# 09 — Menu START minimal (Carnet de leçons, Journal de quêtes, Sac, Kanjidex)

Status: ready-for-human
Bloqué par: 05, 08 (soft — les écrans listent leurs données)
Bloque: —

## Contexte

PRD § Menu Principal. Rien n'existe (le prototype `explorer/` fait office de Kanjidex
hors de tout menu). Au jalon 1 il faut le squelette du menu et 4 écrans utiles au
parcours A1 ; les slots non implémentés existent mais grisés.

## Périmètre (vertical slice)

- **Overlay START** : 6 slots, labels japonais VO (図鑑・レッスン・バッグ・プロフィール・
  ぼうけんノート・せってい), navigation D-pad + A, **B = retour d'un niveau,
  re-appui START = fermeture directe** (PRD § Navigation des surfaces). プロフィール et
  せってい présents mais grisés (hors jalon).
- **図鑑 Kanjidex** : rebrancher `explorer/` + fiche kanji dans le menu (grille,
  unseen/studied/mastered dérivé des cartes — code existant à adapter au schéma étendu).
- **レッスン Carnet de leçons** (CONTEXT.md « Lesson Book ») : `getLessonBook` —
  chapitres = zones visitées + compteur 「3/7」 ; complétée → relecture (écran-livre sans
  quiz) ; prochaine → qui et où seulement ; suivantes → ???. **Combler le trou connu** :
  distinguer visuellement « prochaine leçon disponible » de « verrouillée par
  `unlock_conditions` » (roadmap-pre-code, Étape 3 point 2 — le PNJ affiché mais la
  mention claire qu'il n'est pas encore prêt).
- **ぼうけんノート Journal de quêtes** : quêtes en cours — nom, `steps[].label` de
  l'étape courante, zone cible ; jp affiché, X = en.
- **バッグ Sac** : inventaire par catégorie (les items de quête du jalon : pokegear,
  mystery_egg…) + onglet **どくしょノート Journal de lecture** (CONTEXT.md) : textes des
  zones débloquées — lus (blanc/doré, rouvrables), non-lus grisés avec indice du porteur.
- SELECT inerte avant la remise du Pokégear ; START fonctionne dès le début (PRD).

## Critères d'acceptation

- Pendant la course chez Mr. Pokémon, le Carnet montre les leçons 1-2 complétées et la
  #3 verrouillée-avec-mention ; le Journal de quêtes montre l'étape courante de
  `mystery_egg_errand` ; le Sac montre l'œuf ; le Journal de lecture montre lyra_mail.
- Tests : `getLessonBook` (états, zones, verrouillage), navigation B/START (test .tsx).

## Comments

**2026-07-30 (agent, implémentation)** — Fait, en TDD strict (logique pure →
loaders → action serveur DB-mockée → composant jsdom, tests rouges d'abord à
chaque couche). 50 tests nouveaux (6 zone-slug + 19 start-menu purs + 4
loaders + 7 action + 14 .tsx jsdom), 463 au total, `npm run check` tout vert.

Livré :
- `src/lib/zone-slug.ts` — LE mapping MAP_* ↔ slug de contenu, posé
  proprement (l'écart noté par l'issue 05 : « heuristique locale dans
  npcs.ts, pas de table de correspondance ») : `zoneSlugForMapName`
  (match exact ou préfixe, les intérieurs ne matchent rien — la zone
  extérieure porte le rattachement) + `visitedZoneSlugs` (ordre du voyage,
  dédupliqué). `npcs.ts` refactoré dessus (même comportement, testé par la
  suite existante).
- `src/lib/start-menu.ts` — logique de présentation pure, zéro I/O :
  `buildQuestJournal` (quêtes EN COURS : entrée de quest_progress avec
  fichier de quête réel — la quête implicite lessons-<zone> est ignorée par
  construction —, non terminée ; nom + label de l'étape courante {jp,en} +
  target_zone_id ; tri par ancienneté d'étape), `buildReadingJournal`
  (4 statuts : gold/read/in_progress/undiscovered + porteur
  npc_ref→found_object_ref→event_ref), `groupBagItems` (catégories dans
  l'ordre du registre, item inconnu → `other` avec item_id brut — repli dev
  documenté), `kanjidexStatusMap` (**maîtrisé = stabilité FSRS ≥ 14 j sur
  les DEUX facettes** — `MASTERED_STABILITY_DAYS = 14`, le seuil 30 du
  prototype était un fossile d'avant l'audit 07), `zoneJpLabel` (registre →
  dérivation route-N → 「Nばんどうろ」 → repli prettifié).
- `src/lib/content.ts` — loaders : `getLessonZoneIds`, `getTextZoneIds`,
  `getTextsForZone` (l'index des textes construit une fois sert maintenant
  text_id ET zone).
- `src/app/menu/actions.ts` — `getStartMenuData()` : UNE server action à
  l'ouverture, payload entièrement résolu (le client ne lit jamais
  content/) : Carnet via `getLessonBook` (05) sur les zones visitées dans
  l'ordre du voyage (quêtes implicites fusionnées dans l'index), noms de
  PNJ résolus en jp depuis leur fichier dialogue ; Journal de quêtes ;
  Sac ; Journal de lecture (`getTextCompletions`, 08) ; Kanjidex (table
  kanji + cards sur le schéma étendu item_type/item_id/facet — les
  colonnes legacy ne sont plus lues).
- `src/app/menu/StartMenu.tsx` — l'overlay : bouton START + SELECT centre
  bas, petits, discrets (PRD § Interface) ; 6 slots VO (図鑑・レッスン・
  バッグ・プロフィール・ぼうけんノート・せってい), プロフィール/せってい
  grisés (「じゅんびちゅう」, A inerte) ; navigation D-pad (2 colonnes ×
  3 lignes) + A, tap ; **B = retour d'UN niveau (écran → racine → fermé),
  re-appui START = fermeture directe où qu'on soit** — testé ; SELECT
  inerte ; les touches ne traversent jamais vers MapClient (capture, même
  patron que DailyLoop). **Un seul composant de cadre commun (`MenuFrame`)**
  pour les 4 écrans : titre jp, contenu scrollable, rappels B/START
  identiques.
  - 図鑑 : grille (grisé/blanc/doré + **repère ★ non-coloré sur les
    dorées** — accessibilité daltonienne du PRD), filtres ぜんぶ/N5..N1,
    compteurs ; tap → fiche `/kanji/<id>`.
  - レッスン : chapitres = zones visitées, titre jp + compteur 「2/5」,
    4 états rendus distinctement — completed (✓ + kanji du groupe, tap →
    relecture `/lesson/<zone>/<seq>`), next (badge つぎの　レッスン +
    PNJ seulement, jamais le contenu), **locked (🔒 + PNJ + mention claire
    「まだ　じゅんびが　できていないみたい」 — le trou de roadmap-pre-code
    Étape 3 pt 2 comblé)**, masked (？？？).
  - ぼうけんノート : nom jp + étape courante jp (JpText, lectures
    masquées) + ◎ いきさき：zone jp ; **X = anglais, Y = lectures** (même
    pattern que DialogueBox).
  - バッグ : onglets もちもの (catégories du registre) et どくしょノート
    (blanc rouvrable, doré + ★, よみかけ, non-découvert grisé avec indice
    du porteur もちぬし/ありか).
- `src/app/map/page.tsx` : monte `<StartMenu initialScreen={…}>` (+
  lecture de `?menu=` pour le retour de fiche) — **MapClient : 0
  modification**.
- `src/app/kanji/[id]/page.tsx` (fiche) : bascule sur le schéma étendu
  (item_id/facet, item_type='kanji'), **seuil de maîtrise 14 j** (30 était
  le fossile pré-audit-07), lien retour `← 図鑑` → `/map?menu=zukan` (la
  chaîne B fiche → grille → carte du PRD § Navigation).
- Prototype `src/app/explorer/` **supprimé** (rebranché comme écran du
  menu ; il lisait les colonnes legacy et le seuil 30).
- Données : `src/data/item-labels.json` (registre MINIMAL item_id → jp VO
  + catégorie — la table `items` du PRD attend l'ingestion, documenté
  dans le fichier), `src/data/zone-labels.json` (slug → nom de zone jp VO
  HGSS — le display_name du registre ROM est en FRANÇAIS, donc interdit
  d'écran), `src/data/text-holder-labels.json` (les 5 porteurs-objets de
  la table moteur du contrat § 2). `ui-strings.json` : +26 chaînes
  système. Aucun français visible joueur.

Critères d'acceptation, un par un (menu/actions.test.ts, contenu RÉEL,
DB mockée, état joueur « course chez Mr. Pokémon ») :
1. Carnet : new-bark-town 2/5, lignes 1-2 completed, **#3 locked** (PNJ
   affiché — エルムはかせ — kanji_ids null), 4-5 masked ; chapitres
   new-bark-town → route-29 → cherrygrove-city → route-30 dans l'ordre du
   voyage ; après egg_delivered la #3 passe next (contre-test). ✓
2. Journal de quêtes : mystery_egg_errand, étape egg_received (「ふしぎな
   たまごと…もらった」), cible ワカバタウン, en présent pour X. ✓
3. Sac : mystery_egg dans たいせつなもの (ふしぎな　タマゴ ×1). ✓
4. Journal de lecture : lyra_mail read (gold si gold_at — testé),
   elm_great_text undiscovered avec porteur エルムはかせ, panneau Route 29
   undiscovered avec ありか. ✓
5. Tests navigation B/START : .tsx (retour d'un niveau, fermeture directe
   depuis le fond du Sac, réouverture à la racine, capture clavier,
   D-pad + A). getLessonBook lui-même : testé à l'issue 05 (états/
   verrouillage) + ici zones/mention via l'action. ✓

Écarts/décisions :
- **MapClient : 0 modification** — le bouton START/SELECT vit dans le
  composant StartMenu monté par la page (même patron que le Pokégear de
  DailyLoop). z-75 : au-dessus des contrôles (70), SOUS le combat (80) —
  « en combat rien ne s'ouvre » tenu par construction ; pas d'écouteur
  clavier menu fermé (ouverture tactile ; M = START menu ouvert
  seulement, commodité dev).
- **Kanjidex : grille dans l'overlay, fiche = route existante** adaptée.
  Retour de fiche → `/map?menu=zukan` (le menu se rouvre sur 図鑑).
  Relecture leçon/texte depuis le menu = navigation de route ; le B de
  ces écrans revient à la carte menu fermé (comportement des issues
  05/08, non modifié) — à harmoniser si la QA le veut.
- **« Zones débloquées » du Journal de lecture lu comme zones VISITÉES**
  (visited_zones est la seule liste alimentée au jalon ; unlocked_zones
  n'est écrite par aucun contenu de la zone 1) — même source que les
  chapitres du Carnet, cohérent.
- Les libellés d'items/zones/porteurs-objets vivent dans 3 petits
  registres src/data documentés (repli dev visible = item_id/slug brut) ;
  les noms de PNJ sont résolus depuis les fichiers dialogue (jamais le
  `name` latin du registre npcs.json).
- L'onglet じょすうし du Kanjidex (Carnet des compteurs) n'apparaît qu'à
  la remise narrative (École de Mauville) — hors jalon, rien à faire.
- Tri de la grille : jlpt_level desc (N5 d'abord — ordre d'apprentissage) ;
  le prototype triait N1 d'abord.
- Pas de vérification visuelle en navigateur (DATABASE_URL absent, connu
  depuis l'issue 02) — la QA humaine (phase 6) verra l'habillage du menu,
  la grille et les écrans.
