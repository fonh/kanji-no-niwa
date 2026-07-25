# 05 — 186 kanji sur 2136 n'ont aucune leçon ; 876 mots kana-only et 302 mots hors-joyo sans règle

Status: ready-for-human

Trouvé par la simulation FSRS (revue B1, 2026-07-25) en croisant
`content/lessons-proposal.json` (1950 kanji sur 344 leçons) contre les 2136 de
`content/kanji-zone-assignment.json` et les 8113 mots yomitan.

## Constats

1. **186 kanji assignés mais enseignés nulle part** : l'assignation couvre 2136 kanji,
   les leçons s'arrêtent à 1950 (la Ligue et le Mont Gris sont des « plateaux de
   calibration, sans leçons » — voulu pour le *rythme*, mais aucun autre canal
   d'introduction n'existe : PRD § Leçons, « les nouveaux kanji n'entrent en jeu QUE par
   les leçons »). Conséquence mécanique : ces 186 kanji ne sont jamais « étudiés », ne
   rejoignent jamais le SRS, le Kanjidex plafonne à 1950/2136, et tout gate/achievement
   « 2136 » est inatteignable.
2. **876 mots JLPT kana-only** (きっと, やはり…) : la règle de déblocage (« tous les
   kanji du mot étudiés ») ne peut jamais s'appliquer — aucun kanji. Aucune règle au PRD.
3. **302 mots JLPT contenant un kanji hors des 2136** : jamais débloquables.

## Options (décision de scope — lien direct avec D5 du plan de revue « 2136, le bon
objectif ? »)

- **1a.** Ajouter ~30-38 leçons de fin de jeu pour les 186 kanji (Mont Gris/route-28 en
  portent déjà 80 au comptage figé — vérifier le recouvrement ; le reste en leçons
  post-game, ex. parchemins du dōjō de la Trainer House). Coût contenu réel, cohérence
  « 2136 » préservée.
- **1b.** Assumer 1950 comme cible d'étude : les 186 restants existent en Kanjidex comme
  « rencontrés en lecture seulement », les achievements passent de 2136 à 1950. Zéro
  contenu, mais le titre « 2136 » du PRD devient une borne de consultation, pas d'étude.
- **2.** Mots kana-only : règle simple à écrire au PRD — débloqués par palier JLPT quand
  le joueur atteint le palier (goutte-à-goutte plafonné, cohérent avec l'issue 04-A).
- **3.** Mots hors-joyo : les retirer de la file SRS potentielle (liste de 302 à exclure
  au pipeline) ou les rattacher à la décision 1a/1b.

Recommandation : 1a si l'objectif affiché (« lire des textes authentiques, 2136 kanji »)
reste la promesse du jeu ; sinon 1b assumé et documenté. 2 et 3 sont mécaniques et
peuvent passer en ready-for-agent dès que 1 est tranché.
