// Test d'intégration « traversée » (issue 10) — simule le parcours A1 en
// mémoire, aussi loin que possible sans navigateur ni base : géométrie RÉELLE
// (src/data/zone-registry.json), contenu RÉEL (content/), moteur RÉEL
// (condition-effect, lessons, progression-engine, zone-gate).
//
// Partie 1 — géométrie : le monde extérieur du jalon (Bourg Geon → Route 29 →
// Ville Griotte → Route 30) est continûment marchable, chaque intérieur est
// navigable (entrer par le warp, en ressortir), le spawn d'onboarding mène
// dehors. Les PNJ/objets posés sur des tuiles injoignables à pied sont listés
// EXPLICITEMENT (placements contenu à corriger — hors périmètre moteur, le
// tap-marqueur les rend interactifs en attendant).
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
import { getTrainersForZone } from './trainers'

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

  it('PNJ du parcours approchables à pied — et liste EXPLICITE des placements contenu défaillants', () => {
    const adjacentReachable = (zoneName: string, wx: number, wz: number) =>
      Object.values(DIRECTION_DELTA).some(({ dx, dz }) => reached(zoneName, wx + dx, wz + dz))
    const spots = new Map<string, boolean>()
    for (const name of OUTDOOR_NAMES) {
      const zone = zoneOf(name)
      for (const npc of getNpcsForZone(zone)) {
        spots.set(npc.npc_id, adjacentReachable(name, npc.world_x, npc.world_z))
      }
      for (const trainer of getTrainersForZone(zone)) {
        spots.set(trainer.trainer_id, adjacentReachable(name, trainer.world_x, trainer.world_z))
      }
    }
    // Le chemin nominal de la course de l'œuf est approchable.
    for (const id of [
      'mom_new_bark',
      'mr_pokemon_route30',
      'guide_gent_cherrygrove',
      'youngster_joey_route30',
      'bug_catcher_don_route30',
      'youngster_mikey_route30',
      // Le PC est adjacent à la tuile-PORTE du labo : on l'atteint en
      // sortant du labo (on se tient alors sur la porte) — praticable mais
      // à re-placer dans la chambre à la passe contenu.
      'player_pc_new_bark',
    ]) {
      expect(spots.get(id), id).toBe(true)
    }
    // Placements contenu DÉFAILLANTS connus (tuile solide sans voisin
    // marchable — interaction possible uniquement au tap sur le marqueur ;
    // à corriger à la passe contenu, ce test flanchera quand ce sera fait) :
    // Elm et son assistant devraient vivre DANS le labo, le panneau de
    // Route 29 contre le chemin, Silver #1 et la carte de dresseur près de
    // la sortie nord de Ville Griotte (sa ligne de vue est entièrement dans
    // le solide/l'eau : l'embuscade ne peut JAMAIS se déclencher — le tap
    // sur son marqueur engage le combat en attendant).
    for (const id of [
      'prof_elm_lab',
      'elm_assistant_new_bark',
      'sign_johto_entrance_route29',
      'silver_apparition1_cherrygrove',
      'silver_card_cherrygrove',
    ]) {
      expect(spots.get(id), `${id} (placement contenu à corriger)`).toBe(false)
    }
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
