// La chaîne de leçons d'une zone, du point de vue du joueur (2026-08-07).
//
// POURQUOI
// --------
// L'ordre des leçons est IMPOSÉ (`resolveLessonInteraction` : un porteur qui
// n'est pas en tête de queue répond 「まだ　はやいよ」, quoi qu'il arrive). Cette
// règle est bonne — mais elle ne dit rien de la GÉOGRAPHIE, et c'est là que
// tout se joue :
//
//   - si le porteur de la leçon #4 est le premier qu'on croise en entrant, le
//     joueur se prend un refus avant d'avoir rien fait, sans savoir où aller ;
//   - si toutes les leçons d'une zone sont sur un seul PNJ enfermé dans une
//     maison, un joueur qui traverse la route dehors n'en voit AUCUNE — et
//     tous les garde-fous existants restent verts, puisque le porteur est
//     bel et bien « atteignable » (audit-first-gym-run.py).
//
// Les deux cas sont arrivés. Ce fichier les attrape en marchant réellement la
// zone : BFS depuis les tuiles d'entrée, puis vérification que les distances
// des porteurs suivent l'ordre des `sequence_index`. Un porteur d'intérieur
// compte à la distance de SA PORTE — c'est là que le joueur doit décider d'y
// aller.
//
// Contenu et registre réels, aucune fixture.
import { describe, it, expect } from 'vitest'
import { getZoneByName, getZoneNames } from './zones'
import { getDialogue, getLessonsForZone, getMapNpcs } from './content'
import { canTraverse, findOutdoorZoneAt, type Zone } from './zone-geometry'
import { defaultPlayerState, type PlayerState } from './condition-effect'
import { getQuestStepsIndex } from './content'
import {
  lessonQuestId,
  lessonStepId,
  nextLessonInZone,
  resolveLessonInteraction,
  withLessonQuestSteps,
} from './lessons'

const NO_ABILITIES = { surf: false, whirlpool: false, waterfall: false }

/** Le chemin critique en extérieur, chaque zone avec celle d'où l'on arrive.
 * Bourg Geon n'y est pas : c'est la zone de départ, elle n'a pas d'entrée. */
const PATH: { zoneId: string; zone: string; from: string }[] = [
  { zoneId: 'route-29', zone: 'MAP_ROUTE_29', from: 'MAP_NEW_BARK' },
  { zoneId: 'cherrygrove-city', zone: 'MAP_CHERRYGROVE', from: 'MAP_ROUTE_29' },
  { zoneId: 'route-30', zone: 'MAP_ROUTE_30', from: 'MAP_CHERRYGROVE' },
  { zoneId: 'route-31', zone: 'MAP_ROUTE_31', from: 'MAP_ROUTE_30' },
  { zoneId: 'violet-city', zone: 'MAP_VIOLET', from: 'MAP_ROUTE_31' },
]

/** Dette connue, à reprendre dans sa propre passe — PAS une exemption de
 * principe. Mauville sert la leçon #4 à 29 pas de l'entrée et la #2 à 68 :
 * le joueur croise d'abord le garçon du Mart, qui le rembarre. La liste est
 * vérifiée exacte plus bas : corriger la zone sans retirer sa ligne d'ici
 * fait rougir le test, exprès. */
const DETTE_CONNUE = ['violet-city']

/** Distance en pas depuis les tuiles par lesquelles on entre dans la zone. */
function walkDistances(zone: Zone, fromZoneName: string): Map<string, number> {
  const bounds = getZoneNames()
  const dist = new Map<string, number>()
  const queue: [number, number][] = []
  for (let ty = 0; ty < zone.tile_height; ty++) {
    for (let tx = 0; tx < zone.tile_width; tx++) {
      const wx = zone.world_origin_x + tx
      const wz = zone.world_origin_y + ty
      if (!canTraverse(zone, wx, wz, NO_ABILITIES)) continue
      const touchesEntry = ([
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const).some(([dx, dz]) => findOutdoorZoneAt(bounds, wx + dx, wz + dz, zone.name)?.name === fromZoneName)
      if (touchesEntry && !dist.has(`${tx},${ty}`)) {
        dist.set(`${tx},${ty}`, 0)
        queue.push([tx, ty])
      }
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const [x, y] = queue[head]
    const d = dist.get(`${x},${y}`)!
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = x + dx
      const ny = y + dz
      if (nx < 0 || ny < 0 || nx >= zone.tile_width || ny >= zone.tile_height) continue
      const key = `${nx},${ny}`
      if (dist.has(key)) continue
      if (!canTraverse(zone, zone.world_origin_x + nx, zone.world_origin_y + ny, NO_ABILITIES)) continue
      dist.set(key, d + 1)
      queue.push([nx, ny])
    }
  }
  return dist
}

/** À combien de pas de l'entrée le joueur DÉCIDE d'aborder ce porteur :
 * sa tuile s'il est dehors, la porte de sa pièce s'il est à l'intérieur. */
function stepsToHolder(zone: Zone, dist: Map<string, number>, npcRef: string): number | null {
  const npc = getMapNpcs().find(n => n.npc_id === npcRef)
  if (!npc) return null
  let tx = npc.tile_x
  let ty = npc.tile_y
  if (npc.map_zone && npc.map_zone !== zone.name) {
    const warp = zone.warps?.find(w => w.header === npc.map_zone)
    if (!warp) return null
    tx = warp.x - zone.world_origin_x
    ty = warp.z - zone.world_origin_y
  }
  const around = [
    [tx, ty],
    [tx + 1, ty],
    [tx - 1, ty],
    [tx, ty + 1],
    [tx, ty - 1],
  ]
    .map(([x, y]) => dist.get(`${x},${y}`))
    .filter((v): v is number => v !== undefined)
  return around.length ? Math.min(...around) : null
}

/** Les zones dont l'ordre des leçons contredit l'ordre de la marche. */
function zonesOutOfWalkingOrder(): string[] {
  return PATH.filter(({ zoneId, zone: zoneName, from }) => {
    const zone = getZoneByName(zoneName)
    if (!zone) return false
    const dist = walkDistances(zone, from)
    const steps = getLessonsForZone(zoneId)
      .slice()
      .sort((a, b) => a.sequence_index - b.sequence_index)
      .map(lesson => stepsToHolder(zone, dist, lesson.npc_ref))
    if (steps.some(s => s === null)) return true
    return steps.some((s, i) => i > 0 && s! < steps[i - 1]!)
  }).map(p => p.zoneId)
}

describe('l’ordre des leçons est celui de la marche', () => {
  it('sur le chemin critique, chaque leçon est plus loin de l’entrée que la précédente', () => {
    const coupables = zonesOutOfWalkingOrder().filter(z => !DETTE_CONNUE.includes(z))
    expect(coupables).toEqual([])
  })

  it('la dette connue est exactement celle qu’on croit', () => {
    // Si cette assertion casse parce qu'une zone a été RÉPARÉE, retirer sa
    // ligne de DETTE_CONNUE — c'est le but.
    expect(zonesOutOfWalkingOrder().sort()).toEqual([...DETTE_CONNUE].sort())
  })

  it('Route 30 : les quatre porteurs se croisent dans l’ordre, du sud vers le nord', () => {
    const zone = getZoneByName('MAP_ROUTE_30')!
    const dist = walkDistances(zone, 'MAP_CHERRYGROVE')
    const steps = getLessonsForZone('route-30')
      .slice()
      .sort((a, b) => a.sequence_index - b.sequence_index)
      .map(lesson => ({ ref: lesson.npc_ref, steps: stepsToHolder(zone, dist, lesson.npc_ref) }))
    expect(steps.map(s => s.ref)).toEqual([
      'entrance_boy_route30',
      'man_in_house_route30',
      'road_man_route30',
      'north_girl_route30',
    ])
    // Strictement croissant : aucun aller-retour, aucun ex æquo qui laisserait
    // le hasard décider qui on aborde en premier.
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].steps, `${steps[i].ref} vs ${steps[i - 1].ref}`).toBeGreaterThan(
        steps[i - 1].steps!
      )
    }
  })
})

describe('un porteur de leçon est utilisable par le moteur', () => {
  // Trois conditions, chacune déjà tombée en défaut au moins une fois :
  // sans `role: 'lesson'` le moteur n'ouvre jamais l'écran-livre ; sans
  // dialogue il n'a rien à dire avant ; sans nom japonais le Carnet affiche
  // du latin (« aucun latin à l'écran », journal § 6).
  const holders = PATH.flatMap(({ zoneId }) =>
    getLessonsForZone(zoneId).map(lesson => ({ zoneId, ref: lesson.npc_ref }))
  )

  it('chacun porte role: "lesson" sur son entrée carte', () => {
    const sans = holders.filter(
      h => getMapNpcs().find(n => n.npc_id === h.ref)?.role !== 'lesson'
    )
    expect(sans.map(h => `${h.zoneId}/${h.ref}`)).toEqual([])
  })

  it('chacun a un dialogue, et un nom japonais pour le Carnet', () => {
    const sans = holders.filter(h => {
      const npc = getMapNpcs().find(n => n.npc_id === h.ref)
      const dialogue = npc?.dialogue_ref ? getDialogue(npc.dialogue_ref) : null
      if (!dialogue) return true
      const jp = typeof dialogue.name === 'string' ? dialogue.name : dialogue.name?.jp
      return !jp || /[A-Za-z]/.test(jp.replace(/Mr\.|ポケモン/g, ''))
    })
    expect(sans.map(h => `${h.zoneId}/${h.ref}`)).toEqual([])
  })
})

describe('Route 30 — on ne prend pas les leçons dans le désordre', () => {
  const lessons = getLessonsForZone('route-30')
  const ctx = {
    questSteps: withLessonQuestSteps(getQuestStepsIndex(), 'route-30', lessons),
    now: new Date('2026-08-07T12:00:00Z'),
  }
  /** L'état joueur après avoir complété les leçons 1..n de la zone. */
  const afterLessons = (n: number): PlayerState => {
    const base = defaultPlayerState()
    if (n === 0) return base
    return {
      ...base,
      quest_progress: {
        ...base.quest_progress,
        [lessonQuestId('route-30')]: {
          current_step: lessonStepId(n),
          step_entered_at: '2026-08-07T12:00:00.000Z',
        },
      },
      completed_lessons: Array.from({ length: n }, (_, i) => `route-30#${i + 1}`),
    }
  }
  const holders = lessons
    .slice()
    .sort((a, b) => a.sequence_index - b.sequence_index)
    .map(l => l.npc_ref)

  it('à l’arrivée, seul le premier porteur donne une leçon — les trois autres bloquent', () => {
    const state = afterLessons(0)
    expect(resolveLessonInteraction(holders[0], lessons, state, ctx).kind).toBe('lesson')
    for (const ref of holders.slice(1)) {
      expect(resolveLessonInteraction(ref, lessons, state, ctx).kind, ref).toBe('blocked')
    }
  })

  it('la tête de queue avance d’un porteur à la fois, dans l’ordre', () => {
    for (let done = 0; done < holders.length; done++) {
      const state = afterLessons(done)
      expect(nextLessonInZone(lessons, state)?.npc_ref, `${done} leçon(s) faites`).toBe(
        holders[done]
      )
    }
  })

  it('la zone finie, plus personne ne bloque : tous redeviennent des PNJ ordinaires', () => {
    const state = afterLessons(holders.length)
    expect(nextLessonInZone(lessons, state)).toBeNull()
    for (const ref of holders) {
      expect(resolveLessonInteraction(ref, lessons, state, ctx).kind, ref).toBe(
        'fallback_dialogue'
      )
    }
  })

  it('aucun porteur n’est verrouillé par une condition : les quatre leçons sont prenables d’affilée', () => {
    // Un porteur gaté (badge, jour de la semaine, étape de quête) retomberait
    // sur `fallback_dialogue` au lieu d'ouvrir le livre — et la zone entière
    // se figerait derrière lui, puisque l'ordre est imposé.
    for (let done = 0; done < holders.length; done++) {
      const resolution = resolveLessonInteraction(holders[done], lessons, afterLessons(done), ctx)
      expect(resolution.kind, holders[done]).toBe('lesson')
    }
  })
})
