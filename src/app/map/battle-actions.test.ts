// Server actions de combat (issue 07) — couche DB mockée (DATABASE_URL
// absent ici). On vérifie le contrat : engagement (embuscade/Talk) contre le
// vrai contenu, incrément grammar_encounters au tirage, écriture de la
// victoire (defeated_trainers + battle_results) et son IDEMPOTENCE au
// re-combat (critère d'acceptation).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defaultPlayerState, type PlayerState } from '@/lib/condition-effect'

const requireUserIdMock = vi.hoisted(() => vi.fn(async () => 'user-1'))
vi.mock('@/lib/auth', () => ({ requireUserId: requireUserIdMock }))

type SqlCall = { text: string; values: unknown[] }
const sqlCalls = vi.hoisted(() => [] as SqlCall[])
const grammarRows = vi.hoisted(() => ({ current: [] as { grammar_id: string }[] }))
const sqlMock = vi.hoisted(() =>
  vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join('?')
    sqlCalls.push({ text, values })
    if (text.includes('from grammar_encounters')) return grammarRows.current
    if (text.includes('select avatar')) return [{ avatar: 'ethan' }]
    return []
  })
)
vi.mock('@/lib/db', () => ({ sql: sqlMock }))

const stateRef = vi.hoisted(() => ({ current: null as unknown as PlayerState }))
const savedStates = vi.hoisted(() => [] as PlayerState[])
const savePlayerStateMock = vi.hoisted(() =>
  vi.fn(async (_userId: string, state: PlayerState) => {
    savedStates.push(state)
  })
)
vi.mock('@/lib/player-state', () => ({
  getPlayerState: vi.fn(async () => stateRef.current),
  savePlayerState: savePlayerStateMock,
}))

import { engageTrainer, winBattle } from './battle-actions'

function stateWithLessons(lessons: string[], defeated: string[] = []): PlayerState {
  const state = defaultPlayerState()
  state.completed_lessons = lessons
  state.defeated_trainers = defeated
  return state
}

beforeEach(() => {
  sqlCalls.length = 0
  savedStates.length = 0
  sqlMock.mockClear()
  savePlayerStateMock.mockClear()
  grammarRows.current = []
})

describe('engageTrainer', () => {
  it('Silver #1 non battu : combat de 12 questions / 2 vies, accroche jp, nom jp', async () => {
    stateRef.current = stateWithLessons(['new-bark-town#1', 'new-bark-town#2'])
    grammarRows.current = [{ grammar_id: 'N5-001' }]

    const result = await engageTrainer('silver_apparition1_cherrygrove')
    expect(result).not.toBeNull()
    expect(result!.kind).toBe('battle')
    if (result!.kind !== 'battle') return
    expect(result!.questions).toHaveLength(12) // battle_length du registre, jamais du fichier dialogue
    expect(result!.lives).toBe(2)
    expect(result!.trainer_name_jp).toBe('あかいかみの　おとこのこ')
    expect(result!.intro_pages[0].jp).toContain('おまえ')
    for (const q of result!.questions) {
      expect(['sens', 'lecture', 'saisie', 'composition', 'grammaire']).toContain(q.mode)
    }
  })

  it('incrémente times_drawn/last_drawn_at pour chaque point de grammaire tiré', async () => {
    stateRef.current = stateWithLessons(['new-bark-town#1', 'new-bark-town#2'])
    grammarRows.current = [{ grammar_id: 'N5-001' }, { grammar_id: 'N5-002' }]

    const result = await engageTrainer('silver_apparition1_cherrygrove')
    if (result?.kind !== 'battle') throw new Error('expected battle')
    const grammarQuestions = result.questions.filter(q => q.mode === 'grammaire')
    const updates = sqlCalls.filter(c => c.text.includes('update grammar_encounters'))
    expect(updates).toHaveLength(grammarQuestions.length)
    for (const call of updates) {
      expect(call.text).toContain('times_drawn')
      expect(call.text).toContain('last_drawn_at')
    }
  })

  it('aucune grammaire rencontrée → aucune question grammaire (garde d’exclusion)', async () => {
    stateRef.current = stateWithLessons(['new-bark-town#1', 'new-bark-town#2'])
    const result = await engageTrainer('youngster_joey_route30')
    if (result?.kind !== 'battle') throw new Error('expected battle')
    expect(result.questions.some(q => q.mode === 'grammaire')).toBe(false)
  })

  it('dresseur déjà battu : dialogue post_battle, jamais de re-combat auto', async () => {
    stateRef.current = stateWithLessons(
      ['new-bark-town#1', 'new-bark-town#2'],
      ['silver_apparition1_cherrygrove']
    )
    const result = await engageTrainer('silver_apparition1_cherrygrove')
    expect(result).not.toBeNull()
    expect(result!.kind).toBe('dialogue')
    if (result!.kind !== 'dialogue') return
    expect(result!.pages.map(p => p.jp)).toContain('またな。')
    expect(sqlCalls.some(c => c.text.includes('update grammar_encounters'))).toBe(false)
  })

  it('dresseur inconnu → null', async () => {
    stateRef.current = stateWithLessons(['new-bark-town#1'])
    expect(await engageTrainer('nobody_nowhere')).toBeNull()
  })
})

describe('winBattle', () => {
  const stats = { lives_lost: 1, modes_used: ['sens', 'lecture'], accuracy: 11 / 12 }

  it('première victoire : defeated_trainers mis à jour + battle_results écrit + post_battle retourné', async () => {
    stateRef.current = stateWithLessons(['new-bark-town#1', 'new-bark-town#2'])

    const result = await winBattle('silver_apparition1_cherrygrove', stats)
    expect(result).not.toBeNull()
    expect(result!.pages.map(p => p.jp)).toContain('ふん。')

    expect(savedStates).toHaveLength(1)
    expect(savedStates[0].defeated_trainers).toContain('silver_apparition1_cherrygrove')

    const inserts = sqlCalls.filter(c => c.text.includes('insert into battle_results'))
    expect(inserts).toHaveLength(1)
    expect(inserts[0].values).toContain('silver_apparition1_cherrygrove')
    expect(inserts[0].values).toContain(1) // lives_lost
    // played_at horodaté serveur (default now()) : jamais passé en valeur
    expect(inserts[0].text).not.toContain('played_at')
  })

  it('re-victoire (re-combat) : idempotente — aucune réécriture', async () => {
    stateRef.current = stateWithLessons(
      ['new-bark-town#1', 'new-bark-town#2'],
      ['silver_apparition1_cherrygrove']
    )
    const result = await winBattle('silver_apparition1_cherrygrove', stats)
    expect(result).not.toBeNull()
    expect(savedStates).toHaveLength(0)
    expect(sqlCalls.filter(c => c.text.includes('insert into battle_results'))).toHaveLength(0)
  })

  it('borne les stats client (accuracy > 1, lives_lost négatif)', async () => {
    stateRef.current = stateWithLessons(['new-bark-town#1'])
    await winBattle('youngster_joey_route30', { lives_lost: -3, modes_used: [], accuracy: 42 })
    const [insert] = sqlCalls.filter(c => c.text.includes('insert into battle_results'))
    expect(insert.values).toContain(0) // lives_lost clampé
    expect(insert.values).toContain(1) // accuracy clampée
  })
})
