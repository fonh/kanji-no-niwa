'use server'

// Session SRS quotidienne (issue 06) — refonte du prototype.
//
// L'ancien submitReview faisait confiance au client pour l'état FSRS et le
// prochain due : ici la notation est entièrement re-calculée SERVEUR
// (ts-fsrs sur l'état stocké, horloge serveur), et reviews.reviewed_at est
// le now() Postgres par défaut — jamais une valeur client (PRD § Jour
// calendaire). Chaque note re-vérifie ensuite le statut du jour et pose le
// ✓ (daily_status) dès qu'il est atteint : file vidée ou plafond de
// rattrapage 200 (idempotent, une ligne par jour local).

import { fsrs, generatorParameters, type Card, type Grade } from 'ts-fsrs'
import { requireUserId } from '@/lib/auth'
import { sql } from '@/lib/db'
import { ensureDailyStatus, type DailyStatusResult } from '@/lib/daily-srs'
import { buildSessionQueue } from './session'
import type { SessionCard } from './StudyClient'

export type SrsRating = 1 | 2 | 3 | 4 // Encore | Difficile | Bien | Facile

export interface ContinueSessionResult {
  cards: SessionCard[]
  status: DailyStatusResult
}

/** M3 (revue jalon 1) : recharge de la file EN COURS de session. Une carte
 * notée もういちど (learning steps courts ts-fsrs) redevient due le jour
 * même : elle fait partie de la file du jour (PRD — la session est finie
 * quand la file du jour est vide), le client la re-demande ici quand sa file
 * locale est épuisée mais que le statut serveur dit « pas fini ». Le statut
 * est re-vérifié (et le ✓ posé s'il vient d'être atteint — filet idempotent). */
export async function continueSession(tzOffsetMinutes: number): Promise<ContinueSessionResult> {
  const userId = await requireUserId()
  const { cards } = await buildSessionQueue(userId, tzOffsetMinutes)
  const status = await ensureDailyStatus(userId, tzOffsetMinutes, new Date())
  return { cards, status }
}

/** Statut du jour, en re-vérifiant côté serveur et en posant le ✓ s'il
 * vient d'être atteint (dont le chemin « aucune carte due » → ✓ immédiat).
 * Appelé par l'appel du mentor (carte) et par l'écran de session. */
export async function checkDailyStatus(tzOffsetMinutes: number): Promise<DailyStatusResult> {
  const userId = await requireUserId()
  return ensureDailyStatus(userId, tzOffsetMinutes, new Date())
}

/** Note une carte (4 notes FSRS), écrit la review horodatée serveur, et
 * retourne le statut du jour mis à jour (le client sait ainsi quand la
 * session est finie — file vidée ou plafond atteint). */
export async function rateCard(
  cardId: string,
  rating: SrsRating,
  tzOffsetMinutes: number
): Promise<DailyStatusResult> {
  const userId = await requireUserId()
  const now = new Date()

  // M2 (revue jalon 1) : le rating est typé mais arrive du client — valider
  // AVANT toute écriture (sinon l'update cards part avec un grade hors
  // domaine avant que le CHECK SQL de reviews ne rejette : état incohérent).
  if (!Number.isInteger(rating) || rating < 1 || rating > 4) {
    throw new Error('Invalid rating')
  }

  const rows = await sql`
    select fsrs_state, next_review_at from cards where id = ${cardId} and user_id = ${userId}
  `
  // Carte inconnue ou pas au joueur : refuser plutôt que noter dans le vide
  if (rows.length === 0) throw new Error('Card not found')
  // M2 : seule une carte DUE se note — re-noter une carte déjà replanifiée
  // dans le futur gonflerait reviewedToday jusqu'au ✓ plafond sans traiter
  // la file. (Les cartes « Encore » redeviennent dues à leur heure : les
  // re-noter alors est légitime.)
  if (new Date(rows[0].next_review_at as string) > now) throw new Error('Card not due')

  const f = fsrs(generatorParameters())
  const { card } = f.next(rows[0].fsrs_state as Card, now, rating as Grade)

  await sql`
    update cards set fsrs_state = ${JSON.stringify(card)}, next_review_at = ${card.due.toISOString()}
    where id = ${cardId} and user_id = ${userId}
  `
  // reviewed_at : défaut now() Postgres — l'horodatage reste serveur
  await sql`
    insert into reviews (user_id, card_id, rating, new_fsrs_state)
    values (${userId}, ${cardId}, ${rating}, ${JSON.stringify(card)})
  `

  return ensureDailyStatus(userId, tzOffsetMinutes, now)
}
