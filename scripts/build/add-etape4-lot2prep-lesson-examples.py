#!/usr/bin/env python3
"""
Étape 4, préparation Lot 2 — comble un trou trouvé en auditant le contenu déjà
écrit (tranche verticale étendue + zones oubliées) : 115 kanji assignés à des
leçons réelles (content/lessons/{cherrygrove-city,route-29,route-31,route-36,
sprout-tower,violet-city}.json) n'avaient aucun `lesson_examples[]` dans
src/data/kanji-content.json — la page droite du Book Screen (« usage : 1-2
phrases ») était vide pour eux. Aucun linter ne l'attrapait (lint-kanji-budget.py
ne fait que boucler sur lesson_examples quand la liste existe déjà).

Méthode : phrases ancrées dans le corpus Tatoeba déjà importé
(scripts/sources/tatoeba_jpn_eng.json, 231k paires JP/EN avec kanji_set annoté)
quand une phrase courte n'utilisant QUE ce kanji existe (~71/115 cas, adaptée/
nettoyée pour le registre du jeu — pas de copie de tournures argotiques/vulgaires) ;
sinon composée à la main dans le même registre que les 120 exemples déjà écrits
(30 kanji rares route-36/sprout-tower N2 sans usage isolé naturel — 剖/寡/屯/候 —
utilisent une phrase-étiquette minimale « この かんじは X です », seule option
honnête quand le kanji n'existe jamais hors composé). Les PDF de
scripts/sources/japanse books/ restent bloqués par l'absence d'OCR
(content/japanese-books-mapping.md) et, de toute façon, ne sont pas la bonne
source pour ce champ précis : la règle est zéro AUTRE kanji que l'entrée
elle-même (même kanji déjà étudiés exclus), qu'une phrase de manuel authentique
respecte rarement — Tatoeba filtré sert mieux cet usage précis que les Textes
Progressifs (qui, eux, tolèrent un budget proportionnel et sont la bonne cible
pour le matériel de manuel une fois l'OCR débloqué).

Même règle stricte que les scripts précédents (add-elm-bootstrap-lesson-examples.py
etc.) : vérifiée avant écriture, zéro kanji hors celui de l'entrée.
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
    # --- cherrygrove-city (10) ---
    "冬": [("冬（ふゆ）が　きます。", "Winter is coming.")],
    "図": [("図（ず）を　みます。", "I'll look at the diagram.")],
    "夏": [("もうすぐ　夏（なつ）です。", "Summer is coming soon.")],
    "夜": [("もう　夜（よる）です。", "It's already night.")],
    "家": [("これは　わたしの　家（いえ）です。", "This is my house.")],
    "工": [("この　かんじは　工（こう）です。", "This kanji is 'kō'.")],
    "帰": [("もう　帰（かえ）ります。", "I'm going home now.")],
    "広": [("この　へやは　広（ひろ）いです。", "This room is spacious.")],
    "心": [("心（こころ）から　ありがとう。", "Thank you from the heart.")],
    "方": [("あの　方（かた）は　やさしいです。", "That person is kind.")],
    # --- route-29 (20) ---
    "京": [("京（きょう）へ　いきます。", "I'm going to the capital.")],
    "作": [("ケーキを　作（つく）ります。", "I'll make a cake.")],
    "光": [("光（ひかり）が　きれいです。", "The light is beautiful.")],
    "前": [("前（まえ）に　あいました。", "I met you before.")],
    "力": [("いつでも　力（ちから）に　なるよ。", "I'll always help you.")],
    "北": [("北（きた）へ　いきます。", "I'm going north.")],
    "夕": [("夕（ゆう）べは　さむかったです。", "Last evening was cold.")],
    "後": [("また　後（あと）で。", "See you later.")],
    "文": [("これは　文（ぶん）です。", "This is a sentence.")],
    "母": [("これは　母（はは）です。", "This is my mother.")],
    "毎": [("毎（まい）にち　げんきです。", "I'm doing fine every day.")],
    "父": [("これは　父（ちち）です。", "This is my father.")],
    "田": [("ここは　田（た）です。", "This is a rice field.")],
    "行": [("そこへ　行（い）きます。", "I'll go there.")],
    "西": [("西（にし）へ　いきます。", "I'm going west.")],
    "長": [("この　みちは　長（なが）いです。", "This road is long.")],
    "雨": [("雨（あめ）です。", "It's raining.")],
    "食": [("ごはんを　食（た）べます。", "I'll eat a meal.")],
    "高": [("この　やまは　高（たか）いです。", "This mountain is tall.")],
    "魚": [("魚（さかな）が　います。", "There's a fish.")],
    # --- route-31 (20) ---
    "低": [("この　いすは　低（ひく）いです。", "This chair is low.")],
    "別": [("ここで　お別（わか）れです。", "This is where we part ways.")],
    "原": [("ひろい　原（はら）です。", "It's a wide field.")],
    "園": [("ここは　わたしの　園（その）です。", "This is my garden.")],
    "建": [("いえを　建（た）てます。", "I'll build a house.")],
    "当": [("これが　当（あ）たりです。", "This is a win!")],
    "形": [("きれいな　形（かたち）です。", "It's a beautiful shape.")],
    "戸": [("戸（と）を　あけます。", "I'll open the door.")],
    "才": [("18才（さい）です。", "I'm 18 years old.")],
    "数": [("3まで　数（かぞ）えます。", "I'll count to 3.")],
    "死": [("死（し）なないで。", "Please don't die.")],
    "毛": [("この　ねこは　毛（け）が　ながいです。", "This cat's fur is long.")],
    "漢": [("これは　漢（かん）の　じだいです。", "This is the Han era.")],
    "王": [("王（おう）に　あいました。", "I met the king.")],
    "発": [("あした　発（た）ちます。", "I'll depart tomorrow.")],
    "私": [("私（わたし）は　げんきです。", "I am well.")],
    "竹": [("竹（たけ）が　あります。", "There is bamboo.")],
    "糸": [("糸（いと）が　ほそいです。", "The thread is thin.")],
    "送": [("てがみを　送（おく）ります。", "I'll send a letter.")],
    "進": [("まえに　進（すす）みます。", "I'll move forward.")],
    # --- route-36 (25) ---
    "凶": [("おみくじで　凶（きょう）が　でました。", "I drew bad luck in the fortune slip.")],
    "凹": [("ここが　凹（へこ）んでいます。", "It's dented here.")],
    "刈": [("くさを　刈（か）ります。", "I'll cut the grass.")],
    "刑": [("おもい　刑（けい）です。", "It's a heavy sentence.")],
    "剖": [("この　かんじは　剖（ぼう）です。", "This kanji is 'bō'.")],
    "剣": [("これは　剣（けん）です。", "This is a sword.")],
    "升": [("これは　升（ます）です。", "This is a measuring box.")],
    "卑": [("卑（いや）しい　こころです。", "It's a mean-spirited heart.")],
    "即": [("それが　即（すなわ）ち　こたえです。", "That is, namely, the answer.")],
    "卸": [("にもつを　卸（おろ）します。", "I'll unload the cargo.")],
    "厄": [("これは　厄（やく）です。", "This is bad luck.")],
    "又": [("又（また）　あいましょう。", "Let's meet again.")],
    "呉": [("これを　呉（く）れる？", "Will you give me this?")],
    "唐": [("唐（から）の　じだいです。", "This is the Tang era.")],
    "奉": [("かみさまに　奉（たてまつ）ります。", "I offer it to the god.")],
    "宴": [("たのしい　宴（うたげ）です。", "It's a joyful feast.")],
    "寛": [("うちで　寛（くつろ）ぎます。", "I'll relax at home.")],
    "寡": [("この　かんじは　寡（か）です。", "This kanji is 'ka'.")],
    "寮": [("ここは　寮（りょう）です。", "This is a dormitory.")],
    "尚": [("尚（なお）、ちゅういしてください。", "Furthermore, please be careful.")],
    "尼": [("尼（あま）さんに　あいました。", "I met a nun.")],
    "屯": [("この　かんじは　屯（とん）です。", "This kanji is 'ton'.")],
    "巡": [("まちを　巡（めぐ）ります。", "I'll go around the town.")],
    "幻": [("それは　幻（まぼろし）でした。", "That was an illusion.")],
    "幾": [("幾（いく）つですか。", "How many is it?")],
    # --- sprout-tower (10) ---
    "争": [("もう　争（あらそ）わないで。", "Please don't fight anymore.")],
    "伝": [("これを　伝（つた）えます。", "I'll convey this.")],
    "候": [("この　かんじは　候（こう）です。", "This kanji is 'kō'.")],
    "兆": [("いい　兆（きざ）しです。", "It's a good sign.")],
    "利": [("はなが　利（き）きます。", "I have a good sense of smell.")],
    "遊": [("こどもと　遊（あそ）びます。", "I'll play with the child.")],
    "部": [("部（ぶ）に　はいります。", "I'll join a club.")],
    "酒": [("酒（さけ）を　のみます。", "I'll drink sake.")],
    "陽": [("陽（ひ）が　でました。", "The sun came out.")],
    "面": [("この　面（めん）が　すきです。", "I like this mask.")],
    # --- violet-city (30) ---
    "他": [("他（ほか）のを　ください。", "Please give me a different one.")],
    "倍": [("2倍（ばい）です。", "It's double.")],
    "列": [("列（れつ）に　ならびます。", "I'll line up.")],
    "化": [("おばけに　化（ば）けます。", "I'll transform into a ghost.")],
    "命": [("命（いのち）を　まもります。", "I'll protect life.")],
    "定": [("ルールを　定（さだ）めます。", "I'll establish the rules.")],
    "実": [("この　実（み）は　あまいです。", "This fruit is sweet.")],
    "宿": [("ここが　宿（やど）です。", "This is the inn.")],
    "役": [("これは　わたしの　役（やく）です。", "This is my role.")],
    "投": [("ボールを　投（な）げます。", "I'll throw the ball.")],
    "決": [("こたえを　決（き）めます。", "I'll decide the answer.")],
    "流": [("かわが　流（なが）れます。", "The river flows.")],
    "深": [("この　うみは　深（ふか）いです。", "This sea is deep.")],
    "温": [("この　スープは　温（あたた）かいです。", "This soup is warm.")],
    "港": [("ふねが　港（みなと）に　います。", "A ship is at the harbor.")],
    "湖": [("きれいな　湖（みずうみ）です。", "It's a beautiful lake.")],
    "湯": [("湯（ゆ）が　あついです。", "The hot water is hot.")],
    "皮": [("りんごの　皮（かわ）を　むきます。", "I'll peel the apple's skin.")],
    "皿": [("お皿（さら）を　あらいます。", "I'll wash the dishes.")],
    "福": [("「福（ふく）は　うち。」と　いいます。", 'We say "Fortune in!"')],
    "米": [("お米（こめ）を　たべます。", "I'll eat rice.")],
    "羽": [("とりの　羽（はね）です。", "It's a bird's feather.")],
    "落": [("りんごが　落（お）ちます。", "The apple falls.")],
    "葉": [("きの　葉（は）です。", "It's a tree's leaf.")],
    "角": [("そこの　角（かど）です。", "It's at that corner.")],
    "谷": [("ふかい　谷（たに）です。", "It's a deep valley.")],
    "身": [("その　身（み）に　なって　かんがえて。", "Put yourself in their shoes.")],
    "追": [("ゆめを　追（お）います。", "I'll chase my dream.")],
    "馬": [("馬（うま）が　います。", "There's a horse.")],
    "麦": [("麦（むぎ）を　そだてます。", "I'll grow wheat.")],
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

    assert len(EXAMPLES) == 115, f"attendu 115 kanji, trouvé {len(EXAMPLES)}"

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
