// Parcours « début de partie → première arène » (issue 13).
//
// `a1-traversal.test.ts` prouve la traversée du jalon 1 (Bourg Geon → Route 30).
// Ce fichier-ci prolonge la preuve jusqu'à Falkner : Route 31, Violet City, la
// Tour Grospignon dont la visite conditionne l'accès à l'arène, et l'arène
// elle-même. Le but n'est pas de re-tester la géométrie en général mais de
// répondre à une question précise : **un joueur peut-il aller au bout à pied ?**
//
// Les positions viennent du registre réel et du contenu réel — aucune fixture.
import { describe, it, expect } from 'vitest'
import {
  canTraverse,
  terrainAt,
  warpAt,
  ledgeDirAt,
  findOutdoorZoneAt,
  DIRECTION_BY_CODE,
  DIRECTION_DELTA,
  type Zone,
} from './zone-geometry'
import { getZoneByName, getZoneNames } from './zones'
import { getNpcsForZone } from './npcs'
import { getTrainersForZone } from './trainers'

const NO_ABILITIES = { surf: false, whirlpool: false, waterfall: false }

/** Le continuum extérieur du parcours, dans l'ordre du PRD. */
const OUTDOOR = [
  'MAP_NEW_BARK',
  'MAP_ROUTE_29',
  'MAP_CHERRYGROVE',
  'MAP_ROUTE_30',
  'MAP_ROUTE_31',
  'MAP_VIOLET',
]

const zoneOf = (name: string): Zone => {
  const zone = getZoneByName(name)
  expect(zone, name).toBeDefined()
  return zone!
}

const dry = (zone: Zone, x: number, z: number) => canTraverse(zone, x, z, NO_ABILITIES)

/** BFS du parcours réel, mêmes règles que MapClient : pas cardinal,
 * franchissement de bord entre zones extérieures, corniches à sens unique, et
 * **traversée des warps** — Route 31 et Violet City ne se touchent pas : elles
 * sont reliées par une guérite (MAP_ROUTE_31_VIOLET_GATEHOUSE), exactement
 * comme Route 29 et Route 46. Une marche qui ignore les portes ne peut pas
 * atteindre Violet, et conclurait à tort que la carte est coupée. */
function walkOutdoor(startName: string, startX: number, startZ: number): Set<string> {
  const zones = new Map<string, Zone>(OUTDOOR.map(n => [n, zoneOf(n)]))
  const bounds = getZoneNames().filter(z => OUTDOOR.includes(z.name))
  const key = (n: string, x: number, z: number) => `${n}:${x},${z}`
  const seen = new Set([key(startName, startX, startZ)])
  const queue: [string, number, number][] = [[startName, startX, startZ]]
  while (queue.length) {
    const [name, x, z] = queue.shift()!
    const zone = zones.get(name)!
    for (const dir of DIRECTION_BY_CODE) {
      const { dx, dz } = DIRECTION_DELTA[dir]
      let nx = x + dx
      let nz = z + dz
      let targetName = name
      let targetZone = zone
      if (terrainAt(zone, nx, nz) === null) {
        const next = findOutdoorZoneAt(bounds, nx, nz, name)
        if (!next || !zones.has(next.name)) continue
        targetName = next.name
        targetZone = zones.get(next.name)!
        if (!dry(targetZone, nx, nz)) continue
      } else if (!dry(zone, nx, nz)) {
        const ledge = ledgeDirAt(zone, nx, nz)
        if (ledge === null || DIRECTION_BY_CODE[ledge] !== dir) continue
        nx = x + 2 * dx
        nz = z + 2 * dz
        if (!dry(zone, nx, nz)) continue
      }
      const k = key(targetName, nx, nz)
      if (seen.has(k)) continue
      seen.add(k)
      const warp = warpAt(targetZone, nx, nz)
      if (!warp) {
        queue.push([targetName, nx, nz])
        continue
      }
      // Porte : on arrive dans la zone de destination sur son warp d'ancrage,
      // comme `enterWarp` (MapClient). Seules les guérites de transit sont
      // suivies — entrer dans une maison ne fait pas avancer le parcours, et
      // les intérieurs sont vérifiés séparément.
      if (typeof warp.header !== 'string' || !warp.header.includes('GATEHOUSE')) continue
      const inside = getZoneByName(warp.header)
      if (!inside) continue
      zones.set(inside.name, inside)
      const anchor = inside.warps[warp.anchor] ?? inside.warps[0]
      if (!anchor) continue
      const ik = key(inside.name, anchor.x, anchor.z)
      if (!seen.has(ik)) {
        seen.add(ik)
        // Depuis la guérite, on ressort par SES autres portes.
        for (const out of inside.warps) {
          if (typeof out.header !== 'string') continue
          const dest = zones.get(out.header) ?? getZoneByName(out.header)
          if (!dest) continue
          zones.set(dest.name, dest)
          const back = dest.warps[out.anchor] ?? dest.warps.find(w => w.header === inside.name)
          if (!back) continue
          const dk = key(dest.name, back.x, back.z)
          if (!seen.has(dk)) {
            seen.add(dk)
            queue.push([dest.name, back.x, back.z])
          }
        }
      }
    }
  }
  return seen
}

/** BFS dans une pièce, depuis toutes ses tuiles-portes. */
function walkInterior(zone: Zone): Set<string> {
  const key = (x: number, z: number) => `${x},${z}`
  const seen = new Set<string>()
  const queue: [number, number][] = []
  for (const warp of zone.warps) {
    if (!dry(zone, warp.x, warp.z)) continue
    seen.add(key(warp.x, warp.z))
    queue.push([warp.x, warp.z])
  }
  while (queue.length) {
    const [x, z] = queue.shift()!
    for (const { dx, dz } of Object.values(DIRECTION_DELTA)) {
      const nx = x + dx
      const nz = z + dz
      if (seen.has(key(nx, nz)) || !dry(zone, nx, nz)) continue
      seen.add(key(nx, nz))
      queue.push([nx, nz])
    }
  }
  return seen
}

const adjacentReached = (reached: Set<string>, x: number, z: number, prefix = '') =>
  Object.values(DIRECTION_DELTA).some(({ dx, dz }) =>
    reached.has(`${prefix}${x + dx},${z + dz}`)
  )

describe('parcours jusqu’à la première arène — la marche', () => {
  const start = zoneOf('MAP_NEW_BARK')
  // Départ : la tuile de la porte de la maison du joueur.
  const door = start.warps.find(w => String(w.header).includes('PLAYER_HOUSE'))!
  const reached = walkOutdoor('MAP_NEW_BARK', door.x, door.z)
  const zonesReached = new Set([...reached].map(k => k.split(':')[0]))

  it('les six zones du parcours sont atteintes à pied', () => {
    // « Au moins » et non « exactement » : suivre les guérites ouvre aussi des
    // routes voisines (Route 46, Route 36…). C'est le vrai comportement du
    // jeu — ce qui compte est qu'aucune des six ne manque.
    const missing = OUTDOOR.filter(n => !zonesReached.has(n))
    expect(missing).toEqual([])
  })

  it('la porte de la Tour Grospignon est atteignable depuis Violet City', () => {
    const violet = zoneOf('MAP_VIOLET')
    const towerDoors = violet.warps.filter(w => String(w.header).includes('SPROUT_TOWER'))
    expect(towerDoors.length, 'aucune porte de tour dans Violet City').toBeGreaterThan(0)
    for (const w of towerDoors) {
      expect(reached.has(`MAP_VIOLET:${w.x},${w.z}`), `porte tour (${w.x},${w.z})`).toBe(true)
    }
  })

  it('la porte de l’arène est atteignable depuis Violet City', () => {
    const violet = zoneOf('MAP_VIOLET')
    const gymDoors = violet.warps.filter(w => String(w.header).includes('VIOLET_GYM'))
    expect(gymDoors.length, 'aucune porte d’arène dans Violet City').toBeGreaterThan(0)
    for (const w of gymDoors) {
      expect(reached.has(`MAP_VIOLET:${w.x},${w.z}`), `porte arène (${w.x},${w.z})`).toBe(true)
    }
  })
})

describe('parcours jusqu’à la première arène — les rencontres', () => {
  it('les quatre sages de la Tour Grospignon sont atteignables dans leur étage', () => {
    for (const floor of ['MAP_SPROUT_TOWER_1F', 'MAP_SPROUT_TOWER_3F']) {
      const zone = zoneOf(floor)
      const inside = walkInterior(zone)
      expect(inside.size, `${floor} : aucune tuile atteinte depuis les portes`).toBeGreaterThan(0)
      for (const t of getTrainersForZone(zone)) {
        expect(
          adjacentReached(inside, t.world_x - zone.world_origin_x, t.world_z - zone.world_origin_y),
          `${t.trainer_id} injoignable dans ${floor}`
        ).toBe(true)
      }
    }
  })

  it('Falkner et ses deux gardes sont atteignables dans l’arène', () => {
    const gym = zoneOf('MAP_VIOLET_GYM')
    const inside = walkInterior(gym)
    const trainers = getTrainersForZone(gym)
    expect(trainers.map(t => t.trainer_id).sort()).toEqual([
      'bird_keeper_abe_violet_city',
      'bird_keeper_rod_violet_city',
      'falkner_violet_city',
    ])
    for (const t of trainers) {
      expect(
        adjacentReached(inside, t.world_x - gym.world_origin_x, t.world_z - gym.world_origin_y),
        `${t.trainer_id} injoignable dans l’arène`
      ).toBe(true)
    }
  })

  it('Silver attend au 3F de la tour, pas au rez-de-chaussée', () => {
    // La tuile (12,12) était juste ; c'est l'étage qui manquait, et le PNJ se
    // retrouvait dans un mur du 1F (audit première arène).
    const third = zoneOf('MAP_SPROUT_TOWER_3F')
    const silver = getNpcsForZone(third).find(n => n.npc_id === 'silver_sprout_tower')
    expect(silver, 'Silver absent du 3F').toBeDefined()
    expect(dry(third, silver!.world_x, silver!.world_z)).toBe(true)
    const first = zoneOf('MAP_SPROUT_TOWER_1F')
    expect(getNpcsForZone(first).find(n => n.npc_id === 'silver_sprout_tower')).toBeUndefined()
  })
})

describe('parcours jusqu’à la première arène — la matière enseignée', () => {
  it('l’arène arrive après un vrai volume de leçons, pas avant', () => {
    // Garde de rythme : si le chemin critique tombait sous ce seuil, le joueur
    // affronterait Falkner sans avoir de quoi construire un combat.
    const zones = [
      'new-bark-town',
      'route-29',
      'cherrygrove-city',
      'route-30',
      'route-31',
      'violet-city',
      'sprout-tower',
    ]
    const taught = new Set<string>()
    let lessons = 0
    for (const zoneId of zones) {
      const file = `../../content/lessons/${zoneId}.json`
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const entries = require(file) as { kanji_ids: string[] }[]
      lessons += entries.length
      for (const e of entries) for (const k of e.kanji_ids) taught.add(k)
    }
    expect(lessons).toBeGreaterThanOrEqual(20)
    expect(taught.size).toBeGreaterThanOrEqual(100)
  })
})
