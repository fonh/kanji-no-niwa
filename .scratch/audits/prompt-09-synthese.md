# Audit 09 — Synthèse finale (à lancer en dernier, après les audits 01-08)

Tu es la session de synthèse des audits du projet 漢字の庭 (PWA d'apprentissage du
japonais sur le monde de Pokémon HGSS). Les 8 audits ciblés ont chacun corrigé les
docs de référence dans leur périmètre. Ton travail : vérifier que l'ensemble reste
cohérent APRÈS ces 8 vagues de corrections, et solder les points reportés.
Déroulé : Phase 1 croisement (lecture seule) → Phase 2 grill → Phase 3 correction
finale des docs.

## Entrées

- Les 8 rapports : `.scratch/audits/findings-01-*.md` à `findings-08-*.md` —
  en particulier chaque section « Reporté à la synthèse »
- Les docs corrigés : `.scratch/kanji-no-niwa/PRD.md`, `docs/adr/000*.md`,
  `content/guidebook-adapted.md`, `content/curriculum-checkpoints.md`,
  `content/texts-progressifs.md`, `content/npc-inventory.md`
- L'historique git des corrections : `git log --oneline` + `git diff` sur ces
  fichiers depuis le début des audits (pour voir ce que chaque audit a changé)

## Phase 1 — Croisement (lecture seule)

1. **Solde des reportés** : agrège toutes les sections « Reporté à la synthèse » ;
   pour chacun, vérifie s'il a été traité par un audit ultérieur ou s'il reste ouvert.
2. **Contradictions de seconde vague** : les corrections d'un audit ont-elles
   contredit celles d'un autre ? Points chauds évidents : la condition de lecture
   des CS-Kanji (audits 02+05), le flux nouvelles cartes (01+03+06), le lien
   dresseurs↔SRS (03+07), les tables du modèle de données (02+05+08), les PNJ
   multi-zones (02+04).
3. **Balayage des invariants** sur les docs finaux, mécaniquement (grep) :
   - toute mention résiduelle de maîtrise/stabilité/FSRS comme condition de
     déblocage hors mécanisme B (mode Sens) — interdit, surtout pour les CS-Kanji
   - toute mention résiduelle du modèle « 3 CS-Kanji » ou d'un donneur erroné
   - tout `kanji_pool` par classe de dresseur / theming par PNJ — interdit
   - les nombres canoniques identiques partout : 2136 kanji, 7 CS-Kanji, 6 Silver,
     5 Kimono, 3 Rocket, 16 badges, 27 classes de dresseurs
   - chaque renvoi inter-docs (« voir § X », « voir content/... ») pointe vers une
     section qui existe encore
4. Rapport → `.scratch/audits/findings-09-synthese.md` : reportés soldés/ouverts,
   contradictions trouvées, invariants violés, avec chemin:ligne.

## Phase 2 — Grill

Invoque `/grill` sur tout point encore ouvert qui demande une décision. C'est la
dernière porte avant l'écriture du contenu : signale explicitement à l'utilisateur
tout ce qui, à ton avis, bloquerait encore un rédacteur de contenu demain matin.

## Phase 3 — Correction finale

- Applique les dernières corrections dans les docs, marquées
  `(corrigé AAAA-MM-JJ, synthèse)`.
- Mets à jour `.scratch/audits/README.md` avec un statut final : « PRD prêt pour
  l'écriture du contenu : OUI/NON + restes connus ».
- Résumé final à l'utilisateur : état de cohérence global, décisions prises,
  ce qui est prêt et ce qui reste explicitement hors v1.
