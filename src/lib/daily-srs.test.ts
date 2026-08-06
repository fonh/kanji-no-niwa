// DAL du statut quotidien SRS (issue 06) — couche DB mockée (DATABASE_URL
// absent ici) : on vérifie le contrat de lecture (statut live) et d'écriture
// (daily_status posé une seule fois, au bon chemin, à la bonne date locale).
import { describe, it, expect, vi, beforeEach } from 'vitest'

type SqlCall = { text: string; values: unknown[] }
const sqlCalls = vi.hoisted(() => [] as SqlCall[])
const fixtures = vi.hoisted(() => ({
  dueCards: [] as { id: string; next_review_at: string }[],
  reviewsToday: [] as { reviewed_at: string }[],
  statusRow: null as { path: string } | null,
}))
const sqlMock = vi.hoisted(() =>
  vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join('?')
    sqlCalls.push({ text, values })
    if (text.includes('from cards')) return fixtures.dueCards
    if (text.includes('from reviews')) return fixtures.reviewsToday
    if (text.includes('from daily_status')) return fixtures.statusRow ? [fixtures.statusRow] : []
    return []
  })
)
vi.mock('@/lib/db', () => ({ sql: sqlMock }))

import { getDailySRSStatusForUser, ensureDailyStatus } from './daily-srs'

const NOW = new Date('2026-07-31T08:00:00Z')
const statusInserts = () => sqlCalls.filter(c => c.text.includes('insert into daily_status'))

beforeEach(() => {
  sqlCalls.length = 0
  sqlMock.mockClear()
  fixtures.dueCards = []
  fixtures.reviewsToday = []
  fixtures.statusRow = null
})

describe('getDailySRSStatusForUser (lecture seule — le gate de l’issue 10 lit ceci)', () => {
  it('cartes dues → pas ✓ ; n’écrit JAMAIS', async () => {
    fixtures.dueCards = [
      { id: 'c1', next_review_at: '2026-07-31T00:00:00Z' },
      { id: 'c2', next_review_at: '2026-07-31T00:00:00Z' },
    ]
    const status = await getDailySRSStatusForUser('user-1', 0, NOW)
    expect(status.sessionDone).toBe(false)
    expect(status.cardsPending).toBe(2)
    expect(statusInserts()).toHaveLength(0)
  })

  it('✓ déjà posé (daily_status) : acquis même si des cartes sont pendantes', async () => {
    fixtures.dueCards = [{ id: 'c1', next_review_at: '2026-07-31T00:00:00Z' }]
    fixtures.statusRow = { path: 'session' }
    const status = await getDailySRSStatusForUser('user-1', 0, NOW)
    expect(status.sessionDone).toBe(true)
    expect(statusInserts()).toHaveLength(0)
  })

  it('borne la fenêtre des reviews au minuit LOCAL (offset client)', async () => {
    // Japon (offset -540), 2026-07-30T16:00Z = 31/07 01:00 local : le jour
    // local a commencé à 15:00Z, et la date écrite serait 2026-07-31.
    await getDailySRSStatusForUser('user-1', -540, new Date('2026-07-30T16:00:00Z'))
    const reviewQuery = sqlCalls.find(c => c.text.includes('from reviews'))!
    expect(reviewQuery.values).toContain('2026-07-30T15:00:00.000Z')
    const statusQuery = sqlCalls.find(c => c.text.includes('from daily_status'))!
    expect(statusQuery.values).toContain('2026-07-31')
  })
})

describe('ensureDailyStatus (écrit le ✓ quand il est atteint — idempotent)', () => {
  it('aucune carte due, aucune review → ✓ immédiat, path no_cards_due', async () => {
    const status = await ensureDailyStatus('user-1', 0, NOW)
    expect(status.sessionDone).toBe(true)
    expect(status.path).toBe('no_cards_due')
    const inserts = statusInserts()
    expect(inserts).toHaveLength(1)
    expect(inserts[0].text).toContain('on conflict (user_id, date) do nothing')
    expect(inserts[0].values).toEqual(['user-1', '2026-07-31', 'no_cards_due'])
  })

  it('file vidée après des reviews → path session', async () => {
    fixtures.reviewsToday = [{ reviewed_at: '2026-07-31T07:00:00Z' }]
    const status = await ensureDailyStatus('user-1', 0, NOW)
    expect(status.sessionDone).toBe(true)
    expect(status.path).toBe('session')
    expect(statusInserts()[0].values).toEqual(['user-1', '2026-07-31', 'session'])
  })

  it('plafond de rattrapage (200 notées, backlog restant) → path session, backlog visible', async () => {
    fixtures.reviewsToday = Array.from({ length: 200 }, () => ({
      reviewed_at: '2026-07-31T06:00:00Z',
    }))
    fixtures.dueCards = Array.from({ length: 37 }, (_, i) => ({
      id: `c${i}`,
      next_review_at: '2026-07-25T00:00:00Z',
    }))
    const status = await ensureDailyStatus('user-1', 0, NOW)
    expect(status.sessionDone).toBe(true)
    expect(status.cardsPending).toBe(37)
    expect(status.path).toBe('session')
    expect(statusInserts()).toHaveLength(1)
  })

  it('cartes encore dues, plafond non atteint → rien d’écrit', async () => {
    fixtures.dueCards = [{ id: 'c1', next_review_at: '2026-07-31T00:00:00Z' }]
    const status = await ensureDailyStatus('user-1', 0, NOW)
    expect(status.sessionDone).toBe(false)
    expect(status.path).toBeNull()
    expect(statusInserts()).toHaveLength(0)
  })

  it('IDEMPOTENT : ✓ déjà posé → aucune réécriture, path existant retourné', async () => {
    fixtures.statusRow = { path: 'no_cards_due' }
    const status = await ensureDailyStatus('user-1', 0, NOW)
    expect(status.sessionDone).toBe(true)
    expect(status.path).toBe('no_cards_due')
    expect(statusInserts()).toHaveLength(0)
  })
})
