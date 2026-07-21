---
title: Audit New Bark Town (game designer + prof de japonais)
date: 2026-07-17
labels: [resolved]
zone: new-bark-town
---

> **Soldé 2026-07-21** (décisions utilisateur + application) :
> - **G2** — tranché « gater via unlock_conditions » : nouvelle étape de quête `egg_delivered`
>   (avancée par `welcome_back` d'Elm, qui gagne aussi un état terminal `egg_care`), leçons 3-5
>   gated dessus. Au retour, le beat « je te confie l'œuf » passe toujours en premier.
> - **G5** — aide d'Elm repositionnée dans le labo (tuile 29,1 près d'Elm), `_note` corrigé.
> - **J2/J6** — exemples 円 (prix `100円です`) et 女 (`女の人`) réécrits.
> - **J3/J4** — 2ᵉ `lesson_example` on'yomi ajouté : 一（いち）ばん・二（に）かい・八（はち）じ・
>   日曜日・一月・学生・元気. (Permis depuis l'abandon de la règle « zéro autre kanji », roadmap 2026-07-10.)
> - **J5** — couvert par le câblage grammaire (`content/grammar/new-bark-town.json`, pilote validé).
> - Linters verts après application (110 fichiers).

# Audit zone 1 — ワカバタウン / New Bark Town

Double relecture jouée pas à pas : (1) game designer, (2) prof de japonais.

## ✅ Corrigé dans cette passe (2026-07-17)

- **J1** — `八（や）つ` → `八（やっ）つ` dans `src/data/kanji-content.json` (lecture やっつ, cohérence avec `四（よっ）つ`).
- **G3** — `バーツタウン` → `ワカバタウン` dans `content/quests/mystery_egg_errand.json` (nom HGSS authentique, cf. `zone-registry-names.json`).
- **G1** — Pokégear remis par Mom **avant le départ** (nouvel état `give_pokegear` sur `sent_by_elm`) au lieu du retour. Rend jouables l'ordre d'Elm « みちで わたしに でんわしてね » et les appels Route 30 (`joey_route30`). `welcome_back` ne porte plus que l'annonce du vol (grant pokegear conservé en filet de sécurité idempotent). Source `guidebook-adapted.md` réalignée (L121/128/132).

## 🟠 À trancher — décisions de design (non corrigées)

### G2 — Beats narratifs d'Elm préemptés par ses propres leçons
Elm est PNJ-leçon **et** porte des temps forts (`sent_off`, `welcome_back`). Par la mécanique « coupure aller-retour », toute leçon débloquée en tête passe **avant** les `state_rules`. Conséquences :
- `sent_off` n'apparaît qu'après avoir fait les leçons 1-2.
- `welcome_back` (Elm prend l'œuf + « des gens mal intentionnés rôdent ») n'apparaît qu'**après les 5 leçons bouclées**.

Atténué : Mom + policier portent déjà la nouvelle du vol au retour. Mais le beat « je te confie l'œuf » chez Elm est masqué derrière le grind leçons.
**Question :** accepté tel quel, ou faut-il une exception pour qu'un beat de quête « prioritaire » passe devant la prochaine leçon une fois (ex. flag one-shot) ?

### G5 — `elm_assistant` situé « au comptoir du Mart »
Le `_note` de `elm_assistant_new_bark.json` place l'aide « au comptoir du Mart », or ワカバタウン n'a **ni Mart ni Centre** en canon. En HGSS l'aide est **dans le labo** après le vol.
**Question :** repositionner l'aide dans le labo (tuile près d'Elm) et corriger le `_note` ?

## 🟡 Raffinements pédagogiques (backlog, prof de japonais)

- **J2** — `円（えん）を あげます` / « give you some money » peu naturel (円 = unité yen, pas « argent »). Préférer un exemple de prix : `これは 100円（えん）です`.
- **J3** — Les kanji-chiffres n'exercent que la lecture-compteur (一→ひとつ, 二→ふたつ, 八→やっつ) et jamais le on'yomi de base (いち/に/はち), pourtant prioritaire pour un débutant.
- **J4** — 1 seul `lesson_example`/kanji (le guide autorise 1-2). Les on'yomi à haut rendement N5 ne surfacent jamais : 日 (にち/び → 日曜日), 月 (がつ → 一月), 生 (せい → 学生), 気 (き → 元気). Envisager un 2ᵉ exemple ciblé.
- **J5** — Contenu **grammaire** non encore rédigé : les leçons ne portent que le `grammar_id` (N5-001…005), pas les pages/quiz. Moitié pédagogique à écrire et à réviser. Confirmer aussi le superlatif 「Aがいちばん〜」 comme toute première notion + l'enchaînement des connecteurs けれども/しかし/じゃ/それじゃ.
- **J6** — `あの女（おんな）は…` un peu brusque ; en classe on préférerait `あの女（おんな）の人（ひと）は…`.

## Note moteur (invariant à préserver)

La disparition de Silver (`negate sent_by_elm`) et l'apparition Mom/policier n'est correcte que si `quest_step` a la **sémantique monotone** « a atteint l'étape » (documentée CONTEXT.md). Sous une lecture « étape courante == X », Silver réapparaîtrait après le retour. À garder invariant côté moteur.
