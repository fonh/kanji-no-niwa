# Audits de cohérence du PRD — mode d'emploi

## Statut (2026-07-08, après l'audit 10 et son grill)

**Toutes les décisions de design sont prises — le PRD est prêt pour la couche de données
et le contenu.** Les audits 01-09 ont rendu le PRD et les docs de référence 100% cohérents
**système par système** (progression, SRS, combat, menus, PNJ, textes, leçons, modèle
de données) — tous les reportés soldés, les 11 décisions de design de la synthèse
tranchées, les chiffrages posés (table de calibration à 83 zones, seuils N des
CS-Kanji, ¥, pool audio, tirage pondéré), la passe de vérification post-synthèse
appliquée (10 reliquats corrigés, `findings-09-synthese.md` § 7).

**L'audit 10** a soldé les enchaînements *entre* les systèmes jamais couverts (séquence
d'ouverture, défaite/interruption, typographie jp, chaînes système, sauvegarde/sync,
accessibilité, cérémonies, fin de partie, flag FV-1) — voir `findings-10-charnieres.md`
pour le détail des 10 décisions. Deux décisions plus larges ont émergé pendant le grill et
ont été écrites dans la même session : **suppression de Fukuda** (le rôle de mentor
quotidien est repris par Elm puis le Pr. Chen/Oak, personnages déjà sourcés) et **pivot
d'architecture pour la progression du joueur uniquement** (IndexedDB local + filet Google
Drive ; Supabase reste le domicile du contenu statique et de l'auth, code déjà en place,
aucune réécriture). Le chemin complet jusqu'au premier jalon de code est détaillé dans
`roadmap-pre-code.md` (Étape 1 soldée ; couche de données, gabarits + tranche verticale,
passe contenu industrielle, petits restes techniques épars restent à faire). Hors v1,
définitivement : Battle Frontier et la fonction de transfert du Pal Park — rien d'autre.

---

**Objectif de la phase :** rendre le PRD et les docs de référence 100% cohérents et
complets **avant** d'écrire le contenu, et bien avant tout code ou issue tracker.

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
9. `prompt-09-synthese.md` — croise les 8 rapports, traque les contradictions
   introduites par les corrections elles-mêmes
10. `prompt-10-charnieres.md` — **en dernier, avant d'écrire le contenu** : les
    enchaînements entre systèmes jamais audités (voir `roadmap-pre-code.md`
    Étape 1) — séquence d'ouverture, défaite/interruption, typographie,
    clavier romaji, sauvegarde/sync, accessibilité, cérémonies, fin de partie

## Sorties

- Chaque audit écrit son rapport dans `.scratch/audits/findings-0N-<nom>.md`
- Les corrections sont faites directement dans les docs, marquées `(corrigé AAAA-MM-JJ, audit 0N)`
- Ce qui déborde du périmètre d'un audit est noté dans son rapport, section
  « Reporté à la synthèse » — jamais corrigé hors périmètre
