# 01 — Régression du swap phase 1 : 3 kanji enseignés deux fois, 2 jamais enseignés

Status: résolu (2026-07-24)

Trouvé par vérification d'intégrité indépendante (2026-07-24, revue programmeur, session
principale). Le swap de promotion du noyau (commits `9d0a01ab` + correctif `d687e176`) a
laissé 3 occurrences périmées dans les fichiers de leçons : le kanji promu est enseigné
dans sa NOUVELLE zone ET encore dans son ancienne, et 2 kanji du pool des zones-hôtes ne
sont plus enseignés nulle part.

## Constat (vérifié fichier par fichier)

| Kanji | Zone assignée (post-swap) | Enseigné dans | Occurrence périmée |
|---|---|---|---|
| 言 | route-31 | `lessons/route-31.json` #4 ET `lessons/blackthorn-city.json` #3 | blackthorn |
| 元 | violet-city | `lessons/violet-city.json` #2 ET `lessons/blackthorn-city.json` #5 | blackthorn |
| 寸 | route-31 | `lessons/route-31.json` #3 ET `lessons/national-park.json` #1 | national-park |

Et, symétriquement, jamais enseignés alors que leur zone est couverte :
- **命** (pool route-44, hébergé par blackthorn-city — cascade §4bis du contrat)
- **園** (pool route-35, hébergé par national-park)

Compte : 1350 slots de leçon écrits, 1347 kanji distincts. 3 doublons pour 2 manquants —
le 3ᵉ slot périmé pointe donc vers un kanji d'une zone empruntée non couverte par ma
reconstruction (probablement ice-path ou route-35, à établir en refaisant le calcul du
pool attendu de chaque hôte).

## Correction

1. Pour chaque fichier-hôte (`blackthorn-city.json`, `national-park.json`) : recomposer le
   pool attendu = union des `new_kanji` de la zone hôte + zones empruntées
   (`content/kanji-zone-assignment.json`, cascades du journal de lot + contrat §4bis).
2. Remplacer les occurrences périmées (言, 元 à blackthorn ; 寸 à national-park) par les
   kanji non couverts (命, 園, + le 3ᵉ identifié) — même slot, même leçon, en réécrivant
   la page de leçon (identité + exemples) pour le kanji de remplacement.
3. Vérifier/écrire les `lesson_examples[]` des kanji de remplacement dans
   `src/data/kanji-content.json`, et répercuter dans `content/lessons-proposal.json`
   (les fichiers écrits collent au proposal — le bug est donc aussi dans le proposal).
4. Ajouter au linter (`lint-cross-refs.py` ou dédié) : (a) aucun kanji enseigné deux fois
   dans `content/lessons/*.json` ; (b) tout kanji assigné à une zone écrite ou empruntée
   par une zone écrite est enseigné exactement une fois. Aucun linter actuel ne l'attrape.

## Comments

**2026-07-24, résolu.** Confirmé l'analyse : blackthorn-city emprunte le pool de
route-44 (positions 1-20) et ice-path (positions 21-40) ; national-park emprunte
route-35 en entier. Les 3 kanji périmés (言/元/寸) correspondaient exactement aux
positions réassignées par le swap phase 1 (route-44[15]=命 pas 言 ; ice-path[9]=定
pas 元 ; route-35[2]=園 pas 寸), vérifié par script contre
`kanji-zone-assignment.json` plutôt qu'à la main. Les 3 kanji de remplacement
(命/定/園) avaient déjà leurs `lesson_examples[]` dans `kanji-content.json`
(écrits lors d'une passe antérieure, jamais utilisés) — aucune rédaction de
contenu nécessaire, seulement remplacer la valeur dans les 3 fichiers
(`content/lessons/blackthorn-city.json`, `content/lessons/national-park.json`,
`content/lessons-proposal.json`, ce dernier confirmé porteur du même bug).
Audit global : 1350 slots → 1350 kanji distincts après correctif (0 avant :
1347 distincts pour 1350 slots). Linter ajouté :
`scripts/validate/lint-lessons-kanji-coverage.py` (contrôles (a) et (b) de la
section Correction) — vérifié qu'il détecte les 3 doublons sur le contenu
pré-correctif (`git show HEAD:...`) et ne rapporte plus rien après. 5 linters
existants + le nouveau : tous verts.
