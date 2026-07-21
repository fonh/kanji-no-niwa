#!/usr/bin/env python3
"""Étape 4 Lot 2 — lesson_examples des 40 kanji de national-park.

Registre N3, saveur athlétique/parc quand naturelle (俊足, 冠, 催…), lecture inline
ADR-0002 partout. Idempotent."""
import json, os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
PATH = os.path.join(ROOT, 'src', 'data', 'kanji-content.json')

EXAMPLES = {
 "宣": ("たいかいの　開（かい）始（し）を　宣（せん）言（げん）します。", "The start of the tournament is declared."),
 "寸": ("寸（すん）法（ぽう）を　はかります。", "I measure the dimensions."),
 "己": ("自（じ）己（こ）ベストを　目（め）指（ざ）します。", "I'm aiming for my personal best."),
 "従": ("コーチの　指（し）示（じ）に　従（したが）います。", "I follow the coach's instructions."),
 "我": ("我（われ）を　わすれて　走（はし）りました。", "I ran, forgetting myself."),
 "推": ("新（あたら）しい　方（ほう）法（ほう）を　推（すい）薦（せん）します。", "I recommend the new method."),
 "敵": ("敵（てき）に　勝（か）ちました。", "I beat my opponent."),
 "沿": ("川（かわ）沿（ぞ）いを　歩（ある）きます。", "I walk along the river."),
 "派": ("立（りっ）派（ぱ）な　演（えん）技（ぎ）でした。", "It was a splendid performance."),
 "激": ("激（はげ）しい　運（うん）動（どう）を　しました。", "I did some intense exercise."),
 "熟": ("よく　熟（じゅく）した　果（くだ）物（もの）です。", "It's well-ripened fruit."),
 "穀": ("穀（こく）物（もつ）を　育（そだ）てます。", "We grow grain."),
 "郷": ("故（こ）郷（きょう）に　帰（かえ）ります。", "I'm going back to my hometown."),
 "陛": ("陛（へい）下（か）に　あいさつを　します。", "We greet His Majesty."),
 "丹": ("丹（たん）念（ねん）に　じゅんびを　します。", "I prepare with great care."),
 "乏": ("経（けい）験（けん）が　乏（とぼ）しいです。", "I lack experience."),
 "乙": ("甲（こう）と　乙（おつ）を　くらべます。", "We compare the first and the second."),
 "亀": ("池（いけ）に　亀（かめ）が　います。", "There is a turtle in the pond."),
 "享": ("自（し）然（ぜん）を　享（きょう）受（じゅ）します。", "We enjoy the blessings of nature."),
 "仰": ("空（そら）を　仰（あお）ぎます。", "I look up at the sky."),
 "伐": ("古（ふる）い　木（き）を　伐（き）ります。", "We fell the old tree."),
 "佳": ("佳（か）作（さく）に　えらばれました。", "It was chosen as an honorable mention."),
 "併": ("ふたつの　会（かい）が　合（がっ）併（ぺい）します。", "The two clubs are merging."),
 "侯": ("侯（こう）爵（しゃく）の　やしきです。", "It is the marquis's mansion."),
 "侵": ("プライバシーを　侵（しん）害（がい）しては　いけません。", "You must not violate privacy."),
 "俊": ("俊（しゅん）足（そく）の　選（せん）手（しゅ）です。", "He is a fleet-footed athlete."),
 "倫": ("倫（りん）理（り）を　学（まな）びます。", "We study ethics."),
 "倹": ("倹（けん）約（やく）して　お金（かね）を　ためます。", "I save money by being frugal."),
 "偏": ("食（しょく）事（じ）が　偏（かたよ）って　います。", "My diet is unbalanced."),
 "傍": ("道（みち）の　傍（かたわ）らに　花（はな）が　さいて　います。", "Flowers are blooming by the roadside."),
 "傑": ("傑（けっ）作（さく）が　できました。", "A masterpiece was made."),
 "催": ("たいかいを　催（もよお）します。", "We are holding a tournament."),
 "僕": ("僕（ぼく）も　さんかします。", "I'll take part too."),
 "僚": ("同（どう）僚（りょう）と　昼（ひる）ごはんを　食（た）べます。", "I eat lunch with my colleagues."),
 "充": ("電（でん）池（ち）を　充（じゅう）電（でん）します。", "I charge the battery."),
 "免": ("運（うん）転（てん）免（めん）許（きょ）を　とります。", "I'm getting a driver's license."),
 "冗": ("冗（じょう）談（だん）を　言（い）って　わらいました。", "We told jokes and laughed."),
 "冠": ("優（ゆう）勝（しょう）の　冠（かんむり）を　もらいました。", "I received the champion's crown."),
 "准": ("准（じゅん）教（きょう）授（じゅ）に　なりました。", "He became an associate professor."),
 "凡": ("平（へい）凡（ぼん）な　毎（まい）日（にち）も　いいものです。", "Ordinary days are nice too."),
}

def main():
    with open(PATH) as f:
        data = json.load(f)
    added = skipped = 0
    for k, (jp, en) in EXAMPLES.items():
        exs = data[k].setdefault('lesson_examples', [])
        if exs:
            skipped += 1
            continue
        exs.append({"jp": jp, "en": en,
                    "audio_ref": f"/audio/kanji_examples/{k}_1.webm",
                    "source": "generated"})
        added += 1
    with open(PATH, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print(f"{added} exemple(s) ajouté(s), {skipped} déjà présents.")

if __name__ == '__main__':
    main()
