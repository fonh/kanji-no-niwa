# 02 — Deux dialogues dont la règle default pointe vers un état inexistant

Status: résolu (2026-07-24)

Trouvé par vérification d'intégrité indépendante (2026-07-24). Dans ces deux fichiers, la
règle default sélectionne l'état `welcome`, qui n'existe pas — le seul état défini porte
un autre nom. Au runtime, le moteur ne trouverait aucun état à afficher (dialogue mort) ;
aucun linter actuel ne vérifie la cohérence `state_rules` → `dialogue_states`.

| Fichier | Règle pointe | État réellement défini |
|---|---|---|
| `content/dialogues/npcs/route-24-25-kanto/suicune_viewpoint_r2425.json` | `welcome` | `scene` |
| `content/dialogues/npcs/cerulean-city/lone_grunt_gym_cerulean.json` | `welcome` | `caught` |

C'est la scène du point de vue de la FINALE Suicune et le sbire isolé du gym d'Azuria
(l'exemple canonique du `negate` du PRD) — deux beats importants du Lot 13.

## Correction

1. Corriger la valeur `state` de la règle default (`scene` / `caught`) — ou renommer
   l'état si le nom d'origine était le bon ; vérifier au passage qu'aucun autre système ne
   référence ces noms d'état.
2. Ajouter au linter : pour chaque dialogue, (a) chaque `state_rules[].state` existe dans
   `dialogue_states`, (b) exactement une règle `default`, en dernière position, (c) aucun
   état non-moteur (hors intro/battle_intro/post_battle) défini mais jamais sélectionnable.

## Comments

**2026-07-24, résolu.** Corrigé la valeur de la règle default plutôt que renommé l'état
existant (le nom d'origine, `scene`/`caught`, collait déjà bien au contenu) : `welcome` →
`scene` dans `suicune_viewpoint_r2425.json`, `welcome` → `caught` dans
`lone_grunt_gym_cerulean.json`. Vérifié qu'aucun autre système ne référence ces noms
d'état (`content/map/npcs.json` référence l'entité par `npc_id`/`dialogue_ref`, jamais
par nom d'état). Linter ajouté : `scripts/validate/lint-dialogue-states.py`, couvre les
3 contrôles demandés (a/b/c) sur les 480 fichiers de `content/dialogues/**` — 0 échec,
0 avertissement après correctif ; vérifié qu'il détecte bien les 2 bugs d'origine sur le
contenu pré-correctif (`git show HEAD:...`).
