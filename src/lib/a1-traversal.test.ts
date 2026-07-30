// Test d'intégration « traversée » (issue 10) — simule le parcours A1 en
// mémoire, aussi loin que possible sans navigateur ni base : géométrie RÉELLE
// (src/data/zone-registry.json), contenu RÉEL (content/), moteur RÉEL
// (condition-effect, lessons, progression-engine, zone-gate).
//
// Partie 1 — géométrie : le monde extérieur du jalon (Bourg Geon → Route 29 →
// Ville Griotte → Route 30) est continûment marchable, chaque intérieur est
// navigable (entrer par le warp, en ressortir), le spawn d'onboarding mène
// dehors. Fidélité des interactions (issue 12) : CHAQUE PNJ/dresseur/objet du
// jalon est interagible par A depuis une tuile adjacente marchable atteinte à
// pied — aucun clic nécessaire nulle part (le tap-marqueur de contournement
// de l'issue 10 est supprimé de MapClient) ; l'embuscade de Silver #1 barre
// OBLIGATOIREMENT le chemin de retour de chez Mr. Pokémon, comme en HGSS.
//
// Partie 2 — gate SRS : jour 1 (aucune carte) le monde s'ouvre, leçons 1-2 →
// cartes dues demain, la course de l'œuf se joue, leçons 3-5 ; jour 2 les
// cartes sont dues → toute NOUVELLE zone extérieure est bloquée (jamais un
// retour, jamais un intérieur) ; session faite → le gate s'ouvre.
import { describe, it, expect } from 'vitest'
import {
  canTraverse,
  findOutdoorZoneAt,
  ledgeDirAt,
  terrainAt,
  warpAt,
  DIRECTION_BY_CODE,
  DIRECTION_DELTA,
  type Zone,
} from './zone-geometry'
import { getZoneByName, getZoneNames } from './zones'
import {
  applyEffects,
  defaultPlayerState,
  selectDialogueState,
  type ApplyContext,
  type PlayerState,
} from './condition-effect'
import { getDialogue, getLessonsForZone, getQuestStepsIndex, type DialogueFile } from './content'
import {
  buildNewCards,
  lessonId,
  lessonQuestId,
  lessonStepId,
  nextMorningDue,
  resolveLessonInteraction,
  withLessonQuestSteps,
} from './lessons'
import { getDailySRSStatus } from './progression-engine'
import { gateBlocksEntry } from './zone-gate'
import { getNpcsForZone } from './npcs'
import { getTrainersForZone, isInSightLine } from './trainers'
import { filterVisibleNpcs, filterVisibleTrainers } from './map-visibility'

const NO_ABILITIES = { surf: false, whirlpool: false, waterfall: false }
const OUTDOOR_NAMES = ['MAP_NEW_BARK', 'MAP_ROUTE_29', 'MAP_CHERRYGROVE', 'MAP_ROUTE_30']
const JALON_PREFIXES = OUTDOOR_NAMES

const zoneOf = (name: string): Zone => {
  const zone = getZoneByName(name)
  expect(zone, name).toBeDefined()
  return zone!
}

/** Marchable à pied sec (tuile sol/glace, ou tuile-warp — les portes sont
 * toujours franchissables, comme dans canTraverse). */
const dry = (zone: Zone, wx: number, wz: number) =>
  canTraverse(zone, wx, wz, NO_ABILITIES)

/** BFS dans UNE zone depuis une tuile : l'ensemble atteint. Un warp compte
 * comme atteint mais on n'avance pas À TRAVERS (y marcher téléporte). */
function bfsInZone(zone: Zone, startX: number, startZ: number): Set<string> {
  const key = (x: number, z: number) => `${x},${z}`
  const seen = new Set([key(startX, startZ)])
  const queue: [number, number][] = [[startX, startZ]]
  while (queue.length) {
    const [x, z] = queue.shift()!
    for (const { dx, dz } of Object.values(DIRECTION_DELTA)) {
      const nx = x + dx
      const nz = z + dz
      if (seen.has(key(nx, nz)) || !dry(zone, nx, nz)) continue
      seen.add(key(nx, nz))
      if (!warpAt(zone, nx, nz)) queue.push([nx, nz])
    }
  }
  return seen
}

/** BFS multi-zones sur le continuum extérieur du jalon — reproduit la règle
 * de mouvement de MapClient : pas cardinal, franchissement de bord via
 * findOutdoorZoneAt, saut de corniche dans le sens autorisé, warps = sorties
 * (pas des couloirs). */
function bfsOutdoor(startName: string, startX: number, startZ: number) {
  const zones = new Map(OUTDOOR_NAMES.map(n => [n, zoneOf(n)]))
  const bounds = getZoneNames().filter(z => OUTDOOR_NAMES.includes(z.name))
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
        // bord de zone : le continuum extérieur continue-t-il ?
        const next = findOutdoorZoneAt(bounds, nx, nz, name)
        if (!next || !zones.has(next.name)) continue
        targetName = next.name
        targetZone = zones.get(next.name)!
        if (!dry(targetZone, nx, nz)) continue
      } else if (!dry(zone, nx, nz)) {
        // corniche à sens unique (HGSS) : atterrit une tuile plus loin
        const ledgeDir = ledgeDirAt(zone, nx, nz)
        if (ledgeDir === null || DIRECTION_BY_CODE[ledgeDir] !== dir) continue
        nx = x + 2 * dx
        nz = z + 2 * dz
        if (!dry(zone, nx, nz)) continue
      }
      const k = key(targetName, nx, nz)
      if (seen.has(k)) continue
      seen.add(k)
      if (!warpAt(targetZone, nx, nz)) queue.push([targetName, nx, nz])
    }
  }
  return seen
}

describe('A1 — géométrie du jalon (registre réel)', () => {
  // Départ : devant la porte de la maison du joueur (la tuile sèche la plus
  // proche de la porte, comme à la sortie de l'onboarding).
  const outdoorReach = bfsOutdoor('MAP_NEW_BARK', 694, 397)
  const reached = (name: string, wx: number, wz: number) =>
    outdoorReach.has(`${name}:${wx},${wz}`)

  it('le continuum extérieur est traversable à pied : Bourg Geon → Route 29 → Ville Griotte → Route 30', () => {
    const zonesReached = new Set([...outdoorReach].map(k => k.split(':')[0]))
    expect([...zonesReached].sort()).toEqual([...OUTDOOR_NAMES].sort())
  })

  it('CHAQUE porte (warp) des 4 zones extérieures est atteignable à pied', () => {
    for (const name of OUTDOOR_NAMES) {
      const zone = zoneOf(name)
      for (const warp of zone.warps) {
        expect(reached(name, warp.x, warp.z), `${name} warp (${warp.x},${warp.z})`).toBe(true)
      }
    }
  })

  it('chaque intérieur du jalon est navigable : tuile d’arrivée marchable, toutes les sorties atteignables', () => {
    const visited = new Set<string>()
    const queue = OUTDOOR_NAMES.map(zoneOf)
    while (queue.length) {
      const zone = queue.shift()!
      for (const warp of zone.warps) {
        if (typeof warp.header !== 'string') continue
        if (!JALON_PREFIXES.some(p => warp.header === p || (warp.header as string).startsWith(`${p}_`)))
          continue
        const target = zoneOf(warp.header)
        const anchor = target.warps[warp.anchor]
        expect(anchor, `${zone.name}→${target.name} anchor ${warp.anchor}`).toBeDefined()
        expect(dry(target, anchor.x, anchor.z), `${target.name} arrivée (${anchor.x},${anchor.z})`).toBe(true)
        if (visited.has(target.name) || target.is_outdoor) continue
        visited.add(target.name)
        const reach = bfsInZone(target, anchor.x, anchor.z)
        for (const w of target.warps) {
          expect(reach.has(`${w.x},${w.z}`), `${target.name} sortie (${w.x},${w.z})`).toBe(true)
        }
        queue.push(target)
      }
    }
    // Les 7 intérieurs de Bourg Geon + les 2 maisons de Route 30 + la
    // gatehouse de Route 29 + les 6 intérieurs de Ville Griotte.
    expect([...visited].sort()).toEqual([
      'MAP_CHERRYGROVE_GUIDE_GENT_HOUSE',
      'MAP_CHERRYGROVE_POKECENTER_1F',
      'MAP_CHERRYGROVE_POKECENTER_B1F',
      'MAP_CHERRYGROVE_POKEMART',
      'MAP_CHERRYGROVE_SOUTHEAST_HOUSE',
      'MAP_CHERRYGROVE_SOUTHWEST_HOUSE',
      'MAP_NEW_BARK_ELMS_LAB_1F',
      'MAP_NEW_BARK_ELMS_LAB_2F',
      'MAP_NEW_BARK_PLAYER_HOUSE_1F',
      'MAP_NEW_BARK_PLAYER_HOUSE_2F',
      'MAP_NEW_BARK_RIVAL_HOUSE_1F',
      'MAP_NEW_BARK_RIVAL_HOUSE_2F',
      'MAP_NEW_BARK_SOUTHWEST_HOUSE',
      'MAP_ROUTE_29_ROUTE_46_GATEHOUSE',
      'MAP_ROUTE_30_APRICORN_HOUSE',
      'MAP_ROUTE_30_MR_POKEMON_HOUSE',
    ])
  })

  it('spawn d’onboarding (chambre 2F, tuile 6,6) → escalier → 1F → porte de sortie', () => {
    const h2 = zoneOf('MAP_NEW_BARK_PLAYER_HOUSE_2F')
    expect(dry(h2, 6, 6)).toBe(true)
    const stairs = h2.warps[0]
    expect(bfsInZone(h2, 6, 6).has(`${stairs.x},${stairs.z}`)).toBe(true)
    const h1 = zoneOf(stairs.header as string)
    const arrival = h1.warps[stairs.anchor]
    const exit = h1.warps.find(w => w.header === 'MAP_NEW_BARK')!
    expect(bfsInZone(h1, arrival.x, arrival.z).has(`${exit.x},${exit.z}`)).toBe(true)
  })

  // Fidélité des interactions (issue 12) : plus AUCUN tap-marqueur — chaque
  // entité doit donc être interagible par A depuis une tuile adjacente
  // marchable atteinte à pied. Les placements épinglés par l'issue 10
  // (Silver #1, Mom sur la porte, Elm/assistant/PC/panneau injoignables)
  // sont corrigés dans content/map/ — ces assertions les verrouillent.
  it('CHAQUE PNJ/dresseur/objet extérieur du jalon est interagible par A depuis une tuile adjacente atteinte à pied', () => {
    const adjacentReachable = (zoneName: string, wx: number, wz: number) =>
      Object.values(DIRECTION_DELTA).some(({ dx, dz }) => reached(zoneName, wx + dx, wz + dz))
    let checked = 0
    for (const name of OUTDOOR_NAMES) {
      const zone = zoneOf(name)
      for (const npc of getNpcsForZone(zone)) {
        expect(adjacentReachable(name, npc.world_x, npc.world_z), `${npc.npc_id} (${name})`).toBe(true)
        checked++
      }
      for (const trainer of getTrainersForZone(zone)) {
        expect(
          adjacentReachable(name, trainer.world_x, trainer.world_z),
          `${trainer.trainer_id} (${name})`
        ).toBe(true)
        checked++
      }
    }
    // Garde-fou : le panneau de Route 29, Silver #1 et sa carte (ex-cassés,
    // corrigés) sont bien passés dans la boucle.
    expect(checked).toBeGreaterThanOrEqual(15)
  })

  // Les PNJ d'intérieur (issue 12) : Mom vit dans SA maison (plus sur la
  // tuile-porte extérieure), Elm et son assistant dans le labo, le PC dans
  // la chambre, l'employée dans le Centre Pokémon — servis via `map_zone`
  // (npcs.ts) et interagibles par A depuis une tuile adjacente atteinte
  // depuis la porte de la pièce.
  const INTERIOR_NPCS: Record<string, string[]> = {
    MAP_NEW_BARK_PLAYER_HOUSE_1F: ['mom_new_bark'],
    MAP_NEW_BARK_PLAYER_HOUSE_2F: ['player_pc_new_bark'],
    MAP_NEW_BARK_ELMS_LAB_1F: ['prof_elm_lab', 'elm_assistant_new_bark'],
    MAP_CHERRYGROVE_POKECENTER_1F: ['pokecenter_clerk_cherrygrove'],
  }

  it('les PNJ d’intérieur sont servis DANS leur pièce et interagibles par A depuis la porte', () => {
    for (const [zoneName, expected] of Object.entries(INTERIOR_NPCS)) {
      const zone = zoneOf(zoneName)
      const npcs = getNpcsForZone(zone)
      expect(npcs.map(n => n.npc_id).sort(), zoneName).toEqual([...expected].sort())
      for (const npc of npcs) {
        // Jamais posé sur une porte (la classe de bug « Mom bloque l'entrée »).
        expect(warpAt(zone, npc.world_x, npc.world_z), `${npc.npc_id} sur une tuile-porte`).toBeUndefined()
        // Une tuile adjacente marchable est atteignable depuis chaque porte.
        const adjacentOk = zone.warps.some(door => {
          const reach = bfsInZone(zone, door.x, door.z)
          return Object.values(DIRECTION_DELTA).some(({ dx, dz }) =>
            reach.has(`${npc.world_x + dx},${npc.world_z + dz}`)
          )
        })
        expect(adjacentOk, `${npc.npc_id} (${zoneName})`).toBe(true)
      }
    }
    // Et ils ne sont PLUS servis dans la zone extérieure de rattachement.
    const outdoorIds = new Set(
      OUTDOOR_NAMES.flatMap(name => getNpcsForZone(zoneOf(name)).map(n => n.npc_id))
    )
    for (const id of Object.values(INTERIOR_NPCS).flat()) {
      expect(outdoorIds.has(id), `${id} encore servi dehors`).toBe(false)
    }
  })

  it('aucune entité du jalon ne se tient sur une tuile-porte (warp)', () => {
    const zonesToCheck = [...OUTDOOR_NAMES, ...Object.keys(INTERIOR_NPCS)]
    for (const name of zonesToCheck) {
      const zone = zoneOf(name)
      for (const npc of getNpcsForZone(zone)) {
        expect(warpAt(zone, npc.world_x, npc.world_z), `${npc.npc_id} (${name})`).toBeUndefined()
      }
      for (const trainer of getTrainersForZone(zone)) {
        expect(warpAt(zone, trainer.world_x, trainer.world_z), `${trainer.trainer_id} (${name})`).toBeUndefined()
      }
    }
  })
})

// Silver #1 (issue 12) — l'embuscade HGSS : au retour de chez Mr. Pokémon
// (Route 30 → Ville Griotte → Route 29), Silver intercepte OBLIGATOIREMENT le
// joueur sur le corridor est de la ville. Prouvé en géométrie réelle : tout
// chemin du bord Route 30 au bord Route 29 traverse sa ligne de vue. Et comme
// en HGSS (objet caché piloté par script), il n'existe PAS à l'aller :
// unlock_conditions le fait apparaître à egg_received seulement.
describe('A1 — embuscade de Silver #1 (Ville Griotte, retour de chez Mr. Pokémon)', () => {
  const zone = zoneOf('MAP_CHERRYGROVE')
  const silver = getTrainersForZone(zone).find(t => t.trainer_id === 'silver_apparition1_cherrygrove')!

  const sightTiles = (): [number, number][] => {
    const tiles: [number, number][] = []
    const { dx, dz } = DIRECTION_DELTA[silver.facing]
    for (let i = 1; i <= silver.sight_range; i++) {
      tiles.push([silver.world_x + i * dx, silver.world_z + i * dz])
    }
    return tiles
  }

  // Bord d'entrée depuis Route 30 (nord) et bord de sortie vers Route 29
  // (est) — les tuiles de Ville Griotte marchables des deux côtés du
  // franchissement continu (règle findOutdoorZoneAt de MapClient).
  const borderTiles = (neighbor: string) => {
    const other = zoneOf(neighbor)
    const tiles: [number, number][] = []
    for (let x = zone.world_origin_x; x < zone.world_origin_x + zone.tile_width; x++) {
      for (let z = zone.world_origin_y; z < zone.world_origin_y + zone.tile_height; z++) {
        if (!dry(zone, x, z)) continue
        for (const { dx, dz } of Object.values(DIRECTION_DELTA)) {
          if (terrainAt(zone, x + dx, z + dz) === null && dry(other, x + dx, z + dz)) {
            tiles.push([x, z])
          }
        }
      }
    }
    return tiles
  }

  /** BFS dans Ville Griotte, dresseur solide (règle isTileOccupied de
   * MapClient), tuiles `blocked` interdites. */
  const bfsAvoiding = (starts: [number, number][], blocked: Set<string>) => {
    const key = (x: number, z: number) => `${x},${z}`
    const seen = new Set(starts.map(([x, z]) => key(x, z)))
    const queue = [...starts]
    while (queue.length) {
      const [x, z] = queue.shift()!
      for (const { dx, dz } of Object.values(DIRECTION_DELTA)) {
        const nx = x + dx
        const nz = z + dz
        const k = key(nx, nz)
        if (seen.has(k) || blocked.has(k)) continue
        if (nx === silver.world_x && nz === silver.world_z) continue // dresseur solide
        if (!dry(zone, nx, nz)) continue
        seen.add(k)
        if (!warpAt(zone, nx, nz)) queue.push([nx, nz])
      }
    }
    return seen
  }

  it('sa position et toute sa ligne de vue sont marchables : l’embuscade PEUT se déclencher', () => {
    expect(dry(zone, silver.world_x, silver.world_z)).toBe(true)
    for (const [x, z] of sightTiles()) {
      expect(dry(zone, x, z), `tuile de vue (${x},${z})`).toBe(true)
      expect(isInSightLine(silver, x, z)).toBe(true)
    }
  })

  it('TOUT chemin de retour Route 30 → Route 29 traverse sa ligne de vue (embuscade inévitable)', () => {
    const fromRoute30 = borderTiles('MAP_ROUTE_30')
    const toRoute29 = borderTiles('MAP_ROUTE_29')
    expect(fromRoute30.length).toBeGreaterThan(0)
    expect(toRoute29.length).toBeGreaterThan(0)

    // Ligne de vue interdite → la sortie est est INATTEIGNABLE : pas de
    // chemin qui esquive l'embuscade.
    const cone = new Set(sightTiles().map(([x, z]) => `${x},${z}`))
    const avoiding = bfsAvoiding(fromRoute30, cone)
    for (const [x, z] of toRoute29) {
      expect(avoiding.has(`${x},${z}`), `sortie est (${x},${z}) atteinte en esquivant le cône`).toBe(false)
    }

    // Sanité : en acceptant de traverser le cône, le retour passe.
    const through = bfsAvoiding(fromRoute30, new Set())
    expect(toRoute29.some(([x, z]) => through.has(`${x},${z}`))).toBe(true)
  })

  it('comme le script HGSS : absent à l’aller, présent au retour (egg_received), la carte tombe après le combat', () => {
    const ctx: ApplyContext = { questSteps: getQuestStepsIndex(), now: new Date('2026-07-30T12:00:00Z') }
    const trainers = getTrainersForZone(zone)

    // À l'aller (aucune quête avancée) : Silver n'existe pas sur la carte.
    const before = defaultPlayerState()
    expect(
      filterVisibleTrainers(trainers, before).map(t => t.trainer_id)
    ).not.toContain('silver_apparition1_cherrygrove')

    // Au retour (œuf reçu) : il est là, embuscade armée (sight_auto).
    const after = applyEffects(
      [{ type: 'advance_quest', quest_id: 'mystery_egg_errand', step_id: 'egg_received' }],
      before,
      ctx
    )
    const visible = filterVisibleTrainers(trainers, after)
    const present = visible.find(t => t.trainer_id === 'silver_apparition1_cherrygrove')
    expect(present).toBeDefined()
    expect(present!.trigger_type).toBe('sight_auto')
    expect(present!.role).toBe('battle')

    // Sa carte de dresseur n'apparaît qu'une fois Silver battu, une tuile à
    // côté de sa position (ramassable par A).
    const npcs = getNpcsForZone(zone)
    expect(filterVisibleNpcs(npcs, after).map(n => n.npc_id)).not.toContain('silver_card_cherrygrove')
    const cleared = {
      ...after,
      defeated_trainers: [...after.defeated_trainers, 'silver_apparition1_cherrygrove'],
    }
    const card = filterVisibleNpcs(npcs, cleared).find(n => n.npc_id === 'silver_card_cherrygrove')
    expect(card).toBeDefined()
    expect(Math.abs(card!.world_x - silver.world_x) + Math.abs(card!.world_z - silver.world_z)).toBe(1)
  })
})

describe('A1 — progression + gate SRS sur les jours simulés (contenu réel)', () => {
  const DAY1 = new Date('2026-07-30T12:00:00Z')
  const DAY2 = new Date('2026-07-31T09:00:00Z')
  const TZ = 0

  const lessons = getLessonsForZone('new-bark-town')
  const ctx: ApplyContext = {
    questSteps: withLessonQuestSteps(getQuestStepsIndex(), 'new-bark-town', lessons),
    now: DAY1,
  }

  const talkTo = (dialogue: DialogueFile, state: PlayerState): PlayerState => {
    const reached = selectDialogueState(dialogue.state_rules, state, ctx)
    expect(reached).not.toBe(null)
    return applyEffects(dialogue.dialogue_states[reached!].effects ?? [], state, ctx)
  }

  /** Ce que fait completeLesson (issue 05), en mémoire : cartes créées dues
   * au lendemain, quête implicite avancée, leçon marquée complétée. */
  const completeLesson = (
    state: PlayerState,
    cards: { next_review_at: string }[],
    seq: number
  ): PlayerState => {
    const lesson = lessons.find(l => l.sequence_index === seq)!
    cards.push(...buildNewCards(lesson.kanji_ids, DAY1, nextMorningDue(DAY1, TZ)))
    const next = applyEffects(
      [{ type: 'advance_quest', quest_id: lessonQuestId('new-bark-town'), step_id: lessonStepId(seq) }],
      state,
      ctx
    )
    return { ...next, completed_lessons: [...next.completed_lessons, lessonId('new-bark-town', seq)] }
  }

  it('joue le parcours : leçons 1-2 → course de l’œuf → leçons 3-5 → lendemain gaté → session → gate ouvert', () => {
    const elm = getDialogue('npcs/new-bark-town/prof_elm_lab')!
    const mrPokemon = getDialogue('npcs/route-30/mr_pokemon_route30')!
    const route29 = { name: 'MAP_ROUTE_29', is_outdoor: true }
    const route31 = zoneOf('MAP_ROUTE_31')
    expect(route31.is_outdoor).toBe(true)

    let state = defaultPlayerState()
    const cards: { next_review_at: string }[] = []
    const reviews: { reviewed_at: string }[] = []
    const visited = ['MAP_NEW_BARK_PLAYER_HOUSE_2F', 'MAP_NEW_BARK']
    const dueAt = (now: Date) =>
      cards.filter(c => new Date(c.next_review_at).getTime() <= now.getTime())
    const srsDone = (now: Date) =>
      getDailySRSStatus(reviews, dueAt(now), { serverNow: now, tzOffsetMinutes: TZ }).sessionDone

    // Jour 1, aucune carte : la session est réputée faite, rien n'est gaté.
    expect(srsDone(DAY1)).toBe(true)

    // Elm : welcome → sent_by_elm ; la règle leçon-ou-blocage sert la #1.
    state = talkTo(elm, state)
    expect(state.quest_progress.mystery_egg_errand.current_step).toBe('sent_by_elm')
    let resolution = resolveLessonInteraction('prof_elm_lab', lessons, state, ctx)
    expect(resolution).toMatchObject({ kind: 'lesson', lesson: { sequence_index: 1 } })
    state = completeLesson(state, cards, 1)
    resolution = resolveLessonInteraction('prof_elm_lab', lessons, state, ctx)
    expect(resolution).toMatchObject({ kind: 'lesson', lesson: { sequence_index: 2 } })
    state = completeLesson(state, cards, 2)
    expect(cards).toHaveLength(24) // 12 kanji × 2 facettes, dues demain
    expect(srsDone(DAY1)).toBe(true) // rien de dû AUJOURD'HUI

    // La #3 est verrouillée (egg_delivered manquant) → dialogue ordinaire.
    expect(resolveLessonInteraction('prof_elm_lab', lessons, state, ctx).kind).toBe(
      'fallback_dialogue'
    )

    // Départ : Route 29 jamais visitée mais session ✓ → gate ouvert.
    expect(gateBlocksEntry(route29, visited, srsDone(DAY1))).toBe(false)
    visited.push('MAP_ROUTE_29', 'MAP_CHERRYGROVE', 'MAP_ROUTE_30')

    // Mr. Pokémon : l'œuf + egg_received.
    state = talkTo(mrPokemon, state)
    expect(state.inventory.mystery_egg).toBe(1)
    expect(state.quest_progress.mystery_egg_errand.current_step).toBe('egg_received')

    // Retour chez Elm : welcome_back → egg_delivered, puis leçons 3-5.
    state = talkTo(elm, state)
    expect(state.quest_progress.mystery_egg_errand.current_step).toBe('egg_delivered')
    for (const seq of [3, 4, 5]) {
      const r = resolveLessonInteraction('prof_elm_lab', lessons, state, ctx)
      expect(r).toMatchObject({ kind: 'lesson', lesson: { sequence_index: seq } })
      state = completeLesson(state, cards, seq)
    }
    expect(state.completed_lessons).toHaveLength(5)
    expect(cards).toHaveLength(60)

    // Jour 2 : 60 cartes dues → session non faite → toute NOUVELLE zone
    // extérieure est repoussée…
    expect(dueAt(DAY2)).toHaveLength(60)
    expect(srsDone(DAY2)).toBe(false)
    expect(gateBlocksEntry(route31, visited, srsDone(DAY2))).toBe(true)
    // …mais jamais un retour ni un intérieur (finding 03-D5).
    expect(gateBlocksEntry(route29, visited, srsDone(DAY2))).toBe(false)
    expect(
      gateBlocksEntry(zoneOf('MAP_ROUTE_30_MR_POKEMON_HOUSE'), visited, srsDone(DAY2))
    ).toBe(false)

    // Session du jour 2 : toutes les cartes notées (FSRS les replanifie dans
    // le futur → plus rien de dû), le gate s'ouvre.
    reviews.push(...cards.map(() => ({ reviewed_at: DAY2.toISOString() })))
    cards.length = 0
    expect(srsDone(DAY2)).toBe(true)
    expect(gateBlocksEntry(route31, visited, srsDone(DAY2))).toBe(false)
  })
})
