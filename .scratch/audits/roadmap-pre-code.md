# Feuille de route pré-code — 漢字の庭

Écrite le 2026-07-08, après la passe de vérification post-synthèse (findings-09 § 7).
Mise à jour le 2026-07-08 après l'audit 10 (charnières + grill) puis après le remplacement du
pivot stockage par Neon + Auth.js (même jour, hors périmètre des audits — voir
`docs/adr/0005-data-storage-neon-authjs.md`).

## Statut : Étape 1 soldée. Prochaine étape → Étape 2, point 1 ci-dessous.

Toutes les décisions de design sont prises et écrites dans le PRD. Le stockage/auth est déjà
migré et commité (Neon, Auth.js — code en place, rien à refaire). **Ce qui suit est le chemin
entre « PRD prêt » et « on peut coder le jeu »**, ordonné — chaque étape rend la suivante moins
risquée. Pour reprendre dans un nouveau terminal : commencer par Étape 2, point 1
(l'assignation kanji → zone) — c'est la colonne vertébrale dont tout le reste de l'étape 2 et
toute l'étape 3 dépendent.

---

## Étape 1 — Les surfaces jamais auditées — ✅ SOLDÉE 2026-07-08

Détail complet des 10 décisions (séquence d'ouverture, défaite/interruption, typographie,
chaînes système, accessibilité, cérémonies, fin de partie, flag FV-1) dans
`findings-10-charnieres.md`. Deux décisions plus larges émergées au grill, déjà écrites dans le
PRD : **suppression de Fukuda** (rôle de mentor repris par Elm puis Pr. Chen/Oak) et
**compagnon rouvert** (choix parmi 3 au lieu d'un Pikachu imposé).

**Stockage — traité séparément de l'audit 10, soldé aussi :** l'audit 10 avait d'abord proposé
un pivot vers du stockage local (IndexedDB + filet Google Drive) pour éviter la pause Supabase
après 7 jours d'inactivité. Remplacé le même jour par une décision différente : **Neon
(Postgres) + Auth.js**, une base cloud qui n'a pas ce problème de pause, gardant contenu et
progression dans un seul domicile, sans renoncer à une base unique. Détail et raisonnement :
`docs/adr/0005-data-storage-neon-authjs.md`. **Code déjà migré, revu (8 angles + corrections)
et commité** : `db/migrations/001_initial_schema.sql`, `src/lib/auth.ts`, `src/lib/db.ts`,
Server Actions par route (`src/app/*/actions.ts`).

## Étape 2 — Compléter la couche de données (mécanique, aucun talent d'écriture requis)

Tout est spécifié ; il faut produire les données. Scriptable en grande partie, relecture
humaine. **Ordre conseillé** — le point 1 conditionne tout le reste :

1. **L'assignation kanji → zone — À FAIRE EN PREMIER, colonne vertébrale de tout le contenu** :
   produire la liste ordonnée des 2136 kanji (`getAvailableKanji` : ordre JLPT + prérequis
   composants), la découper selon les fenêtres de la table de calibration, script de
   proposition + relecture. Idem **grammaire** : 828 points Hanabira → paliers → zones. Sans
   ça, impossible de savoir quels kanji une leçon de telle zone doit enseigner — tout le reste
   de cette étape et toute l'étape 3 en dépendent.
2. **Registre des zones** : champ `name {jp, en}` (les noms officiels VO — dépouillement
   Bulbapedia, ~83 entrées), résolution du **mapping musique identité** (tracklist OST HGSS →
   une piste par zone, les arbitrages seuls restant en table).
3. **`story-beats.json` : couvrir Kanto + les 11 zones réintégrées** (flag FV-2 — le fichier
   s'arrête à Mont Gris) et **`placements/` : générer les ~14 fichiers manquants** (FV-3,
   dont route-33 et mont-lune). Même méthode que l'existant.
4. **Dénombrements guidebook** (décisions prises, comptes à faire) : les donneurs de numéro
   de téléphone (registre fermé), les dresseurs génériques par route (fidélité stricte),
   les **sections npc-inventory des 11 zones réintégrées** (Lavender, Union Cave, Safari…).
5. **La colonne « Type assigné » de npc-inventory** : distribuer leçon / texte / combat sur
   les PNJ sourcés, zone par zone — dépend du point 1 (l'assignation kanji doit exister pour
   savoir ce qu'un PNJ-leçon enseigne). C'est la dernière décision « lourde » (elle fixe qui
   enseigne quoi, où) mais elle se prend zone par zone, pas d'un bloc.
6. Migration `{jp, en}` des quêtes existantes (FV-4) et micro-lignes du Journal de quêtes.

## Étape 3 — Gabarits + tranche verticale (le test qui évite d'industrialiser dans le vide)

1. **Un fichier-exemple complet par type de contenu** : une leçon (le format JSON n'existe
   pas encore en exemple), un texte avec quiz + `answer_span`, une émission radio, un appel
   即時応答, une session keigo — chacun validé contre le schéma du PRD.
2. **Écrire LA tranche verticale : Bourg Geon → Ville Griotte** (zones 0-3 + l'ouverture de
   l'étape 1) : tous les dialogues jp/en, les ~7 leçons du bootstrap Elm, les 2-4 premiers textes, la
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
12bis), scripts radio, 36 lettres des mentors (Elm/Oak), Carnet des compteurs. Les seuils N des 8
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
5. **Sprites follower des 3 compagnons** (Pikachu + 2 autres à déterminer — compagnon cosmétique,
   choix rouvert 2026-07-08, audit 10) — vérifier qu'une planche exploitable existe pour chacun
   dans le dump d'assets HGSS, sinon les produire ; trancher les 2 compagnons additionnels.
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
