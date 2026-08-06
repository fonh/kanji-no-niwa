// Verrous de progression (issue 13) — « on peut se déplacer partout sans que
// personne nous arrête ».
//
// Le point sensible n'est pas qu'un verrou bloque : c'est qu'il ne bloque QUE
// dans un sens et QUE tant que sa condition tient. Un verrou qui s'applique au
// retour enferme le joueur du mauvais côté — la même famille d'erreur que le
// patch de terrain qui avait muré un joueur dans une poche de 7 tuiles.
import { describe, it, expect } from 'vitest'
import { blockingRoadblock, getRoadblocks } from './roadblocks'
import type { PlayerState } from './condition-effect'

const emptyState = {
  quest_progress: {},
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
} as unknown as PlayerState

const withQuest = (questId: string, step: string): PlayerState =>
  ({
    ...emptyState,
    quest_progress: { [questId]: { current_step: step, step_entered_at: '2026-01-01T00:00:00Z' } },
  }) as unknown as PlayerState

// `quest_step` signifie « à ce stade ou après » : la comparaison porte sur
// l'ORDRE des étapes, donc l'index doit refléter les vraies quêtes.
const ctx = {
  questSteps: {
    mystery_egg_errand: ['sent_by_elm', 'egg_received', 'egg_delivered'],
    cherrygrove_welcome: ['shoes_given', 'map_given'],
  },
  now: new Date('2026-01-01T12:00:00Z'),
}

describe('blockingRoadblock', () => {
  it('barre la sortie de Bourg Geon tant que le Pr. Elm n’a pas envoyé le joueur', () => {
    const rb = blockingRoadblock('MAP_NEW_BARK', 'MAP_ROUTE_29', emptyState, ctx)
    expect(rb?.roadblock_id).toBe('elm_west_exit_new_bark')
  })

  it('laisse passer une fois la condition remplie', () => {
    const state = withQuest('mystery_egg_errand', 'sent_by_elm')
    expect(blockingRoadblock('MAP_NEW_BARK', 'MAP_ROUTE_29', state, ctx)).toBeNull()
  })

  it('ne barre QUE le sens aller — le retour n’est jamais bloqué', () => {
    // Sinon un joueur qui franchit la limite au moment où la condition tombe
    // se retrouve enfermé du mauvais côté.
    expect(blockingRoadblock('MAP_ROUTE_29', 'MAP_NEW_BARK', emptyState, ctx)).toBeNull()
  })

  it('ne barre pas un franchissement qu’aucun verrou ne concerne', () => {
    expect(blockingRoadblock('MAP_ROUTE_29', 'MAP_CHERRYGROVE', emptyState, ctx)).toBeNull()
  })

  it('barre Ville Griotte → Route 30 jusqu’à la PREMIÈRE réplique du guide', () => {
    // La condition portait sur sa DEUXIÈME réplique : il fallait buter trois
    // fois contre la sortie pour passer, et sa réplique d'adieu était livrée
    // comme un blocage (issue 13). Un verrou délégué à un PNJ doit se lever dès
    // ce que ce PNJ dit en premier — lint-roadblocks.py le vérifie désormais.
    const before = blockingRoadblock('MAP_CHERRYGROVE', 'MAP_ROUTE_30', emptyState, ctx)
    expect(before?.roadblock_id).toBe('guide_gent_cherrygrove_tour')
    expect(before?.npc_id).toBe('guide_gent_cherrygrove')
    const afterFirstLine = withQuest('cherrygrove_welcome', 'map_given')
    expect(blockingRoadblock('MAP_CHERRYGROVE', 'MAP_ROUTE_30', afterFirstLine, ctx)).toBeNull()
  })
})

describe('données des verrous', () => {
  it('chaque verrou dit d’où il vient (source vérifiable, pas inventé)', () => {
    for (const rb of getRoadblocks()) {
      expect(rb.source?.length, rb.roadblock_id).toBeGreaterThan(20)
    }
  })

  it('chaque verrou a une réplique et au moins une condition', () => {
    for (const rb of getRoadblocks()) {
      expect(rb.pages.length, rb.roadblock_id).toBeGreaterThan(0)
      expect(rb.unlock_conditions.length, rb.roadblock_id).toBeGreaterThan(0)
    }
  })

  it('aucun verrou ne barre une zone vers elle-même', () => {
    for (const rb of getRoadblocks()) {
      expect(rb.from_zone, rb.roadblock_id).not.toBe(rb.to_zone)
    }
  })
})
