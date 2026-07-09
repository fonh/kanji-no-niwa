# Rapport — objets cachés extraits de la ROM

Source : `~/pokeheartgold` (décompilation). **257/257 objets rattachés, 56/83 zones concernées** (les autres n'ont aucun objet caché en HGSS). Chaque objet-ball porte un scriptId `std_itemball_<carte>_<item>` — le nom est directement lisible dans l'id, aucune table à résoudre séparément.

## Ce que ce fichier est, et n'est pas

`content/rom-item-roster.json` est un **jeu de données de référence brut**, pas fusionné dans `npc-inventory.md`. Le croisement ci-dessous montre ~100% « d'absents » — attendu, pas un signal d'erreur : `npc-inventory.md` ne cataloguait déjà que les objets remis *par un PNJ* ou liés à une quête, jamais les objets au sol génériques (Potion, Escape Rope, TM courantes) qui composent l'essentiel des objets trouvés ici. Les deux sources se complètent, elles ne se corrigent pas l'une l'autre comme pour les dresseurs.

## Utilisation prévue (à décider plus tard)

Pertinent quand le studio écrira la couche d'exploration/collecte de la carte — probablement à l'étape 4 (passe contenu) ou pour un système de "Chasse au Trésor" déjà évoqué ailleurs dans le projet. Pas d'action requise maintenant.

## Détail du croisement automatique (indicatif seulement, voir note ci-dessus)

- **burned-tower** (3/3 du roster ROM absents du texte) : HP Up, Antidote, TM12
- **celadon-city** (1/1 du roster ROM absents du texte) : TM67
- **cerulean-cave** (13/13 du roster ROM absents du texte) : Max Elixir, Nugget, Full Restore, Sea Incense, PP Up, TM24, Ultra Ball, Odd Incense, Max Revive, Ultra Ball, Dusk Stone, Electirizer, Black Sludge
- **dark-cave** (7/7 du roster ROM absents du texte) : TM54, Revive, Potion, Hyper Potion, Full Heal, Dire Hit, Black Flute
- **dragons-den** (3/3 du roster ROM absents du texte) : Dragon Fang, Calcium, Max Elixir
- **ecruteak-city** (12/12 du roster ROM absents du texte) : Full Heal, Escape Rope, Ultra Ball, PP Up, Rare Candy, Max Potion, Full Heal, Max Revive, Full Restore, Max Elixir, Nugget, HP Up
- **goldenrod-city** (11/11 du roster ROM absents du texte) : TM78, Ultra Ball, Amulet Coin, Burn Heal, Ether, Ultra Ball, Full Heal, Smoke Ball, TM82, Max Ether, Ultra Ball
- **ice-path** (8/8 du roster ROM absents du texte) : HM07, Protein, PP Up, Iron, TM72, Full Heal, Max Potion, Nevermeltice
- **ilex-forest** (4/4 du roster ROM absents du texte) : Revive, X Attack, Antidote, Ether
- **indigo-plateau-antichambre** (9/9 du roster ROM absents du texte) : Max Revive, Full Heal, Potion, TM26, HP Up, Full Restore, Ultra Ball, TM79, Rare Candy
- **lake-of-rage** (3/3 du roster ROM absents du texte) : TM43, Red Flute, Choice Specs
- **mahogany-town** (9/9 du roster ROM absents du texte) : Hyper Potion, Guard Spec , Nugget, TM46, Protein, X Special, TM49, Full Heal, Ultra Ball
- **mont-lune-route-3-4** (2/2 du roster ROM absents du texte) : Big Root, HP Up
- **mt-mortar** (22/22 du roster ROM absents du texte) : Ether, Revive, Escape Rope, Nugget, Iron Ball, Max Potion, Iron, Max Revive, Ultra Ball, Full Incense, Protector, Rare Candy, Max Potion, TM40, Elixir, Dragon Scale, Escape Rope, Carbos, PP Up, Full Restore, Max Ether, Hyper Potion
- **mt-silver-base** (6/6 du roster ROM absents du texte) : Full Restore, Expert Belt, Max Elixir, Calcium, Protein, Max Revive
- **mt-silver-lower** (2/2 du roster ROM absents du texte) : Escape Rope, TM76
- **mt-silver-route-28** (2/2 du roster ROM absents du texte) : TM35, Reaper Cloth
- **mt-silver-upper** (2/2 du roster ROM absents du texte) : Pure Incense, Dawn Stone
- **national-park** (6/6 du roster ROM absents du texte) : TM28, Soothe Bell, Shiny Stone, TM28, Soothe Bell, Shiny Stone
- **olivine-city** (6/6 du roster ROM absents du texte) : TM57, Rare Candy, Ether, TM87, Super Repel, Super Potion
- **pewter-city** (1/1 du roster ROM absents du texte) : Wise Glasses
- **route-11-12-13-diglett** (5/5 du roster ROM absents du texte) : TM86, Calcium, Yellow Flute, PP Max, Rock Incense
- **route-14-15-kanto** (2/2 du roster ROM absents du texte) : PP Up, Rose Incense
- **route-19-20-seafoam** (8/8 du roster ROM absents du texte) : TM55, Grip Claw, Ice Heal, Water Stone, Revive, Big Pearl, Ultra Ball, TM13
- **route-2-foret-viridian** (6/6 du roster ROM absents du texte) : Elixir, Dire Hit, Blue Flute, Leaf Stone, TM77, Carbos
- **route-24-25-kanto** (1/1 du roster ROM absents du texte) : Protein
- **route-26** (2/2 du roster ROM absents du texte) : Max Elixir, Moon Stone
- **route-27** (3/3 du roster ROM absents du texte) : Rare Candy, TM02, Destiny Knot
- **route-29** (1/1 du roster ROM absents du texte) : Potion
- **route-30** (2/2 du roster ROM absents du texte) : Antidote, Potion
- **route-31** (2/2 du roster ROM absents du texte) : Potion, Poke Ball
- **route-32** (4/4 du roster ROM absents du texte) : Repel, Great Ball, TM09, Shell Bell
- **route-34** (2/2 du roster ROM absents du texte) : Nugget, TM63
- **route-35** (2/2 du roster ROM absents du texte) : TM66, Parlyz Heal
- **route-36** (1/1 du roster ROM absents du texte) : Hyper Potion
- **route-38** (2/2 du roster ROM absents du texte) : Max Potion, Lax Incense
- **route-39** (1/1 du roster ROM absents du texte) : TM60
- **route-40** (1/1 du roster ROM absents du texte) : TM88
- **route-42** (3/3 du roster ROM absents du texte) : Super Potion, Dubious Disc, TM65
- **route-43** (1/1 du roster ROM absents du texte) : Max Ether
- **route-44** (3/3 du roster ROM absents du texte) : Max Repel, Max Revive, Ultra Ball
- **route-45** (5/5 du roster ROM absents du texte) : Elixir, Max Potion, Full Heal, Nugget, Revive
- **route-46** (1/1 du roster ROM absents du texte) : X Speed
- **route-47-48-cliff-cave** (5/5 du roster ROM absents du texte) : Revive, Lagging Tail, Wave Incense, White Flute, Nugget
- **route-6-kanto** (1/1 du roster ROM absents du texte) : TM62
- **route-7-kanto** (1/1 du roster ROM absents du texte) : Mental Herb
- **route-8-kanto** (1/1 du roster ROM absents du texte) : TM41
- **route-9-10-rocktunnel** (11/11 du roster ROM absents du texte) : TM91, Full Restore, Light Clay, Max Potion, Elixir, TM56, TM69, Iron, PP Up, Revive, Oval Stone
- **ruins-of-alph** (18/18 du roster ROM absents du texte) : Potion, Hyper Potion, Heal Powder, Energypowder, Oran Berry, Pecha Berry, Heal Powder, Energy Root, Sitrus Berry, Moon Stone, Revival Herb, Charcoal, Life Orb, Leppa Berry, Stardust, Star Piece, Leppa Berry, Mystic Water
- **slowpoke-well** (2/2 du roster ROM absents du texte) : Super Potion, TM18
- **sprout-tower** (4/4 du roster ROM absents du texte) : Parlyz Heal, X Accuracy, Potion, Escape Rope
- **union-cave** (8/8 du roster ROM absents du texte) : X Attack, Great Ball, Potion, Awakening, TM39, X Defense, Elixir, Hyper Potion
- **vermilion-city** (2/2 du roster ROM absents du texte) : Luck Incense, Sticky Barb
- **violet-city** (2/2 du roster ROM absents du texte) : Rare Candy, PP Up
- **whirl-islands** (11/11 du roster ROM absents du texte) : Ultra Ball 2, Ultra Ball, Escape Rope, Carbos, Full Restore, Nugget, Calcium, Max Revive, Full Restore, Max Elixir, Rare Candy
