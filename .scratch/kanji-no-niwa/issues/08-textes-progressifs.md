# 08 — Textes progressifs : fenêtre de lecture + quiz + déblocages moteur

Status: ready-for-agent
Bloqué par: 02, 03
Bloque: 09 (le Journal de lecture liste les complétions)

## Contexte

PRD § Textes Progressifs, `content/texts-progressifs.md`. La zone 1 a 2 textes écrits :
`lyra_mail` (débloqué par l'**ouverture du PC du joueur** — un `unlock_text` que le
moteur doit émettre lui-même, `content/engine-contract.md` § 2) et `elm_great_text`.
Route 29 ajoute le panneau d'entrée (`johto_entrance_sign_route29`, même mécanisme).

## Périmètre (vertical slice)

**Données** : `text_completions` (`text_id`, `score`, `completed_at`, `gold_at`) ;
`unlocked_texts[]` dans `user_map_state` (issue 02). Contenu lu depuis
`content/texts/<zone>/<text_id>.json`.

**Service** :
- `unlock_text` émis par le moteur pour les textes sans donneur dialogue : interaction
  avec l'objet `player_pc_new_bark` (`kind: "object"` dans `content/map/npcs.json`) →
  débloque et ouvre `lyra_mail` ; interaction avec la tuile-panneau de Route 29 →
  `johto_entrance_sign_route29`. Table de correspondance objet/tuile → text_id dans le
  loader contenu, sourcée de engine-contract § 2.
- Complétion du quiz = quiz passé en retry-jusqu'à-correct → `completed_at` ; **passe
  sans faute** (première ou relecture, quiz remélangé) → `gold_at`.

**UI** :
- **Fenêtre de lecture** plein écran, même famille visuelle que l'écran-livre, texture
  selon le type de document (lettre pour lyra_mail). Texte `jp` avec lectures inline
  masquées, Y les révèle, X = traduction (même composant de rendu que l'issue 03).
- **Quiz obligatoire** : QCM, retry-jusqu'à-correct, **le texte reste consultable
  pendant le quiz** ; après un 2ᵉ échec sur une question portant `answer_span`,
  surligner le passage (scaffolding). Mélange des choix à l'affichage.
- B en cours de texte : fermeture avec confirmation ; à la réouverture le quiz reprend à
  la question courante (pas de curseur plus fin — PRD § Navigation).

## Critères d'acceptation

- Ouvrir le PC dans la chambre → lyra_mail se lit et se complète ; `texts_read`
  s'incrémente (métrique consommée par les seuils CS-Kanji plus tard) ; une relecture
  sans faute pose `gold_at`.
- Tests : émission moteur des unlock_text (idempotence), retry/scaffolding, logique
  blanc/doré.

## Hors périmètre

Les seuils CS-Kanji (`count(texts_read, N)`) — la métrique doit juste compter juste dès
maintenant. L'audio des textes, le mode doré du Kanjidex.
