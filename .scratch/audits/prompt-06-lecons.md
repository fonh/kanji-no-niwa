# Audit 06 — Leçons (écran-livre, batchs, ordre)

Tu es une session d'audit du projet 漢字の庭 (PWA d'apprentissage du japonais construite
sur le monde de Pokémon HeartGold/SoulSilver). Phase actuelle du projet : **corriger les
documents de référence avant d'écrire le contenu** — aucun code, aucun issue tracker.
Déroulé strict : Phase 1 audit (lecture seule) → Phase 2 grill → Phase 3 correction
immédiate des docs.

## Docs de référence

- PRD : `.scratch/kanji-no-niwa/PRD.md` — § Leçons (écran-livre), § Menu START slot 2,
  § « Assignation du contenu de leçon — fixée à l'écriture », § « Ordre des leçons
  imposé », `getLessonQueue`, § Interface (orientation paysage, double page)
- `content/curriculum-checkpoints.md` (grammar_note, kanji par palier)
- Sources : `scripts/sources/grammar_JLPT_N*.json` (Hanabira : short/long_explanation,
  examples[], grammar_audio), `scripts/sources/kanjidic2.xml.gz`, kanjivg, jmdict
- `content/npc-inventory.md` (les PNJ-leçons candidats par zone)

## Périmètre

- **Anatomie d'une leçon** : le PRD définit-il ce qu'une leçon CONTIENT exactement
  (combien de kanji/points de grammaire, quelles pages du livre : tracé ? étymologie ?
  exemples ? audio ?) ? Si l'anatomie n'est décrite nulle part de façon exécutable
  par l'équipe contenu, c'est le finding central.
- **Batch** : « batch de leçons actif + historique » — taille d'un batch, qui le
  compose, lien avec le flux de nouvelles cartes SRS (croise avec
  `findings-03-srs.md` s'il existe).
- **Ordre imposé intra-zone** : mécanisme concret (numérotation ? chaînage
  unlock_lesson ?) — cohérent avec le modèle Condition/Effect ?
- **Assignation fixée à l'écriture** : conséquences documentées pour l'équipe contenu
  (un PNJ-leçon = un kanji/grammaire précis) — npc-inventory est-il prêt à recevoir
  cette assignation (format de champ prévu ?) ?
- **Données** : chaque champ promis par l'écran-livre existe-t-il dans les sources
  (audio de grammaire : `generate-grammar-audio.py` existe ; étymologie :
  `generate-etymology.py` / batch-etymology-log ; tracés : kanjivg) ? Compte ce qui
  manque.
- **Écran** : orientation paysage + double page côte à côte — le PRD § Interface et
  le § Leçons racontent-ils la même chose ?

**Interfaces à couvrir aussi :** leçons ↔ SRS (création de cartes), leçons ↔ PNJ
(dialogue_ref vs lesson_ref : deux systèmes ou un seul ?), leçons ↔ progression
(paliers).

## Phase 1 — Audit (lecture seule)

Ne modifie AUCUN fichier. Classe : **A** contradiction, **B** promesse sans données,
**C** promesse sans mécanisme, **D** ambiguïté, **E** obsolète.
Rapport → `.scratch/audits/findings-06-lecons.md` avec chemin:ligne.

## Phase 2 — Grill

Invoque `/grill` sur les D — notamment l'anatomie exacte d'une leçon et la taille des
batchs si le PRD ne les fixe pas.

## Phase 3 — Correction immédiate

- Corrige PRD, curriculum-checkpoints, npc-inventory (format d'assignation) selon les
  décisions. Marque `(corrigé AAAA-MM-JJ, audit 06)`.
- N'écris AUCUNE leçon. Hors périmètre → « Reporté à la synthèse ». Résumé final.

## Règles transverses

1. Aucun français dans le produit ; 2. CS-Kanji jamais débloqués par le SRS ;
3. Pas de theming kanji par classe de dresseur (l'assignation des leçons suit l'ordre
pédagogique, pas un thème de PNJ) ; 4. Anglais selon mécanismes A/B/C (l'étiquette
anglaise unique se montre À la leçon d'introduction — vérifier que le § Leçons le dit).
