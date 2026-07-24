---
# Gabarit lettre du mentor — avec bloc reply optionnel (PRD § Mentors, adopté 2026-07-24).
# Domicile réel : content/dialogues/mentors/{elm,oak}/<event_ref>.md — indexé par event_type/event_ref.
# Le bloc reply n'existe que sur ~8-10 des 36 lettres (jalons à forte charge émotionnelle).
# accepted_orders = indices des chunks, plusieurs séquences valides (validation par comparaison,
# composant Disposition réutilisé — aucune correction libre). reaction_ref pointe la lettre suivante
# du même mentor, qui porte une ouverture alternative (reaction_opening) affichée si replied_at est posé.
mentor: elm
event_type: badge_earned
event_ref: falkner
reply:
  prompt: { jp: "エルムはかせに　へんじを　かこう。", en: "Write a reply to Professor Elm." }
  chunks:
    - { jp: "はかせ、", en: "Professor," }
    - { jp: "はじめての　バッジを", en: "my first badge" }
    - { jp: "とりました！", en: "I got it!" }
    - { jp: "つぎも　がんばります。", en: "I'll keep doing my best." }
  accepted_orders:
    - [0, 1, 2, 3]
    - [1, 2, 0, 3]
  reaction_ref: bugsy
---

# 手紙（てがみ）

○○くんへ

キキョウシティの　ジムを　やぶったって？　すごいじゃないか！
ハヤトは　そらの　みちの　しはんだ。かんたんな　あいてじゃ　ない。

きみが　でて　いってから、けんきゅうじょが　しずかでね。
つぎの　まちでも、あたらしい　もじに　であったら　おしえて　ほしい。

からだに　きを　つけて。

エルムより

---
# Ouverture alternative de la lettre suivante (bugsy.md, champ reaction_opening) si le joueur a répondu :
# { jp: "へんじ、うれしかったよ。けんきゅうしつの　かべに　はって　ある。", en: "Your reply made my day — it's pinned on the lab wall." }
