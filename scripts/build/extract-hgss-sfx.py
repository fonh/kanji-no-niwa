#!/usr/bin/env python3
"""Extrait un bruitage du jeu d'origine depuis la banque sonore de la ROM.

POURQUOI (issue 13, « les bruits de DS ne sont pas les bons »)
--------------------------------------------------------------
Le son joué à chaque avancée de dialogue était `menu_get.wav`, pris dans le
seul lot de bruitages disponible dans le dépôt (7 fichiers, tous des jingles
« objet obtenu / soin / fanfare »). C'est un jingle de **1,5 seconde**, joué à
chaque ligne de texte. Le vrai son du jeu est `SEQ_SE_DP_SELECT` : un bip de
~20 ms. (Vérifié dans le décompilé : `src/oaks_speech.c` fait avancer son texte
avec `PlaySE(SEQ_SE_DP_SELECT)`.)

Ces bruitages ne sont pas des fichiers audio dans la ROM : ce sont des
séquences MIDI-like (SSEQ) qui déclenchent une note sur un échantillon d'une
banque. Ce script suit la chaîne complète :

    SSEQ (par nom, ex. SEQ_SE_DP_SELECT)
      → note + programme joués
      → SBNK (banque d'instruments) → région de clavier
      → SWAR / SWAV (l'échantillon, IMA-ADPCM 4 bits)
      → décodage, ré-échantillonnage à la hauteur de la note

APPROXIMATION ASSUMÉE : l'enveloppe ADSR du DS n'est pas reproduite exactement
(ses tables de conversion sont une émulation à part entière). La note est jouée
pour sa durée écrite dans la séquence, suivie d'une extinction exponentielle.
Pour un bip d'interface — attaque immédiate, tenue de quelques millisecondes —
l'écart n'est pas audible ; pour un son long et tenu, il le serait, et ce
script n'est alors pas le bon outil.

Prérequis : le décompilé pokeheartgold, pour `files/data/sound/gs_sound_data.sdat`.

  python3 scripts/build/extract-hgss-sfx.py --list SELECT
  python3 scripts/build/extract-hgss-sfx.py SEQ_SE_DP_SELECT -o public/audio/sfx/game/text-advance.wav
"""

from __future__ import annotations

import argparse
import os
import struct
import sys
import wave
from pathlib import Path

SDAT = Path(os.path.expanduser("~/pokeheartgold/files/data/sound/gs_sound_data.sdat"))
OUT_RATE = 48000

IMA_STEP = [
    7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45,
    50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230,
    253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963,
    1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024,
    3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493,
    10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623,
    27086, 29794, 32767,
]
IMA_INDEX = [-1, -1, -1, -1, 2, 4, 6, 8]


class Sdat:
    def __init__(self, raw: bytes):
        self.d = raw
        self.blocks = {}
        for i in range(struct.unpack_from("<H", raw, 0x0E)[0]):
            off, size = struct.unpack_from("<II", raw, 0x10 + i * 8)
            self.blocks[raw[off:off + 4].decode().strip()] = off
        self.symb = self.blocks["SYMB"]
        self.info = self.blocks["INFO"]
        self.fat = self.blocks["FAT"]
        self._info_recs = struct.unpack_from("<8I", raw, self.info + 8)
        self._symb_recs = struct.unpack_from("<8I", raw, self.symb + 8)

    def _table(self, base: int, index: int) -> list[int]:
        b = base + index
        n = struct.unpack_from("<I", self.d, b)[0]
        return [struct.unpack_from("<I", self.d, b + 4 + i * 4)[0] for i in range(n)]

    def seq_names(self) -> list[str]:
        out = []
        for off in self._table(self.symb, self._symb_recs[0]):
            if off == 0:
                out.append("")
            else:
                p = self.symb + off
                out.append(self.d[p:self.d.index(b"\0", p)].decode("ascii", "replace"))
        return out

    def file(self, idx: int) -> bytes:
        off, size = struct.unpack_from("<II", self.d, self.fat + 12 + idx * 16)
        return self.d[off:off + size]

    def seq_info(self, idx: int):
        o = self.info + self._table(self.info, self._info_recs[0])[idx]
        file_id, _unk, bank, vol, _cpr, _ppr, _ply = struct.unpack_from("<HHHBBBB", self.d, o)
        return file_id, bank, vol

    def bank_info(self, idx: int):
        o = self.info + self._table(self.info, self._info_recs[2])[idx]
        file_id, _unk, *wa = struct.unpack_from("<HHHHHH", self.d, o)
        return file_id, wa

    def wavearc_file(self, idx: int) -> int:
        o = self.info + self._table(self.info, self._info_recs[3])[idx]
        return struct.unpack_from("<H", self.d, o)[0]


# Longueur des arguments de chaque commande SSEQ. `None` = argument de longueur
# variable (varlen). Les commandes absentes de la table n'ont pas d'argument.
CMD_ARGS = {
    0x80: None, 0x81: None,
    0x93: 4, 0x94: 3, 0x95: 3,
    **{c: 1 for c in range(0xC0, 0xD7)},
    0xE0: 2, 0xE1: 2, 0xE3: 2,
    0xFE: 2,
}


def read_varlen(b: bytes, i: int) -> tuple[int, int]:
    v = 0
    while True:
        c = b[i]
        i += 1
        v = (v << 7) | (c & 0x7F)
        if not c & 0x80:
            return v, i


class Note:
    __slots__ = ("tick", "key", "velocity", "ticks", "program", "volume", "bend", "bend_range")

    def __init__(self, tick, key, velocity, ticks, program, volume, bend, bend_range):
        self.tick, self.key, self.velocity, self.ticks = tick, key, velocity, ticks
        self.program, self.volume, self.bend, self.bend_range = program, volume, bend, bend_range


def _parse_track(body: bytes, start: int, notes: list, tempo_box: list) -> None:
    """Déroule UNE piste depuis `start` et empile ses notes. Le tempo est
    partagé (une seule horloge pour toute la séquence, comme sur la console)."""
    i = start
    tick = 0
    program = volume = 0
    bend, bend_range = 0, 2
    while i < len(body):
        c = body[i]
        i += 1
        if c < 0x80:
            velocity = body[i]
            ticks, i = read_varlen(body, i + 1)
            notes.append(Note(tick, c, velocity, ticks, program, volume, bend, bend_range))
            continue
        if c == 0x80:
            delta, i = read_varlen(body, i)
            tick += delta
            continue
        if c == 0x81:
            program, i = read_varlen(body, i)
            continue
        if c in (0xFF, 0xFD):  # fin de piste / retour
            return
        if c == 0xFC:
            raise SystemExit("séquence à boucle : hors de portée de ce script")
        if c == 0x93:  # ouverture de piste : déjà traitée par l'appelant
            i += 4
            continue
        if c == 0xFE:
            i += 2
            continue
        n = CMD_ARGS.get(c, 0)
        if n is None:
            _, i = read_varlen(body, i)
            continue
        if c == 0xC1:
            volume = body[i]
        elif c == 0xC4:
            bend = struct.unpack_from("<b", body, i)[0]
        elif c == 0xC5:
            bend_range = body[i]
        elif c == 0xE1:
            tempo_box[0] = struct.unpack_from("<H", body, i)[0]
        i += n


def parse_sequence(sseq: bytes) -> tuple[list[Note], int]:
    """Joue la séquence « sur le papier » et rend toutes ses notes.

    Un bruitage d'interface n'est pas une note isolée : SEQ_SE_DP_SELECT en
    enchaîne quatre. Et la plupart des sons d'ACTION (porte, escalier, objet
    obtenu, sauvegarde) sont MULTI-PISTES — deux ou trois voix jouées
    ensemble. Ne gérer qu'une piste les rendait tous inextractibles
    (issue 13). On lit donc la table d'ouverture de pistes (0xFE puis 0x93) et
    on déroule chacune sur la même horloge.
    """
    body = sseq[0x1C:]
    notes: list[Note] = []
    tempo_box = [120]

    starts = [0]
    if body and body[0] == 0xFE:
        # 0xFE <masque u16>, puis un 0x93 <piste> <offset u24> par piste
        # supplémentaire ; la piste 0 démarre juste après ces déclarations.
        i = 3
        while i + 4 <= len(body) and body[i] == 0x93:
            starts.append(int.from_bytes(body[i + 2 : i + 5], "little"))
            i += 5
        starts[0] = i

    for start in starts:
        _parse_track(body, start, notes, tempo_box)

    if not notes:
        raise SystemExit("aucune note dans la séquence")
    notes.sort(key=lambda n: n.tick)
    return notes, tempo_box[0]


def instrument(sbnk: bytes, program: int, note: int):
    typ, off, _ = struct.unpack_from("<BHB", sbnk, 0x3C + program * 4)
    if typ in (16, 17):  # batterie / clavier partagé
        if typ == 16:
            low, high = sbnk[off], sbnk[off + 1]
            idx = max(0, min(note, high) - low)
            e = off + 2 + idx * 12
        else:
            regions = sbnk[off:off + 8]
            idx = next((i for i, hi in enumerate(regions) if hi and note <= hi), 0)
            e = off + 8 + idx * 12
        e += 2
    else:
        e = off
    swav, swar, root, atk, dec, sus, rel, pan = struct.unpack_from("<HHBBBBBB", sbnk, e)
    return swav, swar, root, (atk, dec, sus, rel)


def decode_swav(swar: bytes, index: int) -> tuple[list[int], int]:
    n = struct.unpack_from("<I", swar, 0x38)[0]
    if index >= n:
        raise SystemExit(f"échantillon {index} absent (la banque en a {n})")
    o = struct.unpack_from("<I", swar, 0x3C + index * 4)[0]
    wave_type, _loop, rate, _time, loop_off, non_loop = struct.unpack_from("<BBHHHI", swar, o)
    data = swar[o + 12: o + 12 + (loop_off + non_loop) * 4]
    if wave_type == 0:
        return [(b - 128) * 256 for b in data], rate
    if wave_type == 1:
        return list(struct.unpack(f"<{len(data)//2}h", data[:len(data) // 2 * 2])), rate
    if wave_type != 2:
        raise SystemExit(f"format d'échantillon inconnu ({wave_type})")
    pred, step_i = struct.unpack_from("<hh", data, 0)
    out = []
    for byte in data[4:]:
        for nib in (byte & 0x0F, byte >> 4):
            step = IMA_STEP[step_i]
            diff = step >> 3
            if nib & 1: diff += step >> 2
            if nib & 2: diff += step >> 1
            if nib & 4: diff += step
            pred = max(-32768, min(32767, pred - diff if nib & 8 else pred + diff))
            step_i = max(0, min(88, step_i + IMA_INDEX[nib & 7]))
            out.append(pred)
    return out, rate


TICKS_PER_BEAT = 48
# Queue d'extinction appliquée à chaque note. L'enveloppe ADSR du DS n'est pas
# reproduite (ses tables de conversion sont une émulation à part entière) : sur
# un bruitage d'interface — attaque immédiate, tenue de quelques millisecondes —
# l'écart n'est pas audible ; sur un son tenu, il le serait.
RELEASE_S = 0.035


def mix(notes: list, tempo: int, fetch, ) -> bytes:
    """Rend toutes les notes dans un même tampon, à leurs instants respectifs."""
    sec_per_tick = 60.0 / (tempo * TICKS_PER_BEAT)
    total_s = max(n.tick * sec_per_tick + n.ticks * sec_per_tick for n in notes) + RELEASE_S
    buf = [0.0] * int(OUT_RATE * total_s + 1)
    for n in notes:
        samples, rate, root = fetch(n)
        semitones = (n.key - root) + n.bend * n.bend_range / 128.0
        src_rate = rate * (2.0 ** (semitones / 12.0))
        gain = (n.velocity / 127.0) * (max(n.volume, 1) / 127.0)
        start = int(n.tick * sec_per_tick * OUT_RATE)
        length = int((n.ticks * sec_per_tick + RELEASE_S) * OUT_RATE)
        for k in range(length):
            pos = k * src_rate / OUT_RATE
            a = int(pos)
            if a + 1 >= len(samples):
                break
            frac = pos - a
            v = (samples[a] * (1 - frac) + samples[a + 1] * frac) * gain
            left = (length - k) / OUT_RATE
            if left < RELEASE_S:
                v *= (left / RELEASE_S) ** 2
            j = start + k
            if j < len(buf):
                buf[j] += v
    peak = max(1.0, max(abs(v) for v in buf))
    scale = min(1.0, 30000.0 / peak)
    return b"".join(struct.pack("<h", max(-32768, min(32767, int(v * scale)))) for v in buf)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("name", nargs="?", help="nom de séquence, ex. SEQ_SE_DP_SELECT")
    ap.add_argument("-o", "--out", help="fichier .wav de sortie")
    ap.add_argument("--list", metavar="MOTIF", help="liste les séquences dont le nom contient MOTIF")
    a = ap.parse_args()

    if not SDAT.exists():
        raise SystemExit(f"banque sonore introuvable : {SDAT}\n"
                         "Ce script a besoin du décompilé pokeheartgold.")
    s = Sdat(SDAT.read_bytes())
    names = s.seq_names()

    if a.list:
        hits = [(i, n) for i, n in enumerate(names) if a.list.upper() in n.upper()]
        for i, n in hits:
            print(f"  {i:5d}  {n}")
        print(f"{len(hits)} séquence(s)")
        return
    if not a.name or not a.out:
        ap.error("donner un nom de séquence et -o, ou --list")

    try:
        idx = names.index(a.name)
    except ValueError:
        raise SystemExit(f"séquence inconnue : {a.name} (essayer --list)")

    file_id, bank, _vol = s.seq_info(idx)
    notes, tempo = parse_sequence(s.file(file_id))
    bank_file, wavearcs = s.bank_info(bank)
    sbnk = s.file(bank_file)
    cache: dict = {}

    def fetch(n):
        key = (n.program, n.key)
        if key not in cache:
            swav_i, swar_i, root, _adsr = instrument(sbnk, n.program, n.key)
            swar = s.file(s.wavearc_file(wavearcs[swar_i]))
            samples, rate = decode_swav(swar, swav_i)
            cache[key] = (samples, rate, root)
        return cache[key]

    pcm = mix(notes, tempo, fetch)

    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(OUT_RATE)
        w.writeframes(pcm)
    print(f"{a.name}: {len(notes)} note(s), tempo {tempo} — "
          + ", ".join(f"n{n.key}/v{n.velocity}@t{n.tick}" for n in notes))
    print(f"→ {out} ({len(pcm)/2/OUT_RATE*1000:.0f} ms)")


if __name__ == "__main__":
    main()
