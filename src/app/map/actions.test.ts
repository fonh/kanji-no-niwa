// Émission moteur des unlock_text (issue 08, engine-contract § 2) — la
// couche DB est mockée (DATABASE_URL absent ici) : on vérifie que
// l'interaction avec l'objet PC / la tuile-panneau débloque le bon texte,
// l'IDEMPOTENCE (re-interaction = zéro écriture), et que les textes portés
// par un dialogue (elm_great_text) passent déjà par la lib 02.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defaultPlayerState, type PlayerState } from '@/lib/condition-effect'

const requireUserIdMock = vi.hoisted(() => vi.fn(async () => 'user-1'))
vi.mock('@/lib/auth', () => ({ requireUserId: requireUserIdMock }))

const sqlMock = vi.hoisted(() => vi.fn(async () => []))
vi.mock('@/lib/db', () => ({ sql: sqlMock }))

const stateRef = vi.hoisted(() => ({ current: null as unknown as PlayerState }))
const savePlayerStateMock = vi.hoisted(() =>
  vi.fn(async (_userId: string, state: PlayerState) => {
    stateRef.current = state
  })
)
vi.mock('@/lib/player-state', () => ({
  getPlayerState: vi.fn(async () => stateRef.current),
  savePlayerState: savePlayerStateMock,
}))

import { interactWithNpc, reachDialogueState } from './actions'

beforeEach(() => {
  stateRef.current = defaultPlayerState()
  savePlayerStateMock.mockClear()
  sqlMock.mockClear()
})

describe('interactWithNpc — unlock_text émis par le moteur (objet PC, panneau)', () => {
  it('ouvrir le PC du joueur débloque ET ouvre lyra_mail', async () => {
    const result = await interactWithNpc('player_pc_new_bark')
    expect(result).toEqual({ kind: 'text', text_id: 'lyra_mail_new_bark' })
    expect(savePlayerStateMock).toHaveBeenCalledTimes(1)
    const saved = savePlayerStateMock.mock.calls[0][1]
    expect(saved.unlocked_texts).toContain('lyra_mail_new_bark')
  })

  it('IDEMPOTENT : re-ouvrir le PC n\'écrit rien mais rouvre le texte', async () => {
    await interactWithNpc('player_pc_new_bark')
    savePlayerStateMock.mockClear()
    const again = await interactWithNpc('player_pc_new_bark')
    expect(again).toEqual({ kind: 'text', text_id: 'lyra_mail_new_bark' })
    expect(savePlayerStateMock).not.toHaveBeenCalled()
  })

  it('le panneau de Route 29 débloque johto_entrance_sign_route29', async () => {
    const result = await interactWithNpc('sign_johto_entrance_route29')
    expect(result).toEqual({ kind: 'text', text_id: 'johto_entrance_sign_route29' })
    expect(savePlayerStateMock.mock.calls[0][1].unlocked_texts).toContain(
      'johto_entrance_sign_route29'
    )
  })

  it('un PNJ hors table moteur suit le flux dialogue ordinaire', async () => {
    const result = await interactWithNpc('mom_new_bark', 'npcs/new-bark-town/mom_new_bark')
    expect(result?.kind).toBe('dialogue')
  })
})

describe('elm_great_text — unlock_text porté par un dialogue (lib 02, vérification)', () => {
  it('atteindre great_text chez Elm (8 badges) débloque elm_great_text_new_bark', async () => {
    const state = defaultPlayerState()
    state.badges = Array.from({ length: 8 }, (_, i) => ({
      badge_id: `badge-${i}`,
      earned_at: '2026-07-30T00:00:00.000Z',
    }))
    stateRef.current = state

    const reached = await reachDialogueState('npcs/new-bark-town/prof_elm_lab')
    expect(reached!.state).toBe('great_text')
    expect(savePlayerStateMock).toHaveBeenCalledTimes(1)
    const saved = savePlayerStateMock.mock.calls[0][1]
    expect(saved.unlocked_texts).toContain('elm_great_text_new_bark')
    expect(saved.quest_progress.kimono_finale.current_step).toBe('great_text_received')

    // Reparler à Elm : l'état bascule sur after_great_text, aucun Effect
    // rejoué, zéro écriture.
    savePlayerStateMock.mockClear()
    const again = await reachDialogueState('npcs/new-bark-town/prof_elm_lab')
    expect(again!.state).toBe('after_great_text')
    expect(savePlayerStateMock).not.toHaveBeenCalled()
  })
})
