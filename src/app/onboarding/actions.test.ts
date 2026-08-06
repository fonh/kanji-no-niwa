// completeOnboarding (issue 04, durci à la revue M1) — couche DB mockée.
// Le point critique : un compte legacy (trainer_name posé, avatar null —
// renvoyé à l'onboarding par isOnboarded) possède un user_map_state backfillé
// par la migration 002 (visited_zones, cleared_events, inventaire CS) — le
// spawn chambre ne doit JAMAIS l'écraser.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PlayerState } from '@/lib/condition-effect'
import { ONBOARDING_SPAWN } from '@/lib/onboarding'

const requireUserIdMock = vi.hoisted(() => vi.fn(async () => 'user-1'))
vi.mock('@/lib/auth', () => ({ requireUserId: requireUserIdMock }))

const userRow = vi.hoisted(() => ({
  current: { trainer_name: null, avatar: null } as { trainer_name: string | null; avatar: string | null },
}))
const mapStateRows = vi.hoisted(() => ({ current: [] as { user_id: string }[] }))
type SqlCall = { text: string; values: unknown[] }
const sqlCalls = vi.hoisted(() => [] as SqlCall[])
const sqlMock = vi.hoisted(() =>
  vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join('?')
    sqlCalls.push({ text, values })
    if (text.includes('select trainer_name, avatar')) return [userRow.current]
    if (text.includes('from user_map_state')) return mapStateRows.current
    return []
  })
)
vi.mock('@/lib/db', () => ({ sql: sqlMock }))

const savedStates = vi.hoisted(() => [] as PlayerState[])
const savePlayerStateMock = vi.hoisted(() =>
  vi.fn(async (_userId: string, state: PlayerState) => {
    savedStates.push(state)
  })
)
vi.mock('@/lib/player-state', () => ({ savePlayerState: savePlayerStateMock }))

import { completeOnboarding } from './actions'

beforeEach(() => {
  sqlCalls.length = 0
  savedStates.length = 0
  sqlMock.mockClear()
  savePlayerStateMock.mockClear()
  userRow.current = { trainer_name: null, avatar: null }
  mapStateRows.current = []
})

describe('completeOnboarding', () => {
  it('compte neuf (aucun user_map_state) : nom/avatar écrits + spawn chambre', async () => {
    await completeOnboarding('ethan', 'ゆうき')
    const update = sqlCalls.find(c => c.text.includes('update users set trainer_name'))
    expect(update).toBeDefined()
    expect(update!.values).toContain('ゆうき')
    expect(update!.values).toContain('ethan')
    expect(savedStates).toHaveLength(1)
    expect(savedStates[0].current_zone).toBe(ONBOARDING_SPAWN.zone)
    expect(savedStates[0].visited_zones).toEqual([ONBOARDING_SPAWN.zone])
  })

  // M1 (revue jalon 1) : le compte legacy (avatar null → repasse par
  // l'onboarding) a un user_map_state backfillé — visited_zones, inventaire
  // CS, cleared_events. completeOnboarding ne doit poser QUE nom/avatar.
  it('M1 — compte legacy avec user_map_state existant : état de carte JAMAIS écrasé', async () => {
    userRow.current = { trainer_name: 'サトシ', avatar: null } // isOnboarded → false
    mapStateRows.current = [{ user_id: 'user-1' }] // ligne backfillée par 002

    await completeOnboarding('lyra', 'サトシ')

    // Nom/avatar posés…
    expect(sqlCalls.some(c => c.text.includes('update users set trainer_name'))).toBe(true)
    // …mais AUCUNE écriture d'état de carte (ni spawn, ni visited_zones reset)
    expect(savePlayerStateMock).not.toHaveBeenCalled()
  })

  it('compte déjà onboardé : aucune écriture (idempotence conservée)', async () => {
    userRow.current = { trainer_name: 'サトシ', avatar: 'ethan' }
    await completeOnboarding('lyra', 'サトシ')
    expect(sqlCalls.some(c => c.text.includes('update users'))).toBe(false)
    expect(savePlayerStateMock).not.toHaveBeenCalled()
  })

  it('payload invalide : refus sans écriture', async () => {
    await expect(completeOnboarding('pikachu', 'abc')).rejects.toThrow('Invalid onboarding payload')
    expect(sqlCalls.some(c => c.text.includes('update users'))).toBe(false)
    expect(savePlayerStateMock).not.toHaveBeenCalled()
  })
})
