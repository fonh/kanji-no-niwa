# Audit 04 — PNJ, dialogues et règles de langue

Tu es une session d'audit du projet 漢字の庭 (PWA d'apprentissage du japonais construite
sur le monde de Pokémon HeartGold/SoulSilver). Phase actuelle du projet : **corriger les
documents de référence avant d'écrire le contenu** — aucun code, aucun issue tracker.
Déroulé strict : Phase 1 audit (lecture seule) → Phase 2 grill → Phase 3 correction
immédiate des docs.

## Docs de référence

- PRD : `.scratch/kanji-no-niwa/PRD.md` — § Langue du Jeu (mécanismes A/B/C),
  § Mouvement de l'avatar (X/Y pendant dialogue), § PNJ/leçons
- ADR : `docs/adr/0001-npc-interaction-and-dialogue-state-model.md`,
  `0002-hand-written-dialogue-content-language.md`, `0004-multi-npc-set-pieces...`
- `content/npc-inventory.md` (1292 lignes, inventaire exhaustif par zone)
- `content/dialogues/` (exemples existants : `npcs/new-bark-town/mom_new_bark.json`,
  `trainers/route-29/...`) — le format de référence
- `content/guidebook-adapted.md` (PNJ récurrents transversaux, personnages clés)

## Périmètre

Tout ce qu'un PNJ doit savoir faire, confronté au format qui doit le porter :

- **Format dialogue** : `state_rules` + `dialogue_states` + pages `{jp, en}` avec
  lectures inline `漢字（かな）`. Ce format porte-t-il : les états multiples promis
  (avant/après quête, répétition), les Effects attachés à un state (ADR-0003), le
  mécanisme C (l'anglais = étiquette à usage unique — comment le format marque-t-il
  « première exposition faite » ?), la graduation vers 100% japonais ?
- **Furigana** : la convention `（かな）` inline est-elle documentée quelque part comme
  LA convention (le PRD parle du bouton Y, mais le format des lectures n'est spécifié
  dans aucun doc de référence — si c'est le cas, c'est un finding C) ?
- **Inventaire → contenu** : npc-inventory couvre-t-il chaque PNJ requis par les
  beats du guidebook-adapted (Silver ×6, Kimono ×5, donneurs de CS-Kanji ×7, Arrosoir,
  radio EXPN, gym leaders, Elite 4, PNJ récurrents) ? Chaque PNJ de l'inventaire
  a-t-il zone + rôle + (si quête) sa place dans une quête ?
- **Types d'interaction** : talk / leçon / dresseur / panneau / objet au sol — la
  taxonomie `trigger_type` est-elle définie et exhaustive quelque part ?
- **PNJ récurrents multi-zones** (Eusine, Bill, Lance, photographe) : le modèle
  « un PNJ = une zone » tient-il ? Sinon, qu'est-ce qui doit être spécifié ?
- **Règles de langue** : échantillonne les dialogues existants — respectent-ils
  « aucun français », le niveau N5 de départ, les lectures inline ?

**Interfaces à couvrir aussi :** ce que les dialogues promettent au moteur de quêtes
(audit 02) et aux leçons (audit 06) — signale, ne corrige pas.

## Phase 1 — Audit (lecture seule)

Ne modifie AUCUN fichier. Classe : **A** contradiction interne, **B** promesse sans
données, **C** promesse sans mécanisme, **D** ambiguïté, **E** obsolète.
Rapport → `.scratch/audits/findings-04-pnj-dialogues.md` avec chemin:ligne partout.

## Phase 2 — Grill

Invoque `/grill` sur les D — notamment : comment marquer « étiquette anglaise déjà
montrée » (par joueur ? par carte ?), le sort des PNJ récurrents multi-zones, la
taxonomie trigger_type.

## Phase 3 — Correction immédiate

- Corrige PRD, ADR 0001/0002/0004, npc-inventory selon les décisions. Si le format
  des lectures/furigana doit être normé, écris la norme dans l'ADR-0002 (c'est un
  doc de référence, pas du contenu). Marque `(corrigé AAAA-MM-JJ, audit 04)`.
- N'écris AUCUN dialogue (le contenu vient après les audits).
- Hors périmètre → « Reporté à la synthèse ». Résumé final.

## Règles transverses

1. Aucun français dans le produit ; 2. CS-Kanji jamais débloqués par le SRS ;
3. Pas de theming kanji par classe de dresseur ; 4. Anglais selon mécanismes A/B/C.
