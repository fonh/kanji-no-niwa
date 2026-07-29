# 09 — Menu START minimal (Carnet de leçons, Journal de quêtes, Sac, Kanjidex)

Status: ready-for-agent
Bloqué par: 05, 08 (soft — les écrans listent leurs données)
Bloque: —

## Contexte

PRD § Menu Principal. Rien n'existe (le prototype `explorer/` fait office de Kanjidex
hors de tout menu). Au jalon 1 il faut le squelette du menu et 4 écrans utiles au
parcours A1 ; les slots non implémentés existent mais grisés.

## Périmètre (vertical slice)

- **Overlay START** : 6 slots, labels japonais VO (図鑑・レッスン・バッグ・プロフィール・
  ぼうけんノート・せってい), navigation D-pad + A, **B = retour d'un niveau,
  re-appui START = fermeture directe** (PRD § Navigation des surfaces). プロフィール et
  せってい présents mais grisés (hors jalon).
- **図鑑 Kanjidex** : rebrancher `explorer/` + fiche kanji dans le menu (grille,
  unseen/studied/mastered dérivé des cartes — code existant à adapter au schéma étendu).
- **レッスン Carnet de leçons** (CONTEXT.md « Lesson Book ») : `getLessonBook` —
  chapitres = zones visitées + compteur 「3/7」 ; complétée → relecture (écran-livre sans
  quiz) ; prochaine → qui et où seulement ; suivantes → ???. **Combler le trou connu** :
  distinguer visuellement « prochaine leçon disponible » de « verrouillée par
  `unlock_conditions` » (roadmap-pre-code, Étape 3 point 2 — le PNJ affiché mais la
  mention claire qu'il n'est pas encore prêt).
- **ぼうけんノート Journal de quêtes** : quêtes en cours — nom, `steps[].label` de
  l'étape courante, zone cible ; jp affiché, X = en.
- **バッグ Sac** : inventaire par catégorie (les items de quête du jalon : pokegear,
  mystery_egg…) + onglet **どくしょノート Journal de lecture** (CONTEXT.md) : textes des
  zones débloquées — lus (blanc/doré, rouvrables), non-lus grisés avec indice du porteur.
- SELECT inerte avant la remise du Pokégear ; START fonctionne dès le début (PRD).

## Critères d'acceptation

- Pendant la course chez Mr. Pokémon, le Carnet montre les leçons 1-2 complétées et la
  #3 verrouillée-avec-mention ; le Journal de quêtes montre l'étape courante de
  `mystery_egg_errand` ; le Sac montre l'œuf ; le Journal de lecture montre lyra_mail.
- Tests : `getLessonBook` (états, zones, verrouillage), navigation B/START (test .tsx).
