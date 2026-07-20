#!/usr/bin/env python3
"""
Étape 4, lot 1 — ajoute `lesson_examples[]` aux 70 kanji des leçons de
route-32, ruins-of-alph et azalea-town (dont le pool cascadé de route-33,
voir content/lessons/azalea-town.json) dans src/data/kanji-content.json.
Même règle stricte que les scripts précédents (add-elm-bootstrap-*,
add-route30-*) : chaque phrase n'utilise que le kanji de l'entrée + du
hiragana, vérifié avant écriture.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KANJI_CONTENT_PATH = ROOT / "src/data/kanji-content.json"
FURIGANA_RE = re.compile(r"（[^）]*）")
KANJI_RE = re.compile(r"[一-鿿]")

EXAMPLES = {
    "刷": [("ほんを　刷（す）ります。", "I print a book.")],
    "副": [("副（ふく）かいちょうです。", "I am the vice-chairman.")],
    "印": [("ここに　印（しるし）を　つけます。", "I'll mark it here.")],
    "参": [("かいぎに　参（さん）かします。", "I'll take part in the meeting.")],
    "器": [("この　器（うつわ）は　きれいです。", "This vessel is beautiful.")],
    "変": [("てんきが　変（か）わりました。", "The weather changed.")],
    "官": [("かれは　官（かん）です。", "He is a government official.")],
    "害": [("それは　害（がい）に　なります。", "That becomes harmful.")],
    "富": [("この　くには　富（と）んでいます。", "This country is wealthy.")],
    "席": [("ここに　席（せき）が　あります。", "There is a seat here.")],
    "帯": [("きものに　帯（おび）を　しめます。", "I tie an obi sash to the kimono.")],
    "底": [("うみの　底（そこ）は　くらいです。", "The bottom of the sea is dark.")],
    "康": [("からだの　康（こう）を　いのります。", "I pray for bodily health.")],
    "愛": [("あなたを　愛（あい）しています。", "I love you.")],
    "成": [("ゆめが　成（な）りました。", "The dream came true.")],
    "散": [("はなが　散（ち）りました。", "The flowers scattered.")],
    "欠": [("ちからが　欠（か）けています。", "Strength is lacking.")],
    "残": [("たべものが　残（のこ）っています。", "Food remains.")],
    "求": [("たすけを　求（もと）めます。", "I ask for help.")],
    "浅": [("この　かわは　浅（あさ）いです。", "This river is shallow.")],
    "満": [("こころが　満（み）ちています。", "My heart is full.")],
    "無": [("それは　無（な）いです。", "That doesn't exist.")],
    "然": [("とつ然（ぜん）、あめが　ふりました。", "Suddenly, it rained.")],
    "熱": [("からだが　熱（あつ）いです。", "My body is hot (I have a fever).")],
    "競": [("ふたりで　競（きそ）います。", "The two of us compete.")],
    "老": [("老（お）いを　かんじます。", "I feel old age.")],
    "臣": [("おうの　臣（しん）です。", "I am the king's retainer.")],
    "良": [("とても　良（よ）い　てんきです。", "It's very good weather.")],
    "芸": [("あたらしい　芸（げい）を　みせます。", "I'll show a new trick.")],
    "衣": [("あたたかい　衣（ころも）を　きます。", "I put on warm clothing.")],
    "達": [("ゆめに　達（たっ）しました。", "I reached my dream.")],
    "選": [("ひとつ　選（えら）んで　ください。", "Please choose one.")],
    "陸": [("陸（りく）に　あがります。", "I go up onto land.")],
    "類": [("これは　めずらしい　類（るい）です。", "This is a rare kind.")],
    "久": [("久（ひさ）しぶりですね。", "It's been a while.")],
    "仏": [("仏（ほとけ）に　いのります。", "I pray to the Buddha.")],
    "任": [("あなたに　任（まか）せます。", "I'll leave it to you.")],
    "価": [("たかい　価（あたい）が　あります。", "It has high value.")],
    "保": [("けんこうを　保（たも）ちます。", "I maintain my health.")],
    "修": [("がくもんを　修（おさ）めます。", "I master my studies.")],
    "備": [("じしんに　備（そな）えます。", "I prepare for earthquakes.")],
    "制": [("あたらしい　制（せい）を　つくります。", "We create a new system.")],
    "厚": [("厚（あつ）い　ほんです。", "It's a thick book.")],
    "師": [("かれは　師（し）です。", "He is a master.")],
    "得": [("ちしきを　得（え）ました。", "I gained knowledge.")],
    "復": [("げんきに　復（ふく）します。", "I recover to health.")],
    "快": [("快（こころよ）い　かぜです。", "A pleasant wind.")],
    "接": [("おきゃくさまに　接（せっ）します。", "I attend to the customer.")],
    "殺": [("むしを　殺（ころ）しました。", "I killed a bug.")],
    "毒": [("これは　毒（どく）です。", "This is poison.")],
    "比": [("ふたつを　比（くら）べます。", "I compare the two.")],
    "減": [("おかねが　減（へ）りました。", "My money decreased.")],
    "準": [("準（じゅん）は　だいじです。", "Preparation is important.")],
    "演": [("ぶたいで　演（えん）じます。", "I perform on stage.")],
    "犯": [("あやまちを　犯（おか）しました。", "I committed a mistake.")],
    "示": [("みちを　示（しめ）します。", "I show the way.")],
    "税": [("税（ぜい）を　はらいます。", "I pay tax.")],
    "能": [("能（のう）が　あります。", "I have ability.")],
    "複": [("複（ふく）すうです。", "It's plural.")],
    "象": [("象（ぞう）は　おおきいです。", "An elephant is big.")],
    "述": [("いけんを　述（の）べます。", "I state my opinion.")],
    "逆": [("逆（ぎゃく）に　なりました。", "It became reversed.")],
    "過": [("じかんが　過（す）ぎました。", "Time has passed.")],
    "適": [("適（てき）した　しごとです。", "It's a suitable job.")],
    "限": [("じかんに　限（かぎ）りが　あります。", "There is a time limit.")],
    "険": [("険（けわ）しい　やまです。", "It's a steep mountain.")],
    "雑": [("雑（ざつ）な　しごとです。", "It's careless work.")],
    "非": [("それには　非（ひ）が　あります。", "There is fault in that.")],
    "並": [("並（なみ）の　おおきさです。", "It's an ordinary size.")],
    "亡": [("おじいさんは　亡（な）くなりました。", "Grandfather passed away.")],
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
