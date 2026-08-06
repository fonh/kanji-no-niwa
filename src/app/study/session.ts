// Assemblage serveur de la file de session SRS (issue 06 — extrait de
// page.tsx à la revue M3) : cartes dues MAINTENANT (reviews + nouvelles,
// indistinctes en base : tout est `next_review_at <= now()`), mélangées en
// une seule file et tronquées au quota restant du plafond de rattrapage
// (200 − déjà notées ce jour local).
//
// Partagé entre la page /study (chargement) et l'action continueSession (M3 :
// une carte もういちど redevient due le jour même — la file du jour peut être
// RECHARGÉE en cours de session, la session n'est finie que file vidée).

import { sql } from '@/lib/db'
import { buildDailyQueue, localDayStart, needsWordCardPreface } from '@/lib/progression-engine'
import kanjiContent from '@/data/kanji-content.json'
import type { SessionCard } from './StudyClient'

interface KanjiContentEntry {
  keyword?: string | null
  mnemonic?: string | null
}

export interface SessionQueue {
  cards: SessionCard[]
  /** Cartes déjà notées ce jour local (reprise de session, plafond). */
  reviewedToday: number
}

export async function buildSessionQueue(
  userId: string,
  tzOffsetMinutes: number,
  now = new Date()
): Promise<SessionQueue> {
  const dayStart = localDayStart(now, tzOffsetMinutes)

  const [dueRows, reviewCountRows, reviewedWordRows] = await Promise.all([
    sql`
      select
        c.id, c.item_type, c.item_id, c.facet,
        k.meanings, k.on_readings, k.kun_readings,
        v.word, v.reading as word_reading, v.meanings as word_meanings
      from cards c
      left join kanji k on c.item_type = 'kanji' and k.id = c.item_id
      left join vocabulary v on c.item_type = 'word' and v.id = c.item_id
      where c.user_id = ${userId} and c.next_review_at <= now()
    `,
    sql`
      select count(*)::int as n from reviews
      where user_id = ${userId} and reviewed_at >= ${dayStart.toISOString()}
    `,
    // Mots ayant déjà AU MOINS une review (n'importe quelle facette) : leur
    // Carte Mot ne se re-préface plus (contrat § 8, état dérivé)
    sql`
      select distinct c.item_id from reviews r
      join cards c on c.id = r.card_id
      where r.user_id = ${userId} and c.item_type = 'word'
    `,
  ])

  const reviewedToday = (reviewCountRows[0]?.n as number) ?? 0
  const reviewedWordIds = new Set(reviewedWordRows.map(r => r.item_id as string))
  const content = kanjiContent as Record<string, KanjiContentEntry>

  const cards: SessionCard[] = buildDailyQueue(dueRows, reviewedToday).map(row => {
    const itemType = row.item_type as 'kanji' | 'word'
    const itemId = row.item_id as string
    return {
      id: row.id as string,
      item_type: itemType,
      item_id: itemId,
      facet: row.facet as 'sens' | 'lecture',
      kanji:
        itemType === 'kanji'
          ? {
              keyword: content[itemId]?.keyword ?? null,
              meanings: (row.meanings as string[]) ?? [],
              on_readings: (row.on_readings as string[]) ?? [],
              kun_readings: (row.kun_readings as string[]) ?? [],
              mnemonic: content[itemId]?.mnemonic ?? null,
            }
          : null,
      word:
        itemType === 'word'
          ? {
              word: (row.word as string) ?? '',
              reading: (row.word_reading as string) ?? '',
              meanings: (row.word_meanings as string[]) ?? [],
            }
          : null,
      needs_preface: needsWordCardPreface({ item_type: itemType, item_id: itemId }, reviewedWordIds),
    }
  })

  return { cards, reviewedToday }
}
