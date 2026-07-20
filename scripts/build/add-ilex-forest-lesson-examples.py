#!/usr/bin/env python3
"""
Étape 4 (Lot 3) — Forêt Secte : ajoute un `lesson_examples[]` réel aux 30 kanji
enseignés dans content/lessons/ilex-forest.json (5 leçons × 6, N4). Comble au fil
de l'écriture, pas après coup (content-writing-guide.md § 4).

Règle appliquée (révisée 2026-07-10, roadmap Étape 4) : plus de contrainte « zéro
autre kanji » — un kanji ne devient « étudié » que quand sa PROPRE leçon est
complétée, son apparition incidente ailleurs n'a aucun effet mécanique. Les
composés réels (三冊, 処理, 劇場, 展示…) sont préférés aux phrases-étiquettes.
Seule règle universelle vérifiée ici : lecture inline （…） sur CHAQUE kanji de
la phrase (ADR-0002), comme lint-kanji-budget.py.

Source de vérité unique : src/data/kanji-content.json (dict keyé par le caractère).
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KANJI_CONTENT_PATH = ROOT / "src/data/kanji-content.json"
KANJI_RE = re.compile(r"[一-鿿]")

# {character: [(jp, en), ...]} — chaque kanji de jp doit être suivi de sa lecture inline.
EXAMPLES = {
    # Leçon #1 — 冊 処 刻 劇 卵 宅
    "冊": [("本（ほん）を　三（さん）冊（さつ）　かいました。", "I bought three books.")],
    "処": [("この　問題（もんだい）を　自分（じぶん）で　処理（しょり）します。", "I'll handle this problem myself.")],
    "刻": [("とけいが　しずかに　時（とき）を　刻（きざ）む。", "The clock quietly ticks away the time.")],
    "劇": [("劇場（げきじょう）で　あたらしい　劇（げき）を　見（み）ました。", "I saw a new play at the theater.")],
    "卵": [("朝（あさ）ごはんに　卵（たまご）を　たべます。", "I eat an egg for breakfast.")],
    "宅": [("しごとが　おわって、帰宅（きたく）します。", "Work is over, so I'm heading home.")],
    # Leçon #2 — 宇 将 展 座 律 拝
    "宇": [("宇宙（うちゅう）は　とても　ひろいです。", "The universe is very vast.")],
    "将": [("将来（しょうらい）の　ゆめを　はなしました。", "I talked about my dreams for the future.")],
    "展": [("美術（びじゅつ）の　展示（てんじ）を　見（み）に　いく。", "I'm going to see an art exhibition.")],
    "座": [("どうぞ、この　席（せき）に　座（すわ）って　ください。", "Please, take a seat here.")],
    "律": [("みんなで　法律（ほうりつ）を　まもります。", "Everyone obeys the law.")],
    "拝": [("神社（じんじゃ）で　しずかに　拝（おが）みました。", "I prayed quietly at the shrine.")],
    # Leçon #3 — 探 操 敬 段 片 疑
    "探": [("もりの　出口（でぐち）を　探（さが）しています。", "I'm searching for the forest exit.")],
    "操": [("この　機械（きかい）を　うまく　操作（そうさ）する。", "I operate this machine skillfully.")],
    "敬": [("わたしは　あの　先生（せんせい）を　敬（うやま）っています。", "I hold that teacher in respect.")],
    "段": [("ゆっくり　階段（かいだん）を　のぼりました。", "I climbed the stairs slowly.")],
    "片": [("おもい　にもつを　片手（かたて）で　もつ。", "I carry the heavy luggage with one hand.")],
    "疑": [("その　話（はなし）を　すこし　疑（うたが）っています。", "I doubt that story a little.")],
    # Leçon #4 — 痛 蒸 蔵 補 退 降
    "痛": [("あたまが　とても　痛（いた）いです。", "My head hurts a lot.")],
    "蒸": [("なべで　野菜（やさい）を　蒸（む）します。", "I steam the vegetables in a pot.")],
    "蔵": [("お米（こめ）を　古（ふる）い　蔵（くら）に　しまう。", "I store the rice in an old storehouse.")],
    "補": [("たりない　言葉（ことば）を　補（おぎな）いました。", "I filled in the missing words.")],
    "退": [("ちちは　来年（らいねん）　会社（かいしゃ）を　退職（たいしょく）します。", "My father will retire from the company next year.")],
    "降": [("そとは　つよい　雨（あめ）が　降（ふ）っています。", "Heavy rain is falling outside.")],
    # Leçon #5 — 難 革 了 偉 偶 刺
    "難": [("これは　とても　難（むずか）しい　問題（もんだい）です。", "This is a very difficult problem.")],
    "革": [("あたらしい　革（かわ）の　かばんを　かいました。", "I bought a new leather bag.")],
    "了": [("やっと　しごとが　終了（しゅうりょう）しました。", "The work has finally finished.")],
    "偉": [("あの　人（ひと）は　とても　偉（えら）い　学者（がくしゃ）です。", "That person is a very eminent scholar.")],
    "偶": [("まちで　偶然（ぐうぜん）　ともだちに　あいました。", "I met a friend by chance in town.")],
    "刺": [("はりが　指（ゆび）に　刺（さ）さって　いたい。", "The needle pricked my finger and it hurts.")],
}


def check_inline_reading(character, jp):
    """Chaque RUN de kanji doit être immédiatement suivi de （lecture） (ADR-0002 :
    la furigana couvre le groupe de kanji, ex. 問題（もんだい）, pas chaque kanji)."""
    i = 0
    while i < len(jp):
        if KANJI_RE.match(jp[i]):
            j = i
            while j < len(jp) and KANJI_RE.match(jp[j]):
                j += 1
            run = jp[i:j]
            if j >= len(jp) or jp[j] != "（" or "）" not in jp[j:]:
                raise ValueError(f"{character}: run « {run} » sans lecture inline dans « {jp} »")
            i = j
        else:
            i += 1


def main():
    data = json.loads(KANJI_CONTENT_PATH.read_text())

    assert len(EXAMPLES) == 30, f"attendu 30 kanji, trouvé {len(EXAMPLES)}"
    for character, examples in EXAMPLES.items():
        if character not in data:
            raise KeyError(f"{character} absent de kanji-content.json")
        for jp, _en in examples:
            check_inline_reading(character, jp)

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
