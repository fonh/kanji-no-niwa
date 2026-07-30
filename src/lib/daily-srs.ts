// Statut quotidien SRS — couche d'accès (issue 06). Le SEUL module qui parle
// à la table daily_status. Toute la règle (file vidée / plafond 200 / ✓
// acquis) vit dans src/lib/progression-engine.ts (pur, testé) ; ici on ne
// fait qu'hydrater ses entrées depuis Neon et poser le ✓ quand il est
// atteint.
//
// PRD § Jour calendaire : le jour bascule à minuit heure locale de
// l'appareil (offset client borné ±14 h par progression-engine), mais
// l'écriture qui matérialise le statut est horodatée serveur (recorded_at
// default now() Postgres — jamais une valeur client).
//
// L'issue 10 (gate d'entrée en nouvelle zone) lit getDailySRSStatusForUser.

import { sql } from '@/lib/db'
import {
  getDailySRSStatus,
  localDayKey,
  localDayStart,
  type DailySRSStatus,
} from '@/lib/progression-engine'

export type DailyStatusPath = 'session' | 'no_cards_due'

export interface DailyStatusResult extends DailySRSStatus {
  /** Chemin du ✓ posé pour ce jour (daily_status.path), null si pas encore ✓. */
  path: DailyStatusPath | null
}

async function fetchDailyInputs(userId: string, tzOffsetMinutes: number, serverNow: Date) {
  const dayKey = localDayKey(serverNow, tzOffsetMinutes)
  const dayStart = localDayStart(serverNow, tzOffsetMinutes)
  const [dueRows, reviewRows, statusRows] = await Promise.all([
    sql`
      select id, next_review_at from cards
      where user_id = ${userId} and next_review_at <= ${serverNow.toISOString()}
    `,
    // reviewed_at ne peut pas être dans le futur : >= minuit local = « du jour »
    sql`
      select reviewed_at from reviews
      where user_id = ${userId} and reviewed_at >= ${dayStart.toISOString()}
    `,
    sql`select path from daily_status where user_id = ${userId} and date = ${dayKey}`,
  ])
  return {
    dayKey,
    dueRows: dueRows as { id: string; next_review_at: string }[],
    reviewRows: reviewRows as { reviewed_at: string }[],
    recordedPath: (statusRows[0]?.path as DailyStatusPath | undefined) ?? null,
  }
}

/** Statut SRS du jour pour un joueur — lecture seule, n'écrit jamais. */
export async function getDailySRSStatusForUser(
  userId: string,
  tzOffsetMinutes: number,
  serverNow: Date = new Date()
): Promise<DailyStatusResult> {
  const { dueRows, reviewRows, recordedPath } = await fetchDailyInputs(
    userId,
    tzOffsetMinutes,
    serverNow
  )
  const status = getDailySRSStatus(
    reviewRows,
    dueRows,
    { serverNow, tzOffsetMinutes },
    recordedPath !== null
  )
  return { ...status, path: recordedPath }
}

/** Statut SRS du jour + pose du ✓ s'il vient d'être atteint (file vidée,
 * plafond 200, ou « aucune carte due » → ✓ immédiat). Idempotent : une
 * ligne par (user, jour local), `on conflict do nothing` en filet. */
export async function ensureDailyStatus(
  userId: string,
  tzOffsetMinutes: number,
  serverNow: Date = new Date()
): Promise<DailyStatusResult> {
  const { dayKey, dueRows, reviewRows, recordedPath } = await fetchDailyInputs(
    userId,
    tzOffsetMinutes,
    serverNow
  )
  const status = getDailySRSStatus(
    reviewRows,
    dueRows,
    { serverNow, tzOffsetMinutes },
    recordedPath !== null
  )
  let path = recordedPath
  if (path === null && status.sessionDone) {
    path = status.reviewedToday > 0 ? 'session' : 'no_cards_due'
    await sql`
      insert into daily_status (user_id, date, path)
      values (${userId}, ${dayKey}, ${path})
      on conflict (user_id, date) do nothing
    `
  }
  return { ...status, path }
}
