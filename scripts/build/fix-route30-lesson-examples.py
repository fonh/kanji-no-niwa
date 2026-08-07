#!/usr/bin/env python3
"""
Route 30 — répare les exemples de leçon faux ou hors sujet (2026-08-07).

CE QUI S'EST PASSÉ
------------------
`add-route30-lesson-examples.py` (étape 3) avait écrit à la main un exemple
court et juste par kanji. Une passe générique ultérieure les a REMPLACÉS par
deux exemples chacun, tirés soit de Tatoeba, soit d'un gabarit automatique
「これは　X　です。」 → "This is <mot-clé>." où X est un composé quelconque
contenant le kanji. Le gabarit produit des traductions fausses dès que le
composé ne veut pas dire le mot-clé — et sur les 20 kanji de la Route 30 il
en a produit cinq :

    牛  これは　牛肉（ぎゅうにく）です。   → "This is cow."        (牛肉 = viande de bœuf)
    色  これは　色気（いろけ）です。       → "This is color."      (色気 = charme, sensualité)
    門  これは　門限（もんげん）です。     → "This is gate."       (門限 = couvre-feu)
    世  これは　世論（よろん）です。       → "This is generation." (世論 = opinion publique)
    区  これは　地区（ちく）です。         → "This is ward."       (地区 = secteur, + 地 inconnu)

Plus deux cas hors sujet : 業 illustré par 日系企業 (« entreprise à capitaux
japonais », hors niveau), et 風 dont les DEUX exemples portent sur 風呂 (le
bain) — donc aucun n'illustre le sens enseigné, « vent » — le second,
「お　風呂先（ふろさき）に　入（はい）るね。」, n'étant même pas du japonais
correct. Enfin 肉 et 鳥 avaient deux exemples dont le second était le gabarit
「これは　X　です。」, c'est-à-dire une redite du premier.

CE QUE FAIT CE SCRIPT
---------------------
Remplace ces dix exemples-là, et eux seuls. Règles respectées :
  - le sens illustré est celui que la leçon enseigne ;
  - lecture inline sur TOUT kanji affiché (ADR-0002) ;
  - zéro kanji hors du studiedSet de la zone (vérifié avant écriture) ;
  - `audio_ref` régénéré à la voix Kyoko (macOS `say` + ffmpeg → webm/opus),
    la même chaîne que scripts/build/generate-grammar-audio.py. Garder l'ancien
    fichier serait pire que pas de son : on entendrait l'ancienne phrase.
    `--no-audio` saute la synthèse (utile pour rejouer le script sur une
    machine sans `say`) et ne garde la référence que si le fichier existe
    déjà — jamais de bouton son qui pointe dans le vide.

Le fichier est réécrit avec `indent=1`, la mise en forme du dépôt : écrire
`indent=2` produit un diff de 100 000 lignes pour dix phrases changées.

Les exemples Tatoeba ne sont PAS touchés : ils sont justes, seulement parfois
au-dessus du niveau (色_1, 代_1, 業_1, 度_1 chargent 4 à 7 kanji inconnus).
C'est une autre question — celle du calibrage — pas une erreur de contenu.

Usage : python3 scripts/build/fix-route30-lesson-examples.py [--no-audio]
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KANJI_CONTENT_PATH = ROOT / "src/data/kanji-content.json"
AUDIO_DIR = ROOT / "public/audio/kanji_examples"
FURIGANA_RE = re.compile(r"（[^）]*）")
KANJI_RE = re.compile(r"[一-鿿]")
VOICE = "Kyoko"
RATE = 170

# Le studiedSet de la Route 30 (fin de zone) — scripts/build/rekanjify-report.py.
STUDIED = set(
    "一世二京人代作先光入八円冬前力北区十口四図土夏夕夜大女子家寒小山川工帰広度後心手文方"
    "日月木業止母毎気水池火父牛生用田目立考耳肉色茶行西車通遠金長門雨顔風食高魚鳥"
)

# {kanji: {index d'exemple (1-based): (jp, en)}} — remplacement ciblé, le
# reste de la liste est laissé tel quel.
FIXES = {
    "牛": {2: ("牛（うし）の　ミルクを　のみます。", "I drink cow's milk.")},
    "肉": {2: ("あの　みせの　肉（にく）は　おいしいです。", "The meat at that shop is good.")},
    "色": {2: ("すきな　色（いろ）は　なんですか。", "What colour do you like?")},
    "門": {2: ("大（おお）きな　門（もん）の　まえで　まって　います。", "I'm waiting in front of the big gate.")},
    "世": {2: ("あたらしい　世（よ）が　はじまります。", "A new age is beginning.")},
    "区": {2: ("わたしは　この　区（く）に　すんで　います。", "I live in this ward.")},
    "業": {2: ("工業（こうぎょう）が　さかんな　まちです。", "It's a town where industry thrives.")},
    "風": {
        1: ("きょうは　風（かぜ）が　つよいです。", "The wind is strong today."),
        2: ("あたたかい　風（かぜ）が　ふいて　います。", "A warm wind is blowing."),
    },
    "鳥": {2: ("小（ちい）さな　鳥（とり）の　こえが　します。", "I can hear a small bird.")},
}


def unknown_kanji(jp):
    """Les kanji de la phrase absents du studiedSet de la zone."""
    return {c for c in KANJI_RE.findall(FURIGANA_RE.sub("", jp)) if c not in STUDIED}


def unread_kanji(jp):
    """Les kanji affichés sans lecture inline (ADR-0002).

    Une lecture inline suit immédiatement le bloc de kanji qu'elle lit :
    「工業（こうぎょう）」 couvre 工 et 業.
    """
    return set(KANJI_RE.findall(re.sub(r"[一-鿿]+（[^）]*）", "", jp)))


def synthesize(jp, out_path):
    """Voix Kyoko → webm/opus, même chaîne que generate-grammar-audio.py."""
    plain = FURIGANA_RE.sub("", jp).replace("　", " ")
    aiff = out_path.with_suffix(".aiff")
    subprocess.run(["say", "-v", VOICE, "-r", str(RATE), "-o", str(aiff), plain], check=True)
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(aiff), "-c:a", "libopus", "-b:a", "48k", str(out_path)],
        check=True,
        capture_output=True,
    )
    aiff.unlink(missing_ok=True)


def main():
    with_audio = "--no-audio" not in sys.argv
    data = json.loads(KANJI_CONTENT_PATH.read_text())

    # 1. Tout vérifier avant d'écrire quoi que ce soit.
    for character, fixes in FIXES.items():
        if character not in data:
            raise KeyError(f"{character} absent de kanji-content.json")
        examples = data[character].get("lesson_examples") or []
        for index, (jp, _) in fixes.items():
            if index > len(examples):
                raise IndexError(f"{character}: pas d'exemple #{index} à remplacer")
            if character not in jp:
                raise ValueError(f"{character}: l'exemple n'utilise pas le kanji enseigné")
            unknown = unknown_kanji(jp)
            if unknown:
                raise ValueError(f"{character}: kanji hors studiedSet de la zone : {unknown}")
            unread = unread_kanji(jp)
            if unread:
                raise ValueError(f"{character}: kanji sans lecture inline (ADR-0002) : {unread}")

    # 2. Écrire.
    changed = 0
    for character, fixes in FIXES.items():
        examples = data[character]["lesson_examples"]
        for index, (jp, en) in fixes.items():
            audio_path = AUDIO_DIR / f"{character}_{index}.webm"
            if with_audio:
                synthesize(jp, audio_path)
            examples[index - 1] = {
                "jp": jp,
                "en": en,
                "audio_ref": (
                    f"/audio/kanji_examples/{character}_{index}.webm"
                    if audio_path.exists()
                    else None
                ),
                "source": "generated",
            }
            changed += 1
            print(f"  {character}_{index}  {jp}")

    # indent=1 : la mise en forme du fichier au dépôt. Sans ça, dix phrases
    # changées produisent un diff de 100 000 lignes.
    KANJI_CONTENT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    print(f"\n{changed} exemple(s) remplacé(s) sur {len(FIXES)} kanji.")


if __name__ == "__main__":
    main()
