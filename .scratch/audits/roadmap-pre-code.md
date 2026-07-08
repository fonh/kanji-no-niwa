# Feuille de route pré-code — 漢字の庭

Écrite le 2026-07-08, après la passe de vérification post-synthèse (findings-09 § 7).
**Où on en est** : les 9 audits sont clos, le PRD et les 7 docs de contenu sont cohérents,
toutes les décisions de design sont prises. **Ce qui suit est le chemin entre « PRD prêt »
et « on peut coder »**, ordonné — chaque étape rend la suivante moins risquée.

---

## Étape 1 — Les surfaces jamais auditées (dernières décisions de design)

Les 9 audits ont couvert les *systèmes* (progression, SRS, combat, menus…). Personne n'a
jamais audité les **charnières** — ce qui se passe entre les systèmes. C'est le seul endroit
où il reste de vraies décisions à prendre ; tout le reste de cette roadmap est de l'exécution.
Format recommandé : un **audit 10** sur le modèle des 9 premiers (lecture → grill → correction).

1. **Séquence d'ouverture, minute par minute.** Écran titre → « nouvelle partie » → choix de
   l'avatar (garçon/fille — Ethan/Lyra, comme HGSS) → **saisie du nom du joueur** (question
   piégeuse : en quel alphabet ? le nom apparaît ensuite dans les dialogues japonais — kana
   imposés ? romaji converti ?) → réveil dans la chambre → Mom → Elm → remise du Pikachu →
   dōjō Fukuda → première leçon → première session SRS → Route 29. Des morceaux existent
   (bootstrap Fukuda, tutoriel de marche) mais l'enchaînement bout à bout n'a jamais été écrit,
   et c'est **le quart d'heure le plus important d'un jeu d'apprentissage** (c'est là qu'on
   perd ou garde un joueur).
2. **La défaite et l'interruption.** Que voit-on quand on perd un combat (vies épuisées) ?
   HGSS fait un « blackout » vers le Centre Pokémon ; nous, les combats sont rejouables sans
   cooldown — mais l'écran/le flux de défaite n'est décrit nulle part. Et surtout : **le combat
   de Red fait 100 questions (~30-45 min)** — fermer l'app en plein milieu fait quoi ?
   Reprise ? Abandon ? Pause autorisée ? Idem pour l'Elite Four (70 questions × 4 + Lance).
3. **Typographie japonaise** (le plus gros trou technique jamais mentionné) : une police
   pixel rétro ne peut pas rendre un kanji N1 complexe (鬱, 響…) ni des furigana lisibles.
   Il faut une stratégie à deux fontes — pixel japonaise (Misaki/PixelMplus) pour l'ambiance
   overworld, fonte lisible pour dialogues/leçons/lecture — et une taille minimale de furigana.
   À trancher avant tout mockup.
4. **Le clavier romaji→kana** : les cas limites (ん vs な-ligne, っ, ゃゅょ, ー, nn, correction
   en cours de frappe) — c'est le composant du mode Saisie, de la dictée et du Kanji Sprint ;
   sa spec mérite une page.
5. **Les chaînes système** : はい／いいえ, confirmations, messages d'erreur, écrans de
   sauvegarde — une string table UI à part (jp + en via X ? jp seul ?), distincte des dialogues.
6. **Sauvegarde et synchronisation** : PWA = offline-first ? Le compte Google implique une
   sync multi-appareils — conflits (jouer sur 2 appareils le même jour), backup/export,
   triche d'horloge (le jour calendaire local pilote le SRS, le streak et les time_window).
7. **Accessibilité minimale** : distinction blanc/doré pour daltoniens (forme + couleur),
   taille de texte, comportement des modes audio (Écoute, Radio, Buena) téléphone en silencieux.
8. **Cérémonies** : écran de remise de badge, fanfare CS-Kanji, achievement, passage doré —
   des micro-scènes à formater une fois (gabarit commun), pas 16 fois.
9. **Fin de partie** : Hall of Fame, crédits, écran post-Red, choix de récompense chez Oak
   (3ᵉ visite documentée) — l'épilogue n'a pas de séquence écrite.
10. *(Flag FV-1 à traiter au passage)* : le trophée de l'Antre (lecture N1) exigé par Suicune
    à ~1350 kanji — assumer le pic ou amortir à l'écriture de l'inscription.

## Étape 2 — Compléter la couche de données (mécanique, aucun talent d'écriture requis)

Tout est spécifié ; il faut produire les données. Scriptable en grande partie, relecture humaine.

1. **Registre des zones** : champ `name {jp, en}` (les noms officiels VO — dépouillement
   Bulbapedia, ~83 entrées), résolution du **mapping musique identité** (tracklist OST HGSS →
   une piste par zone, les arbitrages seuls restant en table).
2. **`story-beats.json` : couvrir Kanto + les 11 zones réintégrées** (flag FV-2 — le fichier
   s'arrête à Mont Gris) et **`placements/` : générer les ~14 fichiers manquants** (FV-3,
   dont route-33 et mont-lune). Même méthode que l'existant.
3. **Dénombrements guidebook** (décisions prises, comptes à faire) : les donneurs de numéro
   de téléphone (registre fermé), les dresseurs génériques par route (fidélité stricte),
   les **sections npc-inventory des 11 zones réintégrées** (Lavender, Union Cave, Safari…).
4. **L'assignation kanji → zone** — la colonne vertébrale de tout le contenu : produire la
   liste ordonnée des 2136 kanji (`getAvailableKanji` : ordre JLPT + prérequis composants),
   la découper selon les fenêtres de la table de calibration, script de proposition +
   relecture. Idem **grammaire** : 828 points Hanabira → paliers → zones.
5. **La colonne « Type assigné » de npc-inventory** : distribuer leçon / texte / combat sur
   les PNJ sourcés, zone par zone. C'est la dernière décision « lourde » (elle fixe qui
   enseigne quoi, où) — mais elle se prend zone par zone, pas d'un bloc.
6. Migration `{jp, en}` des quêtes existantes (FV-4) et micro-lignes du Journal de quêtes.

## Étape 3 — Gabarits + tranche verticale (le test qui évite d'industrialiser dans le vide)

1. **Un fichier-exemple complet par type de contenu** : une leçon (le format JSON n'existe
   pas encore en exemple), un texte avec quiz + `answer_span`, une émission radio, un appel
   即時応答, une session keigo — chacun validé contre le schéma du PRD.
2. **Écrire LA tranche verticale : Bourg Geon → Ville Griotte** (zones 0-3 + l'ouverture de
   l'étape 1) : tous les dialogues jp/en, les ~7 leçons du dōjō, les 2-4 premiers textes, la
   quête d'accueil, Silver #1. Objectif : vérifier **en vrai** que la règle des 2 inconnus
   par dialogue tient, que les lectures inline s'écrivent vite, et mesurer le coût réel
   d'écriture d'une zone → extrapoler le budget des 83.
3. **Outillage de validation** (du script, pas du code produit — `scripts/` en a déjà) :
   linter de budget kanji (2 inconnus/dialogue, lectures inline présentes), vérificateur
   anti-deadlock (déjà spécifié), vérificateur d'ids croisés (quest/npc/zone/text refs),
   calculateur des corpus réels par CS (re-calage des seuils N au placement).
4. **Mockups des ~20 écrans** (papier/Excalidraw suffit) : carte, dialogue, les 9 modes de
   combat, écran-livre, session SRS, les 6 menus START, les 4 onglets Pokégear, fenêtre de
   lecture, radio, keigo. Ça ne code rien mais ça débusque les décisions d'écran oubliées —
   et ça fixe la typographie de l'étape 1.3.

## Étape 4 — Passe contenu industrielle

Zone par zone, dans l'ordre de la table de calibration, avec l'outillage de l'étape 3 en CI :
dialogues, leçons, placement des textes (sélection des sources réelles + vetting 12bis),
scripts radio, lettres de Fukuda, Carnet des compteurs. Les seuils N sont re-calculés au fil
du placement. **C'est seulement à la fin de l'étape 3 qu'on sait combien de temps celle-ci
prendra** — c'est tout l'intérêt de la tranche verticale.

## Puis : le code

Avec tout ce qui précède, le développement démarre avec un PRD stable, des formats de données
éprouvés par du vrai contenu, des mockups, et une CI de contenu déjà en place. Premier
jalon de code naturel : le moteur de carte + dialogue sur la tranche verticale existante.

---

*Restes déjà connus et suivis ailleurs : findings-09 § 6 (passe contenu/assets/code) et § 7
(flags FV-1→FV-5). Hors v1, définitivement : Battle Frontier, fonction de transfert du Pal Park.*
