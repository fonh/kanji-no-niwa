#!/usr/bin/env python3
"""Étape 4 Lot 4 — lesson_examples des 110 kanji de route-39 (50), olivine-city (30),
cianwood-city (30). Registre N3, saveur ferme/mer/dojo quand naturelle, lecture inline
ADR-0002. Idempotent."""
import json, os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
PATH = os.path.join(ROOT, 'src', 'data', 'kanji-content.json')

EXAMPLES = {
 # route-39 (ferme)
 "渇": ("のどが　渇（かわ）きました。", "I'm thirsty."),
 "渋": ("この　お茶（ちゃ）は　渋（しぶ）いです。", "This tea is bitter and astringent."),
 "渓": ("渓（けい）谷（こく）を　歩（ある）きます。", "We hike through the ravine."),
 "渦": ("渦（うず）が　まいて　います。", "A whirlpool is swirling."),
 "溝": ("道（みち）の　溝（みぞ）に　気（き）を　つけて。", "Watch out for the ditch in the road."),
 "滅": ("火（ひ）が　消（き）えて、あかりが　滅（めっ）しました。", "The fire went out and the light was extinguished."),
 "漆": ("漆（うるし）の　おわんを　使（つか）います。", "I use a lacquered bowl."),
 "漏": ("屋（や）根（ね）から　雨（あめ）が　漏（も）れます。", "Rain leaks through the roof."),
 "漠": ("砂（さ）漠（ばく）は　雨（あめ）が　少（すく）ないです。", "Deserts get little rain."),
 "漫": ("漫（まん）画（が）を　読（よ）みます。", "I read manga."),
 "潤": ("雨（あめ）が　畑（はたけ）を　潤（うるお）します。", "The rain moistens the fields."),
 "濁": ("川（かわ）の　水（みず）が　濁（にご）って　います。", "The river water is murky."),
 "為": ("かぞくの　為（ため）に　働（はたら）きます。", "I work for my family's sake."),
 "焦": ("パンが　焦（こ）げて　しまいました。", "The bread got burnt."),
 "爵": ("爵（しゃく）位（い）を　もつ　家（いえ）です。", "It's a family with a noble title."),
 "猛": ("猛（もう）れつな　あつさですね。", "It's fiercely hot, isn't it."),
 "猟": ("むかしは　猟（りょう）で　くらして　いました。", "Long ago, they lived by hunting."),
 "猶": ("猶（ゆう）予（よ）は　あと　三（みっ）日（か）です。", "There are three days of grace left."),
 "猿": ("山（やま）で　猿（さる）を　見（み）ました。", "I saw a monkey in the mountains."),
 "獄": ("地（じ）獄（ごく）のように　あつい　日（ひ）です。", "It's a hellishly hot day."),
 "獲": ("大（おお）きな　魚（さかな）を　獲（と）りました。", "I caught a big fish."),
 "玄": ("玄（げん）関（かん）で　くつを　ぬぎます。", "We take off our shoes at the entrance."),
 "疫": ("疫（えき）病（びょう）から　うしを　守（まも）ります。", "We protect the cows from disease."),
 "癒": ("いたみが　癒（い）えました。", "The pain has healed."),
 "癖": ("つめを　かむ　癖（くせ）が　あります。", "I have a habit of biting my nails."),
 "禍": ("災（さい）禍（か）を　まぬがれました。", "We escaped the calamity."),
 "秀": ("秀（ひい）でた　わざを　もって　います。", "He has an outstanding skill."),
 "称": ("名（めい）称（しょう）を　書（か）いて　ください。", "Please write the name."),
 "稚": ("幼（よう）稚（ち）園（えん）に　かよって　います。", "She goes to kindergarten."),
 "稲": ("稲（いね）が　そだって　います。", "The rice plants are growing."),
 "穏": ("穏（おだ）やかな　天（てん）気（き）です。", "The weather is calm."),
 "穫": ("秋（あき）に　収（しゅう）穫（かく）します。", "We harvest in autumn."),
 "竜": ("竜（りゅう）の　でんせつを　聞（き）きました。", "I heard the legend of the dragon."),
 "繭": ("かいこが　繭（まゆ）を　つくります。", "The silkworms spin cocoons."),
 "缶": ("缶（かん）の　ミルクを　あけます。", "I open a can of milk."),
 "罰": ("罰（ばつ）として　そうじを　します。", "As a punishment, I do the cleaning."),
 "舗": ("この　店（てん）舗（ぽ）は　古（ふる）いです。", "This shop building is old."),
 "芋": ("焼（や）き芋（いも）を　食（た）べます。", "I eat a roasted sweet potato."),
 "芝": ("芝（しば）の　上（うえ）で　ひるねを　します。", "I nap on the lawn."),
 "茂": ("草（くさ）が　茂（しげ）って　います。", "The grass is growing thick."),
 "茎": ("花（はな）の　茎（くき）を　切（き）ります。", "I cut the flower's stem."),
 "菊": ("菊（きく）の　花（はな）が　さきました。", "The chrysanthemums have bloomed."),
 "菌": ("菌（きん）から　牛（ぎゅう）乳（にゅう）を　守（まも）ります。", "We protect the milk from germs."),
 "華": ("華（はな）やかな　おまつりでした。", "It was a splendid festival."),
 "葬": ("お葬（そう）式（しき）に　出（で）ました。", "I attended a funeral."),
 "薦": ("この　本（ほん）を　推（すい）薦（せん）します。", "I recommend this book."),
 "薫": ("五（ご）月（がつ）の　風（かぜ）が　薫（かお）ります。", "The May breeze carries a sweet scent."),
 "藤": ("藤（ふじ）の　花（はな）が　きれいです。", "The wisteria flowers are beautiful."),
 "藩": ("むかし、ここは　大（おお）きな　藩（はん）でした。", "Long ago, this was a great feudal domain."),
 "藻": ("池（いけ）に　藻（も）が　はえて　います。", "Algae is growing in the pond."),
 # olivine-city (mer)
 "虎": ("虎（とら）は　強（つよ）い　動（どう）物（ぶつ）です。", "The tiger is a strong animal."),
 "虐": ("動（どう）物（ぶつ）を　虐（いじ）めては　いけません。", "You must not mistreat animals."),
 "虚": ("虚（うそ）を　ついては　いけません。", "You must not tell lies."),
 "褐": ("褐（かっ）色（しょく）の　コートを　着（き）て　います。", "He wears a brown coat."),
 "覇": ("たいかいの　覇（は）者（しゃ）に　なりました。", "He became the tournament champion."),
 "豪": ("豪（ごう）華（か）な　ふねですね。", "What a luxurious ship."),
 "迅": ("迅（じん）速（そく）に　行（こう）動（どう）します。", "We act swiftly."),
 "逐": ("計（けい）画（かく）を　逐（ちく）一（いち）　報（ほう）告（こく）します。", "I report the plan point by point."),
 "逓": ("荷（に）物（もつ）を　逓（てい）送（そう）します。", "The packages are forwarded on."),
 "逮": ("犯（はん）人（にん）が　逮（たい）捕（ほ）されました。", "The culprit was arrested."),
 "遂": ("計（けい）画（かく）を　遂（と）げました。", "We carried the plan through."),
 "遇": ("旅（たび）で　親（しん）切（せつ）な　人（ひと）に　遇（あ）いました。", "On my journey I happened upon a kind person."),
 "遍": ("世（せ）界（かい）を　遍（あまね）く　旅（たび）しました。", "He traveled all over the world."),
 "遣": ("お小（こ）遣（づか）いを　ためます。", "I save up my pocket money."),
 "遷": ("都（みやこ）が　遷（うつ）されました。", "The capital was moved."),
 "避": ("あらしを　避（さ）けて　港（みなと）に　入（はい）ります。", "We shelter from the storm in the harbor."),
 "還": ("ふるさとに　生（せい）還（かん）しました。", "He returned home safe and alive."),
 "那": ("刹（せつ）那（な）の　できごとでした。", "It happened in an instant."),
 "陥": ("あなに　陥（おちい）らないで　ください。", "Don't fall into the pit."),
 "陪": ("陪（ばい）審（しん）員（いん）に　えらばれました。", "I was chosen as a juror."),
 "陰": ("木（き）の　陰（かげ）で　休（やす）みます。", "We rest in the shade of a tree."),
 "陵": ("古（こ）代（だい）の　陵（みささぎ）を　見（けん）学（がく）しました。", "We visited an ancient imperial tomb."),
 "陶": ("陶（とう）器（き）の　カップです。", "It's a ceramic cup."),
 "邦": ("邦（ほう）楽（がく）を　聞（き）くのが　すきです。", "I like listening to traditional Japanese music."),
 "邸": ("大（おお）きな　邸（やしき）に　住（す）んで　います。", "He lives in a grand mansion."),
 "酌": ("じじょうを　酌（く）んで　ゆるしました。", "Taking the circumstances into account, I forgave him."),
 "酔": ("ふなに　酔（よ）って　しまいました。", "I got seasick."),
 "酢": ("サラダに　酢（す）を　かけます。", "I put vinegar on the salad."),
 "醸": ("この　くらでは　しょうゆを　醸（かも）して　います。", "Soy sauce is brewed in this storehouse."),
 "隆": ("この　港（みなと）まちは　隆（りゅう）盛（せい）です。", "This port town is thriving."),
 # cianwood-city (dojo)
 "随": ("随（ずい）分（ぶん）　強（つよ）く　なりましたね。", "You've grown quite strong."),
 "隔": ("海（うみ）で　隔（へだ）てられた　まちです。", "It's a town separated by the sea."),
 "隠": ("たからものを　隠（かく）します。", "I hide the treasure."),
 "隣": ("隣（となり）の　いえに　あいさつします。", "I greet the people next door."),
 "隷": ("むかしの　奴（ど）隷（れい）の　れきしを　学（まな）びました。", "We learned the history of slavery."),
 "雄": ("雄（ゆう）大（だい）な　うみですね。", "What a magnificent sea."),
 "雌": ("この　とりは　雌（めす）です。", "This bird is a female."),
 "離": ("港（みなと）から　ふねが　離（はな）れます。", "The ship pulls away from the harbor."),
 "須": ("練（れん）習（しゅう）は　必（ひっ）須（す）です。", "Practice is essential."),
 "顕": ("努（ど）力（りょく）の　成（せい）果（か）が　顕（あらわ）れました。", "The results of his effort became evident."),
 "飢": ("飢（う）えた　旅（たび）人（びと）に　パンを　あげました。", "I gave bread to the starving traveler."),
 "飾": ("へやを　花（はな）で　飾（かざ）ります。", "I decorate the room with flowers."),
 "鬼": ("鬼（おに）の　おめんを　かぶります。", "I put on a demon mask."),
 "俺": ("俺（おれ）は　まけないぞ。", "I won't lose."),
 "傲": ("傲（ごう）慢（まん）な　たいどは　だめです。", "An arrogant attitude is no good."),
 "僅": ("僅（わず）かな　差（さ）で　勝（か）ちました。", "I won by a slim margin."),
 "冥": ("冥（めい）想（そう）で　心（こころ）を　整（ととの）えます。", "I settle my mind through meditation."),
 "刹": ("古（ふる）い　刹（せつ）が　山（やま）に　あります。", "An old temple stands on the mountain."),
 "剝": ("かべの　ペンキが　剝（は）がれました。", "The paint peeled off the wall."),
 "勾": ("この　さかは　勾（こう）配（ばい）が　きついです。", "This slope has a steep grade."),
 "匂": ("うみの　匂（にお）いが　します。", "I can smell the sea."),
 "宛": ("先（せん）生（せい）宛（あ）てに　手（て）紙（がみ）を　書（か）きます。", "I write a letter addressed to my teacher."),
 "巾": ("雑（ぞう）巾（きん）で　ゆかを　ふきます。", "I wipe the floor with a cloth."),
 "彙": ("語（ご）彙（い）を　ふやしたいです。", "I want to grow my vocabulary."),
 "慄": ("こわくて　戦（せん）慄（りつ）しました。", "I shuddered with fear."),
 "戚": ("親（しん）戚（せき）が　あそびに　きます。", "Relatives are coming to visit."),
 "拶": ("あいさつは　挨（あい）拶（さつ）と　書（か）きます。", "The word aisatsu is written 挨拶."),
 "挨": ("朝（あさ）の　挨（あい）拶（さつ）を　しましょう。", "Let's do our morning greetings."),
 "挫": ("足（あし）を　挫（くじ）いて　しまいました。", "I sprained my ankle."),
 "毀": ("古（ふる）い　こやが　毀（こわ）れました。", "The old shed fell apart."),
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
