#!/usr/bin/env python3
"""
Convertit une planche « people » au format standard PokemonHnS/pokeemerald
(144×32 px, 9 frames de 16×32 : sud/nord/ouest fixes + 2 frames de marche
chacune — l'est n'est jamais stocké, dérivé par miroir horizontal de
l'ouest à l'exécution, convention Gen 3 documentée) vers le format attendu
par ce moteur (256×128 px, grille 8 colonnes × 4 rangées de 32×32,
SPRITE_ROW = {south:0, north:1, west:2, east:3}, voir src/lib/npc-sprites.ts).

Usage : python3 scripts/build/convert-hns-people-sprite.py <entrée.png> <sortie.png>

Source : https://github.com/PokemonHnS-Development/pokemonHnS
  graphics/object_events/pics/people/**.png
"""
import sys
from pathlib import Path
from PIL import Image

SRC_FRAME_W, SRC_FRAME_H = 16, 32
OUT_FRAME = 32

# Index des 9 frames sources par rangée de sortie (sud, nord, ouest) — cycle
# fixe+marche+marche+marche pour remplir les 8 colonnes qu'attend l'animation
# CSS (steps(8)) à partir des 3 frames réelles par direction.
ROW_SOURCE_FRAMES = {
    0: [0, 3, 4, 3, 0, 3, 4, 3],  # sud
    1: [1, 5, 6, 5, 1, 5, 6, 5],  # nord
    2: [2, 7, 8, 7, 2, 7, 8, 7],  # ouest
}


def dekey(img: Image.Image, bg: tuple, tol: int = 24) -> Image.Image:
    """PokemonHnS people sheets use a flat opaque backdrop colour (sampled
    from the corner pixel), not real alpha transparency — confirmed on this
    exact file (issue 13 : sage-green box rendered behind Elm/Silver/Mom/
    Policeman in-game, RGB (152,184,152) opaque, never keyed out here)."""
    img = img.copy()
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if abs(r - bg[0]) <= tol and abs(g - bg[1]) <= tol and abs(b - bg[2]) <= tol:
                px[x, y] = (r, g, b, 0)
    return img


def convert(src_path: Path, out_path: Path) -> None:
    src = Image.open(src_path).convert("RGBA")
    if src.size != (SRC_FRAME_W * 9, SRC_FRAME_H):
        raise ValueError(f"{src_path}: taille {src.size} inattendue (144×32 attendu)")
    src = dekey(src, src.getpixel((0, 0))[:3])

    def frame(i: int) -> Image.Image:
        return src.crop((i * SRC_FRAME_W, 0, (i + 1) * SRC_FRAME_W, SRC_FRAME_H))

    def place(cell_src: Image.Image, mirror: bool = False) -> Image.Image:
        if mirror:
            cell_src = cell_src.transpose(Image.FLIP_LEFT_RIGHT)
        canvas = Image.new("RGBA", (OUT_FRAME, OUT_FRAME), (0, 0, 0, 0))
        x = (OUT_FRAME - SRC_FRAME_W) // 2
        y = OUT_FRAME - SRC_FRAME_H
        canvas.alpha_composite(cell_src, (x, y))
        return canvas

    out = Image.new("RGBA", (OUT_FRAME * 8, OUT_FRAME * 4), (0, 0, 0, 0))
    for row, indices in ROW_SOURCE_FRAMES.items():
        for col, fi in enumerate(indices):
            out.alpha_composite(place(frame(fi)), (col * OUT_FRAME, row * OUT_FRAME))
    # Est = ouest miroir (jamais stocké dans le format source — convention
    # Gen 3 officielle : OAM flip horizontal à l'exécution).
    for col, fi in enumerate(ROW_SOURCE_FRAMES[2]):
        out.alpha_composite(place(frame(fi), mirror=True), (col * OUT_FRAME, 3 * OUT_FRAME))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out.save(out_path)
    print(f"{src_path.name} -> {out_path} ({out.size[0]}×{out.size[1]})")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage : convert-hns-people-sprite.py <entrée.png> <sortie.png>")
        sys.exit(1)
    convert(Path(sys.argv[1]), Path(sys.argv[2]))
