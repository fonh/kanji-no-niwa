# Rapport — dresseurs génériques par route (fidélité stricte, phase web)

**⚠️ Dépassé — voir `.scratch/audits/rom-trainer-roster-report.md`** : cette phase (recherche
web) a trouvé ses limites (tableaux tronqués, une divergence non tranchée) documentées
ci-dessous ; la phase suivante, le même jour, a extrait les données directement de la
décompilation ROM (`~/pokeheartgold`) et résolu tous les écarts trouvés, y compris ceux non
résolus ici. Conservé pour l'historique de la démarche.

Scan systématique de `npc-inventory.md` (marqueurs 🔍/« non détaillé »/« générique » + comptage
numérique déclaré vs. noms effectivement listés) : **9 zones flaggées** sur 83.

## Résolu (recherche web croisée, 2026-07-09)

- **union-cave** — les « 7 dresseurs au total, noms non détaillés » sont en réalité **8**,
  identifiés et confirmés par deux sources indépendantes (StrategyWiki + Bulbapedia,
  concordantes) : Hiker Daniel, Hiker Russell (B1F), Poké Maniac Andrew/Calvin/Larry (B1F sud),
  Ace Trainer Nick/Gwen/Emma (B2F). npc-inventory.md et guidebook-adapted.md mis à jour,
  placements/story-beats régénérés.

## Non résolu — à reprendre dans une passe dédiée

- **route-19-20-seafoam** — « 7-8 nommés » (Route 20) et « 7 Nageurs nommés » (Route 19) : les
  noms ne sont **pas** transcrits dans le document actuel malgré le mot « nommés ». Recherche
  web partielle : seuls Swimmer Tucker et Swimmer Debbie confirmés (Route 19) avant que les
  fetchs ne tronquent sur les longs tableaux Bulbapedia/StrategyWiki (403 sur StrategyWiki).
  **Reste à compléter.**
- **route-16-17-18-cycling-road** — même symptôme sur Route 18 : « 7 Motards nommés + 2
  Dresseurs d'Oiseaux (9 dresseurs) » sans les noms. **Divergence trouvée, non résolue** :
  une recherche web indépendante ne trouve que 2-3 dresseurs sur Route 18 en HGSS (Bird Keeper
  Bob, Bird Keeper Boris, +1 non identifié), pas 9 — à vérifier avant de faire confiance à l'un
  ou l'autre chiffre (confusion possible avec les 12 Motards de la Route 17/Cycling Road
  adjacente dans la source guidebook d'origine). **Ne pas trancher sans re-sourcer.**
- **route-14-15-kanto**, **route-11-12-13-diglett** — comptes partiellement nommés (Torin/Billy
  déjà ajoutés via le recoupement téléphonique du point précédent), mais les totaux déclarés
  par le guidebook ne sont pas garantis exhaustifs pour autant — non revérifiés en détail ici.
- **dragons-den** — « autres vieillards du Sanctuaire (non nommés) » : PNJ d'ambiance
  narrative, pas des dresseurs de combat — probablement pas un gap réel, à confirmer si besoin.
- **route-7-kanto / route-8-kanto** — « Bikers turbulents non nommés (Route 8) » : recherche
  web non tentée sur ce point précis, reste ouvert.

## Pourquoi je m'arrête ici

Les recherches web sur les rosters de dresseurs génériques par route se heurtent à des
tableaux Bulbapedia/StrategyWiki longs que l'outil de récupération tronque systématiquement
(plusieurs échecs consécutifs sur Route 18/19/20), avec un risque réel de mal recouper des
sources partielles (illustré par la divergence 3 vs. 9 sur Route 18 ci-dessus). Continuer sans
solidifier chaque fetch individuellement aurait produit plus d'erreurs que le gain de fidélité
espéré — préférence donnée à la fiabilité de ce qui est déjà écrit plutôt qu'à la complétude à
tout prix. **8 zones sur 9 flaggées restent donc en l'état** (comptes globaux conservés,
non enrichis), 1 zone (union-cave) est résolue avec un niveau de confiance élevé.
