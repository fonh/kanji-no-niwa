#!/usr/bin/env python3
"""Étape 4 Lot 2 — lesson_examples des 50 kanji de goldenrod-city.

Phrases composées à la main au registre N4 (calibrage Marugoto A2-2, situations de la
ville : magasins, radio, tunnel), lecture inline ADR-0002 sur chaque kanji affiché.
La règle « zéro autre kanji » est abandonnée depuis le 2026-07-10 (roadmap § audit
qualité pré-Lot 2) — seule la lecture inline compte. Idempotent : n'écrase pas un
exemple existant.
"""
import json, os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
PATH = os.path.join(ROOT, 'src', 'data', 'kanji-content.json')

EXAMPLES = {
 "匹": ("犬（いぬ）が　二（に）匹（ひき）　います。", "There are two dogs."),
 "寝": ("きょうは　早（はや）く　寝（ね）ます。", "I'm going to bed early today."),
 "巨": ("巨（きょ）大（だい）な　木（き）が　あります。", "There is a gigantic tree."),
 "悩": ("ずっと　悩（なや）んで　います。", "I've been worrying about it for a while."),
 "払": ("お金（かね）を　払（はら）います。", "I'll pay the money."),
 "挟": ("パンに　ハムを　挟（はさ）みます。", "I put ham between the bread."),
 "捕": ("どろぼうが　捕（つか）まりました。", "The thief was caught."),
 "捜": ("なくした　かぎを　捜（さが）して　います。", "I'm searching for the key I lost."),
 "掃": ("部屋（へや）を　掃（そう）除（じ）します。", "I clean the room."),
 "換": ("電車（でんしゃ）を　乗（の)り換（か）えます。", "I transfer trains."),
 "殿": ("殿（との）さまの　お城（しろ）です。", "It is the lord's castle."),
 "汚": ("手（て）が　汚（よご）れて　います。", "My hands are dirty."),
 "沈": ("夕日（ゆうひ）が　海（うみ）に　沈（しず）みます。", "The evening sun sinks into the sea."),
 "沸": ("お湯（ゆ）が　沸（わ）きました。", "The water has boiled."),
 "浮": ("船（ふね）が　浮（う）いて　います。", "The boat is floating."),
 "湾": ("湾（わん）に　船（ふね）が　入（はい）ります。", "The ship enters the bay."),
 "湿": ("湿（しめ）った　空気（くうき）ですね。", "The air is damp, isn't it."),
 "滴": ("水（みず）の　滴（しずく）が　落（お）ちます。", "A drop of water falls."),
 "濯": ("洗（せん）濯（たく）を　します。", "I do the laundry."),
 "狭": ("この　道（みち）は　狭（せま）いです。", "This road is narrow."),
 "甘": ("この　お菓（か）子（し）は　甘（あま）いです。", "This candy is sweet."),
 "療": ("病院（びょういん）で　治（ち）療（りょう）を　受（う）けます。", "I receive treatment at the hospital."),
 "舞": ("雪（ゆき）が　舞（ま）って　います。", "Snow is dancing in the air."),
 "舟": ("川（かわ）で　小（こ）舟（ぶね）に　乗（の）ります。", "I ride a small boat on the river."),
 "荒": ("海（うみ）が　荒（あ）れて　います。", "The sea is rough."),
 "薄": ("この　本（ほん）は　薄（うす）いです。", "This book is thin."),
 "迎": ("駅（えき）まで　迎（むか）えに　行（い）きます。", "I'll go to the station to pick you up."),
 "遅": ("電車（でんしゃ）が　遅（おく）れて　います。", "The train is delayed."),
 "違": ("答（こた）えが　違（ちが）います。", "The answer is wrong."),
 "隅": ("部屋（へや）の　隅（すみ）に　置（お）いて　ください。", "Please put it in the corner of the room."),
 "刀": ("古（ふる）い　刀（かたな）を　見（み）ました。", "I saw an old sword."),
 "弓": ("弓（ゆみ）の　練（れん）習（しゅう）を　します。", "I practice archery."),
 "汽": ("汽（き）車（しゃ）が　走（はし）ります。", "The steam train runs."),
 "羊": ("羊（ひつじ）が　草（くさ）を　食（た）べて　います。", "The sheep are eating grass."),
 "豆": ("豆（まめ）の　スープを　飲（の）みます。", "I drink bean soup."),
 "径": ("円（えん）の　直（ちょっ）径（けい）を　はかります。", "I measure the circle's diameter."),
 "徳": ("徳（とく）の　高（たか）い　お坊（ぼう）さんです。", "He is a monk of great virtue."),
 "氏": ("田（た）中（なか）氏（し）に　会（あ）いました。", "I met Mr. Tanaka."),
 "滋": ("滋（じ）養（よう）の　ある　食（た）べ物（もの）です。", "It is nourishing food."),
 "潟": ("干（ひ）潟（がた）で　鳥（とり）を　見（み）ます。", "I watch birds on the tidal flat."),
 "隊": ("救（きゅう）助（じょ）隊（たい）が　来（き）ました。", "The rescue squad arrived."),
 "鹿": ("鹿（しか）が　森（もり）に　います。", "There are deer in the forest."),
 "士": ("消（しょう）防（ぼう）士（し）に　なりたいです。", "I want to become a firefighter."),
 "属": ("金（きん）属（ぞく）の　スプーンです。", "It is a metal spoon."),
 "幹": ("木（き）の　幹（みき）が　太（ふと）いです。", "The tree trunk is thick."),
 "弁": ("お弁（べん）当（とう）を　作（つく）ります。", "I make a boxed lunch."),
 "潔": ("清（せい）潔（けつ）な　タオルを　使（つか）います。", "I use a clean towel."),
 "酸": ("レモンは　酸（す）っぱいです。", "Lemons are sour."),
 "傷": ("傷（きず）に　薬（くすり）を　つけます。", "I put medicine on the wound."),
 "厳": ("先（せん）生（せい）は　厳（きび）しいです。", "The teacher is strict."),
}

def main():
    with open(PATH) as f:
        data = json.load(f)
    added = skipped = 0
    for k, (jp, en) in EXAMPLES.items():
        entry = data[k]
        exs = entry.setdefault('lesson_examples', [])
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
