#!/usr/bin/env python3
"""
Découpe les sprite sheets HGSS en sprites individuels.

Overworld sheet (957×1101):
  - Blocs de 96×128 px par trainer class
  - Grille interne : 3 cols × 4 rows de 32×32 px
  - Directions : row 0=bas, row 1=gauche, row 2=droite, row 3=haut
  - Frame neutre exportée : col 1 (milieu), row 0 (face bas)

Battle front sheet (973×1798):
  - Sprites standard : 80×80 px
  - Sprites grands (gym leaders) : 80×96 ou 96×96 px
  - Exporté tel quel par blocs détectés auto

Sortie :
  public/sprites/hgss/extracted/overworld/<idx>_<row>_<col>.png   (frames individuelles)
  public/sprites/hgss/extracted/overworld/<idx>_neutral.png        (frame neutre face-bas)
  public/sprites/hgss/extracted/battle/<idx>.png
"""

from PIL import Image
from pathlib import Path
import sys

SPRITES_DIR = Path("public/sprites/hgss")
OUT_OW = Path("public/sprites/hgss/extracted/overworld")
OUT_BT = Path("public/sprites/hgss/extracted/battle")

# ── Overworld ─────────────────────────────────────────────────────────────────

OW_BLOCK_W  = 96    # chaque trainer = 3 frames × 32px
OW_BLOCK_H  = 128   # chaque trainer = 4 dir × 32px
OW_FRAME_W  = 32
OW_FRAME_H  = 32
OW_COLS     = 4     # directions (bas, gauche, droite, haut)
OW_ROWS     = 3     # frames d'animation par direction

# Sens rows/cols dans le bloc :
# col 0..2 = frame d'animation 0/1/2
# row 0    = face-bas (direction principale)
# row 1    = gauche
# row 2    = droite
# row 3    = haut

DIRECTION_NAMES = ["down", "left", "right", "up"]

def extract_overworld(sheet_path: Path):
    img = Image.open(sheet_path).convert("RGBA")
    W, H = img.size
    print(f"Overworld sheet : {W}×{H}")

    cols_in_sheet = W // OW_BLOCK_W
    rows_in_sheet = H // OW_BLOCK_H
    print(f"  → {cols_in_sheet} colonnes × {rows_in_sheet} lignes de blocs = {cols_in_sheet * rows_in_sheet} trainers max")

    idx = 0
    for block_row in range(rows_in_sheet):
        for block_col in range(cols_in_sheet):
            bx = block_col * OW_BLOCK_W
            by = block_row * OW_BLOCK_H

            # Vérifier si le bloc est entièrement transparent/blanc (bloc vide)
            block = img.crop((bx, by, bx + OW_BLOCK_W, by + OW_BLOCK_H))
            extrema = block.getextrema()
            # Si tous les pixels sont identiques (fond uni) → bloc vide probable
            alpha_min = extrema[3][0] if len(extrema) == 4 else 255
            if alpha_min == 0:
                # Vérifier si au moins 10% des pixels sont non-transparents
                alpha_channel = block.split()[3]
                non_transparent = sum(1 for p in alpha_channel.getdata() if p > 10)
                if non_transparent < 50:
                    continue

            prefix = f"{idx:03d}"

            # Exporter toutes les frames
            for dir_idx in range(4):           # 4 directions (rows dans le bloc)
                for frame_idx in range(3):     # 3 frames d'animation (cols dans le bloc)
                    fx = bx + frame_idx * OW_FRAME_W
                    fy = by + dir_idx * OW_FRAME_H
                    frame = img.crop((fx, fy, fx + OW_FRAME_W, fy + OW_FRAME_H))
                    direction = DIRECTION_NAMES[dir_idx]
                    out_path = OUT_OW / f"{prefix}_{direction}_f{frame_idx}.png"
                    frame.save(out_path)

            # Frame neutre = direction bas (row 0), frame centrale (col 1)
            nx = bx + 1 * OW_FRAME_W
            ny = by + 0 * OW_FRAME_H
            neutral = img.crop((nx, ny, nx + OW_FRAME_W, ny + OW_FRAME_H))
            neutral.save(OUT_OW / f"{prefix}_neutral.png")

            idx += 1

    print(f"  → {idx} blocs trainers extraits")
    return idx


# ── Battle Front ──────────────────────────────────────────────────────────────

BT_SPRITE_W  = 80
BT_SPRITE_H  = 80
# Certains gym leaders ont des sprites plus grands (80×96 ou 96×96)
# On exporte en blocs de 80×80 d'abord, puis le script indique les sprites surdimensionnés.
# La sheet est 973×1798.

def extract_battle(sheet_path: Path):
    img = Image.open(sheet_path).convert("RGBA")
    W, H = img.size
    print(f"Battle front sheet : {W}×{H}")

    cols_in_sheet = W // BT_SPRITE_W
    rows_in_sheet = H // BT_SPRITE_H
    print(f"  → {cols_in_sheet} colonnes × {rows_in_sheet} lignes = {cols_in_sheet * rows_in_sheet} sprites max")

    idx = 0
    saved = 0
    for row in range(rows_in_sheet):
        for col in range(cols_in_sheet):
            sx = col * BT_SPRITE_W
            sy = row * BT_SPRITE_H
            sprite = img.crop((sx, sy, sx + BT_SPRITE_W, sy + BT_SPRITE_H))

            # Ignorer les sprites entièrement transparents
            alpha_channel = sprite.split()[3]
            non_transparent = sum(1 for p in alpha_channel.getdata() if p > 10)
            if non_transparent < 30:
                idx += 1
                continue

            out_path = OUT_BT / f"{idx:03d}.png"
            sprite.save(out_path)
            saved += 1
            idx += 1

    print(f"  → {saved} sprites battle extraits (sur {idx} blocs)")
    return saved


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    ow_files = list(SPRITES_DIR.glob("*Overworld*Trainers*(1).png"))
    if not ow_files:
        ow_files = list(SPRITES_DIR.glob("*Overworld*Trainers*.png"))
    bt_files = list(SPRITES_DIR.glob("*Trainers*(Front)*.png"))
    # Prefer the face-caméra file
    bt_face = [f for f in bt_files if "caméra" in f.name or "camera" in f.name.lower()]
    if bt_face:
        bt_files = bt_face

    if not ow_files:
        print("ERREUR : fichier Overworld Trainers introuvable")
        sys.exit(1)
    if not bt_files:
        print("ERREUR : fichier Battle Trainers (Front) introuvable")
        sys.exit(1)

    print(f"Overworld : {ow_files[0].name}")
    n_ow = extract_overworld(ow_files[0])

    print()
    print(f"Battle : {bt_files[0].name}")
    n_bt = extract_battle(bt_files[0])

    print()
    print(f"Done. {n_ow} blocs overworld → {OUT_OW}")
    print(f"      {n_bt} sprites battle  → {OUT_BT}")
    print()
    print("Prochaine étape : inspecter les fichiers extraits, créer trainer_manifest.json")
    print("  avec les correspondances idx → trainer_class, sprite_key, etc.")

if __name__ == "__main__":
    main()
