# 03 — Mineurs relevés par la vérification d'intégrité du 2026-07-24

Status: ready-for-agent

À traiter au fil des phases en cours, aucun n'est bloquant.

1. **`content/texts/slowpoke-well/son_in_law_letter.json`** : les 3 questions ont
   `correct_index: 2` — seul fichier de production resté uniforme après la passe de
   randomisation 2.4 (distribution globale saine : {0:24, 1:16, 2:18, 3:14}). Déjà
   signalé en WARN par `lint-cross-refs.py`.
2. **`kanji.keyword` : 2134/2136 fiches sans le champ.** La politique de fallback
   (contrat §7) est posée, mais les 1 347 kanji déjà enseignés affichent donc
   `meanings[0]` brut (ex. 校 = "exam"). La passe qui les renseigne pour les zones DÉJÀ
   écrites n'est planifiée nulle part explicitement — l'ajouter au périmètre de la
   phase 2.4 ou d'une passe batch dédiée, sinon le trou persiste au lancement.
3. **Overlays grammaire des 11 zones early** toujours absents (azalea, cherrygrove,
   ilex-forest, routes 29/30/31/32/36, ruins-of-alph, sprout-tower, violet-city) — prévu
   phase 5.6, rappel : c'est tout l'arc tutoriel.
4. **Bonnes nouvelles vérifiées** (aucune action) : 0 découpage par caractère restant
   dans les `lesson_examples` (les 466 sont corrigés) ; 1350 slots de leçons avec
   `lesson_examples` présents ; 307/307 combats avec `battle_length` ; item_ids/event_ids/
   quest_steps/npc_cleared tous résolus (recoupé indépendamment des linters) ;
   `length_chars` des textes cohérents ; registres carte sans doublon ni orphelin.
