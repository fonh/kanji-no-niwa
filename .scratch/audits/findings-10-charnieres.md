# Findings — Audit 10 : Les charnières

Date : 2026-07-08. **Phase 1 terminée (audit, lecture seule).** Entrées lues : `PRD.md`
intégral, `content/guidebook-adapted.md`, `content/curriculum-checkpoints.md`,
`findings-09-synthese.md` § 7 (flag FV-1), `roadmap-pre-code.md` (périmètre de cet audit).

Classement : **A** = décision de design pure (aucune réponse « correcte », grill requis),
**B** = point technique formalisable sans arbitrage utilisateur (convention à documenter).

---

## 1. Séquence d'ouverture — **A**

Fragments existants, aucun enchaînement bout à bout : la fiche `Héros` du guidebook
(`content/guidebook-adapted.md:86`, narratif seulement — pas un écran spécifié), le
tutoriel de marche (`content/guidebook-adapted.md:149`, « premiers 3 mouvements »), le
bootstrap Fukuda (`PRD.md:349`, dimensionnement des ~7 leçons/~30 kanji du dōjō, mais pas
sa place dans la séquence). **Aucune mention nulle part** : écran titre, flux « nouvelle
partie »/reprise, écran de choix d'avatar, et surtout — **zéro occurrence de la saisie du
nom du joueur** dans tout le PRD (recherche exhaustive, aucun résultat). C'est un vrai
angle mort : le nom, une fois saisi, réapparaît dans des dialogues 100 % japonais (PNJ
qui interpellent le joueur) — son alphabet de saisie n'est pas un détail technique, c'est
une décision de gameplay (voir § Grill, point 1).

## 2. Défaite et interruption — **A**

Existant : la mécanique de vies est précise (`PRD.md:221` — barre à 0 = défaite, N-ième
erreur fatale, « rejouer immédiatement, sans cooldown »). **Ce qui manque** : l'écran de
défaite lui-même (que voit/lit le joueur entre la chute de la barre et le retour au jeu ?)
et surtout la politique d'interruption pour les combats longs — Red = 100 questions
(~30-45 min, `PRD.md:657`), Elite Four = 70 questions × 4 + Lance. Fermer l'app à la
question 60/100 : reprise à la question 60, reprise à 0, ou abandon obligatoire ? Rien ne
le dit.

## 3. Typographie japonaise — **A/B mixte**

Une partie est déjà tranchée implicitement : `PRD.md:59-61` acte une police pixel pour le
chrome DS (« Police DS non extractable — utiliser une police pixel approchante ») et
`PRD.md:319` décrit l'écran-livre (Wagotabi) avec « kanji en grand avec furigana » — un
registre visuellement distinct de l'overworld, mais **jamais nommé comme une stratégie à
deux fontes**, et aucune police de lecture n'est choisie nommément, ni de taille minimale
de furigana. Point **B** (formaliser la distinction déjà présente en pratique) + point
**A** (choisir concrètement les familles de polices — implication licence/lisibilité).

## 4. Clavier romaji→kana — **B**

Le plus avancé des 10 : `PRD.md:234` (wanakana-like, remplace l'ancienne grille de
tiles), `PRD.md:258` (précision sur ce qui est saisi en Grammaire/Conjugaison — seul le
point, pas la phrase), `PRD.md:258` toujours (comportement IME pour les rares points à
kanji — sélection de candidats, jamais de tracé). **Ce qui manque** est une page de
spec récapitulative des cas limites (ん, っ, ゃゅょ, ー, séquence nn) — mais ce sont des
conventions romaji→kana standard (celles que `wanakana` implémente déjà) : aucun
arbitrage de design requis, seulement écrire la page de référence. Reclassé **B** par
rapport à la roadmap (qui le pressentait comme plus ouvert).

## 5. Chaînes système — **A/B mixte**

Aucune string table UI dédiée dans le schéma (`PRD.md` § Implémentation) — les seuls
textes hors dialogue documentés sont ceux du menu せってい (`PRD.md:74`, labels japonais
déjà donnés en exemple : おそい／ふつう／はやい). Décision **A** : les confirmations/erreurs/
はい・いいえ suivent-elles la même règle que les dialogues (japonais + X = anglais) ou
restent-elles japonais seul (comme un jeu DS authentique n'aurait pas de bouton
traduction sur ses propres menus) ? Point **B** ensuite : leur domicile de données (probable
fichier statique `content/ui-strings.json`, pas une table SQL — ce sont des constantes,
pas du contenu généré par zone).

## 6. Sauvegarde et synchronisation — **A**

`PRD.md:866` mentionne seulement « PWA : manifest + service worker pour installabilité
iOS/Android ». Le schéma de données (§ Implémentation) suppose une base serveur
(Supabase, cf. stack) qui fait autorité — ce qui résout une partie du problème
multi-appareil par construction (dernière écriture gagne, pas de fork local). Mais deux
questions restent ouvertes et non écrites : (a) que se passe-t-il si le joueur avance sur
2 appareils le même jour calendaire (le `daily_status`, le streak et les `time_window`
sont sensibles à la notion de « jour ») ? (b) la triche d'horloge (changer l'heure du
téléphone pour forcer un jour SRS/streak supplémentaire, ou pour débloquer un
`time_window` en avance) — ignorée, ou le serveur fait autorité sur l'heure ?

## 7. Accessibilité minimale — **A**

Aucune occurrence du mot dans le PRD (recherche exhaustive : daltonien, accessibilité,
contraste — zéro résultat). La distinction blanc/doré du Kanjidex (`PRD.md` § 図鑑) repose
uniquement sur la couleur — un vrai risque daltonien identifié mais jamais traité. Pas de
réglage de taille de texte au-delà de la vitesse de texte (`user_settings`, `PRD.md:74`,
qui ne couvre que おそい／ふつう／はやい, pas une taille de police). Comportement audio
(Écoute/Radio/Buena) en mode silencieux ou casque débranché en plein appel 即時応答 : non
spécifié.

## 8. Cérémonies — **A/B mixte**

Le concept existe et est référencé au moins 5 fois (« cérémonie du 印 » — `PRD.md:300,586,
915` ; fanfare CS-Kanji et achievement — `PRD.md:1013,1022` table Audio) mais **jamais
défini visuellement** : aucune des occurrences ne décrit ce que l'écran affiche, sa durée,
s'il est skippable. C'est un score de références orphelines assez inhabituel pour ce
PRD — normalement chaque mention pointe vers une section qui la définit ; ici, aucune ne le
fait. Décision **A** (gabarit court/interruptible vs scène plus posée) puis **B**
(l'écrire une fois, l'appliquer aux ~6 occasions : badge, CS-Kanji, achievement,
tuile Kanjidex dorée, victoire légendaire, victoire Elite Four/Lance/Red).

## 9. Fin de partie — **A**

Angle mort quasi total. `content/guidebook-adapted.md:99` mentionne « Plateau Indigo
(Conseil 4 + Lance, Hall of Fame) » comme référence factuelle HGSS, pas comme spec. Le
PRD ne décrit ni la scène de victoire finale contre Red (au-delà du texte narratif de
`PRD.md:657`), ni les crédits, ni la 3ᵉ visite chez Oak qui donne une récompense
(mentionnée en passant à plusieurs endroits — ex. le fil Steven post-Red, `guidebook-
adapted.md:1389` — jamais mise en séquence). Aucun écran, aucun déclencheur `Effect`
documenté pour cette fin.

## 10. Flag FV-1 (hérité de la synthèse) — **A**

Confirmé en relisant le gate réel : `PRD.md:576` — la quête Suicune exige « trophée Antre
du Dragon », résolue **mi-Kanto** selon l'ordre `Raikou (fin Johto) → Entei (post-Ligue) →
Suicune (mi-Kanto)`. Le trophée lui-même (`PRD.md:640`) est le quiz de lecture N1 de
l'inscription de l'Antre (`dragons-den`, palette kanji 640-720 — table de calibration,
`content/curriculum-checkpoints.md:108`, palier **N2/N1**), alors que le palier N1 «
normal » ne s'installe qu'à partir de 1670-1685 kanji étudiés
(`curriculum-checkpoints.md:134-135`). Le pic est donc réel et mesurable : le joueur doit
déchiffrer un texte N1 en registre classique avec un niveau nominal N2/N1 tout juste
atteint, ~950-1000 kanji avant le palier N1 normal. Les filets déjà en place (furigana Y à
la demande, retry illimité — pas de pénalité de raté) amortissent partiellement, mais la
question de fond (assumer le pic comme un pic de fin d'arc volontaire, ou repousser la
fenêtre de résolution de Suicune) n'a jamais été tranchée explicitement.

---

## Solde

10/10 points audités. **8 points A** (décision de design requise : 1, 2, 3a, 5a, 6, 7,
8a, 9, 10 — soit 9 en comptant les mixtes séparément) et **des compléments B** qui
s'écrivent directement en Phase 3 une fois les A tranchés (typographie : familles de
polices une fois le principe choisi ; clavier : page de spec récapitulative ; chaînes
système : domicile de données ; cérémonies : script unique appliqué aux 6 occasions).
Aucune contradiction trouvée avec les 9 audits précédents — ces 10 points n'avaient
simplement jamais été couverts, cohérent avec le constat de la roadmap pré-code.

**→ Phase 2 : grill avec l'utilisateur sur les points A.**

---

## Phase 2 — Grill (2026-07-08)

Les 10 points ont été grillés avec l'utilisateur. Deux décisions plus larges ont émergé pendant
le grill, hors périmètre initial de l'audit mais tranchées dans la foulée (accord explicite de
l'utilisateur pour tout écrire dans la même session) :

- **Suppression de Fukuda** — soulevée en creusant le point 1 (séquence d'ouverture) : le
  personnage inventé (narrateur philosophe, dōjō, arc du traducteur) est retiré. Le rôle
  quotidien (appel matinal SRS + 36 lettres) est repris par **Elm (arc Johto) puis le Pr.
  Chen/Oak (arc Kanto)** — relais à la traversée SS Aqua, structure canonique de la série,
  personnalités canoniques des jeux d'origine (aucun arc personnel inventé).
- **Pivot d'architecture — stockage local pour la progression uniquement** — soulevé en
  creusant le point 6 (sauvegarde). Découverte en cours de route : du code Supabase existe déjà
  (auth OAuth, scripts d'import du contenu pipeline) — **Supabase reste le domicile du contenu
  statique et de l'auth** (aucune réécriture), seule **la progression du joueur** (SRS, badges,
  quêtes) est scindée vers **IndexedDB local** (source de vérité) + **export vers le Google
  Drive personnel du joueur** (filet de secours, réutilise l'OAuth déjà en place — évite le
  piège de la pause après 7 jours d'inactivité du plan gratuit Supabase pour la progression).
  Risque résiduel assumé : l'auth peut aussi se mettre en pause après 7+ jours sans ouverture de
  l'app. Un seul appareil actif à la fois pour la progression, horloge locale de confiance.
- **Compagnon rouvert** — conséquence du point 9 (fin de partie, écho au premier choix) : retour
  à un choix parmi 3 compagnons (Pikachu + 2 autres à sourcer), plutôt que « Elm confie son
  Pikachu, pas de choix ».

**Décisions des 10 points**, résumées (détail complet et raisonnement dans le PRD, chaque
section datée `2026-07-08, audit 10`) :

| # | Point | Décision |
|---|---|---|
| 1 | Séquence d'ouverture | Nom en kana (clavier romaji→kana existant), écran-titre à chaque lancement, champ nom vide, bootstrap Elm en 2 temps calqué sur l'aller-retour réel (Elm → Mr. Pokémon → retour) |
| 2 | Défaite et interruption | Écran de défaite bref sans bilan ; combats-examens recommencent intégralement (pas de checkpoint) ; interruption = combat annulé, rien sauvegardé |
| 3 | Typographie | `DotGothic16` (chrome) + `BIZ UDGothic` (lecture), furigana plancher 10px |
| 5 | Chaînes système | Japonais seul, pas de bouton X (aligné menus) ; `content/ui-strings.json` |
| 6 | Sauvegarde/sync | Voir pivot stockage local ci-dessus |
| 7 | Accessibilité | Repère non-coloré tuiles dorées, taille de texte 3 crans, Écoute rejouable |
| 8 | Cérémonies | Deux paliers (majeur : écran dédié bref ; mineur : bandeau non-bloquant) |
| 9 | Fin de partie | Séquence assemblée (3 visites Oak, sourcées), écran de générique dédié ; voir aussi compagnon rouvert |
| 10 | Flag FV-1 | Pic Suicune assumé tel quel, aucun changement à l'ordre Raikou→Entei→Suicune |

**→ Phase 3 : correction immédiate — faite dans la même session (voir liste des fichiers modifiés ci-dessous).**

---

## Phase 3 — Correction immédiate (2026-07-08)

Toutes les décisions écrites directement dans les docs, marquées `(décidé 2026-07-08, audit 10)`
ou `(tranché au grill)` selon le point :

- **`.scratch/kanji-no-niwa/PRD.md`** : nouvelles sections § Séquence d'ouverture, § Cérémonies ;
  § Mentors remplace § Sensei Fukuda ; § Implémentation réécrite (Supabase scindé — contenu/auth
  conservés, progression passée en local + filet Google Drive, horloge locale) ; § Compagnon
  rouverte ; § Leçons (bootstrap Elm restructuré) ; § Interface
  (typographie) ; § Langue du Jeu (chaînes système) ; § Menu Principal (taille de texte) ;
  § Kanjidex (repère daltonisme, Écoute rejouable) ; § Kanto/Fin de partie (séquence assemblée) ;
  § Légendaires (flag FV-1 soldé) ; § Système de Combat (défaite/interruption). Toutes les
  mentions de « Fukuda » purgées ou requalifiées (vérifié par recherche exhaustive, seules les
  notes historiques de décision subsistent) ; mentions de « Supabase » conservées et précisées
  (portée scindée : contenu statique + auth restent sur Supabase, code déjà en place ; seule la
  progression du joueur passe en local — voir § Implémentation).
- **`content/guidebook-adapted.md`** : section `new-bark-town` réécrite (labo d'Elm remplace
  dōjō/Maison de Fukuda), toutes les mentions Fukuda requalifiées (mentor/Elm/Oak selon le
  contexte), séquence post-Red mise à jour.
- **`content/curriculum-checkpoints.md`**, **`content/npc-inventory.md`**,
  **`content/texts-progressifs.md`**, **`content/side-content-inventory.md`**,
  **`content/japanese-books-mapping.md`**, **`content/map/story-beats.json`** : mentions Fukuda
  requalifiées.
- **`content/dialogues/npcs/new-bark-town/mom_new_bark.json`** : dialogue réécrit (Elm remplace
  Fukuda/dōjō dans la ligne de Mom).
- **`docs/adr/0001-npc-interaction-and-dialogue-state-model.md`** : référence au dossier
  `content/dialogues/fukuda/` renommée `content/dialogues/mentors/`.
- **`.scratch/audits/findings-09-synthese.md`** § 7 : flag FV-1 soldé.
- **`.scratch/audits/roadmap-pre-code.md`** : Étape 1 marquée soldée avec le résumé des 10
  décisions + les 2 pivots ; Étapes 3-5 mises à jour (bootstrap Elm, lettres des mentors, 3
  sprites compagnon).

**Étape 1 de la roadmap pré-code est soldée.** Plus aucune décision de design en attente avant
la couche de données et le contenu (Étape 2 de la roadmap).
