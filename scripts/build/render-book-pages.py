#!/usr/bin/env python3
"""
Rend une plage de pages d'un PDF scanné en PNG, pour lecture directe (vision),
sans OCR.

Contexte : `content/japanese-books-mapping.md` documentait un blocage
« 17/18 PDF Marugoto/Shin Kanzen Master sont des scans sans texte extractible,
aucun OCR installé » — vrai pour un script cherchant à extraire du texte
machine (pymupdf `page.get_text()` renvoie 0 caractère sur ces fichiers), mais
sans objet pour une lecture directe : l'agent qui écrit le contenu peut lire
une page rendue en image aussi bien qu'un texte OCRisé, avec moins d'erreurs
de reconnaissance (kanji + furigana + mise en page mixte, tesseract se trompe
souvent dessus). Pas besoin de poppler/tesseract — pymupdf (déjà une
dépendance du projet, `scripts/sources/*.py`) rend nativement.

Usage :
    python3 scripts/build/render-book-pages.py "<chemin du pdf>" <page_debut> <page_fin> [--dpi 200]

Pages en 1-indexé, bornes incluses. Écrit dans
scratch/book-pages/<nom_pdf_sans_extension>/p<N>.png (répertoire scratch du
projet, jamais commité — voir .gitignore). Relire ensuite chaque PNG avec
l'outil Read.
"""
import argparse
import sys
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[2]
OUT_ROOT = ROOT / "scratch" / "book-pages"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf_path", help="Chemin vers le PDF (relatif ou absolu)")
    parser.add_argument("page_start", type=int, help="Première page, 1-indexée")
    parser.add_argument("page_end", type=int, help="Dernière page, 1-indexée, incluse")
    parser.add_argument("--dpi", type=int, default=200, help="Résolution de rendu (défaut 200)")
    args = parser.parse_args()

    pdf_path = Path(args.pdf_path)
    if not pdf_path.is_absolute():
        pdf_path = ROOT / pdf_path
    if not pdf_path.exists():
        sys.exit(f"Introuvable : {pdf_path}")

    if args.page_end - args.page_start + 1 > 20:
        sys.exit("Max 20 pages par appel (limite de lecture de l'outil Read côté agent).")

    doc = fitz.open(pdf_path)
    out_dir = OUT_ROOT / pdf_path.stem
    out_dir.mkdir(parents=True, exist_ok=True)

    written = []
    for page_num in range(args.page_start, args.page_end + 1):
        if not (1 <= page_num <= doc.page_count):
            print(f"  page {page_num} hors bornes (document : {doc.page_count} pages), ignorée")
            continue
        page = doc[page_num - 1]
        pix = page.get_pixmap(dpi=args.dpi)
        out_path = out_dir / f"p{page_num}.png"
        pix.save(out_path)
        written.append(out_path)

    print(f"{len(written)} page(s) rendue(s) dans {out_dir.relative_to(ROOT)}/")
    for p in written:
        print(f"  {p.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
