# Passe de vérification globale n°2 — 2026-07-07 (post-audit 05)

Demandée après l'audit 05 : re-vérification de **tout ce qui a été implémenté** depuis le début
(audits 01→05, repasse progression, chasse aux reliques, adoptions I-1→I-14, V-1→V-8) contre
l'ensemble des docs de référence : PRD, CONTEXT.md, les 4 ADR, les 7 docs de `content/`, et —
nouveauté de cette passe — les **fichiers de contenu JSON** (`dialogues/`, `quests/`, `map/`).
Numérotation V-9→V-16, dans la continuité de la passe du 2026-07-07 matin (V-1→V-8,
`findings-01b-progression-repasse.md`).

## Reliquats corrigés

| # | Reliquat | Où | Correction |
|---|---|---|---|
| V-9 | Elm « donne la Master Ball après les 8 badges » — l'inventaire PNJ de la passe 1 n'avait pas été adapté après R11 (Master Ball → grand texte d'Elm) | `guidebook-adapted.md` L135 | « le grand texte de lecture », renvoi PRD |
| V-10 | Condition CS-Kanji « tous les textes des zones débloquées lus » — fossile `all_texts_read` en prose (invisible au grep d'identifiants, d'où sa survie aux passes précédentes) | `guidebook-adapted.md` L1172 | seuil `count(texts_read, N)` |
| V-11 | **Les 12 fichiers de dialogue portaient des noms français** (« Gamin Shin », « Fillette Yuki », « Oiselier Sora ») au format string — exactement les *content bugs* nommés par l'ADR-0002 (04-A1, « no French anywhere in the product », `name` bilingue) ; jamais migrés | `content/dialogues/**/*.json` (12 fichiers) | `name: {jp, en}` — classes vérifiées Bulbapedia : たんパンこぞう (Youngster), ミニスカート (Lass), とりつかい (Bird Keeper), あんないじいさん (Guide Gent), ママ (Mom) |
| V-12 | Mont Lune « hors scope en tant que donjon jouable » / embuscade Silver « zone `pewter-city`, non jouable » — fossiles d'avant le 2026-07-02 : la zone `mont-lune-route-3-4` (1800–1820, N1) figure dans la table de calibration et a son inventaire PNJ | `guidebook-adapted.md` L1261 ; `curriculum-checkpoints.md` L594 | zone jouable, embuscade recalibrée sur `mont-lune-route-3-4`, statut « scène à trancher à la synthèse » conservé |
| V-13 | « 🔒 飛/Coupe pour l'arbre côté Argenta » — coquille : un arbre se coupe (切), ne se survole pas | `npc-inventory.md` L1110 | 切/Coupe |
| V-14 | Pool de grammaire « rencontrés en dialogue NPC, leçon ou texte » — non aligné sur le scope 2026-07-02 (textes obligatoires seulement alimentent `grammar_encounters`) | `PRD.md` § Système de Combat | précision + renvoi § Tagging grammaire |
| V-15 | Quête `cherrygrove_welcome.json` : nom et labels d'étapes en français (« Accueil de Bourg-en-Côteau » — nom de ville de surcroît non officiel, Cherrygrove = Ville Griotte) | `content/quests/cherrygrove_welcome.json` | anglais (langue de contenu, ADR-0002) |
| V-16 | Le Kanji Budget de CONTEXT.md ne connaissait que la règle dialogues (2/dialogue) — pas la variante proportionnelle des textes actée à l'audit 05 (05-D1) | `CONTEXT.md` § Kanji Budget | phrase ajoutée (~2/100 chars, plafond 8–10 distincts) |

## Vérifié OK (rien à corriger)

- **Identifiants retirés** (`all_texts_read`, `mastery_events`, `kanji_count(`, `min_kanji_studied`,
  `blocks_until`, `masteredSet`, param `unlockedZones`) : uniquement des mentions historiques de
  retrait, partout — PRD, CONTEXT, ADRs (les corps d'ADR sont des archives, leurs Update notes font foi).
- **Comptes transverses cohérents** : 8 CS-Kanji (飛水力切砕滝渦登) dans les 3 listes ; ~28-29 textes
  obligatoires (3 occurrences alignées ; l'écart 28/29 s'explique par le chevauchement possible
  texte-Antre ↔ badge de Clair) ; ~70-100 secondaires / ~72 zones ; 9 modes de combat ;
  `pokéathlon_score ≥ 250` (PRD, guidebook, side-content) ; 828 points Hanabira.
- **Master Ball** purgée partout ailleurs (PRD, npc-inventory, placements, story-beats) — V-9 était la
  dernière survivante.
- **Décisions audit 05** (score 1ʳᵉ tentative, sélection manuelle, answer_span, audio_ref, budget
  proportionnel, corpus de référence, plancher N5) : propagées PRD ↔ texts-progressifs ↔ curriculum
  sans contradiction résiduelle trouvée.
- **JSON de carte** (`story-beats.json`, `npcs.json`, `trainers.json`, 67 placements) : aucune
  mécanique périmée (Master Ball, capture comme mécanique joueur, HM non adaptés) — les
  `role_origin`/`position_status` français sont des notes de travail, statut admis par l'ADR-0002.
- `jlpt-language-syllabus.md`, `japanese-books-mapping.md` (hors V-A3 déjà corrigé à l'audit 05) : propres.

## Flags → synthèse (décisions de design, pas des reliquats mécaniques)

- **F-A** — Les annotations Kanto de la passe 6 du guidebook (« mécanique de collection/complétion
  hors scope, mais bon modèle » : réalisateur GAME FREAK, comptoir du Musée, évaluation Pokédex d'Oak,
  cameo Steven « probablement à couper », Pal Park) sont **antérieures à la doctrine « tout
  utilisable »** (04 session 4). Chaque cas est un arbitrage adaptation-vs-couleur-pure à faire aux
  budgets de la synthèse — pas corrigé d'office ici.
- **F-B** — **Langue des noms de zones affichés au joueur** : les docs et `story-beats.json` utilisent
  les noms français HGSS (Doublonville, Forêt Secte…) ; « no French anywhere in the product »
  (ADR-0002) implique que la carte/Pokégear affiche du jp (＋en via X ?). Jamais spécifié nulle part →
  audit 08 (menus) ou synthèse.
- **F-C** — **Visibilité des labels de Quest Steps** : traduits en anglais par prudence (V-15), mais
  aucun doc ne dit si un journal de quêtes les affiche ou si ce sont des notes de travail → audit 08.
- **F-D** — **Embuscade Silver au Mont Lune** : zone désormais jouable (V-12), mais scène
  d'embuscade = 7ᵉ apparition jouable ou simple continuité d'écriture — explicitement laissée
  ouverte, à trancher à la synthèse.
