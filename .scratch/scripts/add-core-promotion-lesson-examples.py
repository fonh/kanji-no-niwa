#!/usr/bin/env python3
"""Étape 4 phase 1 — lesson_examples for the 12 kanji newly taught in an already-written
zone after content/kanji-core-promotion.json (sprout-tower/route-32/ruins-of-alph/
azalea-town/ilex-forest/goldenrod-city). Source of truth: src/data/kanji-content.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PATH = ROOT / "src/data/kanji-content.json"

EXAMPLES = {
    "究": [
        ("この　研究（けんきゅう）は　とても　むずかしいです。", "This research is very difficult."),
        ("兄（あに）は　だいがくで　研究（けんきゅう）を　して　います。", "My older brother does research at university."),
    ],
    "院": [
        ("びょうきなので、病院（びょういん）へ　いきます。", "I'm sick, so I'm going to the hospital."),
        ("この　病院（びょういん）の　いしゃは　しんせつです。", "The doctor at this hospital is kind."),
    ],
    "病": [
        ("病気（びょうき）に　なったので、がっこうを　やすみました。", "I got sick, so I was absent from school."),
        ("おばあさんは　いま　病気（びょうき）です。", "Grandma is sick right now."),
    ],
    "医": [
        ("父（ちち）は　この　まちの　医者（いしゃ）です。", "Dad is a doctor in this town."),
        ("しょうらい、医者（いしゃ）に　なりたいです。", "I want to become a doctor in the future."),
    ],
    "知": [
        ("その　はなしは　知（し）りませんでした。", "I didn't know that story."),
        ("かれの　なまえを　知（し）って　いますか。", "Do you know his name?"),
    ],
    "英": [
        ("がっこうで　英語（えいご）を　ならいます。", "I learn English at school."),
        ("この　ほんは　英語（えいご）で　かかれて　います。", "This book is written in English."),
    ],
    "質": [
        ("いい　質問（しつもん）ですね。", "That's a good question."),
        ("なにか　質問（しつもん）は　ありますか。", "Do you have any questions?"),
    ],
    "題": [
        ("この　問題（もんだい）は　かんたんです。", "This problem is easy."),
        ("きょうの　宿題（しゅくだい）は　おおいです。", "Today's homework is a lot."),
    ],
    "首": [
        ("ねこの　首（くび）に　すずが　あります。", "There's a bell on the cat's neck."),
        ("首（くび）が　いたいです。", "My neck hurts."),
    ],
    "使": [
        ("この　ペンを　使（つか）っても　いいですか。", "May I use this pen?"),
        ("でんわを　使（つか）っても　いいですか。", "May I use the phone?"),
    ],
    "便": [
        ("この　でんしゃは　とても　便利（べんり）です。", "This train is very convenient."),
        ("スマホは　便利（べんり）な　どうぐです。", "The smartphone is a convenient tool."),
    ],
    "借": [
        ("としょかんで　ほんを　借（か）りました。", "I borrowed a book from the library."),
        ("ともだちに　100えんを　借（か）りました。", "I borrowed 100 yen from a friend."),
    ],
}


def main():
    kc = json.loads(PATH.read_text())
    added = []
    for k, examples in EXAMPLES.items():
        entry = kc[k]
        if entry.get("lesson_examples"):
            print(f"SKIP {k}: already has lesson_examples")
            continue
        entry["lesson_examples"] = [
            {
                "jp": jp,
                "en": en,
                "audio_ref": f"/audio/kanji_examples/{k}_{i+1}.webm",
                "source": "generated",
            }
            for i, (jp, en) in enumerate(examples)
        ]
        added.append(k)
    PATH.write_text(json.dumps(kc, ensure_ascii=False, indent=1) + "\n")
    print(f"Added lesson_examples for {len(added)} kanji: {''.join(added)}")


if __name__ == "__main__":
    main()
