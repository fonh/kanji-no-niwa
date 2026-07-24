# Revue structurelle — plan / PRD / complétude du jeu (2026-07-24)

Statut : **traité le 2026-07-24** (validation utilisateur : « implémente selon tes recos ;
P2 et P4 assumés, pas importants »). État par proposition :
- **P1 (production langagière) — IMPLÉMENTÉ en spec** : PRD § 会話 (nouvelle section) +
  § Mentors (bloc reply), entrées CONTEXT.md (Conversation, Mentor Reply), gabarits
  `conversation-example.json` / `mentor-letter-example.md`, contrat moteur § 8, plan de
  production phase 5 (items 6-7 — dont les 36 lettres du mentor, trou de plan repéré au
  passage : aucune ligne ne les couvrait).
- **P2 (prérequis kana) — assumé par l'utilisateur, aucune action.**
- **P3 (contradiction checkpoints) — TRANCHÉ, PRD amendé** : Conseil 4/Lance/Blue/Red
  reprennent par section (vies restaurées à l'entrée de section, sections validées acquises,
  interruption = perte totale) ; les 16 師範 restent tout-ou-rien. Contrat moteur § 8 aligné.
- **P4 (post-game) — assumé par l'utilisateur, aucune action.**
- **P5 (préface Carte Mot) — IMPLÉMENTÉ en spec** : PRD § Système SRS + contrat moteur § 8
  (état dérivé, aucune colonne nouvelle).
- **§ 1 (modes de combat) — confirmé : aucun mode ajouté.** Reste : acquérir SKM N2 文法.

Revue menée après lecture complète du PRD (1194 l.), des deux propositions modes-livres, du
contrat moteur, et des revues game designer + prof de japonais du 23-24/07.

## 1. Réponse à la question « plus de modes de combat depuis les livres ? » — NON

Le filon est épuisé, et c'est documenté : les 4 relevés de formats (SKM N1 文法, N2 語彙,
N1/N2 読解, Marugoto A2-2 りかい) ont produit les 13 modes M10-M23, **adoptés au PRD le
2026-07-21** (22 modes au total). Les 4 formats restants ont été écartés avec raison
(`.scratch/combat-modes-from-books-proposal.md` § Écartés) : réponse pragmatique (doublon
即時応答), auto-notation (conflit FSRS + 08-D7), scènes illustrées (coût assets),
dictée pure (tranché audit 07). Ajouter un 23ᵉ mode diluerait les poids (chaque colonne
resomme à 100) et créerait une dette de données de plus alors que M13/M14 sont déjà en
« 2ᵉ vague » et que le pool `reading_snippets` est encore à 0.

**Là où les livres restent sous-exploités, c'est le contenu, pas les mécaniques** :
- le pool `reading_snippets` (M18-M23) et les ~68-97 textes secondaires — déjà planifiés,
  à exécuter ;
- les gabarits de mini-docs réalistes pour M21 (horaires/annonces des livres) ;
- les situations can-do de Marugoto かつどう → proposition n°1 ci-dessous ;
- les groupements thématiques du 語彙帳 A1 / SKM N2 語彙 → curation des groupes de kanji
  par leçon et de la Carte Mot ;
- **Shin Kanzen Master N2 文法 toujours à acquérir** (seul trou d'inventaire,
  `japanese-books-mapping.md`) — l'étalon de séquençage grammatical de Vermeille→Céladia.

## 2. Les vrais trous structurels (avec propositions)

### P1 — Production langagière : le seul angle mort pédagogique réel
Le jeu teste la reconnaissance (QCM), la lecture, l'écoute, et une production limitée
(taper une lecture, un point de grammaire, ordonner des chunks). **Rien ne demande jamais
de construire un énoncé en situation.** Le 即時応答 est mono-tour ; le Salon du keigo est
un choix de registre. Proposition, sourcée livres et compatible avec tous les invariants
(auto-corrigible, zéro SRS, zéro stat) :

**会話 — conversations à embranchements multi-tours** : une conversation de 4-6 tours
calquée sur une unité can-do de Marugoto かつどう (se présenter, commander, demander son
chemin, s'excuser, inviter…). À chaque tour, 3 répliques (naturelle / registre faux /
hors-sujet) ; la conversation *bifurque* légèrement selon le choix, se termine toujours
(aucun échec), la réaction du PNJ est la correction. Différence avec 即時応答 : la
continuité — le choix du tour 2 dépend du tour 1, ce qui teste la cohérence
conversationnelle, pas la politesse d'une réplique isolée. Modélisation : `pages[]` avec
`kind: "conversation_turn"` (même pattern d'extension que instant_response/companion_choice
— aucun nouveau modèle). Placement sourcé : les PNJ ambiants « couleur locale » déjà
recatégorisables (3ᵉ catégorie, PRD § Dresseurs de Route) — ~1-2 par ville, ~15-20 sur le
jeu, graduées N5→N2. Contenu : les situations viennent directement des unités Marugoto du
palier (jamais verbatim, vetting habituel).

**Variante output écrite, coût quasi nul : répondre aux lettres du mentor.** Les 36
lettres (`mentor_messages`) sont aujourd'hui à sens unique. Proposition : ~8-10 d'entre
elles offrent une réponse à composer en 3-4 chunks à assembler (composant Disposition
réutilisé tel quel, plusieurs ordres valides acceptés = validation par ensemble de
séquences, précalculée). Le mentor réagit à la réponse dans sa lettre suivante (1 ligne).
Zéro nouvelle brique technique, forte valeur d'attachement.

### P2 — Prérequis kana jamais énoncé
Le jeu suppose la lecture hiragana/katakana dès la première minute (saisie du nom, tout
dialogue N5 est en kana, noms de villes en katakana). Aucune leçon kana n'existe ni n'est
prévue. Deux options, à trancher : (a) **assumer le prérequis** — une ligne au PRD
§ Problem Statement (« public : lecteur de kana, débutant en kanji ») + un écran « かな
check » optionnel au premier lancement pointant vers une ressource externe ; (b) ajouter
un micro-bootcamp kana chez Elm avant la leçon 1 (~2 h de jeu, gros contenu). Recommandé :
(a) — l'app est personnelle, le public est connu, et le bootcamp retarderait le vrai début.

### P3 — Contradiction PRD ↔ contrat moteur sur les examens longs
PRD § Combat (écran de défaite) : « une défaite fait recommencer tout l'examen depuis le
début — pas de checkpoint par section, comportement inchangé malgré la longueur ».
`content/engine-contract.md` § 8 (issu des revues du 23/07) recommande la **reprise par
section pour les examens ≥ 70 questions** (Blue 98q ≈ 45-60 min, 10 vies). Les deux
documents disent le contraire. À trancher explicitement ; recommandation maintenue :
reprise par section sur E4/Lance/Red/Blue uniquement (les 師範 ≤ 72q restent tout-ou-rien),
sections déjà définies par le format 試練 — la friction d'un échec à la question 90
n'enseigne rien, elle punit la séance entière.

### P4 — Post-game : le moteur SRS survit des mois au contenu
Après Red (~12-18 mois), le PRD prévoit : Red rematchable, fil Steven, Kanjidex/textes/
émissions à dorer, streak. C'est de la collection, plus de la pratique neuve — or le
backlog SRS (19 944 cartes) continue, et le N1 s'entretient. Proposition à coût minimal,
100 % mécanique existante et sourcée HGSS : **la Trainer House de Vertville** (canon HGSS,
un combat par jour) devient le « dōjō quotidien » post-16-badges — un combat/jour au
format 試練 court (~30q), composé par la rotation « plus-anciens-d'abord » déjà spécifiée
(grammaire) étendue aux items (le mécanisme `last_drawn_at` existe). Aucune stat, aucune
récompense hors ¥/collection — de la pratique fraîche quotidienne quand la carte est
finie. + Option lecture : la bibliothèque Aozora « brute » (déjà source N1) s'ouvre en
flux dans le Journal de lecture post-Red (1 texte dur/semaine, hors compteurs).

### P5 — Les mots n'ont pas de moment d'introduction
Les kanji ont leur double page ; les ~7 836 mots entrent en SRS automatiquement (kanji
étudié → mots éligibles) et leur première carte SRS est leur toute première rencontre.
La Carte Mot est une fiche de consultation, pas une introduction. Ce n'est pas un trou
bloquant (le mot-clé anglais + audio suffisent en carte), mais une passe de qualité est
possible sans nouveau système : au déblocage d'un lot de mots, la session SRS du lendemain
les présente en tête avec leur Carte Mot en « préface » (1 tap, déjà designée) avant la
première notation. À griller : trivial côté moteur, zéro contenu nouveau.

## 3. Ce qu'il ne faut PAS ajouter (revue négative)

- **Pas de nouveaux modes de combat** (cf. § 1) — le manque n'est pas là.
- **Pas de tracé de kanji / reconnaissance manuscrite** — écarté consciemment (Skritter
  refusé, « Saisie » assumée) ; y revenir contredirait 3 décisions actées.
- **Pas de micro / production orale** — même statut.
- **Pas de nouveau système de progression** (niveaux, XP, difficulté réglable) — la
  structure badges/CS/SRS/streak couvre tout ; le PRD l'a déjà refusé proprement.
- **Pas de contenu v2** — la règle « aucune v2 » tient : tout ce qui précède est soit une
  ligne de PRD, soit du contenu léger (~15-20 conversations, ~10 réponses de lettres),
  à produire dans la passe en cours ou pas du tout.

## 4. Priorité recommandée

1. Trancher P3 (contradiction de spec — bloque l'équipe code au premier examen long).
2. Écrire la ligne P2a (prérequis kana) au PRD.
3. Finir la production déjà planifiée (12 zones, textes, snippets, appels, radio, keigo,
   overlays early, keyword) — **avant** toute nouveauté : 5 systèmes sont encore à 0 donnée.
4. Griller P1 (会話 + réponses aux lettres) — la seule vraie extension proposée.
5. P4/P5 en fin de passe (peu de contenu, surtout des lignes de spec).
6. Acquérir SKM N2 文法.
