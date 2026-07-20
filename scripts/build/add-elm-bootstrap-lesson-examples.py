#!/usr/bin/env python3
"""
Étape 3 point 2 — tranche verticale, Bourg Geon.

Ajoute `lesson_examples[]` aux 30 kanji du bootstrap Elm (new-bark-town,
content/lessons-proposal.json leçons #1-5) dans src/data/kanji-content.json.
Champ défini au PRD § Schéma Base de Données : {jp, en, audio_ref, source}.

Règle stricte (§ Leçons, calibration) : chaque phrase n'utilise QUE le kanji
de l'entrée + du hiragana — zéro autre kanji, pas de tolérance
proportionnelle ici (contrairement aux Textes Progressifs). Vérifié par ce
script lui-même avant écriture (même logique que
scripts/validate/lint-kanji-budget.py § lint_lesson_examples).
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KANJI_CONTENT_PATH = ROOT / "src/data/kanji-content.json"
FURIGANA_RE = re.compile(r"（[^）]*）")
KANJI_RE = re.compile(r"[一-鿿]")

# {character: [(jp, en), ...]}
EXAMPLES = {
    "一": [("これは　一（ひと）つです。", "This is one.")],
    "二": [("それは　二（ふた）つです。", "That is two.")],
    "人": [("あの　人（ひと）は　やさしいです。", "That person is kind.")],
    "先": [("先（さき）に　いきます。", "I'll go on ahead.")],
    "入": [("なかに　入（はい）ります。", "I go inside.")],
    "八": [("りんごが　八（や）つ　あります。", "There are eight apples.")],
    "円": [("円（えん）を　あげます。", "I'll give you some money.")],
    "十": [("十（じゅう）まで　かぞえます。", "I'll count to ten.")],
    "口": [("口（くち）を　あけて　ください。", "Please open your mouth.")],
    "四": [("これは　四（よっ）つです。", "This is four.")],
    "土": [("土（つち）は　くろいです。", "The soil is black.")],
    "大": [("この　いえは　大（おお）きいです。", "This house is big.")],
    "女": [("あの　女（おんな）は　げんきです。", "That woman is doing well.")],
    "子": [("この　子（こ）は　げんきです。", "This child is energetic.")],
    "小": [("とても　小（ちい）さいです。", "It's very small.")],
    "山": [("あの　山（やま）は　たかいです。", "That mountain is tall.")],
    "川": [("川（かわ）で　およぎます。", "I swim in the river.")],
    "手": [("手（て）を　あらいます。", "I wash my hands.")],
    "日": [("日（ひ）が　でました。", "The sun came out.")],
    "月": [("月（つき）が　きれいです。", "The moon is beautiful.")],
    "木": [("木（き）が　おおきいです。", "The tree is big.")],
    "気": [("気（き）を　つけて。", "Take care.")],
    "水": [("水（みず）を　のみます。", "I drink water.")],
    "火": [("火（ひ）は　あついです。", "Fire is hot.")],
    "生": [("生（う）まれました。", "I was born.")],
    "目": [("目（め）が　いたいです。", "My eyes hurt.")],
    "立": [("ここに　立（た）って　ください。", "Please stand here.")],
    "耳": [("耳（みみ）が　おおきいです。", "The ears are big.")],
    "車": [("あの　車（くるま）は　あかいです。", "That car is red.")],
    "金": [("金（きん）は　たかいです。", "Gold is expensive.")],
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

    for i, (character, examples) in enumerate(EXAMPLES.items(), start=1):
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
