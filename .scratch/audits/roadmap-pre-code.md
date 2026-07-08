# Feuille de route pré-code — 漢字の庭

Écrite le 2026-07-08, après la passe de vérification post-synthèse (findings-09 § 7).
Mise à jour le 2026-07-08 après l'audit 10 (charnières + grill). **Où on en est** : les 10
audits sont clos, le PRD et les docs de contenu sont cohérents, toutes les décisions de design
sont prises — y compris les deux pivots soulevés pendant le grill de l'audit 10 (suppression de
Fukuda, stockage local). **Ce qui suit est le chemin entre « PRD prêt » et « on peut coder »**,
ordonné — chaque étape rend la suivante moins risquée.

---

## Étape 1 — Les surfaces jamais auditées (dernières décisions de design) — ✅ SOLDÉE 2026-07-08

Les 9 audits ont couvert les *systèmes* (progression, SRS, combat, menus…). L'audit 10
(`.scratch/audits/prompt-10-charnieres.md` → `findings-10-charnieres.md`) a couvert les
**charnières** — ce qui se passe entre les systèmes — et deux décisions plus larges soulevées
pendant le grill. Toutes les décisions de design sont désormais prises, écrites dans le PRD.

**Les 10 charnières, décidées et écrites (2026-07-08, audit 10, tranché au grill) :**
1. **Séquence d'ouverture** (PRD § Séquence d'ouverture) : écran-titre à chaque lancement,
   avatar garçon/fille sourcé, **nom saisi en kana** via le clavier romaji→kana déjà prévu pour
   le mode Saisie (champ vide, pas de suggestion), choix du compagnon parmi 3 (voir ci-dessous).
   Bootstrap restructuré : Elm donne les premières leçons **en deux temps calqués sur
   l'aller-retour réel du jeu** (Elm → course chez Mr. Pokémon → retour), pas un enfermement
   au labo (PRD § Leçons, « bootstrap Elm »).
2. **Défaite et interruption** (PRD § Système de Combat) : écran de défaite bref sans bilan ;
   les combats-examens (師範/E4/Lance/Red) recommencent intégralement en cas de défaite (pas de
   checkpoint par section) ; fermer l'app en plein combat annule le combat, aucun état
   sauvegardé.
3. **Typographie** (PRD § Interface) : `DotGothic16` (chrome/overworld) + `BIZ UDGothic`
   (lecture — dialogues/leçons/textes), plancher furigana 10px partout.
5. **Chaînes système** (PRD § Langue du Jeu) : japonais seul, pas de bouton X (aligné sur les
   labels de menu), `content/ui-strings.json`.
6. **Sauvegarde et synchronisation** (PRD § Implémentation) — **pivot d'architecture** : voir
   ci-dessous.
7. **Accessibilité** (PRD § Kanjidex, § Menu Principal, § Système de Combat) : repère
   non-coloré sur les tuiles dorées (daltonisme), réglage de taille de texte (3 crans) dans
   せってい, mode Écoute rejouable à volonté (aligné sur Disposition).
8. **Cérémonies** (PRD § Cérémonies, nouvelle section) : deux paliers — majeur (badge/CS-Kanji/
   victoires rares, écran dédié bref) et mineur (achievement/tuile dorée, bandeau non-bloquant).
9. **Fin de partie** (PRD § Kanto, note "Fin de partie") : séquence assemblée à partir du
   guidebook (3 visites à Bourg-Origine), écran de générique dédié après la 3ème visite d'Oak.
10. **Flag FV-1 soldé** (`findings-09-synthese.md` § 7) : pic de difficulté Suicune assumé tel
    quel, aucun changement à l'ordre Raikou→Entei→Suicune.

**Deux décisions plus larges, soulevées pendant le grill et écrites dans tout le PRD :**
- **Suppression de Fukuda** (PRD § Mentors) : personnage inventé retiré. Le rôle quotidien
  (appel matinal SRS + 36 lettres) est repris par **Elm (tout l'arc Johto) puis le Pr. Chen/Oak
  (tout l'arc Kanto)** — relais à la traversée SS Aqua, personnalités canoniques des jeux
  d'origine, aucun arc personnel inventé. Le « dōjō » n'existait déjà que comme redécoration du
  labo d'Elm — aucune géographie perdue.
- **Pivot d'architecture — stockage local pour la progression uniquement** (PRD § Implémentation)
  : Supabase **reste le domicile du contenu statique et de l'auth** (code déjà en place —
  `scripts/lib/supabase.ts`, `src/lib/supabase/`, `src/proxy.ts` — aucune réécriture nécessaire).
  Seule **la progression du joueur** (SRS, badges, quêtes, inventaire…) est scindée vers
  **IndexedDB local** (source de vérité) + **export JSON périodique vers le Google Drive
  personnel du joueur** (filet de secours, réutilise l'OAuth déjà en place — évite le piège de
  la pause après 7 jours d'inactivité du plan gratuit Supabase pour la progression). Risque
  résiduel assumé : l'auth elle-même peut se mettre en pause après 7+ jours sans ouverture de
  l'app (reconnexion nécessitant une relance manuelle du tableau de bord) — la progression
  reste jouable en local même si l'auth est cassée. Un seul appareil actif à la fois pour la
  progression, zéro conflit par construction. Horloge locale de confiance (pas de vérification
  serveur).
- **Compagnon rouvert** (PRD § Compagnon) : retour à un choix parmi 3 compagnons (Pikachu + 2
  autres à sourcer) au tout début, plutôt que « Elm confie son Pikachu, pas de choix » —
  écho en fin de partie (3ème visite d'Oak, objet cosmétique assorti).

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
