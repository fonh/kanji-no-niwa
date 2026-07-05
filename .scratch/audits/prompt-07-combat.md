# Audit 07 — Modes de combat et dresseurs

Tu es une session d'audit du projet 漢字の庭 (PWA d'apprentissage du japonais construite
sur le monde de Pokémon HeartGold/SoulSilver). Phase actuelle du projet : **corriger les
documents de référence avant d'écrire le contenu** — aucun code, aucun issue tracker.
Déroulé strict : Phase 1 audit (lecture seule) → Phase 2 grill → Phase 3 correction
immédiate des docs.

## Docs de référence

- PRD : `.scratch/kanji-no-niwa/PRD.md` — § modes de combat (Sens/Écriture/
  Disposition/Traduction), § Langue du Jeu (mécanismes A et B), § Dresseurs de Route
  (27 classes, rôles fixes), § Gyms (2 門弟 + 師範)
- `content/guidebook-adapted.md` (rosters de dresseurs par zone, classes)
- ADR-0001 (sight-line), la règle « rencontre premier passage » (guidebook-adapted
  § Règles d'adaptation, point 8)
- Sources : `scripts/sources/jmdictExtended-*.json` (relations related/antonym pour le
  mécanisme B), kanjivg (tracés pour le mode Écriture), assets
  `public/sprites/ui/battle/`

## Périmètre

- **Chaque mode de combat est-il spécifiable tel quel ?** Pour Sens, Écriture,
  Disposition, Traduction : entrée montrée au joueur, réponse attendue, méthode de
  saisie (Écriture : tracé ? clavier ? choix ?), critère de réussite, et ce qui se
  passe en cas d'échec (dégâts ? retry ? carte re-due ?). Tout mode dont l'écran ne
  peut pas être maquetté à partir du PRD = finding C.
- **Mécanisme B (Sens gradué)** : compte réellement dans jmdictExtended la couverture
  des relations `related`/`antonym` sur un échantillon de vocabulaire N5-N3 — la
  promesse « fallback anglais si pas de relation » tient-elle statistiquement, ou le
  fallback sera-t-il le cas majoritaire (ce qui viderait le mécanisme) ?
- **Économie du combat** : composition du « pool » d'un dresseur (kanji de la zone ?
  cartes dues ? mélange ?), le fallback « si <5 kanji disponibles », les PV/structure
  d'un combat (nombre de questions), récompenses.
- **Dresseurs** : les rosters guidebook-adapted par zone ↔ le nombre de « slots »
  promis par le PRD par route — cohérents ? La règle premier passage (auto-battle)
  ↔ « ! » (carte due) ↔ sight-line ADR-0001 : les trois docs racontent-ils la même
  chose ?
- **Gyms** : structure 2 門弟 + 師範 ↔ les gabarits de puzzle notés côté Kanto
  (labyrinthes, interrupteurs) — le PRD dit-il ce qu'un gym EST mécaniquement
  (série de combats ? puzzle + combats ?) ?
- **Silver, Rocket, Elite 4** : ces combats spéciaux utilisent-ils les mêmes modes ou
  des règles à part (le PRD § arc narratif promet des « confrontations exigeant une
  vraie compréhension écrite ») ? Si règles à part : sont-elles écrites ?

## Phase 1 — Audit (lecture seule)

Ne modifie AUCUN fichier. Fais les comptes JMdict pour de vrai (script jetable
scratchpad). Classe : **A** contradiction, **B** promesse sans données, **C** promesse
sans mécanisme, **D** ambiguïté, **E** obsolète.
Rapport → `.scratch/audits/findings-07-combat.md` avec chemin:ligne et chiffres.

## Phase 2 — Grill

Invoque `/grill` sur les D — notamment : la saisie du mode Écriture, la structure
d'un combat (échec/dégâts), et le sort du mécanisme B si la couverture JMdict est
faible.

## Phase 3 — Correction immédiate

- Corrige le PRD (et guidebook-adapted si rosters incohérents) selon les décisions.
  Marque `(corrigé AAAA-MM-JJ, audit 07)`.
- Ni code, ni contenu. Hors périmètre → « Reporté à la synthèse ». Résumé final.

## Règles transverses

1. Aucun français dans le produit ; 2. CS-Kanji jamais débloqués par le SRS ;
3. Pas de theming kanji par classe de dresseur — le pool d'un dresseur suit l'ordre
pédagogique + studiedSet, jamais un thème de classe (toute trace contraire = finding) ;
4. Anglais selon mécanismes A/B/C (seule la Traduction garde l'anglais en permanence).
