# Rapport — registre fermé des numéros de téléphone (Pokégear)

Source : [Serebii — PokéGear Phonecalls](https://www.serebii.net/heartgoldsoulsilver/pokegearphone.shtml),
vérifiée par un second fetch confirmant le total de lignes et la dernière entrée (Reese).
74 contacts au total, écrits dans `content/phone-registry.json` par
`scripts/build/build-phone-registry.py`.

## Répartition

- **11 story** (mentors/famille/PNJ scénaristique) : Baoba, Bill, Day Care Lady/Man, Ethan/Lyra,
  Mom, Pr. Elm, Pr. Oak, Kurt, Buena.
- **16 gym_leader** (les 16 champions Johto+Kanto, trouvés en vadrouille post-Hall of Fame,
  rematch conditionné jour/heure).
- **47 generic** — le vrai « registre fermé » au sens strict de la roadmap : dresseurs de route
  nommés qui donnent leur numéro « After Defeating ».

## Croisement avec npc-inventory.md (déjà sourcé du guidebook Prima)

- **59/74 retrouvés directement** dans la zone attendue.
- **6 absences attendues, pas un écart** : Day Care Lady/Man (mécanique Day Care coupée dans ce
  projet — confirmé dans route-34, « Day Care supprimée dans 漢字の庭 ») ; Brock/Bugsy/Falkner/
  Pryce (les 16 champions ne sont jamais une ligne de PNJ à part entière dans npc-inventory.md —
  seuls leurs 門弟 et la ligne de récompense les mentionnent, structure de données différente,
  pas un gap de contenu).
- **8 vrais écarts trouvés et comblés** (2026-07-09) : des dresseurs génériques confirmés par
  Serebii mais absents du dépouillement guidebook initial, ajoutés à npc-inventory.md avec
  mention explicite de la source et sans classe de dresseur inventée quand elle n'était pas
  donnée par Serebii :
  - Route 2 (hors forêt) : **Rob, Doug**.
  - Route 12 : **Kyle, Kyler** (remplacent le placeholder générique « Pêcheurs génériques »).
  - Route 13 : **Tim & Sue** (parmi les 11 dresseurs déjà annoncés mais pas tous nommés).
  - Route 14 : **Torin** (un des 5 Écoliers jusque-là non nommés).
  - Route 15 : **Billy** (un des 2 Écoliers jusque-là non nommés).
  - Route 17 : **Reese** (un des 9 motards jusque-là non nommés).
- **13 écarts de zone mineurs** (le nom existe dans npc-inventory.md mais pas exactement dans la
  zone que Serebii indique pour l'appel — ex. Erin trouvée en route-45, Serebii dit route-46) :
  plausibles divergences entre lieu de combat (source guidebook, plus fiable) et lieu où le
  jeu positionne le personnage pour l'appel (source Serebii, plus approximative sur ce point) —
  non corrigées, documentées dans `content/phone-registry.json` (`matched_zone` ≠ `zone_id`).

## Ce que ce fichier ne fait pas (hors périmètre)

- Pas de schéma `Condition`/jour-heure implémenté — seule la condition brute Serebii est
  recopiée dans `note`/`condition`.
- Pas de contenu de dialogue d'appel (`content/dialogues/calls/<caller_id>.json`, PRD § でんわ) —
  ce fichier ne fait que fixer la liste fermée, pas écrire les appels.
- Le domicile DB (`user_map_state.registered_trainers[]`) n'est pas peuplé ici — c'est un
  champ runtime, pas une donnée de contenu statique.
