// completeLesson (issue 05) — la couche DB est mockée (DATABASE_URL absent
// ici) : on vérifie le contrat d'écriture (12 cartes dues demain,
// advance_quest, grammar_encounters) et l'IDEMPOTENCE si la leçon est
// rejouée (critère d'acceptation).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defaultPlayerState, type PlayerState } from '@/lib/condition-effect'
import { lessonId, lessonQuestId, lessonStepId } from '@/lib/lessons'

const requireUserIdMock = vi.hoisted(() => vi.fn(async () => 'user-1'))
vi.mock('@/lib/auth', () => ({ requireUserId: requireUserIdMock }))

type SqlCall = { text: string; values: unknown[] }
const sqlCalls = vi.hoisted(() => [] as SqlCall[])
const sqlMock = vi.hoisted(() =>
  vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    sqlCalls.push({ text: strings.join('?'), values })
    return []
  })
)
vi.mock('@/lib/db', () => ({ sql: sqlMock }))

const stateRef = vi.hoisted(() => ({ current: null as unknown as PlayerState }))
const savePlayerStateMock = vi.hoisted(() =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  vi.fn(async (_userId: string, _state: PlayerState) => {})
)
vi.mock('@/lib/player-state', () => ({
  getPlayerState: vi.fn(async () => stateRef.current),
  savePlayerState: savePlayerStateMock,
}))

import { completeLesson } from './actions'

const NOW = new Date('2026-07-29T14:00:00Z')

function stateAt(eggStep: string | null, lessonsDone: number): PlayerState {
  const state = defaultPlayerState()
  if (eggStep) {
    state.quest_progress.mystery_egg_errand = { current_step: eggStep, step_entered_at: NOW.toISOString() }
  }
  if (lessonsDone > 0) {
    state.quest_progress[lessonQuestId('new-bark-town')] = {
      current_step: lessonStepId(lessonsDone),
      step_entered_at: NOW.toISOString(),
    }
    for (let i = 1; i <= lessonsDone; i++) {
      state.completed_lessons.push(lessonId('new-bark-town', i))
    }
  }
  return state
}

const cardInserts = () => sqlCalls.filter(c => c.text.includes('insert into cards'))
const grammarInserts = () => sqlCalls.filter(c => c.text.includes('insert into grammar_encounters'))

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  sqlCalls.length = 0
  sqlMock.mockClear()
  savePlayerStateMock.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('completeLesson', () => {
  it('leçon #1 disponible : 12 cartes (6 kanji × sens/lecture) toutes dues demain, quête avancée, grammaire first_seen', async () => {
    stateRef.current = stateAt('sent_by_elm', 0)
    const result = await completeLesson('new-bark-town', 1, 0) // client en UTC

    expect(result).toEqual({ completed: true })
    const inserts = cardInserts()
    expect(inserts).toHaveLength(12)
    // values : userId, kanji_id, card_type, item_type, item_id, facet, fsrs_state, next_review_at
    for (const call of inserts) {
      expect(call.text).toContain('on conflict (user_id, item_type, item_id, facet) do nothing')
      expect(call.values[3]).toBe('kanji')
      expect(call.values[7]).toBe('2026-07-30T00:00:00.000Z') // lendemain minuit local (UTC ici)
    }
    const facetsByKanji = new Map<string, string[]>()
    for (const call of inserts) {
      const kanji = call.values[4] as string
      facetsByKanji.set(kanji, [...(facetsByKanji.get(kanji) ?? []), call.values[5] as string])
    }
    expect([...facetsByKanji.keys()].sort()).toEqual(['一', '二', '人', '先', '入', '八'].sort())
    for (const facets of facetsByKanji.values()) expect(facets.sort()).toEqual(['lecture', 'sens'])

    // Progression : quête implicite + completed_lessons
    expect(savePlayerStateMock).toHaveBeenCalledTimes(1)
    const saved = savePlayerStateMock.mock.calls[0][1]
    expect(saved.quest_progress['lessons-new-bark-town'].current_step).toBe('lesson-1')
    expect(saved.completed_lessons).toContain('new-bark-town#1')

    // Grammaire rencontrée (first_seen), idempotente côté SQL
    const grammar = grammarInserts()
    expect(grammar).toHaveLength(1)
    expect(grammar[0].values).toContain('N5-001')
    expect(grammar[0].text).toContain('on conflict (user_id, grammar_id) do nothing')
  })

  it('IDEMPOTENT : rejouer une leçon complétée n’écrit rien', async () => {
    stateRef.current = stateAt('sent_by_elm', 1)
    const result = await completeLesson('new-bark-town', 1, 0)
    expect(result).toEqual({ completed: true })
    expect(sqlMock).not.toHaveBeenCalled()
    expect(savePlayerStateMock).not.toHaveBeenCalled()
  })

  it('refuse une leçon qui n’est pas la tête disponible (client jamais cru)', async () => {
    // #3 tentée alors que la règle sert la #1
    stateRef.current = stateAt('sent_by_elm', 0)
    expect(await completeLesson('new-bark-town', 3, 0)).toEqual({ completed: false })
    // #1 tentée alors qu'elle est verrouillée (quête pas commencée)
    stateRef.current = stateAt(null, 0)
    expect(await completeLesson('new-bark-town', 1, 0)).toEqual({ completed: false })
    // leçon inexistante
    stateRef.current = stateAt('sent_by_elm', 0)
    expect(await completeLesson('new-bark-town', 99, 0)).toEqual({ completed: false })
    expect(sqlMock).not.toHaveBeenCalled()
    expect(savePlayerStateMock).not.toHaveBeenCalled()
  })
})
