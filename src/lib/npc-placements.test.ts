// Placements conditionnels (issue 13, content/opening-sequence.md).
//
// Le jeu d'origine déplace ses figurants au fil de l'histoire — l'assistant
// d'Elm quitte le labo pour le comptoir du Mart de Mauville quand Elm rappelle
// le joueur après le premier badge. Le moteur ne savait donner qu'UNE position par PNJ, ce qui
// obligeait soit à le figer, soit à le dupliquer sous un autre identifiant
// (donc à perdre son dialogue et son rôle).
import { describe, it, expect } from 'vitest'
import { activePlacement, getNpcsForZone } from './npcs'
import { getZoneByName } from './zones'
import type { Condition, PlayerState } from './condition-effect'

const ctx = {
  questSteps: {
    mystery_egg_errand: ['sent_by_elm', 'egg_received', 'egg_delivered'],
  },
  now: new Date('2026-01-01T12:00:00Z'),
}

const atStep = (step: string): Condition => ({
  type: 'quest_step',
  quest_id: 'mystery_egg_errand',
  step,
})

const stateAt = (step: string | null): PlayerState =>
  ({
    quest_progress: step
      ? { mystery_egg_errand: { current_step: step, step_entered_at: '2026-01-01T00:00:00Z' } }
      : {},
    completed_quests: [],
    completed_lessons: [],
    visited_zones: [],
    unlocked_zones: [],
    defeated_trainers: [],
    cleared_events: [],
    unlocked_texts: [],
    registered_trainers: [],
    inventory: {},
    badges: [],
    companion_id: null,
    pokeathlon_score: 0,
    current_zone: 'MAP_NEW_BARK',
  }) as unknown as PlayerState

describe('activePlacement', () => {
  const npc = {
    map_zone: 'MAP_A',
    tile_x: 1,
    tile_y: 1,
    placements: [
      { map_zone: 'MAP_LATE', tile_x: 9, tile_y: 9, conditions: [atStep('egg_delivered')] },
      { map_zone: 'MAP_MID', tile_x: 5, tile_y: 5, conditions: [atStep('egg_received')] },
      { map_zone: 'MAP_EARLY', tile_x: 2, tile_y: 2 },
    ],
  }

  it('sans état : le poste par défaut, celui du début de partie', () => {
    // Les appelants purs (audits de traversée) n'ont pas d'état joueur ; le
    // repli doit décrire le jeu à son début, l'état où la carte doit être
    // franchissable.
    expect(activePlacement(npc)).toMatchObject({ map_zone: 'MAP_EARLY', tile_x: 2 })
  })

  it('le PREMIER poste dont les conditions tiennent gagne', () => {
    expect(activePlacement(npc, { state: stateAt('egg_received'), ctx })).toMatchObject({
      map_zone: 'MAP_MID',
    })
    // `quest_step` signifie « à ce stade OU APRÈS » : à egg_delivered, les deux
    // conditions tiennent. C'est l'ordre de la liste — du plus tardif au plus
    // précoce — qui fait gagner le bon poste.
    expect(activePlacement(npc, { state: stateAt('egg_delivered'), ctx })).toMatchObject({
      map_zone: 'MAP_LATE',
    })
  })

  it('avant toute condition : le poste par défaut', () => {
    expect(activePlacement(npc, { state: stateAt(null), ctx })).toMatchObject({
      map_zone: 'MAP_EARLY',
    })
  })

  it('un PNJ sans placements garde sa position fixe', () => {
    expect(activePlacement({ map_zone: 'MAP_A', tile_x: 3, tile_y: 4 })).toMatchObject({
      map_zone: 'MAP_A',
      tile_x: 3,
      tile_y: 4,
    })
  })
})

describe('l’assistant d’Elm change vraiment de carte (contenu réel)', () => {
  const lab = getZoneByName('MAP_NEW_BARK_ELMS_LAB_1F')!
  const mart = getZoneByName('MAP_VIOLET_POKEMART')!
  const find = (zone: typeof lab, state: PlayerState) =>
    getNpcsForZone(zone, { state, ctx }).find(n => n.npc_id === 'elm_assistant_new_bark')

  const withBadge = (state: PlayerState): PlayerState =>
    ({ ...state, badges: [{ badge_id: 'falkner', earned_at: '2026-01-02T00:00:00Z' }] }) as unknown as PlayerState

  it('au labo au début, jamais au Mart', () => {
    const state = stateAt(null)
    expect(find(lab, state)).toBeDefined()
    expect(find(mart, state)).toBeUndefined()
  })

  it('toujours au labo pendant toute la course de l’œuf', () => {
    for (const step of ['sent_by_elm', 'egg_received', 'egg_delivered']) {
      const state = stateAt(step)
      expect(find(lab, state)).toBeDefined()
      expect(find(mart, state)).toBeUndefined()
    }
  })

  it('au comptoir du Mart de Mauville une fois le premier badge décroché', () => {
    const state = withBadge(stateAt('egg_delivered'))
    expect(find(mart, state)).toBeDefined()
    expect(find(lab, state)).toBeUndefined()
  })
})
