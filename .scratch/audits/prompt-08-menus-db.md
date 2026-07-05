# Audit 08 — Menus, Pokégear, Sac et modèle de données

Tu es une session d'audit du projet 漢字の庭 (PWA d'apprentissage du japonais construite
sur le monde de Pokémon HeartGold/SoulSilver). Phase actuelle du projet : **corriger les
documents de référence avant d'écrire le contenu** — aucun code, aucun issue tracker.
Déroulé strict : Phase 1 audit (lecture seule) → Phase 2 grill → Phase 3 correction
immédiate des docs.

## Docs de référence

- PRD : `.scratch/kanji-no-niwa/PRD.md` — § Menu Principal (START, 5 slots),
  § Pokégear (SELECT, 4 onglets), § Sac/Journal de lecture, § Profil, § Options,
  § Kanjidex/Carte Mot, et la table du modèle de données (toutes les tables listées)
- Migrations existantes : `supabase/migrations/001...006` (pour info : l'écart
  code/PRD n'est PAS le sujet — le sujet est la cohérence interne du PRD)
- `content/guidebook-adapted.md` § Bâtiments récurrents, § Musique

## Périmètre

De l'énumération systématique — c'est l'audit « rien d'oublié » :

- **Chaque écran promis, champ par champ** : pour START (図鑑/Leçons/Sac/Profil/
  Options) et Pokégear (Téléphone/Carte/Radio/Grammaire), liste ce que l'écran
  affiche d'après le PRD, et vérifie que chaque donnée affichée existe dans le
  modèle de données du PRD (table + champ). Tout affichage sans table = finding.
- **Profil** : les 4 progressions promises (Silver 6, Rocket 3, Kimono 5,
  Légendaires 3) — le PRD § modèle de données a-t-il ces tables ? Badges,
  stats, achievements : idem.
- **Kanjidex/Carte Mot** : « registre séparé » avec anglais permanent — champs
  requis présents ? Distinction claire avec les écrans de gameplay ?
- **Radio** : « émissions d'Oak, radio d'ambiance » — spécifié au point de pouvoir
  écrire le contenu (liste des émissions, déclencheurs) ou vœu pieux ? Croise avec
  la carte EXPN/Flûte Poké (réveil du Ronflex — la radio a désormais un rôle de
  gameplay, le § Pokégear le reflète-t-il ?).
- **Pokégear Carte** : « carte Johto complète, vue globale » ↔ voyage rapide 飛
  (« tap sur une ville visitée ») — même écran ? Deux ? Le PRD § CS-Kanji et le
  § Pokégear se répondent-ils ?
- **Sac** : catégories (Apricorns — le système Kurt complet du guidebook-adapted —,
  CS-Kanji, objets de quête, Journal de lecture) ↔ tables. L'Arrosoir et la carte
  EXPN ont-ils leur place ?
- **Boutons/navigation** : START/SELECT sont décrits § Interface — chaque surface
  a-t-elle un chemin d'entrée ET de sortie défini (B ferme ?) ?
- **Musique** : le mapping § Musique du guidebook-adapted a-t-il un mécanisme côté
  PRD (assets, déclencheurs par zone) ou est-ce orphelin ?

## Phase 1 — Audit (lecture seule)

Ne modifie AUCUN fichier. Produis la matrice écran×données complète. Classe :
**A** contradiction, **B** promesse sans données, **C** promesse sans mécanisme,
**D** ambiguïté, **E** obsolète.
Rapport → `.scratch/audits/findings-08-menus-db.md` avec chemin:ligne.

## Phase 2 — Grill

Invoque `/grill` sur les D — notamment le sort des surfaces sous-spécifiées
(Radio, Options) : les spécifier maintenant ou les couper du v1 explicitement.

## Phase 3 — Correction immédiate

- Corrige le PRD (écrans + modèle de données) selon les décisions. Marque
  `(corrigé AAAA-MM-JJ, audit 08)`.
- Ni migration, ni code. Hors périmètre → « Reporté à la synthèse ». Résumé final.

## Règles transverses

1. Aucun français dans le produit (les noms d'écrans/labels promis par le PRD
doivent être japonais ou anglais pédagogique — vérifier) ; 2. CS-Kanji jamais
débloqués par le SRS ; 3. Pas de theming kanji par classe ; 4. Mécanismes A/B/C
(Kanjidex = registre séparé avec anglais permanent, c'est l'exception voulue).
