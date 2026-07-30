// completeText (issue 08) — DB mockée (DATABASE_URL absent ici) : on vérifie
// le contrat d'écriture de text_completions (score première-tentative figé,
// gold_at posé une seule fois, horodatage SERVEUR) et les refus (texte
// verrouillé ou inconnu — le client n'est jamais cru).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defaultPlayerState, type PlayerState } from '@/lib/condition-effect'

const requireUserIdMock = vi.hoisted(() => vi.fn(async () => 'user-1'))
vi.mock('@/lib/auth', () => ({ requireUserId: requireUserIdMock }))

type SqlCall = { text: string; values: unknown[] }
const sqlCalls = vi.hoisted(() => [] as SqlCall[])
const sqlResult = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[] }))
const sqlMock = vi.hoisted(() =>
  vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    sqlCalls.push({ text: strings.join('?'), values })
    return sqlResult.rows
  })
)
vi.mock('@/lib/db', () => ({ sql: sqlMock }))

const stateRef = vi.hoisted(() => ({ current: null as unknown as PlayerState }))
vi.mock('@/lib/player-state', () => ({
  getPlayerState: vi.fn(async () => stateRef.current),
}))

import { completeText } from './actions'

beforeEach(() => {
  sqlCalls.length = 0
  sqlMock.mockClear()
  sqlResult.rows = []
  const state = defaultPlayerState()
  state.unlocked_texts = ['lyra_mail_new_bark']
  stateRef.current = state
})

describe('completeText', () => {
  it('première complétion : insert idempotent, horodatage serveur, gold_at jamais écrasé', async () => {
    sqlResult.rows = [{ gold_at: null }]
    const result = await completeText('lyra_mail_new_bark', 67, false)
    expect(result).toEqual({ completed: true, gold: false })
    expect(sqlCalls).toHaveLength(1)
    const call = sqlCalls[0]
    expect(call.text).toContain('insert into text_completions')
    // Horodatage serveur : now() dans le SQL, jamais un timestamp client
    expect(call.text).toContain('now()')
    // Rejeu : le score/completed_at de la PREMIÈRE complétion restent
    // intacts ; seul gold_at peut passer de null à une date, une fois.
    expect(call.text).toContain('on conflict (user_id, text_id) do update')
    expect(call.text).toContain('coalesce(text_completions.gold_at, excluded.gold_at)')
    expect(call.values).toEqual(['user-1', 'lyra_mail_new_bark', 67, false])
  })

  it('passe sans faute (première ou relecture) → gold', async () => {
    sqlResult.rows = [{ gold_at: '2026-07-30T10:00:00Z' }]
    const result = await completeText('lyra_mail_new_bark', 100, true)
    expect(result).toEqual({ completed: true, gold: true })
    expect(sqlCalls[0].values).toEqual(['user-1', 'lyra_mail_new_bark', 100, true])
  })

  it('borne le score client (0..100, entier)', async () => {
    await completeText('lyra_mail_new_bark', 150, false)
    expect(sqlCalls[0].values[2]).toBe(100)
    await completeText('lyra_mail_new_bark', -5, false)
    expect(sqlCalls[1].values[2]).toBe(0)
    await completeText('lyra_mail_new_bark', 66.6, false)
    expect(sqlCalls[2].values[2]).toBe(67)
  })

  it('refuse un texte non débloqué ou inconnu : zéro écriture', async () => {
    expect(await completeText('johto_entrance_sign_route29', 100, true)).toEqual({
      completed: false,
      gold: false,
    })
    expect(await completeText('nope', 100, true)).toEqual({ completed: false, gold: false })
    expect(sqlMock).not.toHaveBeenCalled()
  })
})
