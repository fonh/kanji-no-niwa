#!/usr/bin/env python3
"""
Étape 3 point 2 — tranche verticale, Route 30.

Ajoute `lesson_examples[]` aux 20 kanji des 4 leçons de l'Homme dans une
maison (route-30, content/lessons/route-30.json) dans
src/data/kanji-content.json. Même règle stricte, même vérification que
scripts/build/add-elm-bootstrap-lesson-examples.py.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KANJI_CONTENT_PATH = ROOT / "src/data/kanji-content.json"
FURIGANA_RE = re.compile(r"（[^）]*）")
KANJI_RE = re.compile(r"[一-鿿]")

EXAMPLES = {
    "止": [("止（と）まって　ください。", "Please stop.")],
    "池": [("池（いけ）が　あります。", "There is a pond.")],
    "牛": [("牛（うし）が　います。", "There's a cow.")],
    "用": [("用（よう）が　あります。", "I have some business to attend to.")],
    "考": [("よく　考（かんが）えます。", "I'll think it over carefully.")],
    "肉": [("肉（にく）が　すきです。", "I like meat.")],
    "色": [("この　色（いろ）が　すきです。", "I like this color.")],
    "茶": [("お茶（ちゃ）を　のみます。", "I drink tea.")],
    "通": [("ここを　通（とお）ります。", "I'll go through here.")],
    "遠": [("あの　いえは　遠（とお）いです。", "That house is far away.")],
    "門": [("門（もん）が　あります。", "There is a gate.")],
    "顔": [("顔（かお）を　あらいます。", "I wash my face.")],
    "風": [("風（かぜ）が　つよいです。", "The wind is strong.")],
    "鳥": [("鳥（とり）が　とんでいます。", "A bird is flying.")],
    "世": [("この　世（よ）は　ひろいです。", "This world is vast.")],
    "代": [("代（か）わりに　いきます。", "I'll go in your place.")],
    "区": [("この　区（く）は　しずかです。", "This district is quiet.")],
    "寒": [("きょうは　寒（さむ）いです。", "It's cold today.")],
    "度": [("度（ど）が　たかいです。", "The degree is high.")],
    "業": [("この　業（わざ）は　むずかしいです。", "This trade is difficult.")],
}


def check(character, jp):
    plain = FURIGANA_RE.sub("", jp)
    other = set(KANJI_RE.findall(plain)) - {character}
    if other:
        raise ValueError(f"{character}: exemple « {jp} » contient un autre kanji : {other}")


def main():
    data = json.loads(KANJI_CONTENT_PATH.read_text())

    for character, examples in EXAMPLES.items():
        if character not in data:
            raise KeyError(f"{character} absent de kanji-content.json")
        for jp, en in examples:
            check(character, jp)

    for character, examples in EXAMPLES.items():
        data[character]["lesson_examples"] = [
            {
                "jp": jp,
                "en": en,
                "audio_ref": f"/audio/kanji_examples/{character}_{n}.webm",
                "source": "generated",
            }
            for n, (jp, en) in enumerate(examples, start=1)
        ]

    KANJI_CONTENT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(EXAMPLES)} kanji mis à jour dans {KANJI_CONTENT_PATH.relative_to(ROOT)}.")


if __name__ == "__main__":
    main()
