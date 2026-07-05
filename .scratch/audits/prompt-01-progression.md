# Audit 01 — Économie de progression (le compte doit fermer)

Tu es une session d'audit du projet 漢字の庭 (PWA d'apprentissage du japonais construite
sur le monde de Pokémon HeartGold/SoulSilver). Phase actuelle du projet : **corriger les
documents de référence avant d'écrire le contenu** — aucun code, aucun issue tracker.
Ton déroulé est strict : Phase 1 audit (lecture seule) → Phase 2 grill (décisions de
l'utilisateur) → Phase 3 correction immédiate des docs.

## Docs de référence

- PRD : `.scratch/kanji-no-niwa/PRD.md`
- `content/curriculum-checkpoints.md` (paliers kanji/grammaire par zone)
- `content/guidebook-adapted.md` (zone par zone : PNJ, dresseurs, beats)
- `content/npc-inventory.md` (inventaire exhaustif des PNJ par zone)
- Vérité factuelle du jeu d'origine : `scripts/sources/guidebook/johto-guide-fulltext.txt`
  et `kanto-guide-fulltext.txt`

## Périmètre

L'**arithmétique de la progression**, de bout en bout :

- Budget total : 2136 kanji Jōyō. L'arc Johto ↔ Kanto ↔ Mont Gris (le PRD mentionne
  1500→2000 pour Kanto, 2000→2136 compressé pour Mont Gris) — les paliers de
  `curriculum-checkpoints.md` somment-ils exactement à 2136, sans trou ni chevauchement ?
- Paliers par zone ↔ ordre des zones du PRD (§ La Carte de Johto) : chaque zone de
  l'ordre a-t-elle un palier ? Chaque palier a-t-il une zone ? L'ordre est-il le même
  dans les deux docs ?
- Densité : pour chaque zone, (kanji du palier) ÷ (PNJ-leçons disponibles dans
  npc-inventory + inventés autorisés) donne-t-il une charge réaliste par PNJ-leçon ?
  Signale toute zone où il faudrait inventer une majorité de PNJ (le guidebook est censé
  être la source principale).
- Grammaire : les points Hanabira (N5→N1) répartis dans curriculum-checkpoints
  couvrent-ils tous les fichiers `scripts/sources/grammar_JLPT_N*.json` ? Compte réel
  des entrées disponibles vs promises.
- Rythme joueur : avec la boucle quotidienne du PRD (1 session SRS/jour + leçons),
  combien de jours pour finir le jeu ? Ce chiffre est-il cohérent avec ce que le PRD
  promet implicitement ?

**Interfaces à couvrir aussi :** ce que la progression promet aux leçons (taille des
batchs), au SRS (flux de cartes nouvelles/jour), et aux gyms (jalon = niveau atteint).

## Phase 1 — Audit (lecture seule)

Ne modifie AUCUN fichier. Fais les comptes réellement (scripts jetables Python dans le
scratchpad autorisés pour compter les entrées des JSON/MD). Classe chaque finding :

- **A. Contradiction interne** (deux docs ou deux sections se contredisent)
- **B. Promesse sans données** (la source ne contient pas assez d'entrées)
- **C. Promesse sans mécanisme** (rien ne définit comment c'est censé marcher)
- **D. Ambiguïté à trancher** (plusieurs lectures possibles — question pour le grill)
- **E. Trace obsolète** (résidu d'une décision remplacée)

Écris le rapport dans `.scratch/audits/findings-01-progression.md` : un finding par
entrée, avec citation courte + chemin:ligne des passages concernés, et les chiffres de
tes comptes. Termine par la liste des questions D à trancher.

## Phase 2 — Grill

Invoque la skill `/grill` sur tes findings de type D et sur toute correction qui n'est
pas purement factuelle. Interroge l'utilisateur jusqu'à ce que chaque décision soit
nette. Ne passe en phase 3 qu'après.

## Phase 3 — Correction immédiate

- Corrige uniquement les docs de référence (PRD, curriculum-checkpoints,
  guidebook-adapted, npc-inventory) selon les décisions du grill + les findings A/E
  factuels. Marque chaque correction `(corrigé AAAA-MM-JJ, audit 01)`.
- Ne touche ni au code, ni aux données générées, ni aux autres docs hors périmètre.
- Ce qui impacte un autre domaine : note-le dans le rapport, section
  « Reporté à la synthèse », sans le corriger.
- Termine par un résumé : corrections appliquées, décisions prises, points reportés.

## Règles transverses (à vérifier au passage dans ton périmètre)

1. Aucun français dans le produit (le français est réservé aux docs internes)
2. Les CS-Kanji ne sont JAMAIS débloqués par le SRS ou la maîtrise — remis par PNJ/trouvés
3. Pas de theming kanji par classe de dresseur — ordre pédagogique pur (voir mémoire projet)
4. L'anglais suit les mécanismes A/B/C du PRD § Langue du Jeu
