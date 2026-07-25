# Plan de revue « le projet va-t-il dans la bonne direction ? » (2026-07-24)

Constat d'ouverture : le projet est sur-revu sur le papier (10 audits + grills + 3 revues
cette semaine) et sous-revu dans la réalité — zéro minute jouée, zéro simulation de charge,
zéro traversée automatique de la progression. Les revues qui manquent ne sont pas des
relectures : ce sont des **instruments** (une tranche jouable, deux simulateurs, un
protocole de playtest). Trois familles, par ordre de valeur.

---

## A. Revue joueur — impossible sans instrument : construire la tranche verticale d'abord

C'est la revue la plus importante et la seule qu'aucun document ne peut remplacer. Elle
exige un moteur minimal (carte New Bark → Violet, dialogues, leçons, SRS, combat aux 9
modes fondateurs — les 13 additionnels peuvent attendre) sur le contenu déjà écrit. C'est
une remise en question directe du plan « 100 % du contenu avant le code » — assumée, voir
§ D1.

Points de contrôle, dans l'ordre où un joueur les vit :

- **A1. Première session (0 → 30 min)** : onboarding → choix compagnon → 1-2 leçons d'Elm
  → Route 29 → Cherrygrove. Mesurer : temps réel, nombre d'écrans avant le premier moment
  de jeu « libre », moments de confusion. Seuil d'alerte : > 20 min avant la première
  vraie décision du joueur.
- **A2. La boucle quotidienne sur 14 jours réels** (toi, sur téléphone) : l'appel du
  mentor → session SRS → exploration. Mesurer chaque jour : durée SRS réelle, envie de
  continuer après le SRS (le jeu est-il la récompense ou une 2ᵉ corvée ?), jours manqués.
  C'est LE test existentiel du produit (§ D2).
- **A3. Pacing d'une route** : traverser Route 30-31 avec ses dresseurs. Un combat de
  route = 5-8 questions ; en fin de jeu 20-25. Chronométrer la traversée, noter la
  sensation (rythme ou corvée). Extrapoler à une route Kanto à 8 dresseurs × 20q.
- **A4. Lisibilité réelle sur mobile** : densité kanji 15-20 % + lectures inline masquées
  + DotGothic16/BIZ UDGothic + furigana 10px, en paysage sur TON téléphone. Une décision
  typographique invalidée ici invalide la re-kanjification entière — à tester tôt.
- **A5. Le combat-quiz tient-il 100 fois ?** Jouer ~15 combats d'affilée. La variété des
  modes suffit-elle, ou l'habillage Pokémon s'use-t-il en une session ? (§ D3)
- **A6. Défaite et refaire** : perdre un 師範 à la question 20/24, refaire. Frustration
  productive ou punitive ?
- **A7. Mur Kanto simulé** : maquette de Carmin (30 leçons, 4 PNJ) en avance rapide —
  même sans contenu final, enchaîner 8 leçons du même PNJ dit tout de suite si les
  sous-lieux narratifs suffisent.

Protocole : journal de bord quotidien (3 lignes/jour), pas de questionnaire — les
findings A1-A7 remontent comme issues `ready-for-agent` ou comme amendements PRD.

## B. Revue prof de japonais — faisable maintenant, sur données

- **B1. Simulation de charge FSRS (script, pas d'opinion)** : rejouer 18 mois de
  progression au rythme de référence (1 leçon/jour, courbe réelle des zones écrites) avec
  `ts-fsrs` et sortir : reviews/jour au fil du temps, pics post-Carmin, effet d'une
  absence d'une semaine. Le PRD annonce ~300-380 reviews/jour « assumé » — chiffre jamais
  simulé. Si la simulation sort 500+ en régime Kanto, le rythme du jeu entier est à
  recalibrer AVANT d'écrire les 12 zones restantes.
- **B2. Rétention de la grammaire hors SRS (le point faible identifié)** : la grammaire
  vit sur « rencontres + rotation plus-anciens-d'abord + boost 14 jours ». Simuler avec
  les données réelles (overlays écrits, poids de combat, fréquence de combat estimée) :
  combien de fois un point N4 moyen est-il retiré sur 6 mois ? S'il tombe sous ~1×/mois,
  le mécanisme ne retient rien et c'est un problème de PRD, pas de contenu.
- **B3. Le résidu de l'ordre par composants** : post-swap, mesurer objectivement — pour
  chaque kanji, sa position dans le jeu vs son rang de fréquence (corpus news/Netflix).
  Lister le top-50 des aberrations restantes (鬱 en 545, 朕 en 1167…). Décider une fois :
  2ᵉ vague de swap, ou assumé et documenté (§ D5).
- **B4. Adéquation modes ↔ paliers** : vérifier que le gating par palier des modes
  M19-M23 (lecture) et de la graduation anglais→japonais produit une expérience N5
  cohérente (un débutant ne doit jamais voir un mode au-dessus de son niveau). Sur table,
  avec la matrice modes × paliers.
- **B5. Échantillonnage linguistique continu** : à chaque lot de production, 15 dialogues
  + 2 textes tirés au sort, relus en profondeur (naturalité, registre, lectures) — le
  même exercice que la revue du 23/07, mais récurrent et petit. Les linters attrapent la
  structure, jamais le ton.
- **B6. Couverture du syllabus** : croiser `jlpt-language-syllabus.md` (can-dos) avec le
  contenu écrit — quels can-dos n'ont AUCUNE incarnation (ni dialogue, ni 会話, ni
  leçon) ? Sortie : liste de trous à combler dans les zones restantes.

## C. Revue programmeur — faisable maintenant, à outiller une fois

- **C1. Le solveur de progression (l'outil manquant le plus rentable)** : un script qui
  joue la partie entière comme une traversée de graphe — état initial → applique
  Conditions/Effects/quêtes/seuils → prouve que Red est atteignable, liste les gates
  jamais franchissables, les items en excès, les ordres de visite qui bloquent.
  `calc-cs-corpus.py` en fait 10 % ; généraliser. C'est le seul moyen de prouver
  l'absence de deadlock sans jouer 18 mois. À faire tourner en CI sur chaque lot.
- **C2. Schéma ↔ contenu, passe finale** : chaque champ consommé par le PRD a-t-il une
  colonne (audit 08 refait sur l'état final), chaque champ écrit dans les 685 fichiers
  est-il lu par quelque chose (champs morts) ?
- **C3. Budget d'implémentation honnête des 22 modes** : chaque mode = UI + tirage +
  distracteurs + garde d'exclusion + QA. Chiffrer, puis décider si la v-jouable démarre à
  9 modes avec les 13 en flux (§ D4).
- **C4. Budget PWA** : poids réel de kanji-content.json (37k tokens rien qu'à lire…),
  audio Disposition 25-35 Mo, sprites — simuler un premier chargement mobile.
- **C5. Couverture des linters** : matrice « règle du PRD → linter qui la vérifie ». Les
  trous connus : schéma `conversation_turn`/`reply` (nouveaux), densité cible atteinte
  par zone re-kanjifiée, budget proportionnel des textes longs.
- **C6. Rejouabilité des Effects** : preuve d'idempotence sur séquences adverses
  (re-talk, re-visite, ordre inattendu) — sur table ou en test unitaire du futur moteur.

## D. Les questions de fond à rouvrir (PRD compris) — le « surtout le PRD »

- **D1. « Tout le contenu avant le code » — la décision la plus risquée du projet.**
  100 % du contenu s'écrit sous des hypothèses d'UX jamais testées (densité kanji,
  longueur de leçon, pacing de combat, typographie). Si A1-A7 invalident UNE de ces
  hypothèses après 48 zones écrites, la reprise coûte des semaines. Recommandation :
  tranche verticale en parallèle des 12 zones restantes — le contenu Johto est fini et
  suffit ; les deux chantiers ne se touchent pas.
- **D2. Le pari existentiel : 1h+/jour pendant 12-18 mois.** Le jeu est une couche sur une
  discipline Anki hardcore. Question à se poser honnêtement après A2/B1 : le jeu
  REND-il la discipline plus tenable, ou ajoute-t-il du temps par-dessus ? Aucun
  document ne répondra — seulement les 14 jours de A2.
- **D3. Combat = quiz, 100 % du temps.** Toute l'aventure est des QCM habillés. Si A5
  révèle l'usure, les pistes existent déjà dans le PRD (Pokéathlon = fluence chronométrée,
  mini-jeux) — la question serait d'en faire des respirations régulières, pas des
  annexes.
- **D4. 22 modes : richesse ou dette ?** Chaque mode additionnel a un coût pipeline+QA
  permanent. Une v-jouable à 9 modes ne trahit rien (les 13 sont « additifs » par
  construction). À trancher après C3.
- **D5. 2136 kanji, le bon objectif ?** Le scope inclut des kanji que même le N1 ne
  demande pas (朕, 彙…). L'objectif affiché est « lire des textes authentiques » —
  ~1500-1800 kanji de fréquence y suffisent, la queue s'apprend en lisant. Rouvrir le
  scope coûterait cher (comptages figés) ; a minima, B3 doit dire ce que la queue rare
  coûte en temps d'apprentissage pour décider en connaissance.
- **D6. L'anglais comme langue pédagogique d'un francophone.** Décision assumée
  (immersion, matériaux EN), mais A2 doit vérifier que la double traduction mentale
  (JP→EN→FR) ne fatigue pas en pratique.
- **D7. Ce qui est sain et ne doit PAS être rouvert** : fidélité HGSS zéro-invention,
  modèle Condition/Effect monotone, budget kanji + lectures inline, SRS séparé du combat,
  refus des stats de performance, refus du tracé. Ces fondations sont bonnes — les
  remettre en question serait du churn.

## Ordre recommandé — état au 2026-07-25

1. ~~C1 (solveur de progression)~~ **FAIT** : `scripts/validate/solve-progression.py`,
   traversée complète prouvée (60 zones, 16/16 quêtes, 18/18 textes, 0 deadlock),
   sensibilité vérifiée, intégré à l'auto-test par zone. 2 text_id du contrat corrigés.
2. ~~B1 (simulation FSRS)~~ **FAIT** : `scripts/analysis/simulate-srs-load.py` — verdict
   « optimiste » : croisière réelle 400-530 rev/j (pics 630), divergence à 70 % Good.
   → **issue 04** (plafond 13-15 mots/jour recommandé, ready-for-human) et **issue 05**
   (186 kanji sans leçon, 876 mots kana-only, 302 mots hors-joyo — ready-for-human).
   ~~B2 (simulation grammaire)~~ **FAIT** : `scripts/analysis/simulate-grammar-retention.py`
   — verdict : le mécanisme hors-SRS suffit 3-4 mois puis s'effondre (47 % du pool perdu
   à fin Johto, 100 % à M11 ; le boost est cosmétique, c'est le débit qui manque ; SRS
   grammaire = 12 rev/j pour ~0 perte). → **issue 06** (ready-for-human, renverse une
   décision de grill).
3. Tranche verticale (D1) en parallèle de la fin de production — **prochaine étape**.
4. A1-A7 sur la tranche (14 jours) → verdict D2/D3/D6.
5. B3-B6, C2-C6 au fil de l'eau ; D4 tranché avec C3 ; **D5 a maintenant ses données**
   (issue 05 : la queue au-delà de 1950 n'est déjà pas enseignée — la décision de scope
   est devenue concrète).
