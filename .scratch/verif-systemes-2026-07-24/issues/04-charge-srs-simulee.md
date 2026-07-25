# 04 — Simulation FSRS 18 mois : le « 300-380 rev/jour, ~1h » du PRD est optimiste

Status: ready-for-human

Simulation complète (revue B1, 2026-07-25) : `scripts/analysis/simulate-srs-load.py` —
FSRS-4.5 (w[] défaut, rétention 0.9), données réelles (344 leçons écrites/proposées,
8113 mots yomitan décomposés par kanji, ordre narratif réel), 3 graines, 550 jours.

## Constats

1. **Le « ~300-380 révisions/jour en croisière » du PRD est une moyenne sur toute la
   partie (306/j), pas une croisière** : le régime réel des 4 derniers mois de leçons est
   **400-530/j, pics à 630** — 10 mois consécutifs au-dessus de 300, 5 mois au-dessus de
   450. À 6-8 s/carte : 45-84 min/jour selon le mois. Le « ~1h/jour » tient de justesse
   en moyenne et casse aux mois de pointe.
2. **Fragilité à la précision** : à 70 % de Good (au lieu de 80 %), le système diverge —
   croisière 905/j, pics > 1100, 1h30-2h/jour. La charge annoncée suppose un apprenant
   qui réussit beaucoup.
3. **Les murs ne sont pas où on croyait** : Carmin (N1, peu de vocabulaire JLPT sur ses
   kanji rares) est un *répit* (15,7 mots/leçon). Les vraies vagues : fin de Johto
   (Blackthorn→Dark Cave, ~1340 mots débloqués en un mois) et **Céladon (1031 mots en 25
   leçons → pic absolu du jeu, mois 9 : 530/j de moyenne)**.
4. **Le plafond de rattrapage 200 est incohérent avec la charge réelle** : la file de
   croisière dépasse 300-500, donc « backlog = file > 200 » (définition PRD) est vrai
   *tous les jours* ; après une absence de 7 j au jour 300 (~2150 cartes), le plafond ne
   résorbe jamais — la file reste > 200 pendant 154 jours.

## Décisions à prendre (recommandations chiffrées)

- **A. Plafonner l'introduction de vocabulaire à 13-15 mots/jour** (30 cartes) : écrête
  précisément les deux vagues → croisière ~344/j, pic moy-7j ~363, tous les mots
  introduits avant le jour 550. C'est LE levier. ⚠️ Contredit la décision PRD « pas de
  plafond quotidien » (tranchée au grill) — c'est pourquoi cette issue est
  ready-for-human, pas ready-for-agent.
- **B. Redéfinir le backlog** : « file > 200 » → un seuil relatif (ex. file > 2× la
  moyenne mobile 14 j) ou simplement > 600 ; sinon requalifier le plafond 200 en plafond
  quotidien permanent assumé (ce qu'il devient de facto).
- **C. Mettre à jour PRD § Rythme et charge assumés** avec les chiffres simulés (et la
  variante 5j/7 : croisière 318/j, jeu +150 jours — une option à documenter pour le
  joueur réel).
- **D. PRD § Volume des leçons** : la réalité écrite est 5-6 kanji/leçon partout, pas
  « 4-5 Johto / 8-12 Kanto » — paragraphe à corriger (constat, pas une décision).
