#!/usr/bin/env python3
"""Étape 4 phase 1 (corrigé après revue) — lesson_examples pour les 25 kanji
nouvellement enseignés dans une zone déjà écrite après la 2e version corrigée du swap
(violet-city/sprout-tower/route-32/ruins-of-alph/azalea-town/ilex-forest/goldenrod-city).
Source de vérité : src/data/kanji-content.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PATH = ROOT / "src/data/kanji-content.json"

EXAMPLES = {
    "院": [
        ("足（あし）が　いたいので、病院（びょういん）へ　いきました。", "My leg hurt, so I went to the hospital."),
        ("この　病院（びょういん）の　いしゃは　しんせつです。", "The doctor at this hospital is kind."),
    ],
    "病": [
        ("かぜで　病気（びょうき）に　なりました。", "I caught a cold and got sick."),
        ("兄（あに）は　病気（びょうき）で　がっこうを　やすみました。", "My older brother was absent from school due to illness."),
    ],
    "年": [
        ("今年（ことし）は　いい　年（とし）に　なりますように。", "I hope this year will be a good year."),
        ("来年（らいねん）、日本（にほん）へ　いきます。", "Next year, I'll go to Japan."),
    ],
    "舌": [
        ("あついので、舌（した）を　やけどしました。", "It was hot, so I burned my tongue."),
        ("ねこは　舌（した）で　みずを　のみます。", "Cats drink water with their tongue."),
    ],
    "話": [
        ("その　話（はなし）は　おもしろいですね。", "That story is interesting, isn't it."),
        ("先生（せんせい）と　でんわで　話（はな）しました。", "I talked with the teacher on the phone."),
    ],
    "説": [
        ("先生（せんせい）が　もんだいを　説明（せつめい）しました。", "The teacher explained the problem."),
        ("かれの　説明（せつめい）は　わかりやすいです。", "His explanation is easy to understand."),
    ],
    "週": [
        ("来週（らいしゅう）、テストが　あります。", "There's a test next week."),
        ("毎週（まいしゅう）、としょかんへ　いきます。", "I go to the library every week."),
    ],
    "矢": [
        ("矢（や）で　まとを　いました。", "I shot the target with an arrow."),
        ("かんばんに　矢印（やじるし）が　あります。", "There's an arrow on the sign."),
    ],
    "医": [
        ("わたしの　ちちは　医者（いしゃ）です。", "My father is a doctor."),
        ("しょうらい、医者（いしゃ）に　なりたいです。", "I want to become a doctor in the future."),
    ],
    "知": [
        ("その　みちを　知（し）って　いますか。", "Do you know that road?"),
        ("かれの　なまえを　知（し）りませんでした。", "I didn't know his name."),
    ],
    "短": [
        ("この　えんぴつは　短（みじか）いです。", "This pencil is short."),
        ("じかんが　短（みじか）いので、いそぎましょう。", "Time is short, so let's hurry."),
    ],
    "映": [
        ("しゅうまつに　映画（えいが）を　みました。", "I watched a movie over the weekend."),
        ("この　映画（えいが）は　とても　おもしろいです。", "This movie is very interesting."),
    ],
    "時": [
        ("今（いま）、何時（なんじ）ですか。", "What time is it now?"),
        ("じゅぎょうの　時間（じかん）です。", "It's class time."),
    ],
    "菜": [
        ("野菜（やさい）を　たくさん　たべましょう。", "Let's eat lots of vegetables."),
        ("この　野菜（やさい）は　しんせんです。", "These vegetables are fresh."),
    ],
    "質": [
        ("なにか　質問（しつもん）は　ありますか。", "Do you have any questions?"),
        ("いい　質問（しつもん）ですね。", "That's a good question."),
    ],
    "首": [
        ("きりんは　首（くび）が　ながいです。", "Giraffes have long necks."),
        ("首（くび）が　いたいです。", "My neck hurts."),
    ],
    "道": [
        ("この　道（みち）を　まっすぐ　いって　ください。", "Please go straight down this road."),
        ("駅（えき）までの　道（みち）を　おしえて　ください。", "Please tell me the way to the station."),
    ],
    "校": [
        ("まいにち、学校（がっこう）へ　いきます。", "I go to school every day."),
        ("この　学校（がっこう）は　おおきいです。", "This school is big."),
    ],
    "飯": [
        ("もう　ご飯（はん）を　たべましたか。", "Have you eaten yet?"),
        ("あさ、ご飯（はん）を　たべませんでした。", "I didn't eat breakfast this morning."),
    ],
    "動": [
        ("この　きかいは　動（うご）きません。", "This machine doesn't move."),
        ("まいあさ、運動（うんどう）します。", "I exercise every morning."),
    ],
    "試": [
        ("あした、試験（しけん）が　あります。", "There's an exam tomorrow."),
        ("この　ふくを　試着（しちゃく）しても　いいですか。", "May I try on these clothes?"),
    ],
    "何": [
        ("これは　何（なん）ですか。", "What is this?"),
        ("何（なに）を　たべたいですか。", "What do you want to eat?"),
    ],
    "使": [
        ("この　ペンを　使（つか）っても　いいですか。", "May I use this pen?"),
        ("まいにち　にほんごを　使（つか）います。", "I use Japanese every day."),
    ],
    "働": [
        ("ちちは　ぎんこうで　働（はたら）いて　います。", "My father works at a bank."),
        ("いっしょうけんめい　働（はたら）きます。", "I'll work hard."),
    ],
    "貸": [
        ("ほんを　貸（か）して　ください。", "Please lend me the book."),
        ("かさを　貸（か）しましょうか。", "Shall I lend you an umbrella?"),
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
