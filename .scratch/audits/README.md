# Audits de cohérence du PRD — mode d'emploi

**Objectif de la phase actuelle :** rendre le PRD et les docs de référence 100% cohérents
**avant** d'écrire le contenu, et bien avant tout code ou issue tracker.

## Lancement

Un audit = un nouveau terminal avec une session Fable 5 vierge. Dans le terminal :

```
claude
> Lis et exécute .scratch/audits/prompt-01-progression.md
```

Chaque prompt est autonome (contexte, fichiers à lire, phases). Déroulé imposé par
chaque prompt : **audit (lecture seule) → grill (tes décisions) → correction immédiate
des docs**. Aucune issue n'est créée, aucun code n'est touché.

## Ordre — séquentiel, pas en parallèle

Les phases de correction modifient le PRD et les docs partagés : deux sessions en
parallèle se marcheraient dessus. Lance-les **une par une, dans cet ordre** (du plus
structurant au moins risqué) :

1. `prompt-01-progression.md` — l'économie de progression (le compte des 2136 kanji doit fermer)
2. `prompt-02-condition-effect.md` — le modèle Condition/Effect face à tous les cas narratifs
3. `prompt-03-srs.md` — SRS/FSRS et boucle quotidienne
4. `prompt-04-pnj-dialogues.md` — PNJ, dialogues, règles de langue
5. `prompt-05-textes.md` — textes progressifs et condition de lecture des CS-Kanji
6. `prompt-06-lecons.md` — leçons (écran-livre, batchs, ordre)
7. `prompt-07-combat.md` — modes de combat et dresseurs
8. `prompt-08-menus-db.md` — menus, Pokégear, Sac, et schéma de données
9. `prompt-09-synthese.md` — **en dernier, obligatoire** : croise les 8 rapports,
   traque les contradictions introduites par les corrections elles-mêmes

## Sorties

- Chaque audit écrit son rapport dans `.scratch/audits/findings-0N-<nom>.md`
- Les corrections sont faites directement dans les docs, marquées `(corrigé AAAA-MM-JJ, audit 0N)`
- Ce qui déborde du périmètre d'un audit est noté dans son rapport, section
  « Reporté à la synthèse » — jamais corrigé hors périmètre
