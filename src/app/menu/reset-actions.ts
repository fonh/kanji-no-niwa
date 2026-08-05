'use server'

// Effacement de la partie (issue 13, écran せってい).
//
// Deux choses volontairement distinctes : la PARTIE et le COMPTE. On efface la
// partie — progression, cartes SRS, historique de révisions, lectures, combats,
// nom et avatar du dresseur — mais pas la ligne `users`, qui porte l'identité
// Google. Supprimer cette ligne ferait cascader les mêmes tables ET casserait
// la session en cours ; le joueur serait recréé au prochain chargement, sans
// que rien de plus ait été effacé. Ne rien gagner pour un risque en plus.
//
// Après effacement, `trainer_name` et `avatar` sont nuls : `isOnboarded()`
// renvoie faux et la page d'accueil renvoie sur /onboarding, exactement comme
// un compte neuf.

import { requireUserId } from '@/lib/auth'
import { sql } from '@/lib/db'

export interface ResetResult {
  ok: boolean
}

// Les effacements sont écrits un par un, pas générés depuis une liste de noms
// de tables : le client SQL de ce projet ne compose pas d'identifiants, et une
// suppression est exactement le genre de requête qu'on veut pouvoir relire
// telle qu'elle part. `reviews` avant `cards` (la clé étrangère va dans ce
// sens) ; le reste ne dépend que de `users`.
//
// À TENIR À JOUR : toute nouvelle table portant un `user_id` doit être ajoutée
// ici. Un oubli laisserait des données derrière une action qui promet le
// contraire — `reset-actions.test.ts` compare cette liste au schéma.
export async function resetPlayerData(): Promise<ResetResult> {
  const userId = await requireUserId()

  await sql`delete from reviews             where user_id = ${userId}`
  await sql`delete from cards               where user_id = ${userId}`
  await sql`delete from user_map_state      where user_id = ${userId}`
  await sql`delete from npc_quest_progress  where user_id = ${userId}`
  await sql`delete from daily_status        where user_id = ${userId}`
  await sql`delete from battle_results      where user_id = ${userId}`
  await sql`delete from text_completions    where user_id = ${userId}`
  await sql`delete from grammar_encounters  where user_id = ${userId}`

  await sql`
    update users
       set trainer_name = null,
           avatar       = null,
           queued_kanji = '{}',
           map_zone     = default,
           map_x        = default,
           map_z        = default,
           map_progress = '{}'
     where id = ${userId}
  `
  return { ok: true }
}
