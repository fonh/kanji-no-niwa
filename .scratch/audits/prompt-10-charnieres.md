# Audit 10 — Les charnières (jamais auditées)

Tu es une session d'audit du projet 漢字の庭 (PWA d'apprentissage du japonais construite
sur le monde de Pokémon HeartGold/SoulSilver). Phase actuelle du projet : les audits
01-09 ont rendu le PRD et les docs de référence cohérents **système par système**
(progression, SRS, combat, menus, PNJ, textes, leçons, modèle de données). Personne n'a
encore audité ce qui se passe **entre** les systèmes — les enchaînements, les transitions,
les cas limites d'UX qui ne rentrent dans aucune des 8 catégories précédentes.
C'est la dernière porte avant la couche de données et le contenu (voir
`.scratch/audits/roadmap-pre-code.md`, Étape 1). Déroulé strict : Phase 1 audit
(lecture seule) → Phase 2 grill → Phase 3 correction immédiate des docs.

## Docs de référence

- PRD complet : `.scratch/kanji-no-niwa/PRD.md`
- `content/guidebook-adapted.md` (bootstrap Fukuda, tutoriel de marche, scènes d'ouverture
  Bourg Geon, Kimono gauntlet, séquence Elm/Pikachu)
- `content/curriculum-checkpoints.md` (table de calibration, ordre des zones)
- `docs/adr/0001-0004` (conventions déjà actées — Condition/Effect, npc multi-zones, etc.)
- `.scratch/audits/findings-09-synthese.md` § 7 (flag FV-1 à traiter ici)
- Recherche web autorisée et attendue pour les références HGSS exactes (comme aux
  audits précédents) — mais toute décision de design reste à trancher par l'utilisateur
  au grill, pas par la source HGSS seule.

## Périmètre — 10 charnières, aucune n'a de section PRD dédiée aujourd'hui

1. **Séquence d'ouverture, minute par minute.** Écran titre → « nouvelle partie » →
   choix de l'avatar (garçon/fille, Ethan/Lyra comme HGSS) → **saisie du nom du
   joueur** (en quel alphabet ? le nom réapparaît dans des dialogues japonais —
   kana imposés, romaji converti à la volée, ou clavier libre avec les risques que
   ça implique pour le rendu ?) → réveil dans la chambre → Mom → Elm → remise du
   Pikachu → dōjō Fukuda → première leçon → première session SRS → Route 29.
   Écrire l'enchaînement bout à bout, écran par écran, avec ce qui bloque le
   joueur à chaque étape (peut-il skip ? revenir en arrière ?).
2. **Défaite et interruption.** Écran/flux affiché quand les vies sont épuisées en
   combat (pas de blackout façon HGSS — nos combats sont rejouables sans cooldown,
   mais le PRD ne décrit pas l'écran de défaite lui-même). Cas du **combat de Red**
   (100 questions, ~30-45 min) et de l'**Elite Four** (70 questions × 4 + Lance) :
   fermer l'app en plein milieu fait quoi ? Reprise à l'endroit exact, reprise au
   début du combat, abandon avec pénalité, pause explicite ? Sauvegarde-t-on l'état
   mi-combat ?
3. **Typographie japonaise.** Une police pixel rétro (esthétique overworld voulue)
   ne peut pas rendre lisiblement un kanji N1 complexe (鬱, 響…) ni des furigana à
   taille lisible. Trancher une stratégie à deux fontes : laquelle pour l'overworld
   (pixel jp — Misaki/PixelMplus ou équivalent), laquelle pour dialogues/leçons/
   lecture (lisible, avec furigana), taille minimale de furigana en px/rem. À
   trancher avant tout mockup (dépendance de l'Étape 3 de la roadmap).
4. **Clavier romaji→kana.** Spec du composant utilisé par le mode Saisie, la dictée
   et le Kanji Sprint : cas limites ん (avant voyelle/n/consonne), doublement de
   consonne っ, petits ゃゅょ, allongement ー, séquence "nn" vs "n'", comportement
   de la correction en cours de frappe (affiche-t-on le romaji brut, la conversion
   en direct, une zone d'erreur ?), gestion des fautes de frappe (tolérance ?).
5. **Chaînes système.** はい／いいえ, confirmations, messages d'erreur, écrans de
   sauvegarde, états de chargement — une string table UI à part des dialogues
   narratifs. Langue : jp seul, jp+furigana, ou jp avec bascule X=en comme les
   quêtes (SV-9/FC) ? Où vit cette table dans le modèle de données ?
6. **Sauvegarde et synchronisation.** PWA offline-first ? Le compte Google implique
   une sync multi-appareils potentielle : que se passe-t-il si le joueur avance sur
   2 appareils le même jour (conflit d'état) ? Y a-t-il un export/backup manuel ?
   Le SRS, le streak et les `time_window` (appels téléphoniques, revanches hebdo)
   dépendent du jour calendaire local — triche d'horloge (changer l'heure du
   téléphone) : ignorée, détectée, sans conséquence ?
7. **Accessibilité minimale.** Distinction blanc/doré des tuiles Kanjidex pour
   daltoniens (faut-il une forme en plus de la couleur ?), taille de texte
   réglable, comportement des modes audio (Écoute, Radio, Buena) si le téléphone
   est en silencieux ou casque débranché en plein appel 即時応答.
8. **Cérémonies.** Remise de badge, fanfare CS-Kanji, achievement débloqué,
   passage d'une tuile Kanjidex au doré — ce sont des micro-scènes déclenchées par
   des `Effect` déjà modélisés, mais leur habillage écran n'est décrit nulle part.
   Définir un gabarit commun (durée, éléments affichés, interruptible ou non) à
   appliquer partout plutôt que de le réinventer zone par zone.
9. **Fin de partie.** Hall of Fame (équivalent thématique), crédits, écran
   post-Red, la 3ᵉ visite chez Oak qui donne une récompense (mentionnée en passant
   au PRD/guidebook mais jamais mise en séquence) — l'épilogue n'a pas de scène
   écrite bout en bout.
10. **Flag FV-1 (hérité, à trancher ici) :** le gate Suicune exige le Trophée de
    l'Antre (lecture N1 en registre classique) vers ~1350 kanji étudiés, alors que
    le palier N1 « normal » n'arrive qu'à ~1670. Pic de difficulté assumé tel quel,
    ou amorti à l'écriture de l'inscription (furigana Y systématiques + retry
    illimité existent déjà comme filet) ?

## Phase 1 — Audit (lecture seule)

Pour chacune des 10 charnières : que dit le PRD aujourd'hui (rien, un fragment, une
contradiction) ? Quelles décisions bloquent un développeur ou un rédacteur de contenu
demain matin ? Classe en **A** décision de design pure (aucune réponse "correcte",
juste un choix) ou **B** point technique tranchable sans grill (convention à documenter).
Rapport → `.scratch/audits/findings-10-charnieres.md` avec chemin:ligne pour chaque
fragment existant trouvé.

## Phase 2 — Grill

Invoque `/grill` sur tous les points **A**. Ce sont des choix de design produit, pas
des faits vérifiables par recherche web — l'utilisateur doit trancher chacun.

## Phase 3 — Correction immédiate

- Écris chaque décision dans le PRD (nouvelle section dédiée si besoin, ex.
  § Séquence d'ouverture, § Typographie, § Clavier Saisie, § Sauvegarde) ou dans
  `content/guidebook-adapted.md` selon la nature. Marque
  `(décidé AAAA-MM-JJ, audit 10)`.
- Résous le flag FV-1 dans `findings-09-synthese.md` § 7 (marque-le soldé, renvoie
  vers la nouvelle section PRD).
- Mets à jour `.scratch/audits/roadmap-pre-code.md` : coche/retire l'Étape 1 une
  fois toutes les charnières tranchées, et signale si une décision ouvre un nouveau
  chantier de données (ex. table `ui_strings`, table `save_conflicts`…) à ajouter à
  l'Étape 2.
- Résumé final à l'utilisateur : les 10 décisions prises, ce qui reste ouvert le
  cas échéant, et confirmation que l'Étape 1 de la roadmap est soldée.

## Règles transverses

1. Aucun français dans le produit (cf. décision F-B, synthèse : noms/labels en
   japonais officiel, X = anglais). 2. Ne pas réinventer une mécanique déjà tranchée
   ailleurs (compagnon = Pikachu cosmétique, journal de quêtes = ぼうけんノート,
   etc.) — ces charnières s'articulent AVEC l'existant, ne le remplacent pas.
   3. Fidélité HGSS par défaut (feedback_hgss_fidelity) : n'invente une mécanique
   que si HGSS n'a strictement aucun équivalent (ex. saisie du nom en romaji —
   sujet inédit, pas de précédent HGSS puisque le jeu d'origine n'a pas de mode Saisie).
