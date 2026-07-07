# Audits de cohérence du PRD — mode d'emploi

## Statut final (2026-07-07, audit 09 — synthèse)

**PRD prêt pour l'écriture du contenu : OUI.** Les 9 audits sont terminés. Tous les reportés
sont soldés, les 11 dernières décisions de design ont été tranchées au grill de la synthèse
(dresseurs inventés abandonnés, arc Silver Kanto sourcé, trophée Antre défini, compagnon =
Pikachu cosmétique, périmètre téléphone/radio, F-A/F-B/F-C, redistribution des 83 zones,
keigo en mini-jeu — détail : `findings-09-synthese.md` § 5), et les chiffrages sont posés
(table de calibration à 83 zones, seuils N des CS-Kanji, ¥, pool audio, tirage pondéré).

**Restes connus (n'empêchent pas d'écrire le contenu — liste complète : findings-09 § 6)** :
la **passe contenu** (scripts radio, lettres Fukuda, micro-lignes de quêtes, dénombrements
guidebook, sections npc-inventory des 11 zones réintégrées, re-calcul des seuils N au
placement réel), la **passe assets** (tile-authoring, sprite follower Pikachu, mapping
musique identité, batch VOICEVOX), et 2 points de code/data (prompt français de
generate-etymology.py, 3 kanji sans audio). Explicitement hors v1 : Battle Frontier et la
fonction de transfert du Pal Park — rien d'autre.

---

**Objectif de la phase (atteint) :** rendre le PRD et les docs de référence 100% cohérents
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
