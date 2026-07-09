# Rapport — registre téléphonique remplacé par la donnée ROM exacte

Source : `~/pokeheartgold/files/tel/pmtel_book.json` (décompilation, table binaire `tel/pmtel_book.dat`
déjà décodée) — remplace entièrement l'ancien `content/phone-registry.json` (sourcé Serebii, vérifié
à la main le 2026-07-09 dans une passe précédente).

`scripts/build/build-rom-phone-registry.py` → `content/phone-registry.json`, **75/75 contacts,
0 non rattaché à un zone_id** (12 story, 47 generic, 16 gym_leader). Chaque entrée porte
`map_name` (carte ROM exacte), `gift` (objet remis), `rematch_day`/`rematch_time` (condition
exacte du rendez-vous), et `phone_contact_id` (traçabilité).

## Confirmation croisée

Les 47 dresseurs génériques du registre correspondent presque exactement à ceux déjà identifiés
via Serebii (74 entrées comparables) — **confirme la fiabilité des deux sources**. Mieux : les
zones de plusieurs d'entre eux (Joey/route-30, Wade/route-31, Anthony/route-33) confirment
indépendamment les corrections déjà appliquées à `npc-inventory.md` lors de l'extraction du
roster de dresseurs de combat (étape 2 point 4, ROM).

## Corrections trouvées vs. la version Serebii (4)

- **Ethan/Lyra** : Serebii les plaçait au Day Care (route-34, confusion avec Day Care Man/Lady) ;
  la ROM les place dans leur propre maison à Bourg Geon (`new-bark-town`).
- **Baoba** : Serebii le plaçait Route 39 (1ère rencontre) ; la ROM le place à la Safari Zone
  (son poste d'accueil, plus pertinent pour un appel téléphonique).
- **Pr. Oak** : Serebii le plaçait chez Mr. Pokémon (route-30) ; la ROM le place dans son propre
  laboratoire à Bourg-Origine (`pallet-town`).

## Ce qui manque encore (hors scope de ce fichier)

- Pas de dialogue d'appel écrit (`content/dialogues/calls/<caller_id>.json`, PRD § でんわ) —
  ce fichier ne fait toujours que fixer la liste fermée et ses conditions.
- Le domicile DB (`user_map_state.registered_trainers[]`) reste un champ runtime, pas peuplé ici.
