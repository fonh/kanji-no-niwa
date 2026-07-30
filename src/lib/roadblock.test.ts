// Roadblock NPC (issue 10, CONTEXT.md) — machine d'interception générique :
// Sight Cone → le PNJ marche vers le joueur, livre sa ligne, repousse d'une
// case ; re-déclenche à chaque approche tant que sa condition n'est pas levée.
// Aucun PNJ à sight_auto_result: block dans les 4 zones du jalon (le seul du
// contenu est rocket_grunt_azalea, azalea-town, hors jalon) — la géométrie est
// donc testée sur données synthétiques + sur la forme du vrai enregistrement
// d'Azalea (mêmes champs registre).
import { describe, it, expect } from 'vitest'
import { findInterceptingNpc, interceptionApproach, pushBackTile } from './roadblock'
import { getNpcsForZone } from './npcs'
import { getZoneByName } from './zones'

const blocker = (over: Record<string, unknown> = {}) => ({
  npc_id: 'grunt',
  world_x: 10,
  world_z: 10,
  facing: 'south' as const,
  sight_range: 3,
  trigger_type: 'sight_auto',
  sight_auto_result: 'block',
  ...over,
})

describe('findInterceptingNpc', () => {
  it('détecte le joueur dans la ligne de vue (1 tuile de large, sight_range de long)', () => {
    expect(findInterceptingNpc([blocker()], 10, 13)?.npc_id).toBe('grunt')
    expect(findInterceptingNpc([blocker()], 10, 11)?.npc_id).toBe('grunt')
  })

  it('hors ligne de vue (au-delà de la portée, décalé, ou derrière) → null', () => {
    expect(findInterceptingNpc([blocker()], 10, 14)).toBeNull()
    expect(findInterceptingNpc([blocker()], 11, 12)).toBeNull()
    expect(findInterceptingNpc([blocker()], 10, 9)).toBeNull()
  })

  it('un PNJ talk ou sans résultat block ne déclenche jamais l’interception', () => {
    expect(findInterceptingNpc([blocker({ trigger_type: 'talk' })], 10, 12)).toBeNull()
    expect(findInterceptingNpc([blocker({ sight_auto_result: undefined })], 10, 12)).toBeNull()
  })

  it('détecte le VRAI Roadblock du contenu (rocket_grunt_azalea, via getNpcsForZone)', () => {
    // Le seul PNJ à sight_auto_result: block du contenu vit à azalea-town
    // (hors jalon) — on vérifie que ses champs registre traversent npcs.ts
    // et déclenchent la machine, en coordonnées monde réelles.
    const zone = getZoneByName('MAP_AZALEA')
    expect(zone).toBeDefined()
    const npcs = getNpcsForZone(zone!).filter(
      n => n.trigger_type === 'sight_auto' && n.sight_auto_result === 'block'
    )
    expect(npcs.map(n => n.npc_id)).toEqual(['rocket_grunt_azalea'])
    const raw = npcs[0]
    expect(raw.facing).toBe('south')
    expect(raw.sight_range).toBe(3)
    const grunt = { ...raw, facing: raw.facing!, sight_range: raw.sight_range! }
    // Deux cases devant lui, dans son axe de vue → interception.
    expect(
      findInterceptingNpc([grunt], grunt.world_x, grunt.world_z + 2)?.npc_id
    ).toBe('rocket_grunt_azalea')
  })
})

describe('interceptionApproach', () => {
  it('le PNJ marche jusqu’à la case adjacente au joueur, le long de son axe de vue', () => {
    // PNJ (10,10) sud, joueur (10,13) → il marche (10,11) puis (10,12).
    expect(interceptionApproach(blocker(), 10, 13)).toEqual([
      { x: 10, z: 11 },
      { x: 10, z: 12 },
    ])
  })

  it('joueur déjà adjacent → aucun déplacement', () => {
    expect(interceptionApproach(blocker(), 10, 11)).toEqual([])
  })

  it('fonctionne dans les quatre directions', () => {
    expect(interceptionApproach(blocker({ facing: 'east' }), 13, 10)).toEqual([
      { x: 11, z: 10 },
      { x: 12, z: 10 },
    ])
    expect(interceptionApproach(blocker({ facing: 'west' }), 8, 10)).toEqual([{ x: 9, z: 10 }])
    expect(interceptionApproach(blocker({ facing: 'north' }), 10, 8)).toEqual([{ x: 10, z: 9 }])
  })
})

describe('pushBackTile', () => {
  it('repousse le joueur d’une case dans la direction de vue du PNJ (loin de lui)', () => {
    expect(pushBackTile(blocker(), 10, 12)).toEqual({ x: 10, z: 13 })
    expect(pushBackTile(blocker({ facing: 'east' }), 12, 10)).toEqual({ x: 13, z: 10 })
    expect(pushBackTile(blocker({ facing: 'north' }), 10, 8)).toEqual({ x: 10, z: 7 })
    expect(pushBackTile(blocker({ facing: 'west' }), 8, 10)).toEqual({ x: 7, z: 10 })
  })
})
