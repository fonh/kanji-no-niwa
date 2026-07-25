# 06 — Simulation rétention grammaire : le mécanisme hors-SRS ne suffit que 3-4 mois

Status: ready-for-human

Simulation (revue B2, 2026-07-25) : `scripts/analysis/simulate-grammar-retention.py` —
693 points assignés sur les 60 zones, 307 combats réels (battle_length), rotation
plus-anciens-d'abord + boost 14 jours implémentés, 5 graines, 12 mois, variante corpus
écrit (435 points).

## Constats

1. **Le débit est le problème, pas la priorité.** Rotation et boost distribuent bien
   (aucun point n'est jamais tiré zéro fois) mais ne créent aucun débit : en régime
   permanent (après la fin du contenu, jour ~171), 1 revanche/jour × 15 questions × 15 %
   de poids grammaire = **2,2 questions grammaire/jour pour un pool de 693 points** —
   intervalle d'équilibre ~300 jours. Le boost est cosmétique (×1, ×3, ×10 : même
   couverture à ±0,3 point).
2. **Avec une courbe d'oubli raisonnable (60 j sans re-vue = perdu)** : premières pertes
   au mois 3, **47 % du pool perdu à la fin de Johto (M6)**, 95 % au M8, 100 % au M11.
   Le corpus réellement écrit (435 points) ne décale l'effondrement que d'un mois.
3. **Aucun réglage réaliste ne comble le facteur 10** : couvrir 693 points 1×/mois exige
   ≥23 questions grammaire/jour ; il en existe 2,2. Seul « poids grammaire triplé + 8
   combats/jour » (≈120 questions/jour, violant la table des poids ET la règle « au plus
   1 appel de dresseur/jour ») atteint 98 %.
4. **Le SRS refusé par le PRD réglerait tout pour presque rien** : les 693 points en
   FSRS ≈ **12,3 révisions/jour en moyenne (pic 44), ~5-6 min/jour**, ~zéro point perdu.
   Le manque à gagner du refus est donc : 100 % du pool franchit le seuil d'oubli, contre
   ~0, pour 12 révisions/jour économisées.

## Décision à prendre (elle renverse « La grammaire n'est PAS dans le SRS », tranché au grill)

- **Option A (recommandée) — la grammaire entre au SRS**, en cartes légères : 1 carte
  cloze par point (l'exemple Hanabira à trou, la réponse est le motif — le composant de
  saisie existe), notée FSRS comme le reste. +12 rev/jour absorbables, surtout si le
  plafond de mots de l'issue 04 est adopté (les deux décisions se compensent). Les modes
  de combat Grammaire/Conjugaison/M17-M18 restent tels quels — ils deviennent la
  *pratique en contexte*, le SRS assure la *rétention* : c'est exactement la répartition
  kanji/combat déjà actée ailleurs.
- **Option B — hybride fenêtre + graduation** : pool de combat plafonné aux N derniers
  paliers (97 % de couverture locale mesurée), et un point qui SORT de la fenêtre entre
  au SRS. Préserve la lettre du refus, complexité en plus, même coût final.
- **Option C — statu quo assumé** : documenter que la grammaire s'apprend puis s'oublie
  hors des ~100 points récents, et que les combats la testent sans la retenir. Défendable
  seulement si l'objectif grammaire du jeu est l'exposition, pas la rétention.

Rapports archivés par la simulation ; scripts rejouables (`--written` pour la variante
corpus écrit).
