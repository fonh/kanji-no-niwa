# Étape 4, lot 2 — passe contenu industrielle (Route 34 → Doublonville, Gym 3 Whitney)

Lis ce fichier en entier avant de commencer. Il te donne tout le contexte nécessaire pour
continuer le travail de contenu sans redécouvrir les conventions à la dure — plusieurs erreurs
réelles ont déjà été trouvées et corrigées lors des lots précédents, ce fichier existe pour ne
pas les refaire.

## Le projet, en une phrase

漢字の庭 (Kanji no Niwa) : un jeu qui reprend toute la structure de Pokémon HeartGold/SoulSilver
(carte, villes, combats, badges, histoire) mais remplace les Pokémon par des kanji — on combat en
répondant à des questions de japonais, on apprend des kanji au lieu d'attraper des créatures.
**Aucun Pokémon n'apparaît jamais comme compagnon de combat** — règle #1 de
`content/guidebook-adapted.md`, violée deux fois par erreur au lot 1 (des dresseurs disaient
« mon Rattata »/« mon Wooper ») avant d'être corrigée. Ne jamais nommer un Pokémon comme s'il
appartenait à un personnage.

## Où on en est

Document maître : `.scratch/audits/roadmap-pre-code.md`. Étapes 1-3 soldées (toutes les
décisions de conception + la couche de données + un échantillon jouable testé). **Étape 4 en
cours** : passe contenu zone par zone. Lot 1 vient de finir (Ruines Arcaniques → Route 32 →
Union Cave → Route 33 → Écorcia/Gym 2 Bugsy → Puits Ramoloss). Lis la section « Lot 1 » de la
roadmap avant de commencer — elle documente les pièges déjà trouvés.

**Ta tâche : Lot 2**, dans l'ordre narratif réel (`content/guidebook-adapted.md` ligne ~99, la
séquence complète du jeu) : **Route 34 → Forêt Secte → Doublonville (Gym 3 Whitney)**. Optionnel
si le temps le permet : Route 35 / Parc National (Pokéathlon). Forêt Secte résout la quête de
Charcoal Man laissée en attente au lot 1 (`content/dialogues/npcs/azalea-town/charcoal_man_azalea.json`,
état `waiting`) — une fois Forêt Secte écrite, ajoute un état `resolved` chez lui qui remet le
Charbon (`grant_item charcoal`), gated sur `npc_cleared`/`event_cleared` de ce qui résout la
Forêt Secte.

## Méthode (identique à ce qui a déjà été fait, ne pas réinventer)

1. **Sources à lire avant d'écrire quoi que ce soit**, pour chaque zone :
   - `content/npc-inventory.md` — cherche `## <zone_id> —` : liste des PNJ sourcés, leur rôle
     d'origine, et surtout la colonne **Type assigné** (lesson #N / combat / ambiant) avec les
     kanji/grammar_id déjà décidés pour les leçons.
   - `content/guidebook-adapted.md` — section correspondante, pour la narration/les beats.
   - `content/map/placements/<zone>.json` — positions tile_x/tile_y sourcées ROM quand
     disponibles (`source: rom_matched`), sinon `generated` (position à inventer, le signaler
     dans `position_status`).
   - `content/lessons-proposal.json` — filtre par `zone_id` : donne le `kanji_ids`/`grammar_id`
     exact déjà assigné à chaque leçon, à copier tel quel dans `content/lessons/<zone>.json`.
   - `content/rom-trainer-roster.json` — filtre par `zone_id` : classe/nom exacts des dresseurs
     de combat, pour éviter d'inventer une classe (ex. confondre Bug Catcher et Youngster).
2. **Zéro PNJ inventé.** Tout personnage doit être sourcé dans npc-inventory.md ou
   guidebook-adapted.md. Si une zone a un pool de kanji mais aucun PNJ-leçon disponible, ne pas
   en inventer un — c'est le mécanisme de cascade déjà documenté (voir « fausse alerte » du lot 1
   dans la roadmap) : une zone voisine mieux fournie absorbe le pool.
3. **Fichiers à produire par zone** :
   - `content/dialogues/npcs/<zone_id>/<npc_id>.json` (PNJ ambiants/leçon) et
     `content/dialogues/trainers/<zone_id>/<trainer_id>.json` (dresseurs de combat) — format
     `dialogue_states`/`state_rules`/`pages`, voir n'importe quel fichier déjà écrit comme
     modèle (ex. `content/dialogues/npcs/violet-city/earl_violet_city.json`).
   - `content/lessons/<zone_id>.json` — tableau de `{zone_id, npc_ref, sequence_index,
     kanji_ids[], grammar_id}`, copié depuis `lessons-proposal.json`.
   - `content/texts/<zone_id>/<nom>.json` si `content/side-content-inventory.md` liste un texte
     « tout trouvé » sourcé pour cette zone (cherche le nom de la zone dans ce fichier).
   - Enregistrement dans `content/map/npcs.json` / `content/map/trainers.json` (et
     `content/map/obstacles.json` si un obstacle CS-Kanji ou objet-clé existe pour la zone).
4. **Boss de gym (Whitney) — format examen** : voir `content/dialogues/trainers/violet-city/falkner_violet_city.json`
   et `bugsy_azalea.json` comme modèles exacts (champ `exam_name` bilingue, exempté du budget
   kanji comme les noms de personnage — c'est déjà fait dans le linter). Longueur de combat de
   Whitney et de ses 門弟 : voir la table `PRD.md § Système de Combat` (« Whitney 13 » pour les
   门弟, « Whitney 38 » pour elle). `unlock_conditions` du boss = `npc_cleared` sur chacun de ses
   门弟, même pattern que Falkner/Bugsy.

## Règles de contenu à ne jamais oublier (trouvées à la dure dans les lots précédents)

- **Budget kanji** : max 2 kanji hors studiedSet par dialogue entier (`name`/`exam_name`
  exemptés du compte, jamais de la règle de lecture inline) ; textes = proportionnel ~2/100
  caractères, plafond 10 ; `kanji.lesson_examples[]` = zéro autre kanji que lui-même, strict.
  Utilise `content/kanji-zone-assignment.json` (`cumulative_start` de la zone) comme plancher,
  mais reste **conservateur** : l'ordre `cumulative` de ce fichier ne correspond PAS toujours à
  l'ordre réel de visite (Route 36 en est l'exemple documenté, `cumulative_start=330` alors que
  la vraie position de visite donne un studiedSet réel ≈140) — en cas de doute, calcule le
  studiedSet réel depuis les zones réellement déjà écrites plutôt que de faire confiance
  aveuglément au champ `cumulative_start`.
- **Lecture inline obligatoire** : `道場（どうじょう）`, jamais de kanji sans sa lecture entre
  parenthèses pleine chasse juste après (ADR-0002).
- **Pas de choix de compagnon/gender à réinventer** — ces mécaniques ont leurs propres champs
  (`companion_id`, `set_companion`) déjà posés au § Compagnon du PRD, ne rien dupliquer.
- **`lessons.unlock_conditions`** (optionnel, `Condition[]`) : à utiliser seulement si un même
  PNJ-leçon porte aussi de la narration qui doit passer AVANT ses leçons (comme Elm, Guide Gent)
  — sinon laisser vide, l'ordre intra-zone strict suffit déjà.
- **Silver** (si son parcours croise Doublonville/Forêt Secte à ce point — vérifier la table
  `PRD.md § Silver — 6 Rencontres`) : apparition #2 déjà écrite à Écorcia (lot 1) ; ne pas
  dupliquer, l'apparition suivante n'est qu'à la Tour Embrasée (apparition #3), hors périmètre.

## Auto-test — obligatoire après chaque zone, pas seulement à la fin

```
python3 scripts/validate/lint-kanji-budget.py
python3 scripts/validate/lint-cross-refs.py
python3 scripts/validate/check-cs-kanji-deadlock.py
python3 scripts/validate/calc-cs-corpus.py
```

Le 4ᵉ script (`calc-cs-corpus.py`) a une liste `NARRATIVE_ORDER` en dur en tête de fichier —
**l'étendre** avec les nouvelles zones dans leur vrai ordre de visite à mesure qu'elles
s'ajoutent (ne pas utiliser `story-beats.json § order`, qui suit l'ordre kanji abstrait, pas
l'ordre de visite réel — voir la docstring du script pour l'explication complète).

Si un des 4 outils échoue : corrige le contenu, ne baisse jamais le seuil pour faire passer un
vrai problème. Si l'échec est un faux positif légitime (comme la cascade route-33→azalea-town au
lot 1), documente-le dans le fichier concerné plutôt que de le laisser comme un mystère pour la
suite.

## En terminant

Mets à jour `.scratch/audits/roadmap-pre-code.md` § Étape 4 avec une section « Lot 2 » au même
format que « Lot 1 » (zones couvertes, nombre de fichiers, kanji dotés d'exemples, vraies
erreurs trouvées, simplifications assumées). Ne touche à aucun fichier hors de ce qui est décrit
ici — une autre session travaille en parallèle et a mis son propre travail de contenu en pause
pendant que tu avances, pour éviter les conflits d'édition sur les mêmes fichiers.
