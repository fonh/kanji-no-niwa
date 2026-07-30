// Hydratation des métriques de PlayerState (issue 08) — DB mockée : la
// métrique `texts_read` consommée par Condition.count (seuils CS-Kanji plus
// tard) doit compter les textes COMPLÉTÉS (text_completions), jamais les
// simples déblocages (unlocked_texts).
import { describe, it, expect, vi, beforeEach } from 'vitest'

type SqlCall = { text: string; values: unknown[] }
const sqlCalls = vi.hoisted(() => [] as SqlCall[])
const sqlMock = vi.hoisted(() =>
  vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join('?')
    sqlCalls.push({ text, values })
    if (text.includes('from cards')) return [{ kanji_studied: 6 }]
    if (text.includes('from text_completions')) return [{ texts_read: 2 }]
    return []
  })
)
vi.mock('@/lib/db', () => ({ sql: sqlMock }))

import { getPlayerState } from './player-state'

beforeEach(() => {
  sqlCalls.length = 0
  sqlMock.mockClear()
})

describe('getPlayerState — métriques hydratées', () => {
  it('texts_read = count(text_completions), kanji_studied = count(cards)', async () => {
    const state = await getPlayerState('user-1')
    expect(state.metrics.texts_read).toBe(2)
    expect(state.metrics.kanji_studied).toBe(6)
    const textQuery = sqlCalls.find(c => c.text.includes('from text_completions'))
    expect(textQuery).toBeDefined()
    expect(textQuery!.values).toContain('user-1')
  })

  it('compte à zéro pour un compte tout neuf (aucune ligne)', async () => {
    sqlMock.mockImplementationOnce(async () => []).mockImplementation(async () => [])
    const state = await getPlayerState('user-2')
    expect(state.metrics.texts_read).toBe(0)
    expect(state.metrics.kanji_studied).toBe(0)
  })
})
