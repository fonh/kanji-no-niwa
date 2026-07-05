# Audit 02 — Modèle Condition/Effect face à tous les cas narratifs

Tu es une session d'audit du projet 漢字の庭 (PWA d'apprentissage du japonais construite
sur le monde de Pokémon HeartGold/SoulSilver). Phase actuelle du projet : **corriger les
documents de référence avant d'écrire le contenu** — aucun code, aucun issue tracker.
Ton déroulé est strict : Phase 1 audit (lecture seule) → Phase 2 grill (décisions de
l'utilisateur) → Phase 3 correction immédiate des docs.

## Docs de référence

- PRD : `.scratch/kanji-no-niwa/PRD.md` — § « Modèle de condition/effet générique »
- ADR : `docs/adr/0003-condition-effect-quest-model.md` (+ 0001, 0002, 0004)
- `content/guidebook-adapted.md` (tous les cas narratifs, zone par zone)
- `content/map/story-beats.json` (jalons extraits, 52 beats)
- `content/texts-progressifs.md` (conditions liées à la lecture)

## Périmètre

Le modèle Condition/Effect est la colonne vertébrale du moteur. Types actuels :
`Condition` = kanji_count, item_owned, quest_step, npc_cleared, event_cleared,
badge_earned (ET logique en tableau) ; `Effect` = advance_quest, grant_item,
unlock_lesson, unlock_zone, unlock_text.

**Exercice central : prends chaque cas narratif du guidebook-adapted et écris sa
formalisation en Condition[]/Effect[]. Tout cas inexprimable = finding.**

Liste minimale à couvrir (complète-la en lisant le doc) :

- Les 6 apparitions de Silver (lieux + déclencheurs)
- Les 5 Kimono Girls + le gauntlet final à Rosalia
- Les 3 arcs Team Rocket (Puits Ramoloss, QG Acajou, Tour Radio — incl. déguisement)
- L'obtention des 7 CS-Kanji (dont 水 : remis par le Gentleman MAIS utilisable
  seulement après le badge de Morty — deux conditions distinctes) et la condition de
  lecture globale (« tous les textes des zones débloquées lus » : quel type de
  Condition l'exprime ? il n'existe pas de type text_completions à ce jour)
- Les objets-clés : Arrosoir (Simularbre), radio/carte EXPN (Ronflex)
- Les PNJ calendaires : frères/sœurs du jour (jour de semaine réel), photographe
  itinérant (calendrier hebdo), l'homme des Condominiums (créneau horaire 20h-4h),
  Daisy (15h-16h, 7 visites cumulées) — quel type de Condition exprime le temps réel ?
- Gyms verrouillées (icône cadenas), porte du Plateau Indigo (8 badges), gym de
  Vertville (Blaine battu + Blue rencontré), Misty absente du gym jusqu'à l'événement
  du cap, quête Copycat (objet trouvé ville A rendu ville B), Centrale Kanto
  (pièce volée → restituée → passage débloqué)
- Le gating quotidien SRS (« nouvelle zone bloquée si révisions non faites ») —
  est-ce une Condition ou un mécanisme à part ? Le PRD doit être net.

**Interfaces à couvrir aussi :** `state_rules` des dialogues (ADR-0001) — la sélection
d'état d'un PNJ couvre-t-elle tous les états requis par ces cas ? Idempotence des
Effects face aux quêtes à répétition.

## Phase 1 — Audit (lecture seule)

Ne modifie AUCUN fichier. Classe chaque finding : **A** contradiction interne,
**B** promesse sans données, **C** promesse sans mécanisme (cas inexprimable),
**D** ambiguïté à trancher, **E** trace obsolète.

Rapport → `.scratch/audits/findings-02-condition-effect.md` : pour chaque cas
narratif, sa formalisation (ou le trou), avec chemin:ligne. Termine par les
questions D et la liste des nouveaux types Condition/Effect que tu proposes
(proposition motivée : le moins de types possible).

## Phase 2 — Grill

Invoque `/grill` sur : chaque nouveau type de Condition/Effect proposé, les cas
temps-réel (les garder ? les couper ? v2 ?), et toute ambiguïté D. Ne passe en
phase 3 qu'après décision.

## Phase 3 — Correction immédiate

- Mets à jour le PRD (§ condition/effet) et l'ADR-0003 selon les décisions (nouveau
  types, cas explicitement reportés v2...). Marque `(corrigé AAAA-MM-JJ, audit 02)`.
- Si une décision mérite un nouvel ADR (changement de modèle), écris-le dans
  `docs/adr/` en suivant le format des existants.
- Ni code, ni contenu. Hors périmètre → « Reporté à la synthèse » dans le rapport.
- Résumé final : corrections, décisions, reportés.

## Règles transverses

1. Aucun français dans le produit ; 2. CS-Kanji jamais débloqués par le SRS (remis par
PNJ/trouvés, comme les HM du jeu) ; 3. Pas de theming kanji par classe de dresseur ;
4. Anglais selon mécanismes A/B/C du PRD § Langue du Jeu.
