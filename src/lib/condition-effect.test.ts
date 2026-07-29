import { describe, it, expect } from 'vitest'
import {
  defaultPlayerState,
  evalCondition,
  evalConditions,
  selectDialogueState,
  applyEffect,
  applyEffects,
  isUnlocked,
  type ApplyContext,
  type Condition,
  type Effect,
  type EvalContext,
  type PlayerState,
  type StateRule,
} from './condition-effect'

// A wednesday, 15:30 (local time)
const NOW = new Date(2026, 6, 29, 15, 30)

const QUEST_STEPS = {
  mystery_egg_errand: ['sent_by_elm', 'egg_received', 'egg_delivered'],
}

const ctx: EvalContext = { questSteps: QUEST_STEPS, now: NOW }
const applyCtx: ApplyContext = { questSteps: QUEST_STEPS, now: NOW }

function stateWith(overrides: Partial<PlayerState>): PlayerState {
  return { ...defaultPlayerState(), ...overrides }
}

function atStep(step: string): PlayerState {
  return stateWith({
    quest_progress: {
      mystery_egg_errand: { current_step: step, step_entered_at: NOW.toISOString() },
    },
  })
}

describe('evalCondition — count', () => {
  it('badges_earned derives from badges[]', () => {
    const state = stateWith({
      badges: [
        { badge_id: 'falkner', earned_at: NOW.toISOString() },
        { badge_id: 'bugsy', earned_at: NOW.toISOString() },
      ],
    })
    expect(evalCondition({ type: 'count', metric: 'badges_earned', threshold: 2 }, state, ctx)).toBe(true)
    expect(evalCondition({ type: 'count', metric: 'badges_earned', threshold: 3 }, state, ctx)).toBe(false)
  })

  it('pokeathlon_score derives from the dedicated field', () => {
    const state = stateWith({ pokeathlon_score: 250 })
    expect(evalCondition({ type: 'count', metric: 'pokeathlon_score', threshold: 250 }, state, ctx)).toBe(true)
    expect(evalCondition({ type: 'count', metric: 'pokeathlon_score', threshold: 251 }, state, ctx)).toBe(false)
  })

  it('other metrics read the hydrated metrics map, defaulting to 0', () => {
    const state = stateWith({ metrics: { kanji_studied: 12 } })
    expect(evalCondition({ type: 'count', metric: 'kanji_studied', threshold: 12 }, state, ctx)).toBe(true)
    expect(evalCondition({ type: 'count', metric: 'kanji_studied', threshold: 13 }, state, ctx)).toBe(false)
    expect(evalCondition({ type: 'count', metric: 'texts_read', threshold: 1 }, state, ctx)).toBe(false)
  })

  it('negate inverts the comparison', () => {
    const state = stateWith({ metrics: { kanji_studied: 12 } })
    expect(
      evalCondition({ type: 'count', metric: 'kanji_studied', threshold: 20, negate: true }, state, ctx)
    ).toBe(true)
  })
})

describe('evalCondition — item_owned', () => {
  it('true when the item is in the inventory with a positive quantity', () => {
    const state = stateWith({ inventory: { pokegear: 1, apricorn: 0 } })
    expect(evalCondition({ type: 'item_owned', item_id: 'pokegear' }, state, ctx)).toBe(true)
    expect(evalCondition({ type: 'item_owned', item_id: 'apricorn' }, state, ctx)).toBe(false)
    expect(evalCondition({ type: 'item_owned', item_id: 'red_scale' }, state, ctx)).toBe(false)
  })

  it('negate inverts ownership', () => {
    const state = stateWith({ inventory: { pokegear: 1 } })
    expect(evalCondition({ type: 'item_owned', item_id: 'pokegear', negate: true }, state, ctx)).toBe(false)
    expect(evalCondition({ type: 'item_owned', item_id: 'red_scale', negate: true }, state, ctx)).toBe(true)
  })
})

describe('evalCondition — quest_step (at-or-after)', () => {
  const cond: Condition = { type: 'quest_step', quest_id: 'mystery_egg_errand', step: 'egg_received' }

  it('false when the quest has never advanced', () => {
    expect(evalCondition(cond, defaultPlayerState(), ctx)).toBe(false)
  })

  it('false before the step, true at the step, true after the step', () => {
    expect(evalCondition(cond, atStep('sent_by_elm'), ctx)).toBe(false)
    expect(evalCondition(cond, atStep('egg_received'), ctx)).toBe(true)
    expect(evalCondition(cond, atStep('egg_delivered'), ctx)).toBe(true)
  })

  it('false when the step or quest is unknown', () => {
    expect(
      evalCondition({ type: 'quest_step', quest_id: 'mystery_egg_errand', step: 'nope' }, atStep('egg_delivered'), ctx)
    ).toBe(false)
    expect(
      evalCondition({ type: 'quest_step', quest_id: 'unknown_quest', step: 'briefed' }, atStep('egg_delivered'), ctx)
    ).toBe(false)
  })

  it('negate expresses "present until X" (silver_spying_new_bark)', () => {
    const cond: Condition = {
      type: 'quest_step',
      quest_id: 'mystery_egg_errand',
      step: 'sent_by_elm',
      negate: true,
    }
    expect(evalCondition(cond, defaultPlayerState(), ctx)).toBe(true)
    expect(evalCondition(cond, atStep('sent_by_elm'), ctx)).toBe(false)
    expect(evalCondition(cond, atStep('egg_delivered'), ctx)).toBe(false)
  })
})

describe('evalCondition — npc_cleared / event_cleared / badge_earned', () => {
  it('npc_cleared reads defeated_trainers', () => {
    const state = stateWith({ defeated_trainers: ['silver_apparition1_cherrygrove'] })
    expect(
      evalCondition({ type: 'npc_cleared', npc_id: 'silver_apparition1_cherrygrove' }, state, ctx)
    ).toBe(true)
    expect(evalCondition({ type: 'npc_cleared', npc_id: 'youngster_joey_route30' }, state, ctx)).toBe(false)
    expect(
      evalCondition({ type: 'npc_cleared', npc_id: 'silver_apparition1_cherrygrove', negate: true }, state, ctx)
    ).toBe(false)
  })

  it('event_cleared reads cleared_events', () => {
    const state = stateWith({ cleared_events: ['misty_met_viewpoint'] })
    expect(evalCondition({ type: 'event_cleared', event_id: 'misty_met_viewpoint' }, state, ctx)).toBe(true)
    expect(evalCondition({ type: 'event_cleared', event_id: 'ice_path_puzzle_solved' }, state, ctx)).toBe(false)
    expect(
      evalCondition({ type: 'event_cleared', event_id: 'ice_path_puzzle_solved', negate: true }, state, ctx)
    ).toBe(true)
  })

  it('badge_earned reads badges[]', () => {
    const state = stateWith({ badges: [{ badge_id: 'falkner', earned_at: NOW.toISOString() }] })
    expect(evalCondition({ type: 'badge_earned', badge_id: 'falkner' }, state, ctx)).toBe(true)
    expect(evalCondition({ type: 'badge_earned', badge_id: 'bugsy' }, state, ctx)).toBe(false)
    expect(evalCondition({ type: 'badge_earned', badge_id: 'falkner', negate: true }, state, ctx)).toBe(false)
  })
})

describe('evalCondition — time_window', () => {
  const state = defaultPlayerState()

  it('matches the day of week against ctx.now', () => {
    expect(
      evalCondition({ type: 'time_window', days_of_week: ['wednesday'] }, state, ctx)
    ).toBe(true)
    expect(
      evalCondition({ type: 'time_window', days_of_week: ['tuesday'] }, state, ctx)
    ).toBe(false)
    expect(
      evalCondition({ type: 'time_window', days_of_week: ['monday', 'wednesday'] }, state, ctx)
    ).toBe(true)
  })

  it('matches a plain hour range (15:30 in [15, 16))', () => {
    expect(evalCondition({ type: 'time_window', hour_range: [15, 16] }, state, ctx)).toBe(true)
    expect(evalCondition({ type: 'time_window', hour_range: [16, 17] }, state, ctx)).toBe(false)
  })

  it('supports a wrap-around hour range like [20, 4]', () => {
    const night = { ...ctx, now: new Date(2026, 6, 29, 23, 0) }
    const morning = { ...ctx, now: new Date(2026, 6, 29, 3, 0) }
    const noon = { ...ctx, now: new Date(2026, 6, 29, 12, 0) }
    expect(evalCondition({ type: 'time_window', hour_range: [20, 4] }, state, night)).toBe(true)
    expect(evalCondition({ type: 'time_window', hour_range: [20, 4] }, state, morning)).toBe(true)
    expect(evalCondition({ type: 'time_window', hour_range: [20, 4] }, state, noon)).toBe(false)
  })

  it('requires both day and hour when both are given, and supports negate', () => {
    expect(
      evalCondition({ type: 'time_window', days_of_week: ['wednesday'], hour_range: [15, 16] }, state, ctx)
    ).toBe(true)
    expect(
      evalCondition({ type: 'time_window', days_of_week: ['tuesday'], hour_range: [15, 16] }, state, ctx)
    ).toBe(false)
    expect(
      evalCondition({ type: 'time_window', days_of_week: ['wednesday'], negate: true }, state, ctx)
    ).toBe(false)
  })

  it('an empty time_window is always true', () => {
    expect(evalCondition({ type: 'time_window' }, state, ctx)).toBe(true)
  })
})

describe('evalConditions — pure AND', () => {
  it('an empty array is true', () => {
    expect(evalConditions([], defaultPlayerState(), ctx)).toBe(true)
  })

  it('all conditions must hold', () => {
    const state = stateWith({
      inventory: { pokegear: 1 },
      badges: [{ badge_id: 'falkner', earned_at: NOW.toISOString() }],
    })
    const both: Condition[] = [
      { type: 'item_owned', item_id: 'pokegear' },
      { type: 'badge_earned', badge_id: 'falkner' },
    ]
    expect(evalConditions(both, state, ctx)).toBe(true)
    expect(
      evalConditions([...both, { type: 'event_cleared', event_id: 'nope' }], state, ctx)
    ).toBe(false)
  })
})

describe('isUnlocked', () => {
  it('an entity without unlock_conditions is always present', () => {
    expect(isUnlocked(undefined, defaultPlayerState(), ctx)).toBe(true)
  })

  it('gates presence on the conditions', () => {
    const conds: Condition[] = [
      { type: 'quest_step', quest_id: 'mystery_egg_errand', step: 'sent_by_elm', negate: true },
    ]
    expect(isUnlocked(conds, defaultPlayerState(), ctx)).toBe(true)
    expect(isUnlocked(conds, atStep('sent_by_elm'), ctx)).toBe(false)
  })
})

describe('selectDialogueState', () => {
  // Mom's real rule shape: most-advanced step first, default last
  const rules: StateRule[] = [
    { if: [{ type: 'quest_step', quest_id: 'mystery_egg_errand', step: 'egg_received' }], state: 'welcome_back' },
    { if: [{ type: 'quest_step', quest_id: 'mystery_egg_errand', step: 'sent_by_elm' }], state: 'give_pokegear' },
    { default: true, state: 'intro' },
  ]

  it('falls through to default when nothing matches', () => {
    expect(selectDialogueState(rules, defaultPlayerState(), ctx)).toBe('intro')
  })

  it('first match wins even though at-or-after makes later rules true too', () => {
    expect(selectDialogueState(rules, atStep('sent_by_elm'), ctx)).toBe('give_pokegear')
    expect(selectDialogueState(rules, atStep('egg_received'), ctx)).toBe('welcome_back')
    expect(selectDialogueState(rules, atStep('egg_delivered'), ctx)).toBe('welcome_back')
  })

  it('returns null when no rule matches and there is no default', () => {
    const noDefault: StateRule[] = [
      { if: [{ type: 'badge_earned', badge_id: 'falkner' }], state: 'later' },
    ]
    expect(selectDialogueState(noDefault, defaultPlayerState(), ctx)).toBe(null)
  })
})

describe('applyEffect — advance_quest', () => {
  const advance = (step_id: string): Effect => ({
    type: 'advance_quest',
    quest_id: 'mystery_egg_errand',
    step_id,
  })

  it('starts a quest at the requested step with the server timestamp', () => {
    const next = applyEffect(advance('sent_by_elm'), defaultPlayerState(), applyCtx)
    expect(next.quest_progress.mystery_egg_errand).toEqual({
      current_step: 'sent_by_elm',
      step_entered_at: NOW.toISOString(),
    })
  })

  it('advances forward, is a no-op at the same step or backward (idempotent)', () => {
    const s1 = applyEffect(advance('sent_by_elm'), defaultPlayerState(), applyCtx)
    const s2 = applyEffect(advance('egg_received'), s1, applyCtx)
    expect(s2.quest_progress.mystery_egg_errand.current_step).toBe('egg_received')
    expect(applyEffect(advance('egg_received'), s2, applyCtx)).toBe(s2)
    expect(applyEffect(advance('sent_by_elm'), s2, applyCtx)).toBe(s2)
  })

  it('reaching the final step marks the quest completed, once', () => {
    const s1 = applyEffect(advance('egg_delivered'), atStep('egg_received'), applyCtx)
    expect(s1.completed_quests).toContain('mystery_egg_errand')
    expect(applyEffect(advance('egg_delivered'), s1, applyCtx)).toBe(s1)
  })

  it('ignores unknown quests and unknown steps', () => {
    const state = defaultPlayerState()
    expect(applyEffect({ type: 'advance_quest', quest_id: 'nope', step_id: 'x' }, state, applyCtx)).toBe(state)
    expect(applyEffect(advance('not_a_step'), state, applyCtx)).toBe(state)
  })

  it('adverse order: a forward jump then an out-of-order earlier advance stays put', () => {
    const jumped = applyEffect(advance('egg_delivered'), defaultPlayerState(), applyCtx)
    expect(jumped.quest_progress.mystery_egg_errand.current_step).toBe('egg_delivered')
    expect(applyEffect(advance('sent_by_elm'), jumped, applyCtx)).toBe(jumped)
  })
})

describe('applyEffect — grant_item / remove_item', () => {
  it('unique item: granted once, inert when already owned', () => {
    const s1 = applyEffect({ type: 'grant_item', item_id: 'pokegear' }, defaultPlayerState(), applyCtx)
    expect(s1.inventory).toEqual({ pokegear: 1 })
    expect(applyEffect({ type: 'grant_item', item_id: 'pokegear' }, s1, applyCtx)).toBe(s1)
  })

  it('fungible item: every valid trigger increments the quantity', () => {
    const ctxFungible: ApplyContext = { ...applyCtx, itemKinds: { apricorn_ball: 'fungible' } }
    const s1 = applyEffect({ type: 'grant_item', item_id: 'apricorn_ball' }, defaultPlayerState(), ctxFungible)
    const s2 = applyEffect({ type: 'grant_item', item_id: 'apricorn_ball' }, s1, ctxFungible)
    expect(s2.inventory).toEqual({ apricorn_ball: 2 })
  })

  it('remove_item: no-op when absent, removes a unique item, decrements a fungible one', () => {
    const state = defaultPlayerState()
    expect(applyEffect({ type: 'remove_item', item_id: 'red_scale' }, state, applyCtx)).toBe(state)

    const owned = stateWith({ inventory: { red_scale: 1, apricorn_ball: 2 } })
    const s1 = applyEffect({ type: 'remove_item', item_id: 'red_scale' }, owned, applyCtx)
    expect(s1.inventory).toEqual({ apricorn_ball: 2 })

    const ctxFungible: ApplyContext = { ...applyCtx, itemKinds: { apricorn_ball: 'fungible' } }
    const s2 = applyEffect({ type: 'remove_item', item_id: 'apricorn_ball' }, s1, ctxFungible)
    expect(s2.inventory).toEqual({ apricorn_ball: 1 })
    const s3 = applyEffect({ type: 'remove_item', item_id: 'apricorn_ball' }, s2, ctxFungible)
    expect(s3.inventory).toEqual({})
  })
})

describe('applyEffect — grant_badge / unlock_text / unlock_zone / set_companion', () => {
  it('grant_badge appends {badge_id, earned_at} once', () => {
    const s1 = applyEffect({ type: 'grant_badge', badge_id: 'falkner' }, defaultPlayerState(), applyCtx)
    expect(s1.badges).toEqual([{ badge_id: 'falkner', earned_at: NOW.toISOString() }])
    expect(applyEffect({ type: 'grant_badge', badge_id: 'falkner' }, s1, applyCtx)).toBe(s1)
  })

  it('unlock_text adds to unlocked_texts once', () => {
    const s1 = applyEffect({ type: 'unlock_text', text_id: 'elm_great_text_new_bark' }, defaultPlayerState(), applyCtx)
    expect(s1.unlocked_texts).toEqual(['elm_great_text_new_bark'])
    expect(applyEffect({ type: 'unlock_text', text_id: 'elm_great_text_new_bark' }, s1, applyCtx)).toBe(s1)
  })

  it('unlock_zone adds to unlocked_zones once', () => {
    const s1 = applyEffect({ type: 'unlock_zone', zone_id: 'route-29' }, defaultPlayerState(), applyCtx)
    expect(s1.unlocked_zones).toEqual(['route-29'])
    expect(applyEffect({ type: 'unlock_zone', zone_id: 'route-29' }, s1, applyCtx)).toBe(s1)
  })

  it('set_companion writes only while companion_id is null — never re-chosen', () => {
    const s1 = applyEffect({ type: 'set_companion', companion_id: 'pikachu' }, defaultPlayerState(), applyCtx)
    expect(s1.companion_id).toBe('pikachu')
    expect(applyEffect({ type: 'set_companion', companion_id: 'tbd_2' }, s1, applyCtx)).toBe(s1)
  })
})

describe('applyEffects — sequences', () => {
  it('re-playing a state\'s effects returns the same state object (idempotence)', () => {
    // Mr. Pokémon's intro effects, replayed as a re-talk would
    const effects: Effect[] = [
      { type: 'grant_item', item_id: 'mystery_egg' },
      { type: 'advance_quest', quest_id: 'mystery_egg_errand', step_id: 'egg_received' },
    ]
    const s1 = applyEffects(effects, atStep('sent_by_elm'), applyCtx)
    expect(s1.inventory.mystery_egg).toBe(1)
    expect(s1.quest_progress.mystery_egg_errand.current_step).toBe('egg_received')
    expect(applyEffects(effects, s1, applyCtx)).toBe(s1)
  })

  it('an empty effect list is a no-op', () => {
    const state = defaultPlayerState()
    expect(applyEffects([], state, applyCtx)).toBe(state)
  })
})
