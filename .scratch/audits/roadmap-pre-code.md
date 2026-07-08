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
**À lancer : `.scratch/audits/prompt-10-charnieres.md`** (même méthode que les 9 premiers —
lecture → grill → correction — un nouveau terminal, session vierge).

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

Zone par zone, dans l'ordre de la table de calibration (83 zones), avec l'outillage de
l'étape 3 en CI : dialogues, leçons (**≈290-385** au total, réintégrations comprises),
placement des textes secondaires (**~85-115**, sélection des sources réelles + vetting
12bis), scripts radio, 36 lettres de Fukuda, Carnet des compteurs. Les seuils N des 8
CS-Kanji sont re-calculés au fil du placement réel (valeurs actuelles de calibration :
砕 6 · 切 12 · 水 20 · 飛 26 · 力 29 · 渦 32 · 滝 35 · 登 60). **C'est seulement à la fin
de l'étape 3 qu'on sait combien de temps celle-ci prendra** — c'est tout l'intérêt de la
tranche verticale.

## Étape 5 — Petits restes techniques épars

Ne bloquent aucune étape ci-dessus ; à faire quand on y passe (souvent en même temps que
l'étape 2 ou 4, zone par zone), listés ici pour ne rien perdre :

1. **FV-5** (`findings-09-synthese.md` § 7) : fil Steven, étape 1 — « déclenche une
   rencontre légendaire ailleurs » est un fait source sans adaptation définie ; une
   simple ligne de dialogue suffit, à écrire à la passe contenu de la zone concernée.
2. **`scripts/build/generate-etymology.py`** : le prompt du batch IA étymologie/
   mnémotechnique est encore en français (finding 06-B3) — à traduire/adapter avant le
   prochain run de génération.
3. **3 kanji sans audio** (finding 06-B3) — identifier lesquels, combler via le même
   pipeline VOICEVOX que le reste.
4. **Tile-authoring** : les 16 intérieurs de gym + les zones réintégrées (Lavender,
   Union Cave, Route 43, Îles Tourbillon, Safari, Routes 46/5/8/22/47/48, Cliff Cave,
   Puits Ramoloss, intérieurs Tour Radio/QG Rocket/Tour Jo…) n'ont pas encore de tiles
   produites — inventaire de production, pas un chiffrage.
5. **Sprite follower du Pikachu** (compagnon cosmétique, décision synthèse) — vérifier
   qu'une planche exploitable existe dans le dump d'assets HGSS, sinon la produire.
6. **Résolution du mapping musique « identité »** : chaque zone HGSS garde sa piste
   d'origine (règle posée à la synthèse) — reste à résoudre piste-par-fichier-asset à
   la passe assets ; seuls les arbitrages (zones sans équivalent direct) restent en
   table dans `content/guidebook-adapted.md` § Musique.
7. **Pool audio Disposition** : ~600 phrases (~120/palier), ~25-35 Mo opus — batch
   VOICEVOX à lancer, chargement par palier à implémenter côté build.

## Puis : le code

Avec tout ce qui précède, le développement démarre avec un PRD stable, des formats de données
éprouvés par du vrai contenu, des mockups, et une CI de contenu déjà en place. Premier
jalon de code naturel : le moteur de carte + dialogue sur la tranche verticale existante.

---

*Hors v1, définitivement, et rien d'autre : Battle Frontier, fonction de transfert du Pal
Park (décision F-A, synthèse — Pal Park reste un intérieur réel navigable, seule la
fonction de transfert est coupée).*
