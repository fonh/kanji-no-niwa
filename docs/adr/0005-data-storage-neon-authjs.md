# 0005 — Stockage et auth : Neon + Auth.js (remplace Supabase)

Date : 2026-07-08. Statut : adopté.

## Contexte

Le PRD utilisait Supabase (PostgreSQL + Auth Google OAuth) comme backend unique
depuis le début du projet. En préparant la question « comment corriger le code
plus tard sans perdre ma partie ? », il est apparu que le plan gratuit Supabase
met en pause tout projet inactif après 7 jours — et que la reprise n'est **pas**
automatique : il faut cliquer « Restore » dans le tableau de bord Supabase avant
que l'app ne refonctionne. Pour une app perso ouverte par périodes, c'est un
retour d'absence cassé au pire moment. Sources : [Project Pausing — Supabase
Docs](https://supabase.com/docs/guides/platform/free-project-pausing),
[Database Backups — Supabase Docs](https://supabase.com/docs/guides/platform/backups).

Ce même constat a été fait indépendamment, le même jour, dans deux sessions
séparées :
- cette conversation (option cloud alternative) ;
- l'audit 10 (`findings-10-charnieres.md`, point 6), qui a résolu le problème en
  **quittant le cloud** : stockage local IndexedDB (source de vérité) + export
  périodique vers le Google Drive personnel du joueur (filet), Supabase gardé
  uniquement pour le contenu statique et l'auth.

Les deux sessions tournaient en parallèle sur les mêmes fichiers. L'audit 10 a
été commité tel quel (Fukuda supprimé, compagnon rouvert, pivot stockage local —
voir commit `7e5fffab`) pour ne rien perdre, puis cette décision revient
spécifiquement sur son point 6 (stockage), sans toucher aux deux autres
décisions de cette session qui n'ont aucun rapport avec le stockage.

## Décision

**Neon (PostgreSQL serverless) remplace Supabase comme base de données, et
Auth.js (NextAuth v5 + provider Google) remplace l'auth Supabase.** Une seule
base fait autorité pour tout — contenu **et** progression du joueur. Pas de
stockage local, pas de synchronisation Google Drive : le jeu nécessite une
connexion réseau pour toute écriture de progression (décision explicite avec
l'utilisateur — voir § suivante).

### Pourquoi pas le stockage local (IndexedDB + Drive) retenu par l'audit 10

C'est une solution valide qui résout le même problème, mais à un coût
structurel plus élevé pour ce projet :
- Elle demande de maintenir deux systèmes de vérité (contenu sur Supabase,
  progression en local) avec une frontière à respecter partout dans le code.
- Elle laisse un risque résiduel non résolu : l'audit 10 note lui-même que
  l'**auth** Supabase reste sujette à la même pause (même projet), donc la
  reconnexion peut casser même si la progression locale survit.
- Elle réintroduit une fenêtre de triche d'horloge (pas de serveur pour arbitrer
  « quel jour sommes-nous » — l'audit 10 l'accepte explicitement comme risque
  assumé).
- Elle demande de coder une intégration Google Drive (API, App Data folder,
  export JSON périodique) — une vraie fonctionnalité à écrire et maintenir,
  pour un filet.

### Pourquoi Neon plutôt que Supabase-avec-parade

Une option plus légère aurait été de garder Supabase et d'empêcher la pause
avec un ping périodique (cron GitHub Actions). Rejetée : ça ne résout pas le
problème, ça le maquille avec une dépendance externe de plus qui peut tomber en
panne silencieusement — le symptôme (app cassée) n'apparaît alors que des
semaines plus tard, au pire moment pour un joueur qui revient jouer 10 minutes.

### Pourquoi Neon spécifiquement

Postgres standard (même SQL, mêmes migrations que Supabase) mais sans le piège
de la pause :
- Mise en veille automatique après 5 min d'inactivité (« scale to zero »), mais
  réveil **transparent** à la connexion suivante (~100-500ms) — jamais d'action
  manuelle, jamais de tableau de bord à ouvrir.
- 6h d'historique de restauration instantanée incluses sur le plan gratuit
  (Supabase gratuit : 0h — les sauvegardes sont réservées au payant).
- Gratuit, sans limite de temps documentée pour un usage de ce volume.

Sources : [Scale to Zero — Neon Docs](https://neon.com/docs/introduction/scale-to-zero),
[Restore window — Neon Docs](https://neon.com/docs/introduction/restore-window).

Au-delà des 6h de restauration instantanée, un export manuel périodique
(`pg_dump`) reste recommandé comme filet — une pratique d'exploitation, pas une
fonctionnalité du jeu.

### Pourquoi la connexion réseau est requise (pas de mode hors-ligne)

Décision explicite avec l'utilisateur (2026-07-08) : le jeu ne cherche pas à
reproduire le hors-ligne que l'IndexedDB offrait gratuitement. Une file
d'attente locale qui rejoue les écritures vers Neon dès le retour du réseau est
possible mais ajoute de la complexité permanente (ordre des écritures, retry,
résolution de conflit) pour un bénéfice jugé secondaire ici. Sans connexion, une
Server Action échoue avec un message clair ; le contenu déjà chargé reste
consultable, rien de nouveau ne s'enregistre tant que le réseau n'est pas
revenu.

Conséquence positive : l'horloge peut redevenir serveur (`now()` Postgres pour
toute écriture datée), ce qui referme la fenêtre de triche d'horloge que
l'audit 10 avait dû accepter comme risque résiduel — voir `PRD.md` § Boucle
Quotidienne, « Jour calendaire ».

## Conséquence architecturale : RLS remplacée par vérification applicative

Supabase isolait les données par joueur via **Row Level Security**
(`auth.uid() = user_id`), appliquée automatiquement côté base — le client
navigateur pouvait donc écrire directement dans Postgres via la clé anon,
protégé par les policies. Neon n'a pas d'équivalent RLS lié à une session HTTP
et sa chaîne de connexion est une vraie créance Postgres, jamais exposable au
navigateur.

**Conséquence : plus aucun accès direct navigateur → base de données.** Toute
écriture qui passait par le client Supabase dans un composant `'use client'`
(`StudyClient`, `MapClient`, `LessonClient`, `QueueButton`) devient une **Server
Action** Next.js, qui :
1. lit la session via `auth()` (Auth.js) ;
2. dérive `user_id` de cette session — jamais d'un argument fourni par le
   client ;
3. exécute la requête SQL paramétrée (`@neondatabase/serverless`, tagged
   template `sql`) avec ce `user_id` en clause `WHERE`.

C'est le modèle standard Next.js/Postgres (pas propre à ce projet) et il est
en réalité plus strict que l'ancien modèle RLS : aucune requête ne peut plus
être forgée depuis le navigateur, même en théorie. `src/lib/auth.ts` exporte
`requireUserId()` — lit la session et lève si absente — pour que cette étape
soit un seul point centralisé plutôt que rescrite dans chaque Server Action.

**Piège Auth.js sans adaptateur base de données (trouvé et corrigé en revue,
2026-07-08) :** sans adaptateur, Auth.js **n'utilise volontairement pas**
l'id du profil OAuth pour `user.id` — il assigne un `crypto.randomUUID()`
neuf à chaque connexion (comportement documenté dans `@auth/core`, pas un
bug amont). Utiliser `user.id` comme clé stable dans `users.id` aurait donc
créé un nouveau joueur fantôme à chaque reconnexion (cookie expiré,
changement d'appareil, déconnexion/reconnexion), orphelinant toute la
progression précédente. La véritable identité stable est `profile.sub` (le
sujet OIDC de Google), disponible dans les callbacks `signIn`/`jwt` — c'est
ce que `src/lib/auth.ts` utilise, jamais `user.id`.

## Migrations de schéma

`supabase/migrations/001-006` sont squashées en une base propre
`db/migrations/001_initial_schema.sql` (schéma actuel consolidé, `users.id`
devient une clé texte — l'identifiant Google, plus de FK vers un schéma
`auth.*` propriétaire Supabase — RLS et policies retirées). Squash choisi
plutôt que rejeu historique : aucune donnée de production n'existe encore,
c'est le moment le moins cher pour repartir d'une base propre.

Workflow futur : un nouveau fichier SQL numéroté par changement de schéma,
appliqué manuellement via `psql "$DATABASE_URL" -f db/migrations/00N_nom.sql`
contre l'unique base de production. Pas d'outil de migration versionnée
(Prisma/Drizzle migrate) : projet solo, une seule base cible, l'indirection
n'apporte rien ici.

## Ce qui ne change pas

Le contenu (kanji, mots, grammaire, textes, registres de carte) reste généré
une fois par le pipeline (`scripts/import/*.ts`), jamais écrit par le joueur —
seul le domicile change (Neon au lieu de Supabase). Les scripts d'import sont
mis à jour pour pointer vers `DATABASE_URL` au lieu des variables Supabase.
