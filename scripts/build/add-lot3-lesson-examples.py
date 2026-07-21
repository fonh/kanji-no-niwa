#!/usr/bin/env python3
"""Étape 4 Lot 3 — lesson_examples des 55 kanji de route-37 (15) et ecruteak-city (40).

Registre N3, saveur ville historique/tours/théâtre quand naturelle (相撲, 暦, 携帯…),
lecture inline ADR-0002 partout. Idempotent."""
import json, os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
PATH = os.path.join(ROOT, 'src', 'data', 'kanji-content.json')

EXAMPLES = {
 # route-37
 "庶": ("庶（しょ）民（みん）の　生（せい）活（かつ）を　えがいた　本（ほん）です。", "It's a book depicting the lives of common people."),
 "庸": ("中（ちゅう）庸（よう）が　大（たい）切（せつ）です。", "Moderation is important."),
 "廷": ("法（ほう）廷（てい）で　証（しょう）言（げん）します。", "I will testify in court."),
 "弊": ("弊（へい）社（しゃ）の　製（せい）品（ひん）です。", "This is our company's product."),
 "微": ("微（び）妙（みょう）な　ちがいが　あります。", "There is a subtle difference."),
 "徴": ("特（とく）徴（ちょう）を　おぼえます。", "I memorize the distinctive features."),
 "徹": ("徹（てつ）夜（や）で　べんきょうしました。", "I studied all night."),
 "怪": ("怪（あや）しい　人（ひと）を　見（み）ました。", "I saw a suspicious person."),
 "恒": ("恒（こう）例（れい）の　まつりが　あります。", "There's the customary festival."),
 "恨": ("人（ひと）を　恨（うら）んでは　いけません。", "You must not hold grudges."),
 "悟": ("悟（さと）りを　ひらきました。", "He attained enlightenment."),
 "悦": ("悦（よろこ）びを　かんじます。", "I feel delight."),
 "惰": ("惰（だ）性（せい）で　つづけて　います。", "I keep going out of inertia."),
 "愉": ("愉（ゆ）快（かい）な　仲（なか）間（ま）です。", "They're cheerful companions."),
 "慕": ("先（せん）生（せい）を　慕（した）って　います。", "I look up to my teacher with affection."),
 # ecruteak-city
 "慢": ("我（が）慢（まん）して　います。", "I'm bearing with it."),
 "慶": ("慶（けい）事（じ）が　ありました。", "There was a happy event."),
 "憂": ("将（しょう）来（らい）を　憂（うれ）えて　います。", "He worries about the future."),
 "憤": ("憤（いきどお）りを　かんじました。", "I felt indignation."),
 "懐": ("懐（なつ）かしい　歌（うた）です。", "It's a nostalgic song."),
 "戒": ("自（じ）分（ぶん）を　戒（いまし）めます。", "I admonish myself."),
 "把": ("内（ない）容（よう）を　把（は）握（あく）します。", "I get a grasp of the contents."),
 "抑": ("声（こえ）を　抑（おさ）えて　ください。", "Please keep your voice down."),
 "抗": ("決（けっ）定（てい）に　抗（こう）議（ぎ）します。", "We protest the decision."),
 "抵": ("抵（てい）抗（こう）が　あります。", "There is resistance."),
 "拐": ("誘（ゆう）拐（かい）事（じ）件（けん）の　ニュースを　見（み）ました。", "I saw the news about the kidnapping case."),
 "振": ("手（て）を　振（ふ）って　あいさつします。", "I wave my hand in greeting."),
 "挿": ("花（はな）を　花（か）瓶（びん）に　挿（さ）します。", "I put the flowers in the vase."),
 "掛": ("かべに　絵（え）を　掛（か）けます。", "I hang a picture on the wall."),
 "掲": ("目（もく）標（ひょう）を　掲（かか）げます。", "We set forth our goal."),
 "揚": ("国（こっ）旗（き）を　揚（あ）げます。", "We raise the national flag."),
 "援": ("友（とも）達（だち）を　応（おう）援（えん）します。", "I cheer on my friend."),
 "揺": ("船（ふね）が　揺（ゆ）れて　います。", "The boat is rocking."),
 "搭": ("飛（ひ）行（こう）機（き）に　搭（とう）乗（じょう）します。", "I board the airplane."),
 "携": ("携（けい）帯（たい）電（でん）話（わ）を　持（も）って　います。", "I have a mobile phone."),
 "搾": ("牛（ぎゅう）乳（にゅう）を　搾（しぼ）ります。", "I milk the cow."),
 "摂": ("栄（えい）養（よう）を　摂（と）ります。", "I take in nutrition."),
 "摘": ("花（はな）を　摘（つ）みます。", "I pick flowers."),
 "撤": ("意（い）見（けん）を　撤（てっ）回（かい）します。", "I withdraw my opinion."),
 "撲": ("相（す）撲（もう）を　見（み)に　行（い）きます。", "I'm going to watch sumo."),
 "擁": ("計（けい）画（かく）を　擁（よう）護（ご）します。", "I defend the plan."),
 "敢": ("敢（あ）えて　挑（ちょう）戦（せん）します。", "I dare to take on the challenge."),
 "敷": ("ふとんを　敷（し）きます。", "I lay out the futon."),
 "斗": ("北（ほく）斗（と）七（しち）星（せい）を　さがします。", "I look for the Big Dipper."),
 "斤": ("パンを　一（いっ）斤（きん）　買（か）います。", "I buy one loaf of bread."),
 "既": ("既（すで）に　終（お）わりました。", "It has already ended."),
 "暦": ("暦（こよみ）の　上（うえ）では　春（はる）です。", "According to the calendar, it's spring."),
 "殻": ("たまごの　殻（から）を　むきます。", "I peel the eggshell."),
 "没": ("日（にち）没（ぼつ）が　きれいです。", "The sunset is beautiful."),
 "泰": ("泰（たい）然（ぜん）と　して　います。", "He remains calm and composed."),
 "津": ("津（つ）波（なみ）に　注（ちゅう）意（い）して　ください。", "Please beware of tsunamis."),
 "浦": ("浦（うら）の　村（むら）に　住（す）んで　います。", "I live in a village by the inlet."),
 "浸": ("パンを　牛（ぎゅう）乳（にゅう）に　浸（ひた）します。", "I soak the bread in milk."),
 "涯": ("生（しょう）涯（がい）の　友（とも）達（だち）です。", "A friend for life."),
 "添": ("手（て）紙（がみ）に　写（しゃ）真（しん）を　添（そ）えます。", "I enclose a photo with the letter."),
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
