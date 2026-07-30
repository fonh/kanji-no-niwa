// Boucle quotidienne SRS (issue 06) — critères d'acceptation, DB en mémoire
// (DATABASE_URL absent ici) :
//   Jour J : leçon complétée → 12 cartes dues DEMAIN → 0 due aujourd'hui →
//   ✓ immédiat (path no_cards_due). Jour J+1 (injection d'horloge, jamais
//   l'heure système) : les 12 cartes sont dues, la session les épuise,
//   ✓ posé, daily_status écrit — et le tout idempotent.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildNewCards, nextMorningDue } from '@/lib/lessons'
import { getLessonsForZone } from '@/lib/content'

const requireUserIdMock = vi.hoisted(() => vi.fn(async () => 'user-1'))
vi.mock('@/lib/auth', () => ({ requireUserId: requireUserIdMock }))

// ── Fake DB en mémoire : route les requêtes réellement émises ────────────────
interface CardRow {
  id: string
  user_id: string
  fsrs_state: unknown
  next_review_at: string
}
interface ReviewRow {
  user_id: string
  card_id: string
  rating: number
  reviewed_at: string
}
interface StatusRow {
  user_id: string
  date: string
  path: string
}
const db = vi.hoisted(() => ({
  cards: [] as CardRow[],
  reviews: [] as ReviewRow[],
  daily_status: [] as StatusRow[],
}))
const reviewInsertTexts = vi.hoisted(() => [] as string[])
const sqlMock = vi.hoisted(() =>
  vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join('$')
    if (text.includes('select id, next_review_at from cards')) {
      const [userId, nowIso] = values as [string, string]
      return db.cards.filter(c => c.user_id === userId && c.next_review_at <= nowIso)
    }
    if (text.includes('select reviewed_at from reviews')) {
      const [userId, startIso] = values as [string, string]
      return db.reviews.filter(r => r.user_id === userId && r.reviewed_at >= startIso)
    }
    if (text.includes('select path from daily_status')) {
      const [userId, date] = values as [string, string]
      return db.daily_status.filter(s => s.user_id === userId && s.date === date)
    }
    if (text.includes('insert into daily_status')) {
      const [userId, date, path] = values as [string, string, string]
      if (!db.daily_status.some(s => s.user_id === userId && s.date === date)) {
        db.daily_status.push({ user_id: userId, date, path })
      }
      return []
    }
    if (text.includes('select fsrs_state from cards')) {
      const [cardId, userId] = values as [string, string]
      return db.cards.filter(c => c.id === cardId && c.user_id === userId)
    }
    if (text.includes('update cards set fsrs_state')) {
      const [fsrsState, nextReviewAt, cardId, userId] = values as [string, string, string, string]
      const card = db.cards.find(c => c.id === cardId && c.user_id === userId)
      if (!card) return []
      card.fsrs_state = JSON.parse(fsrsState)
      card.next_review_at = nextReviewAt
      return [{ id: cardId }]
    }
    if (text.includes('insert into reviews')) {
      reviewInsertTexts.push(text)
      const [userId, cardId, rating] = values as [string, string, number]
      // reviewed_at : défaut now() Postgres — simulé par l'horloge injectée
      db.reviews.push({
        user_id: userId,
        card_id: cardId,
        rating,
        reviewed_at: new Date().toISOString(),
      })
      return []
    }
    throw new Error(`Requête non routée par le fake : ${text}`)
  })
)
vi.mock('@/lib/db', () => ({ sql: sqlMock }))

import { rateCard, checkDailyStatus } from './actions'

const DAY_J = new Date('2026-07-30T14:00:00Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(DAY_J)
  db.cards.length = 0
  db.reviews.length = 0
  db.daily_status.length = 0
  reviewInsertTexts.length = 0
})

afterEach(() => {
  vi.useRealTimers()
})

/** Jour J : la leçon #1 d'Elm vient d'être complétée (mêmes cartes que
 * completeLesson : buildNewCards sur les vrais kanji_ids, dues demain). */
function seedLessonCards() {
  const lesson = getLessonsForZone('new-bark-town').find(l => l.sequence_index === 1)!
  const dueAt = nextMorningDue(DAY_J, 0)
  buildNewCards(lesson.kanji_ids, DAY_J, dueAt).forEach((card, i) => {
    db.cards.push({
      id: `card-${i}`,
      user_id: 'user-1',
      fsrs_state: JSON.parse(JSON.stringify(card.fsrs_state)),
      next_review_at: card.next_review_at,
    })
  })
}

describe('boucle quotidienne — critères d’acceptation', () => {
  it('jour J : 12 cartes dues demain → 0 due aujourd’hui → ✓ immédiat (no_cards_due), idempotent', async () => {
    seedLessonCards()
    expect(db.cards).toHaveLength(12)

    const status = await checkDailyStatus(0)
    expect(status.sessionDone).toBe(true)
    expect(status.cardsPending).toBe(0)
    expect(status.path).toBe('no_cards_due')
    expect(db.daily_status).toEqual([{ user_id: 'user-1', date: '2026-07-30', path: 'no_cards_due' }])

    // Relancer l'app le même jour : silencieux, rien de réécrit
    await checkDailyStatus(0)
    expect(db.daily_status).toHaveLength(1)
  })

  it('jour J+1 (horloge injectée) : 12 dues, la session les épuise, ✓ posé, daily_status écrit', async () => {
    seedLessonCards()
    await checkDailyStatus(0) // ✓ du jour J

    vi.setSystemTime(new Date('2026-07-31T08:00:00Z'))
    const morning = await checkDailyStatus(0)
    expect(morning.sessionDone).toBe(false)
    expect(morning.cardsPending).toBe(12)
    expect(db.daily_status).toHaveLength(1) // rien d'écrit tant que pas ✓

    const queue = db.cards.map(c => c.id)
    for (let i = 0; i < queue.length; i++) {
      const result = await rateCard(queue[i], 3, 0)
      expect(result.reviewedToday).toBe(i + 1)
      expect(result.sessionDone).toBe(i === queue.length - 1)
    }

    // 12 reviews écrites, horodatage serveur (jamais un reviewed_at client)
    expect(db.reviews).toHaveLength(12)
    for (const text of reviewInsertTexts) expect(text).not.toContain('reviewed_at')
    // FSRS a replanifié chaque carte dans le futur
    for (const card of db.cards) {
      expect(new Date(card.next_review_at).getTime()).toBeGreaterThan(Date.now())
    }
    // ✓ du jour J+1 posé, chemin session — et une seule ligne par jour
    expect(db.daily_status).toEqual([
      { user_id: 'user-1', date: '2026-07-30', path: 'no_cards_due' },
      { user_id: 'user-1', date: '2026-07-31', path: 'session' },
    ])

    // Idempotence du ✓ : re-vérifier ne réécrit rien
    await checkDailyStatus(0)
    expect(db.daily_status).toHaveLength(2)
  })

  it('rateCard refuse une carte qui n’appartient pas au joueur', async () => {
    seedLessonCards()
    db.cards[0].user_id = 'quelqu-un-d-autre'
    await expect(rateCard('card-0', 3, 0)).rejects.toThrow('Card not found')
    expect(db.reviews).toHaveLength(0)
  })

  it('les 4 notes FSRS passent telles quelles (Encore=1 … Facile=4)', async () => {
    seedLessonCards()
    vi.setSystemTime(new Date('2026-07-31T08:00:00Z'))
    await rateCard('card-0', 1, 0)
    await rateCard('card-1', 2, 0)
    await rateCard('card-2', 4, 0)
    expect(db.reviews.map(r => r.rating)).toEqual([1, 2, 4])
    // Encore (1) revient plus tôt que Facile (4)
    const again = db.cards.find(c => c.id === 'card-0')!
    const easy = db.cards.find(c => c.id === 'card-2')!
    expect(new Date(again.next_review_at).getTime()).toBeLessThan(
      new Date(easy.next_review_at).getTime()
    )
  })
})
