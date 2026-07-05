# Audit 03 — SRS/FSRS et boucle quotidienne

Tu es une session d'audit du projet 漢字の庭 (PWA d'apprentissage du japonais construite
sur le monde de Pokémon HeartGold/SoulSilver). Phase actuelle du projet : **corriger les
documents de référence avant d'écrire le contenu** — aucun code, aucun issue tracker.
Déroulé strict : Phase 1 audit (lecture seule) → Phase 2 grill (décisions de
l'utilisateur) → Phase 3 correction immédiate des docs.

## Docs de référence

- PRD : `.scratch/kanji-no-niwa/PRD.md` — § Boucle Quotidienne, § SRS/révisions,
  § Pokégear (Fukuda), § Streak, et toute mention de FSRS ailleurs
- `content/curriculum-checkpoints.md` (flux de cartes attendu par palier)
- `content/guidebook-adapted.md` (dresseurs « ! » = carte due, dresseur spécial 1/5)
- Pour info seulement (ne pas corriger) : l'app a déjà `/study`, `/onboarding/fukuda-intro`

## Périmètre

La boucle mémoire, cœur du produit :

- **Appel de Fukuda** : premier lancement du jour → appel → accepter/refuser →
  rappel via Pokégear. Chaque branche est-elle spécifiée (refus multiple, deuxième
  lancement du jour, fuseau horaire/« jour calendaire ») ?
- **Gating** : « SRS non fait → entrer dans une nouvelle zone est bloqué ». Définition
  exacte de « nouvelle zone » (jamais visitée ? non débloquée ?), comportement aux
  frontières de la carte continue, cas « aucune carte due ».
- **FSRS** : les 4 notes (Encore/Difficile/Bien/Facile), qu'est-ce qu'une « carte »
  (kanji seul ? kanji+vocab ? les deux mélangés ?), d'où viennent les nouvelles cartes
  (leçons ?), cap de nouvelles cartes/jour, retard accumulé (backlog après absence).
- **Interaction combat↔SRS** : les dresseurs de route re-testent des cartes dues
  (« ! ») — double comptage avec la session du matin ? Une victoire note-t-elle la
  carte FSRS ou est-ce indépendant ? Le PRD doit trancher noir sur blanc.
- **Streak** : « session SRS terminée » = définition exacte (toutes les dues ? au
  moins une ?), interaction avec « aucune carte due » (jour ✓ automatique ?).
- **Cohérence de charge** : le flux de nouvelles cartes implicite (audit 01 aura posé
  les chiffres — lis son rapport `findings-01-progression.md` s'il existe) est-il
  soutenable avec une session quotidienne ?

**Interfaces à couvrir aussi :** leçons (une leçon crée-t-elle des cartes le jour
même ?), mode Sens gradué (mécanisme B : synonymes JMdict après stabilité ≥ 30j —
c'est le SEUL endroit où la stabilité FSRS a le droit d'exister comme condition ;
vérifier qu'aucun autre déblocage n'utilise la maîtrise, notamment JAMAIS les CS-Kanji).

## Phase 1 — Audit (lecture seule)

Ne modifie AUCUN fichier. Classe chaque finding : **A** contradiction interne,
**B** promesse sans données, **C** promesse sans mécanisme, **D** ambiguïté à
trancher, **E** trace obsolète.

Rapport → `.scratch/audits/findings-03-srs.md`, un finding par entrée avec
chemin:ligne. Termine par les questions D.

## Phase 2 — Grill

Invoque `/grill` sur les findings D (notamment : définition de « session terminée »,
double comptage combat/SRS, backlog après absence, cap de nouvelles cartes).

## Phase 3 — Correction immédiate

- Corrige le PRD (et curriculum-checkpoints si concerné) selon les décisions.
  Marque `(corrigé AAAA-MM-JJ, audit 03)`.
- Ni code, ni contenu. Hors périmètre → « Reporté à la synthèse » dans le rapport.
- Résumé final : corrections, décisions, reportés.

## Règles transverses

1. Aucun français dans le produit ; 2. CS-Kanji jamais débloqués par le SRS/maîtrise ;
3. Pas de theming kanji par classe de dresseur ; 4. Anglais selon mécanismes A/B/C.
