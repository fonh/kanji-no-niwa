# Suivi Étape 4 — Passe contenu industrielle (漢字の庭)

Fichier de trace créé 2026-07-17 à la demande de l'utilisateur (« un fichier pour garder
une trace à chaque étape »). Une ligne par zone de croissance. **Le comptage
(leçons/kanji/PNJ) est déjà figé** en amont — ce document ne le recalcule pas, il suit
l'avancement de la *rédaction* de chaque zone.

## Sources du comptage (ne pas recompter, lire)
- `content/kanji-zone-assignment.json` — 2136 kanji ordonnés, 83 zones
- `content/lessons-proposal.json` — 344 leçons / 48 zones / 1950 kanji, taille par leçon
- `content/npc-inventory.md` — PNJ par zone + colonne Type assigné (136 combat / 117 leçon / 88 ambiant)
- `content/side-content-inventory.md` — vivier des ~80-110 textes secondaires

## Décisions d'exécution (validées 2026-07-17, amendées 2026-07-21)
1. **Séquentiel, 1 session** — pas de multi-agents parallèles (fichiers partagés kanji-content.json / npc-inventory.md).
2. **Textes au fil de chaque zone** — chaque zone sourcée reçoit son texte dans son propre passage.
3. ~~Point de contrôle après chaque zone~~ — **levé 2026-07-21** (demande utilisateur « finis tout le contenu ») : passe continue, commit + push par lot de zones.
4. **Overlay grammaire au fil de chaque zone** (`content/grammar/<zone>.json`, spec `content/grammar-wiring-spec.md`, pilote New Bark validé) — même passage que les leçons de la zone.
5. **Pool `reading_snippets` (modes lecture M18-M23, adoptés 2026-07-21)** — passages adaptés des livres au fil des paliers, livrable de cette passe (voir roadmap Lot 0).

## Méthode par zone (cf. `content/content-writing-guide.md`)
1. Lire sources : npc-inventory → guidebook-adapted → placements → lessons-proposal → rom-trainer-roster → livres (calibrage)
2. Écrire dialogues PNJ (`content/dialogues/npcs/<zone>/`) + dresseurs (`.../trainers/<zone>/`)
3. `content/lessons/<zone>.json` (copie depuis lessons-proposal, jamais réordonner)
4. `lesson_examples[]` réels pour chaque kanji de la zone dans `src/data/kanji-content.json`
5. Texte(s) sourcé(s) si listé(s) dans side-content-inventory
6. Enregistrer dans `content/map/npcs.json` / `trainers.json` / `obstacles.json`
7. Auto-test : 4 linters `scripts/validate/` + vérifs manuelles (espèces Pokémon, présence lesson_examples, variété types de question)

## Avancement global
- Zones : **12 / 48** écrites
- Leçons : **49 / 344** écrites
- Kanji dotés d'exemples : **265 / 1950**

### Journal
- **2026-07-17 — ilex-forest (Forêt Secte)** : 3 dialogues (apprenti charbonnier PNJ-leçon #1/#3/#5 + quête, homme de la corniche PNJ-leçon #2/#4, Naoko ambiant), `lessons/ilex-forest.json` (5 leçons N4-063→067), 30 lesson_examples, texte secondaire A8 (sanctuaire `forest_shrine_ilex`), quête cross-zone `escaped_companions_errand` (Écorcia↔Forêt), remise CS 切 (`cs_kiru` + texte obligatoire `cs_kiru_azalea`, arc du Maître du Charbon d'Écorcia complété — différé du Lot 1), obstacle `cut_tree_ilex_shortcut`, 3 entrées carte. 4 linters verts (110 fichiers). Aucun dresseur nommé sourcé pour cette zone (roster ROM vide) → 0 combat inventé.

## Tableau de suivi (ordre narratif réel)

Colonnes statut détaillé à cocher au fil : D=dialogues, L=lessons/*.json, E=lesson_examples, T=texte(s), C=carte/registre.

| # | Zone | Région | Leçons | Kanji | PNJ | Statut | D | L | E | T | C |
|---|---|---|---:|---:|---:|---|:-:|:-:|:-:|:-:|:-:|
| 1 | new-bark-town | Johto | 5 | 30 | 1 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | route-29 | Johto | 4 | 20 | 1 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | cherrygrove-city | Johto | 2 | 10 | 2 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 | route-30 | Johto | 4 | 20 | 1 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5 | route-31 | Johto | 4 | 20 | 1 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6 | violet-city | Johto | 5 | 30 | 5 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7 | sprout-tower | Johto | 2 | 10 | 2 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8 | route-32 | Johto | 4 | 20 | 4 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9 | ruins-of-alph | Johto | 4 | 20 | 2 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 | azalea-town | Johto | 5 | 30 | 2 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 11 | ilex-forest | Johto | 5 | 30 | 2 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 12 | goldenrod-city | Johto | 9 | 50 | 9 | ⬜ à faire | · | · | · | · | · |
| 13 | national-park | Johto | 7 | 40 | 4 | ⬜ à faire | · | · | · | · | · |
| 14 | route-36 | Johto | 5 | 25 | 2 | ✅ fait | ✅ | ✅ | ✅ | ✅ | ✅ |
| 15 | route-37 | Johto | 3 | 15 | 1 | ⬜ à faire | · | · | · | · | · |
| 16 | ecruteak-city | Johto | 7 | 40 | 6 | ⬜ à faire | · | · | · | · | · |
| 17 | route-39 | Johto | 9 | 50 | 4 | ⬜ à faire | · | · | · | · | · |
| 18 | olivine-city | Johto | 5 | 30 | 2 | ⬜ à faire | · | · | · | · | · |
| 19 | cianwood-city | Johto | 5 | 30 | 3 | ⬜ à faire | · | · | · | · | · |
| 20 | route-42 | Johto | 3 | 15 | 1 | ⬜ à faire | · | · | · | · | · |
| 21 | mahogany-town | Johto | 5 | 25 | 5 | ⬜ à faire | · | · | · | · | · |
| 22 | route-43 | Johto | 1 | 5 | 1 | ⬜ à faire | · | · | · | · | · |
| 23 | lake-of-rage | Johto | 1 | 5 | 1 | ⬜ à faire | · | · | · | · | · |
| 24 | blackthorn-city | Johto | 15 | 90 | 7 | ⬜ à faire | · | · | · | · | · |
| 25 | dragons-den | Johto | 10 | 60 | 2 | ⬜ à faire | · | · | · | · | · |
| 26 | dark-cave | Johto | 7 | 40 | 1 | ⬜ à faire | · | · | · | · | · |
| 27 | route-26 | Johto | 7 | 40 | 2 | ⬜ à faire | · | · | · | · | · |
| 28 | route-27 | Johto | 5 | 30 | 1 | ⬜ à faire | · | · | · | · | · |
| 29 | indigo-plateau-antichambre | Johto | 7 | 40 | 1 | ⬜ à faire | · | · | · | · | · |
| 30 | vermilion-city | Kanto | 30 | 180 | 4 | ⬜ à faire | · | · | · | · | · |
| 31 | route-6-kanto | Kanto | 2 | 10 | 2 | ⬜ à faire | · | · | · | · | · |
| 32 | saffron-city | Kanto | 24 | 140 | 6 | ⬜ à faire | · | · | · | · | · |
| 33 | route-9-10-rocktunnel | Kanto | 4 | 20 | 1 | ⬜ à faire | · | · | · | · | · |
| 34 | lavender-town | Kanto | 4 | 20 | 1 | ⬜ à faire | · | · | · | · | · |
| 35 | kanto-power-plant | Kanto | 2 | 10 | 2 | ⬜ à faire | · | · | · | · | · |
| 36 | cerulean-city | Kanto | 17 | 100 | 2 | ⬜ à faire | · | · | · | · | · |
| 37 | celadon-city | Kanto | 25 | 150 | 6 | ⬜ à faire | · | · | · | · | · |
| 38 | route-16-17-18-cycling-road | Kanto | 4 | 20 | 1 | ⬜ à faire | · | · | · | · | · |
| 39 | fuchsia-city | Kanto | 22 | 130 | 4 | ⬜ à faire | · | · | · | · | · |
| 40 | route-14-15-kanto | Kanto | 4 | 20 | 1 | ⬜ à faire | · | · | · | · | · |
| 41 | route-11-12-13-diglett | Kanto | 3 | 15 | 3 | ⬜ à faire | · | · | · | · | · |
| 42 | pewter-city | Kanto | 20 | 115 | 2 | ⬜ à faire | · | · | · | · | · |
| 43 | mont-lune-route-3-4 | Kanto | 4 | 20 | 1 | ⬜ à faire | · | · | · | · | · |
| 44 | route-2-foret-viridian | Kanto | 3 | 15 | 1 | ⬜ à faire | · | · | · | · | · |
| 45 | viridian-city | Kanto | 2 | 10 | 1 | ⬜ à faire | · | · | · | · | · |
| 46 | route-1-kanto | Kanto | 2 | 10 | 1 | ⬜ à faire | · | · | · | · | · |
| 47 | pallet-town | Kanto | 3 | 15 | 1 | ⬜ à faire | · | · | · | · | · |
| 48 | mt-silver-route-28 | Mont Argenté | 14 | 80 | 1 | ⬜ à faire | · | · | · | · | · |

_Les 35 zones sans leçon (combat/texte/ambiant seuls) parmi les 83 ne figurent pas ici :
elles n'ont pas de pool kanji propre et seront traitées comme sous-partie du lot de leur
région (dialogues de dresseurs/ambiants légers) — voir npc-inventory.md._
