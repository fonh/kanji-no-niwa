# Prompt — passe « les figurants deviennent des personnages »

À coller tel quel dans une nouvelle conversation. Écrit le 2026-08-07 à la fin
de la session « carte de conception + QA de la tranche verticale ».

---

Projet : **Kanji no Niwa (漢字の庭)** — jeu d'apprentissage des 2136 kanji habillé
comme Pokémon HeartGold/SoulSilver. Dépôt
`/Users/henrifontanille/Documents/pokedex_kanji`, branche
`jalon-1-tranche-verticale`. Tout le contenu et la doc sont en français, tout le
japonais affiché en jeu est en kana majoritaire avec lectures inline.

**Lis d'abord `docs/agents/journal.md`** — où vit chaque chose, les recettes, et
les pièges déjà payés. Puis `content/opening-sequence.md` § 8 (méthode de zone)
et `content/texts-progressifs.md` (densité et calibrage des textes).

## Le constat

En jouant, le joueur traverse les routes et **personne ne lui donne rien**. Les
silhouettes qu'il croise sur la carte sont du décor brut extrait de la ROM :
elles n'ont ni fiche, ni dialogue écrit, ni leçon, ni texte — juste une réplique
d'ambiance tirée d'un pool générique. Les seuls personnages qui donnent quelque
chose sont les PNJ-leçon curatés, souvent à l'intérieur d'une maison.

## La mission

Promouvoir ces figurants en **personnages curatés**, zone par zone, sur le
chemin critique d'abord :

`new-bark-town` → `route-29` → `cherrygrove-city` → `route-30` → `route-31` →
`violet-city` → `sprout-tower`

Pour chaque figurant retenu, produire :

1. une entrée dans `content/map/npcs.json` — **position reposée sur son objet
   ROM**, `map_zone` si c'est un intérieur, `unlock_conditions` si sa présence
   dépend de l'histoire, `role: "lesson"` seulement s'il porte une leçon ;
2. un fichier `content/dialogues/npcs/<zone>/<npc_id>.json` — `state_rules` +
   `dialogue_states`, un état par moment de l'histoire, jamais un fourre-tout ;
3. **ce qu'il apporte** : un texte (`content/texts/<zone>/`, débloqué par un
   `Effect.unlock_text` dans l'état qui le remet), un objet (`grant_item` +
   entrée dans `src/data/item-labels.json`), ou rien du tout — un figurant qui
   dit une bonne réplique et ne donne rien est un personnage valide.

## Les règles qui ne se discutent pas

- **Aucun personnage inventé.** Tout PNJ vient soit du guidebook curaté
  (`content/guidebook-adapted.md`, `content/npc-inventory.md`), soit d'un objet
  du décompilé (`~/pokeheartgold/files/fielddata/eventdata/zone_event/`). Cite
  ta source par personnage — fichier et ligne.
- **Aucune position inventée.** `tile = monde − world_origin` du registre.
  Vérifie la praticabilité ET qu'aucun autre personnage n'occupe la tuile.
- **Le curriculum de kanji ne bouge pas.** `content/curriculum-checkpoints.md`
  fait foi. Si tu ajoutes un PNJ-leçon, tu redistribues des leçons EXISTANTES,
  tu n'en crées pas.
- **Densité de textes** : `content/texts-progressifs.md` § Densité (route de
  transit 0-1, route avec PNJ nommés 1-2, ville 3-5, donjon majeur 2-3). Les
  Poké Balls ramassables comptent dans ce budget — voir `src/lib/collectibles.ts`.
- **Japonais** : kana majoritaire, lecture inline sur tout kanji affiché
  (ADR-0002), au plus 2 kanji inconnus par dialogue.
  `content/content-writing-guide.md` fait foi sur le style.
- **`npm run check` reste vert.** Si un garde-fou refuse ton contenu, c'est
  presque toujours lui qui a raison — lis son message avant de le contourner.

## Ce qui va te mordre si tu ne fais pas attention

Le journal les liste toutes, mais celles-ci sont pour cette tâche :

- deux personnages sur la même tuile (`lint-npc-placements.py` le refuse) ;
- un PNJ d'intérieur sans `map_zone` → servi dehors, planté dans un champ ;
- un état par défaut qui remet un objet sans état d'après → il le re-offre à
  l'infini (`lint-cross-refs.py` le refuse) ;
- une tuile de garage prise pour une position (la ROM range hors carte les
  objets qu'un script fera apparaître ailleurs) ;
- un porteur de leçon gaté par un badge ou un jour de la semaine
  (`audit-first-gym-run.py` le refuse).

## Ce qui est déjà automatisé — ne le refais pas à la main

Trois commandes tiennent l'échelle à ta place. Lance-les AVANT de toucher au
contenu, et re-lance-les après :

```
npm run maps:scrub     # efface les personnages peints dans les captures
npm run maps:verify    # re-mesure : plus aucune silhouette peinte ?
npm run npc:sprites    # habille tout personnage sans apparence
```

Conséquences pour ta passe :

- **N'écris pas un `sprite_id` à la main si le personnage est posé sur son objet
  ROM** : le moteur en hérite l'apparence tout seul. Reposer un personnage sur
  son objet est donc doublement payant (apparence + doublon retiré).
- **S'il est décalé de son objet**, note `rom_object: "obj_..."` : c'est la
  façon explicite de dire « ces deux-là sont le même personnage », sinon le
  décor dessine le figurant À CÔTÉ de ton personnage.
- `npm run npc:sprites` laisse une trace de sa règle et de sa source dans
  `_note_sprite`. Une note qui dit « PROVISOIRE » est un personnage à habiller
  correctement pendant ta passe — c'est ta liste de travail.

## Comment tu vérifies ton travail sans moi

`python3 scripts/validate/render-zone-preview.py MAP_ROUTE_30 --around 8,43`
compose la carte telle qu'elle sera affichée et marque chaque endroit où le
moteur dessinera quelqu'un. **Regarde l'image** : un marqueur dans un mur, deux
marqueurs sur la même case, un marqueur sur du vide au milieu de nulle part —
ça se voit en une seconde et aucun test ne l'attrape.

## Livrable

Zone par zone, un commit par zone : le contenu, les sources citées dans les
`_note`, et `npm run check` vert. À la fin, **complète
`docs/agents/journal.md`** avec ce que tu as appris qui servira à la zone
suivante — c'est la règle de tenue du journal.

Commence par `route-30` : c'est la zone que le joueur traverse en ce moment, et
c'est là que le manque se voit le plus.
