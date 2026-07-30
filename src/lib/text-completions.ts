// DAL fin des complétions de textes (issue 08) — le SEUL module qui LIT
// text_completions (l'écriture vit dans src/app/text/actions.ts,
// idempotente). L'issue 09 (Journal de lecture, どくしょノート) consomme
// getTextCompletions pour lister blanc/doré.

import { sql } from '@/lib/db'

export interface TextCompletionRow {
  text_id: string
  /** % de questions réussies en première tentative (0..100). */
  score: number
  completed_at: string // ISO 8601
  gold_at: string | null // ISO 8601, null tant qu'aucune passe sans faute
}

function rowToCompletion(row: Record<string, unknown>): TextCompletionRow {
  return {
    text_id: row.text_id as string,
    score: row.score as number,
    completed_at: new Date(row.completed_at as string).toISOString(),
    gold_at: row.gold_at ? new Date(row.gold_at as string).toISOString() : null,
  }
}

/** Toutes les complétions d'un joueur (Journal de lecture, issue 09). */
export async function getTextCompletions(userId: string): Promise<TextCompletionRow[]> {
  const rows = await sql`
    select text_id, score, completed_at, gold_at
    from text_completions
    where user_id = ${userId}
    order by completed_at
  `
  return rows.map(rowToCompletion)
}

/** La complétion d'un texte précis ; null si jamais complété. */
export async function getTextCompletion(
  userId: string,
  textId: string
): Promise<TextCompletionRow | null> {
  const rows = await sql`
    select text_id, score, completed_at, gold_at
    from text_completions
    where user_id = ${userId} and text_id = ${textId}
  `
  return rows[0] ? rowToCompletion(rows[0]) : null
}
