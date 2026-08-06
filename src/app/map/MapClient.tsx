'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  saveMapProgress,
  saveMapPosition,
  reachDialogueState,
  chooseCompanion,
  interactWithNpc,
  checkZoneEntry,
  type BlockedCrossing,
} from './actions'
import { engageTrainer, type TrainerBattleStart } from './battle-actions'
import BattleScreen from './BattleScreen'
import DialogueBox, { type DialogueBoxHandle } from './DialogueBox'
import type { DialoguePageEntry } from '@/lib/content'
import {
  canTraverse,
  isWalkable,
  terrainAt,
  zoneSpawn,
  findOutdoorZoneAt,
  ledgeDirAt,
  warpAt,
  worldToPixel as zoneWorldToPixel,
  DIRECTION_BY_CODE,
  DIRECTION_DELTA,
  type Direction,
  type Zone,
  type ZoneWarp,
} from '@/lib/zone-geometry'
import type { ZoneNpc } from '@/lib/npcs'
import { findInterceptingNpc, interceptionApproach, pushBackTile, type RoadblockSource } from '@/lib/roadblock'
import { isInSightLine, type ZoneTrainer } from '@/lib/trainers'
import { ambientLineFor } from '@/lib/ambient-lines'
import type { ZoneListEntry } from '@/lib/zones'
import {
  resolveNpcSprite,
  spriteFrameOffset,
  type ResolvedSprite,
  SPRITE_ROW,
  PLAYER_SPRITE_URL,
  SPRITE_FRAME_SIZE,
} from '@/lib/npc-sprites'
import {
  obstacleKindOf,
  obstacleKey,
  requiredFlag,
  blockedLine,
  clearedLine,
  type MapProgress,
} from '@/lib/obstacles'
import { useAudioManager } from '@/lib/audio-manager'
import uiStrings from '@/data/ui-strings.json'
import { musicRefForMapName, SFX } from '@/lib/audio-tracks'

export type { Zone, ZoneObject, ZoneWarp } from '@/lib/zone-geometry'
export type { ZoneNpc } from '@/lib/npcs'
export type { ZoneTrainer } from '@/lib/trainers'

export interface PlayerPos {
  world_x: number
  world_z: number
}

// La boîte elle-même (pagination, X/Y, kinds spéciaux, machine à écrire) vit
// dans DialogueBox.tsx — MapClient ne garde que l'ouverture/fermeture et le
// relais des boutons.
interface ActiveDialogue {
  name: string
  pages: DialoguePageEntry[]
}

interface Props {
  zone: Zone
  npcs: ZoneNpc[]
  trainers: ZoneTrainer[]
  initialPos: PlayerPos
  initialProgress: MapProgress
  allZoneNames: ZoneListEntry[]
  // Planche overworld de l'avatar choisi à l'onboarding (issue 04) — même
  // géométrie 8×4 que la planche Ethan par défaut.
  playerSpriteUrl?: string
  // Planche overworld du compagnon choisi (issue 10) — null si aucun
  // compagnon ou pas de planche exploitable (le suivi n'apparaît pas).
  followerSprite?: ResolvedSprite | null
}

// One tile per input (PRD "Mouvement de l'avatar"); holding a direction
// repeats at this cadence. The avatar's CSS transition matches it so steps
// chain into a continuous walk.
/** Temps d'arrêt sur le « ! » avant que le garde ne se mette en marche. */
/** Écran bas de la DS : 256×192. On ne reproduit pas la résolution (les
 * captures de cartes sont à une autre échelle) mais bien le RATIO — c'est lui
 * qui donne le cadrage du jeu d'origine. */
const DS_SCREEN_W = 256
const DS_SCREEN_H = 192

/** Cadrage. La DS montre 16×12 tuiles sur un écran de 3 pouces ; reproduire ce
 * compte tel quel sur un moniteur donne des tuiles de 4 cm de côté — c'est ce
 * qui a été essayé, et c'était trop gros (issue 13). Deux contraintes qui se
 * contredisent, donc un arbitrage :
 *
 *  - on VISE le cadrage serré de la DS (12 rangées) ;
 *  - mais on PLAFONNE l'agrandissement à 4×, la valeur usuelle d'une fenêtre
 *    d'émulateur sur ordinateur. Au-delà, on ne gagne plus en lisibilité, on
 *    perd juste le monde autour.
 *
 * Sur un grand écran c'est donc le plafond qui décide (on voit un peu plus que
 * sur DS, à taille de pixel raisonnable) ; sur un téléphone, c'est le cadrage
 * (12 rangées, comme la console). */
const VISIBLE_TILES_Y = 12
const MAX_ZOOM = 4

const BANG_MS = 550

const STEP_MS = 170
const HOP_MS = 280
const SLIDE_MS = 110

// Warp fade (issue 13, QA humaine — transitions de zone) : HGSS fait un
// bref fondu au noir sur les WARPS (portes, escaliers, grottes, ascenseurs)
// — l'écran noircit, la zone cible se charge/positionne le joueur pendant
// que l'écran est noir, puis s'éclaircit. Recherche : la fadescreen est un
// mécanisme générique du moteur Pokémon déclenché par les commandes "warp"
// (voir pret/pokeemerald wiki « Remove Warp Fadescreen »), distinct des
// "connections" de cartes extérieures contiguës qui ne fondent JAMAIS — le
// franchissement route→route reste donc sans fondu ici, fidèle au jeu
// (Essentials Docs Wiki, « Connecting maps » / « Map transfers »). Rapide
// (comme dans le jeu), pas un fondu cinématique.
const WARP_FADE_MS = 150

// Player sheet rows (public/sprites/characters/protagonist_ethan_ow.png,
// 8×4 frames of 32px): 0=south, 1=north, 2=west, 3=east.

// Decor spriteId -> curated npc sprite_id that represents the SAME character
// through a different mechanism (issue 13) — used to suppress the decor
// duplicate zone-wide, not just when they happen to sit on the same tile.
const SPRITE_ALIASES: Record<string, string> = { SPRITE_GSRIVEL: 'SPRITE_HNS_SILVER' }

function formatZoneName(name: string): string {
  return name.replace(/^MAP_/, '').replace(/_/g, ' ')
}

/** Collision-grid rendering for the 23 zones with no screenshot asset:
 * floor/wall/ledge/door tiles drawn 1px per tile and upscaled with crisp
 * pixels — fully navigable, just untextured. */
function CollisionCanvas({ zone }: { zone: Zone }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    canvas.width = zone.tile_width
    canvas.height = zone.tile_height
    const g = canvas.getContext('2d')
    if (!g) return
    const colorFor = (t: string, x: number, z: number) => {
      switch (t) {
        case '#':
          return '#161b24'
        case 'w':
          return (x + z) % 2 === 0 ? '#1f4a78' : '#215081'
        case 'W':
          return '#173a5e'
        case 'F':
          return '#2e6da8'
        case 'i':
          return (x + z) % 2 === 0 ? '#9fc2d8' : '#a9cbe0'
        default:
          // subtle checker so distances stay readable while walking
          return (x + z) % 2 === 0 ? '#3d4757' : '#414c5d'
      }
    }
    for (let z = 0; z < zone.tile_height; z++) {
      for (let x = 0; x < zone.tile_width; x++) {
        g.fillStyle = colorFor(zone.terrain[z * zone.tile_width + x], x, z)
        g.fillRect(x, z, 1, 1)
      }
    }
    g.fillStyle = '#6b5b33'
    for (const [lx, lz] of zone.ledges ?? []) g.fillRect(lx, lz, 1, 1)
    g.fillStyle = '#3b82c4'
    for (const w of zone.warps) {
      g.fillRect(w.x - zone.world_origin_x, w.z - zone.world_origin_y, 1, 1)
    }
  }, [zone])

  return (
    <canvas
      ref={ref}
      style={{
        width: zone.screenshot_w,
        height: zone.screenshot_h,
        imageRendering: 'pixelated',
        display: 'block',
      }}
    />
  )
}

/** Direction d'un pas d'une tuile, ou null si les deux points sont confondus.
 * Sert à faire regarder un acteur dans le sens de sa marche puis vers le
 * joueur — un garde qui traverse la ville de dos est plus visible qu'on ne
 * croit. */
function directionBetween(fromX: number, fromZ: number, toX: number, toZ: number): Direction | null {
  if (toX > fromX) return 'east'
  if (toX < fromX) return 'west'
  if (toZ > fromZ) return 'south'
  if (toZ < fromZ) return 'north'
  return null
}

export default function MapClient({ zone: initialZone, npcs: initialNpcs, trainers: initialTrainers, initialPos, initialProgress, allZoneNames, playerSpriteUrl = PLAYER_SPRITE_URL, followerSprite = null }: Props) {
  const [zone, setZone] = useState(initialZone)
  const [npcs, setNpcs] = useState(initialNpcs)
  const [trainers, setTrainers] = useState(initialTrainers)
  const [playerPos, setPlayerPos] = useState(initialPos)
  const [progress, setProgress] = useState<MapProgress>(() =>
    initialProgress.visited.includes(initialZone.name)
      ? initialProgress
      : { ...initialProgress, visited: [...initialProgress.visited, initialZone.name] }
  )
  const [floorPicker, setFloorPicker] = useState(false)
  const [facing, setFacing] = useState<Direction>('south')
  const [stepping, setStepping] = useState(false)
  const [bumpKey, setBumpKey] = useState(0)
  // Combat (issue 07) : l'état du combat vit CLIENT, jamais persisté (PRD :
  // fermer l'app = fuite). `engagingTrainer` = « ! » + mouvement bloqué le
  // temps que la server action assemble le script.
  const [battle, setBattle] = useState<TrainerBattleStart | null>(null)
  const [engagingTrainer, setEngagingTrainer] = useState<string | null>(null)
  // Interception Roadblock (issue 10) : PNJ bloqueur en train de marcher vers
  // le joueur / de livrer sa ligne — mouvement gelé pendant toute la séquence.
  const [interceptingNpc, setInterceptingNpc] = useState<string | null>(null)
  // Garde d'un verrou de progression : acteur transitoire, pas un PNJ de la
  // zone — il surgit pour barrer la route puis disparaît (issue 13).
  const [roadblockGuard, setRoadblockGuard] = useState<{
    sprite_id: string
    world_x: number
    world_z: number
    facing: Direction
    bang: boolean
  } | null>(null)
  // Suivi du compagnon : la tuile que le joueur vient de quitter. Les
  // planches follower extraites (pikachu) n'ont que la rangée « face sud »
  // fiable (voir npc-sprites.ts) — une seule rangée rendue, documenté pour
  // la passe assets.
  const [followerPos, setFollowerPos] = useState<PlayerPos | null>(null)
  const [viewSize, setViewSize] = useState({ w: 375, h: 667 })
  // M4 (revue jalon 1) : le tiroir dev (téléport toutes zones + octroi des
  // CS-Kanji) est un outil de développement — jamais accessible dans un
  // build de production (rendu ET toggle gatés).
  const devDrawerEnabled = process.env.NODE_ENV !== 'production'
  const [showZonePicker, setShowZonePicker] = useState(false)
  const [activeDialogue, setActiveDialogue] = useState<ActiveDialogue | null>(null)
  const [banner, setBanner] = useState<{ label: string; key: number } | null>(null)
  // Fondu au noir des warps (portes/escaliers/ascenseurs) — voir WARP_FADE_MS.
  const [warpFading, setWarpFading] = useState(false)

  // BGM de zone (issue audio jalon 1) : relancée à chaque changement de zone
  // (PRD § Audio, "la piste music_ref se (re)lance à l'entrée de zone") — la
  // couche 'battle' (posée par BattleScreen le temps du combat) la recouvre
  // sans que ce composant ait à s'en soucier (voir audio-manager.tsx).
  const { setBgmLayer, playSfx } = useAudioManager()
  useEffect(() => {
    const musicRef = musicRefForMapName(zone.name)
    setBgmLayer('zone', musicRef ? { url: musicRef, loop: true } : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone.name])

  // Refs mirroring state that the movement loop reads synchronously —
  // interval callbacks and keydown handlers would otherwise close over
  // stale values from the render they were created in.
  const zoneRef = useRef(zone)
  const playerPosRef = useRef(playerPos)
  const facingRef = useRef(facing)
  const npcsRef = useRef(npcs)
  const trainersRef = useRef(trainers)
  const dialogueRef = useRef(activeDialogue)
  const progressRef = useRef(progress)
  const floorPickerRef = useRef(floorPicker)
  const battleRef = useRef(battle)
  const engagingRef = useRef(engagingTrainer)
  const interceptingRef = useRef(interceptingNpc)
  zoneRef.current = zone
  playerPosRef.current = playerPos
  facingRef.current = facing
  npcsRef.current = npcs
  trainersRef.current = trainers
  dialogueRef.current = activeDialogue
  progressRef.current = progress
  floorPickerRef.current = floorPicker
  battleRef.current = battle
  engagingRef.current = engagingTrainer
  interceptingRef.current = interceptingNpc

  // A ref, not state: read synchronously within the same input, before any
  // render has a chance to commit — a state flag would let two inputs in
  // the same event-loop tick both see "not transitioning" and both fire.
  const isTransitioningRef = useRef(false)
  const stepBusyUntilRef = useRef(0)
  const heldDirRef = useRef<Direction | null>(null)
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepSettleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressedKeysRef = useRef<Set<string>>(new Set())
  // Ref, pas state (même raison que isTransitioningRef) : le fondu couvre
  // aussi la fenêtre AVANT que goToZone lui-même ne pose isTransitioningRef
  // (le temps du fade-out) — sans ce ref un second warp déclenché pendant
  // cette fenêtre partirait en parallèle.
  const warpFadeActiveRef = useRef(false)
  const warpFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current)
      if (stepSettleTimeoutRef.current) clearTimeout(stepSettleTimeoutRef.current)
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current)
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current)
      if (warpFadeTimeoutRef.current) clearTimeout(warpFadeTimeoutRef.current)
    },
    []
  )

  // Libellés d'écran (issue 10, PRD § Noms de lieux) : jp_label = nom VO jp
  // (propre ou hérité de la ville) — le display_name français du registre ROM
  // n'est plus jamais affiché. Repli latin prettifié pour les zones hors
  // contenu (dev). jp_name (nom PROPRE seulement) pilote le bandeau d'entrée.
  const zoneEntryByName = useRef(new Map(allZoneNames.map(z => [z.name, z]))).current
  const zoneLabel = useCallback(
    (name: string) => zoneEntryByName.get(name)?.jp_label || formatZoneName(name),
    [zoneEntryByName]
  )

  // Écran de jeu au format DS (256×192, soit 4:3), aussi grand que la fenêtre
  // le permet (issue 13). Avant, le monde occupait toute la fenêtre : sur un
  // écran d'ordinateur large, on voyait la carte ENTIÈRE d'un coup — plus
  // aucune sensation d'exploration, et un rendu qui n'a rien à voir avec une
  // DS. On cadre donc une fenêtre 4:3 centrée, et le monde y défile.
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const ratio = DS_SCREEN_W / DS_SCREEN_H
      // La plus grande boîte 4:3 qui tient dans la fenêtre.
      const boxW = Math.min(w, h * ratio)
      setViewSize({ w: Math.floor(boxW), h: Math.floor(boxW / ratio) })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Progress persistence — debounced like the position, one JSONB write.
  const persistProgressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const updateProgress = useCallback(
    (patch: Partial<MapProgress>) => {
      setProgress(prev => {
        const next = { ...prev, ...patch }
        progressRef.current = next
        if (persistProgressTimeoutRef.current) clearTimeout(persistProgressTimeoutRef.current)
        persistProgressTimeoutRef.current = setTimeout(() => {
          saveMapProgress(next).catch(err => console.warn('Failed to save map progress', err))
        }, 800)
        return next
      })
    },
    []
  )

  const markVisited = useCallback(
    (zoneName: string) => {
      if (!progressRef.current.visited.includes(zoneName)) {
        updateProgress({ visited: [...progressRef.current.visited, zoneName] })
      }
    },
    [updateProgress]
  )

  // Debounced: consecutive moves fire independent HTTP requests with no
  // ordering guarantee, so a slow-to-land earlier write could overwrite a
  // faster later one and leave a stale position saved. Waiting for movement
  // to settle means only the final position is ever sent.
  const persistPosition = useCallback(
    (zoneName: string, x: number, z: number) => {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current)
      persistTimeoutRef.current = setTimeout(() => {
        // tz : le filet serveur du gate SRS re-calcule le jour local du
        // joueur à l'écriture (issue 10).
        saveMapPosition(zoneName, x, z, new Date().getTimezoneOffset()).catch(err =>
          console.error('Failed to save map position', err)
        )
      }, 400)
    },
    []
  )

  const worldToPixel = useCallback(
    (wx: number, wz: number) => zoneWorldToPixel(zone, wx, wz),
    [zone]
  )

  const dialogueOpen = activeDialogue !== null
  const avatarPx = worldToPixel(playerPos.world_x, playerPos.world_z)

  // Facteur d'agrandissement : on veut VISIBLE_TILES_Y tuiles sur la hauteur du
  // cadre. Le monde est ensuite translaté DANS l'espace non zoomé, d'où la
  // division par `zoom` pour recentrer sur le joueur.
  const zoom = Math.min(MAX_ZOOM, Math.max(1, viewSize.h / (VISIBLE_TILES_Y * zone.scale_y)))
  const stageW = viewSize.w / zoom
  const stageH = viewSize.h / zoom
  const offsetX = stageW / 2 - avatarPx.x
  const offsetY = stageH / 2 - avatarPx.y

  const openDialogue = useCallback((name: string, pages: DialoguePageEntry[]) => {
    if (pages.length === 0) return
    setActiveDialogue({ name, pages })
  }, [])

  // Server action : sélectionne le dialogue_state actif contre le vrai état
  // joueur et applique ses Effect[] côté serveur (issue 02) — remplace
  // l'ancien GET /api/dialogue qui servait toujours l'état default.
  // Les pages partent brutes à DialogueBox, qui route les kinds spéciaux
  // (companion_choice, instant_response, conversation_turn — issue 03).
  const fetchDialogue = useCallback(
    (ref: string) => {
      reachDialogueState(ref)
        .then(data => {
          if (data && data.pages.length) openDialogue(data.name, data.pages)
        })
        .catch(err => console.error('Failed to load dialogue', err))
    },
    [openDialogue]
  )

  // Interaction PNJ (issue 05) : la server action applique la règle
  // leçon-ou-blocage — un PNJ-leçon dont la leçon est disponible ouvre le
  // Book Screen (route /lesson/<zone>/<seq>) au lieu du dialogue.
  const router = useRouter()
  const startNpcInteraction = useCallback(
    (npc: ZoneNpc) => {
      interactWithNpc(npc.npc_id)
        .then(result => {
          if (!result) return
          if (result.kind === 'lesson') {
            router.push(`/lesson/${result.zone_id}/${result.sequence_index}`)
          } else if (result.kind === 'dialogue' && result.lesson) {
            // L'histoire d'abord : on lit sa réplique, l'écran-livre s'ouvre
            // en refermant la boîte (issue 13).
            const { zone_id, sequence_index } = result.lesson
            afterDialogueCloseRef.current = () =>
              router.push(`/lesson/${zone_id}/${sequence_index}`)
            openDialogue(result.dialogue.name, result.dialogue.pages)
          } else if (result.kind === 'text') {
            // Textes débloqués par le moteur (issue 08) : PC du joueur,
            // panneau de Route 29 — la fenêtre de lecture est une route.
            router.push(`/text/${result.text_id}`)
          } else if (result.dialogue.pages.length) {
            openDialogue(result.dialogue.name, result.dialogue.pages)
          }
        })
        .catch(err => console.error('Failed to interact with NPC', err))
    },
    [router, openDialogue]
  )

  // ── Combat (issue 07) ─────────────────────────────────────────────────────
  // Engagement : « ! », mouvement bloqué (engagingRef), la server action
  // engageTrainer assemble le script complet, courte pause façon HGSS puis
  // l'overlay BattleScreen prend l'écran.
  const engageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (engageTimeoutRef.current) clearTimeout(engageTimeoutRef.current)
    },
    []
  )

  const startBattleEngagement = useCallback(
    (trainer: ZoneTrainer) => {
      if (battleRef.current || engagingRef.current) return
      engagingRef.current = trainer.trainer_id
      setEngagingTrainer(trainer.trainer_id)
      engageTrainer(trainer.trainer_id)
        .then(result => {
          if (result?.kind === 'battle') {
            engageTimeoutRef.current = setTimeout(() => {
              setEngagingTrainer(null)
              setBattle(result)
            }, 700)
            return
          }
          setEngagingTrainer(null)
          engagingRef.current = null
          if (result?.kind === 'dialogue' && result.pages.length) {
            openDialogue(result.name, result.pages)
          }
        })
        .catch(err => {
          console.error('Failed to engage trainer', err)
          setEngagingTrainer(null)
          engagingRef.current = null
        })
    },
    [openDialogue]
  )

  // Talk sur un dresseur : non battu (rôle battle) → combat aussi ; battu →
  // dialogue post_battle (serveur), plus jamais de re-combat automatique.
  const startTrainerInteraction = useCallback(
    (trainer: ZoneTrainer) => {
      if (trainer.role === 'battle' && !trainer.defeated) {
        startBattleEngagement(trainer)
        return
      }
      engageTrainer(trainer.trainer_id)
        .then(result => {
          if (result?.kind === 'dialogue' && result.pages.length) {
            openDialogue(result.name, result.pages)
          } else if (!result) {
            fetchDialogue(trainer.dialogue_ref)
          }
        })
        .catch(err => console.error('Failed to talk to trainer', err))
    },
    [startBattleEngagement, openDialogue, fetchDialogue]
  )

  // Rafraîchit PNJ/dresseurs après une victoire (le serveur re-filtre :
  // dresseur marqué battu, entités gated sur npc_cleared révélées).
  const refreshZoneEntities = useCallback(async () => {
    try {
      const res = await fetch(`/api/zone?name=${encodeURIComponent(zoneRef.current.name)}`)
      if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return
      const { npcs: freshNpcs, trainers: freshTrainers } = (await res.json()) as {
        npcs: ZoneNpc[]
        trainers: ZoneTrainer[]
      }
      setNpcs(freshNpcs)
      setTrainers(freshTrainers)
    } catch (err) {
      console.error('Failed to refresh zone entities', err)
    }
  }, [])

  const finishBattle = useCallback(
    (result: { won: boolean }) => {
      setBattle(null)
      engagingRef.current = null
      // Défaite : rien n'est écrit, le dresseur reste engageable (rejouable
      // immédiatement). Victoire : l'état serveur a changé, on resynchronise.
      if (result.won) refreshZoneEntities()
    },
    [refreshZoneEntities]
  )

  // Ligne de vue (Sight Cone, ADR-0001) : dresseur rôle battle, non battu,
  // trigger sight_auto + joueur dans la ligne → embuscade.
  const checkSightLine = useCallback(
    (trainerList: ZoneTrainer[], wx: number, wz: number) => {
      if (battleRef.current || engagingRef.current || dialogueRef.current) return
      const spotted = trainerList.find(
        t =>
          t.role === 'battle' &&
          !t.defeated &&
          t.trigger_type === 'sight_auto' &&
          isInSightLine(t, wx, wz)
      )
      if (spotted) startBattleEngagement(spotted)
    },
    [startBattleEngagement]
  )

  /** Obstacle already cleared by the player (力/水/飛 interactions)? */
  const isCleared = useCallback(
    (obj: Zone['objects'][number]) =>
      progressRef.current.cleared.includes(obstacleKey(zoneRef.current.name, obj)),
    []
  )

  /** Solid occupants: NPCs, trainers, and visible decorative objects all
   * block movement, like in the original game — minus cleared obstacles.
   * A door tile is always the exception (issue 13, bug H): several ROM
   * placements sit an object directly on a zone's exit (e.g. Elm's Lab 1F,
   * SPRITE_VAR_1 on the only door out) — never let one make a zone's exit
   * permanently unreachable, same principle as isWarpTile at the terrain
   * level (zone-geometry.ts). */
  const isTileOccupied = useCallback(
    (wx: number, wz: number) => {
      if (warpAt(zoneRef.current, wx, wz)) return false
      if (npcsRef.current.some(n => n.world_x === wx && n.world_z === wz)) return true
      if (trainersRef.current.some(t => t.world_x === wx && t.world_z === wz)) return true
      return zoneRef.current.objects.some(
        o =>
          o.x === wx &&
          o.z === wz &&
          !isCleared(o) &&
          resolveNpcSprite(o.spriteId, o.eventFlag) !== null
      )
    },
    [isCleared]
  )

  // ── Interception Roadblock (issue 10, CONTEXT.md « Roadblock NPC ») ───────
  // Sight Cone d'un PNJ à sight_auto_result `block` : le PNJ marche vers le
  // joueur (une tuile par STEP_MS — animation simple, pas de pathfinding : il
  // suit son axe de vue), livre sa ligne (interactWithNpc → DialogueBox — un
  // PNJ-leçon à cône livrerait ici sa ligne de blocage via la règle serveur),
  // repousse le joueur d'une case, puis REGAGNE sa position d'origine
  // (téléport assumé, comme documenté dans l'issue). Se re-déclenche à chaque
  // entrée dans le cône tant que sa condition n'est pas levée (la présence du
  // PNJ est déjà filtrée serveur par unlock_conditions).
  const afterDialogueCloseRef = useRef<(() => void) | null>(null)
  const interceptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const npcHomeRef = useRef<{ x: number; z: number } | null>(null)

  useEffect(
    () => () => {
      if (interceptTimerRef.current) clearTimeout(interceptTimerRef.current)
    },
    []
  )

  const finishInterception = useCallback(
    (blocker: ZoneNpc & RoadblockSource, pushBack: boolean) => {
      if (pushBack) {
        const pos = playerPosRef.current
        const back = pushBackTile(blocker, pos.world_x, pos.world_z)
        const z = zoneRef.current
        const abilities = {
          surf: progressRef.current.mizu,
          whirlpool: progressRef.current.uzu,
          waterfall: progressRef.current.taki,
        }
        if (canTraverse(z, back.x, back.z, abilities) && !isTileOccupied(back.x, back.z)) {
          // Le joueur fait face au PNJ qui vient de le sermonner.
          const facePairs: Record<Direction, Direction> = {
            south: 'north',
            north: 'south',
            east: 'west',
            west: 'east',
          }
          setFacing(facePairs[blocker.facing])
          setFollowerPos({ world_x: pos.world_x, world_z: pos.world_z })
          setPlayerPos({ world_x: back.x, world_z: back.z })
          persistPosition(z.name, back.x, back.z)
        }
      }
      const home = npcHomeRef.current
      if (home) {
        setNpcs(prev =>
          prev.map(n =>
            n.npc_id === blocker.npc_id ? { ...n, world_x: home.x, world_z: home.z } : n
          )
        )
      }
      npcHomeRef.current = null
      interceptingRef.current = null
      setInterceptingNpc(null)
    },
    [isTileOccupied, persistPosition]
  )

  const checkNpcInterception = useCallback(
    (npcList: ZoneNpc[], wx: number, wz: number) => {
      if (battleRef.current || engagingRef.current || dialogueRef.current) return
      if (interceptingRef.current) return
      const sightNpcs = npcList.filter(
        (n): n is ZoneNpc & RoadblockSource => n.facing !== undefined && n.sight_range !== undefined
      )
      const blocker = findInterceptingNpc(sightNpcs, wx, wz)
      if (!blocker) return
      interceptingRef.current = blocker.npc_id
      setInterceptingNpc(blocker.npc_id)
      npcHomeRef.current = { x: blocker.world_x, z: blocker.world_z }
      const path = interceptionApproach(blocker, wx, wz)
      let step = 0
      const advance = () => {
        if (step < path.length) {
          const tile = path[step++]
          setNpcs(prev =>
            prev.map(n =>
              n.npc_id === blocker.npc_id ? { ...n, world_x: tile.x, world_z: tile.z } : n
            )
          )
          interceptTimerRef.current = setTimeout(advance, STEP_MS)
          return
        }
        interactWithNpc(blocker.npc_id)
          .then(result => {
            if (result?.kind === 'lesson') {
              // PNJ-leçon à cône dont la leçon est DISPONIBLE : pas un
              // blocage — le Book Screen s'ouvre, sans repoussée.
              finishInterception(blocker, false)
              router.push(`/lesson/${result.zone_id}/${result.sequence_index}`)
              return
            }
            const pages = result?.kind === 'dialogue' ? result.dialogue.pages : []
            if (pages.length) {
              afterDialogueCloseRef.current = () => finishInterception(blocker, true)
              openDialogue(result?.kind === 'dialogue' ? result.dialogue.name : '', pages)
            } else {
              finishInterception(blocker, true)
            }
          })
          .catch(err => {
            console.error('Roadblock interception failed', err)
            finishInterception(blocker, false)
          })
      }
      // Même temps d'arrêt que pour les verrous : le « ! » s'affiche, puis le
      // PNJ se met en marche. Sans la pause, les deux tombent dans la même
      // image et on ne voit jamais l'exclamation (issue 13).
      interceptTimerRef.current = setTimeout(advance, BANG_MS)
    },
    [finishInterception, openDialogue, router]
  )

  const showBanner = useCallback((label: string) => {
    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current)
    setBanner({ label, key: Date.now() })
    bannerTimeoutRef.current = setTimeout(() => setBanner(null), 1900)
  }, [])

  // ── Verrou de progression (issue 13) ──────────────────────────────────────
  // Le serveur a refusé le franchissement et dit QUI barre la route. On joue
  // la scène du jeu d'origine : le garde surgit de son poste avec un « ! »,
  // marque un temps, marche jusqu'au joueur, parle, puis regagne son poste et
  // disparaît. Le joueur n'a jamais bougé — inutile de le repousser, le pas
  // a déjà été annulé.
  const roadblockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (roadblockTimerRef.current) clearTimeout(roadblockTimerRef.current)
    },
    []
  )

  const playRoadblockScene = useCallback(
    (block: BlockedCrossing) => {
      if (interceptingRef.current) return
      interceptingRef.current = block.roadblock_id
      const z = zoneRef.current
      const home = {
        x: z.world_origin_x + block.guard.post.tile_x,
        z: z.world_origin_y + block.guard.post.tile_y,
      }
      const player = playerPosRef.current
      setRoadblockGuard({
        sprite_id: block.guard.sprite_id,
        world_x: home.x,
        world_z: home.z,
        facing: block.guard.facing,
        bang: true,
      })

      const path = interceptionApproach(
        { world_x: home.x, world_z: home.z },
        player.world_x,
        player.world_z
      )
      let step = 0
      const walk = () => {
        if (step < path.length) {
          const tile = path[step++]
          setRoadblockGuard(g =>
            g === null
              ? g
              : {
                  ...g,
                  world_x: tile.x,
                  world_z: tile.z,
                  bang: false,
                  facing: directionBetween(g.world_x, g.world_z, tile.x, tile.z) ?? g.facing,
                }
          )
          roadblockTimerRef.current = setTimeout(walk, STEP_MS)
          return
        }
        // Arrivé à hauteur du joueur : il lui fait face, puis parle.
        setRoadblockGuard(g =>
          g === null
            ? g
            : {
                ...g,
                bang: false,
                facing: directionBetween(g.world_x, g.world_z, player.world_x, player.world_z) ?? g.facing,
              }
        )
        afterDialogueCloseRef.current = () => {
          // Retour au poste, puis il s'efface.
          setRoadblockGuard(g => (g === null ? g : { ...g, world_x: home.x, world_z: home.z }))
          roadblockTimerRef.current = setTimeout(() => {
            setRoadblockGuard(null)
            interceptingRef.current = null
          }, STEP_MS)
        }
        // Quand le bloqueur EST un PNJ curaté, on joue SON dialogue : c'est le
        // seul chemin qui applique ses effets (avancer la quête, remettre la
        // carte). Sans ça, il arrête le joueur sans jamais pouvoir lui donner
        // ce qui lève le verrou — blocage définitif (issue 13, le guide de
        // Ville Griotte). Les pages figées restent le repli.
        if (block.npc_id) {
          interactWithNpc(block.npc_id)
            .then(result => {
              const pages = result?.kind === 'dialogue' ? result.dialogue.pages : block.pages
              openDialogue(result?.kind === 'dialogue' ? result.dialogue.name : block.name, pages)
            })
            .catch(() => openDialogue(block.name, block.pages))
          return
        }
        openDialogue(block.name, block.pages)
      }
      // Le temps d'arrêt sur le « ! » : dans le jeu d'origine le personnage
      // s'exclame AVANT de se mettre en marche. Sans cette pause, les deux
      // arrivent dans la même image et on ne voit que la marche.
      roadblockTimerRef.current = setTimeout(walk, BANG_MS)
    },
    [openDialogue]
  )

  const goToZone = useCallback(
    async (targetName: string, resolveSpawn?: (newZone: Zone) => PlayerPos | null) => {
      if (isTransitioningRef.current) return
      isTransitioningRef.current = true
      try {
        // Gate SRS quotidien (issue 10, PRD § Boucle Quotidienne pt 5) :
        // l'entrée en zone EXTÉRIEURE jamais visitée est vérifiée serveur au
        // moment précis du franchissement — les deux chemins (continuité
        // outdoor→outdoor d'attemptStep ET warps) passent ici. Refus → le pas
        // est annulé (le joueur n'a pas bougé), même ressort que le blocage.
        const target = zoneEntryByName.get(targetName)
        // Le verrou de progression s'évalue à CHAQUE franchissement (zone déjà
        // visitée ou non) ; le gate SRS, lui, ne concerne que les zones jamais
        // vues — c'est le serveur qui tranche les deux.
        const entry = await checkZoneEntry(
          targetName,
          new Date().getTimezoneOffset(),
          zoneRef.current.name
        )
        if (!entry.allowed) {
          setBumpKey(k => k + 1)
          if ('roadblock' in entry) playRoadblockScene(entry.roadblock)
          else openDialogue('', [{ jp: entry.jp }])
          return
        }
        const res = await fetch(`/api/zone?name=${encodeURIComponent(targetName)}`)
        // A 307 to the sign-in page (expired session) resolves as `ok` once
        // fetch follows the redirect, but the body is HTML, not JSON.
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return
        const { zone: newZone, npcs: newNpcs, trainers: newTrainers } = (await res.json()) as {
          zone: Zone
          npcs: ZoneNpc[]
          trainers: ZoneTrainer[]
        }
        const pos = resolveSpawn ? resolveSpawn(newZone) : zoneSpawn(newZone)
        if (!pos) return // e.g. the exact tile crossed into turned out not to be walkable there
        setZone(newZone)
        setNpcs(newNpcs)
        setTrainers(newTrainers)
        setPlayerPos(pos)
        setFollowerPos(null) // le compagnon ré-émerge derrière le premier pas
        setFloorPicker(false)
        // Bandeau : le nom VO jp PROPRE de la zone (ワカバタウン…). Les
        // intérieurs n'ont pas de nom propre dans le contenu → pas de bandeau
        // (comme HGSS ; leur libellé hérité reste visible au HUD).
        if (target?.jp_name) showBanner(target.jp_name)
        markVisited(newZone.name)
        persistPosition(newZone.name, pos.world_x, pos.world_z)
        checkSightLine(newTrainers, pos.world_x, pos.world_z)
        if (!engagingRef.current) checkNpcInterception(newNpcs, pos.world_x, pos.world_z)
      } catch (err) {
        console.error('Zone transition failed', err)
      } finally {
        isTransitioningRef.current = false
      }
    },
    [
      persistPosition,
      checkSightLine,
      checkNpcInterception,
      showBanner,
      zoneEntryByName,
      markVisited,
      openDialogue,
      playRoadblockScene,
    ]
  )

  // Warps only (portes, escaliers, ascenseurs) : fondu au noir avant le swap
  // de zone, tenu pendant le fetch, puis fondu retour — jamais utilisé pour
  // le continuum outdoor→outdoor (attemptStep appelle goToZone directement,
  // fidèle au jeu : les cartes extérieures contiguës ne fondent pas).
  const goToZoneWithFade = useCallback(
    (targetName: string, resolveSpawn?: (newZone: Zone) => PlayerPos | null) => {
      if (warpFadeActiveRef.current || isTransitioningRef.current) return
      warpFadeActiveRef.current = true
      setWarpFading(true)
      warpFadeTimeoutRef.current = setTimeout(() => {
        goToZone(targetName, resolveSpawn).finally(() => {
          setWarpFading(false)
          warpFadeActiveRef.current = false
        })
      }, WARP_FADE_MS)
    },
    [goToZone]
  )

  const enterWarp = useCallback(
    (warp: ZoneWarp) => {
      // 0xFFF marks the ROM's dynamic warps: elevators and the Safari gate.
      // Their real destination is "whichever floor you came from" (RAM state)
      // — we surface the precomputed floor list as a picker instead.
      if (typeof warp.header !== 'string') {
        if (zoneRef.current.elevator_floors.length > 0) setFloorPicker(true)
        return
      }
      // The destination tile depends on the target zone's own warp list
      // (warp.anchor points back to the matching door there), so it can only
      // be resolved once that zone's data has been fetched.
      // Son de porte ou d'escalier selon la destination — c'est ce qui donne
      // sa matière au franchissement (issue 13, sons d'action).
      playSfx(/STAIR|_[0-9]F$|B[0-9]F$/.test(String(warp.header)) ? SFX.stairs : SFX.doorOpen)
      goToZoneWithFade(warp.header, newZone => {
        const anchorWarp = newZone.warps[warp.anchor]
        if (anchorWarp) return { world_x: anchorWarp.x, world_z: anchorWarp.z }
        return zoneSpawn(newZone)
      })
    },
    [goToZoneWithFade, playSfx]
  )

  const settleStep = useCallback(
    (pos: PlayerPos, durationMs: number, dir: Direction) => {
      setStepping(true)
      stepBusyUntilRef.current = Date.now() + durationMs
      if (stepSettleTimeoutRef.current) clearTimeout(stepSettleTimeoutRef.current)
      stepSettleTimeoutRef.current = setTimeout(() => {
        const z = zoneRef.current
        // Warp tiles fire when *entered* (doors, gate walk-through tiles) —
        // never on spawn, so arriving on a door's twin tile can't bounce
        // the player straight back.
        const w = warpAt(z, pos.world_x, pos.world_z)
        if (w) {
          setStepping(false)
          enterWarp(w)
          return
        }
        // Slippery ice: keep sliding in the same direction until landing on
        // a non-ice tile (or hitting something) — input is ignored mid-slide
        // because stepBusyUntil keeps getting pushed forward.
        if (terrainAt(z, pos.world_x, pos.world_z) === 'i') {
          const { dx, dz } = DIRECTION_DELTA[dir]
          const next = { world_x: pos.world_x + dx, world_z: pos.world_z + dz }
          if (
            canTraverse(z, next.world_x, next.world_z, {
              surf: progressRef.current.mizu,
              whirlpool: progressRef.current.uzu,
              waterfall: progressRef.current.taki,
            }) &&
            !isTileOccupied(next.world_x, next.world_z)
          ) {
            settleStep(next, SLIDE_MS, dir)
            return
          }
        }
        setStepping(false)
      }, durationMs)
      // Suivi du compagnon : il occupe la tuile que le joueur quitte, tourné
      // dans la direction du pas (issue 10).
      const from = playerPosRef.current
      setFollowerPos({ world_x: from.world_x, world_z: from.world_z })
      setPlayerPos(pos)
      persistPosition(zoneRef.current.name, pos.world_x, pos.world_z)
      checkSightLine(trainersRef.current, pos.world_x, pos.world_z)
      if (!engagingRef.current) checkNpcInterception(npcsRef.current, pos.world_x, pos.world_z)
    },
    [persistPosition, checkSightLine, checkNpcInterception, enterWarp, isTileOccupied]
  )

  const attemptStep = useCallback(
    (dir: Direction) => {
      if (dialogueRef.current || floorPickerRef.current || isTransitioningRef.current || warpFadeActiveRef.current)
        return
      // Mouvement bloqué dès l'engagement d'un combat (« ! ») et pendant
      // toute sa durée (l'overlay couvre l'écran, la garde couvre le clavier)
      // — idem pendant une interception Roadblock (marche du PNJ + repoussée).
      if (battleRef.current || engagingRef.current || interceptingRef.current) return
      if (Date.now() < stepBusyUntilRef.current) return

      setFacing(dir)
      const z = zoneRef.current
      const pos = playerPosRef.current
      const abilities = {
        surf: progressRef.current.mizu,
        whirlpool: progressRef.current.uzu,
        waterfall: progressRef.current.taki,
      }
      const { dx, dz } = DIRECTION_DELTA[dir]
      const t1 = { world_x: pos.world_x + dx, world_z: pos.world_z + dz }

      const inBounds =
        t1.world_x >= z.world_origin_x &&
        t1.world_x < z.world_origin_x + z.tile_width &&
        t1.world_z >= z.world_origin_y &&
        t1.world_z < z.world_origin_y + z.tile_height

      if (inBounds) {
        if (isTileOccupied(t1.world_x, t1.world_z)) {
          setBumpKey(k => k + 1)
          playSfx(SFX.bump)
          return
        }
        if (canTraverse(z, t1.world_x, t1.world_z, abilities)) {
          settleStep(t1, STEP_MS, dir)
          return
        }
        // Ledge hop: the blocked tile in front is a ledge crossable in this
        // exact direction — land one tile beyond it (HGSS one-way ledges).
        const ledgeDir = ledgeDirAt(z, t1.world_x, t1.world_z)
        if (ledgeDir !== null && DIRECTION_BY_CODE[ledgeDir] === dir) {
          const t2 = { world_x: pos.world_x + 2 * dx, world_z: pos.world_z + 2 * dz }
          if (canTraverse(z, t2.world_x, t2.world_z, abilities) && !isTileOccupied(t2.world_x, t2.world_z)) {
            settleStep(t2, HOP_MS, dir)
            return
          }
        }
        setBumpKey(k => k + 1)
        playSfx(SFX.bump)
        return
      }

      // Outdoor zones share one continuous coordinate space — walking off
      // this route's edge can mean "you're now in the next route/town".
      if (z.is_outdoor) {
        const next = findOutdoorZoneAt(allZoneNames, t1.world_x, t1.world_z, z.name)
        if (next) {
          goToZone(next.name, newZone =>
            canTraverse(newZone, t1.world_x, t1.world_z, abilities) ? t1 : null
          )
          return
        }
      }
      setBumpKey(k => k + 1)
    },
    [allZoneNames, goToZone, isTileOccupied, settleStep, playSfx]
  )

  // ── Held-direction movement loop ──────────────────────────────────────────

  const stopHold = useCallback((dir?: Direction) => {
    if (dir && heldDirRef.current !== dir) return
    heldDirRef.current = null
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current)
      stepTimerRef.current = null
    }
  }, [])

  const startHold = useCallback(
    (dir: Direction) => {
      heldDirRef.current = dir
      attemptStep(dir)
      if (!stepTimerRef.current) {
        stepTimerRef.current = setInterval(() => {
          const held = heldDirRef.current
          if (held) attemptStep(held)
        }, 55)
      }
    },
    [attemptStep]
  )

  // ── A / B / X / Y ─────────────────────────────────────────────────────────
  // Pendant un dialogue, A/X/Y sont relayés à DialogueBox (ref impérative) ;
  // B ferme à tout moment (PRD § Mouvement de l'avatar).

  const dialogueBoxRef = useRef<DialogueBoxHandle>(null)
  const closeDialogue = useCallback(() => {
    setActiveDialogue(null)
    // Fin d'une interception Roadblock : la ligne livrée, la fermeture de la
    // boîte déclenche la repoussée + le retour du PNJ (issue 10).
    const after = afterDialogueCloseRef.current
    afterDialogueCloseRef.current = null
    if (after) after()
  }, [])

  const onA = useCallback(() => {
    if (battleRef.current || engagingRef.current) return
    // Fondu de warp en cours : entrée gelée, comme le mouvement.
    if (warpFadeActiveRef.current) return
    // Pendant la marche d'interception (avant la boîte), A/B sont inertes ;
    // une fois la boîte ouverte, dialogueRef reprend la main normalement.
    if (interceptingRef.current && !dialogueRef.current) return
    if (dialogueRef.current) {
      dialogueBoxRef.current?.pressA()
      return
    }
    if (floorPickerRef.current) return
    const z = zoneRef.current
    const pos = playerPosRef.current
    const { dx, dz } = DIRECTION_DELTA[facingRef.current]
    const fx = pos.world_x + dx
    const fz = pos.world_z + dz

    const npc = npcsRef.current.find(n => n.world_x === fx && n.world_z === fz)
    if (npc) {
      startNpcInteraction(npc)
      return
    }
    const trainer = trainersRef.current.find(t => t.world_x === fx && t.world_z === fz)
    if (trainer) {
      startTrainerInteraction(trainer)
      return
    }
    const warp = warpAt(z, fx, fz)
    if (warp) {
      enterWarp(warp)
      return
    }
    const obj = z.objects.find(
      o => o.x === fx && o.z === fz && !isCleared(o) && resolveNpcSprite(o.spriteId, o.eventFlag) !== null
    )
    if (!obj) return

    // Obstacles react to the matching CS-Kanji: cleared for good, or a
    // short system line saying the way is blocked.
    const kind = obstacleKindOf(obj)
    if (kind) {
      if (progressRef.current[requiredFlag(kind)]) {
        updateProgress({ cleared: [...progressRef.current.cleared, obstacleKey(z.name, obj)] })
        openDialogue('', [{ jp: clearedLine(kind), en: '' }])
      } else {
        openDialogue('', [{ jp: blockedLine(kind), en: '' }])
      }
      return
    }
    // Personnages de décor extraits de la ROM : pas de fiche, pas de dialogue
    // écrit à la main — ils servaient un « ・・・・・・ » muet. Ils reçoivent
    // maintenant une réplique du pool d'ambiance, tirée de façon déterministe
    // sur leur identifiant : le même figurant dit toujours la même chose
    // (issue 13). Le battement muet reste le repli si le pool est vide.
    const ambient = ambientLineFor(obj.id)
    openDialogue('', ambient ? ambient.pages : [{ jp: '・・・・・・', en: '' }])
  }, [startNpcInteraction, startTrainerInteraction, enterWarp, openDialogue, isCleared, updateProgress])

  const onB = useCallback(() => {
    // En combat, B n'abandonne pas (PRD) — BattleScreen gère ses entrées.
    if (battleRef.current || engagingRef.current) return
    if (interceptingRef.current && !dialogueRef.current) return
    if (dialogueRef.current) closeDialogue()
    else if (floorPickerRef.current) setFloorPicker(false)
  }, [closeDialogue])

  const onX = useCallback(() => {
    if (dialogueRef.current) dialogueBoxRef.current?.pressX()
  }, [])

  const onY = useCallback(() => {
    if (dialogueRef.current) dialogueBoxRef.current?.pressY()
  }, [])

  // ── Keyboard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const dirForKey = (code: string): Direction | null => {
      switch (code) {
        case 'ArrowUp':
          return 'north'
        case 'ArrowDown':
          return 'south'
        case 'ArrowLeft':
          return 'west'
        case 'ArrowRight':
          return 'east'
        default:
          return null
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const dir = dirForKey(e.code)
      if (dir) {
        e.preventDefault()
        if (!pressedKeysRef.current.has(e.code)) {
          pressedKeysRef.current.add(e.code)
          startHold(dir)
        }
        return
      }
      if (e.repeat) return
      // Les quatre touches A/B/X/Y du clavier SONT les quatre boutons de la
      // DS (issue 13). WASD est retiré du déplacement : il volait la touche A
      // au bouton A, et les flèches suffisent — c'est la croix directionnelle.
      switch (e.code) {
        case 'KeyA':
        case 'Space':
        case 'Enter':
          e.preventDefault()
          onA()
          break
        case 'KeyB':
        case 'Escape':
        case 'Backspace':
          onB()
          break
        case 'KeyX':
          onX()
          break
        case 'KeyY':
          onY()
          break
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      const dir = dirForKey(e.code)
      if (!dir) return
      pressedKeysRef.current.delete(e.code)
      // If another direction key is still held, keep walking that way.
      const remaining = Array.from(pressedKeysRef.current)
        .map(dirForKey)
        .find(d => d !== null)
      if (remaining) startHold(remaining)
      else stopHold()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      stopHold()
    }
  }, [startHold, stopHold, onA, onB, onX, onY])

  const handleZoneChange = useCallback(
    (name: string) => {
      setShowZonePicker(false)
      goToZone(name)
    },
    [goToZone]
  )

  const dirButton = (dir: Direction, label: string, gridArea: string) => (
    <button
      key={dir}
      aria-label={dir}
      style={{ gridArea, touchAction: 'none' }}
      className="w-14 h-14 bg-black/35 active:bg-white/25 border border-white/25 rounded-lg backdrop-blur-[2px] flex items-center justify-center text-white/60 text-xl"
      onPointerDown={e => {
        e.preventDefault()
        ;(e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId)
        startHold(dir)
      }}
      onPointerUp={() => stopHold(dir)}
      onPointerCancel={() => stopHold(dir)}
      onContextMenu={e => e.preventDefault()}
    >
      {label}
    </button>
  )

  /** Bouton de face, style émulateur : rond translucide, grisé quand il ne
   * sert à rien (X et Y hors dialogue) mais jamais retiré — un bouton qui
   * apparaît et disparaît est plus déroutant qu'un bouton éteint. */
  const faceButton = (
    area: string,
    label: string,
    onPress: () => void,
    dimmed: boolean
  ) => (
    <button
      key={area}
      data-testid={`button-${area}`}
      aria-label={label}
      style={{ gridArea: area, touchAction: 'none' }}
      onClick={onPress}
      className={`w-12 h-12 rounded-full border backdrop-blur-[2px] font-bold ${
        dimmed
          ? 'bg-black/45 border-white/35 text-white/60'
          : 'bg-black/45 active:bg-white/25 border-white/60 text-white'
      }`}
    >
      {label}
    </button>
  )

  const beatCount = allZoneNames.find(z => z.name === zone.name)?.beat_count ?? 0

  return (
    <div className="fixed inset-0 bg-black select-none font-chrome flex items-center justify-center">
      {/* Cadre DS : le monde est découpé à ce rectangle, le reste de la fenêtre
          reste noir (bordure d'émulateur). `relative` + `overflow-hidden` : tout
          ce qui est posé dedans (monde, boutons) se cale sur le cadre, pas sur
          la fenêtre. */}
      <div
        data-testid="ds-screen"
        className="relative overflow-hidden"
        style={{ width: viewSize.w, height: viewSize.h }}
      >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: stageW,
          height: stageH,
          transform: `scale(${zoom})`,
          transformOrigin: '0 0',
          imageRendering: 'pixelated',
        }}
      >
      {/* World — translates to keep player centered */}
      <div
        style={{
          position: 'absolute',
          transform: `translate(${offsetX}px, ${offsetY}px)`,
          transition: `transform ${STEP_MS / 1000}s linear`,
          willChange: 'transform',
        }}
      >
        <div style={{ position: 'relative', width: zone.screenshot_w, height: zone.screenshot_h }}>
          {zone.screenshot ? (
            <img
              src={zone.screenshot}
              width={zone.screenshot_w}
              height={zone.screenshot_h}
              alt={zoneLabel(zone.name)}
              draggable={false}
              style={{ display: 'block' }}
            />
          ) : (
            <CollisionCanvas zone={zone} />
          )}

          {/* Decorative object markers (background NPCs, items, props) —
              rendered as the real overworld sprite (row 0 of the sheet, for
              the ~90% of matches that have a standard 8-frame layout — or
              the row matching the ROM's authored facingDirection, for the
              handful of verified 4-row sheets, `sprite.rows === 4`, see
              HNS_PEOPLE in npc-sprites.ts) for the ~98% of instances
              resolved via resolveNpcSprite, falling back to a plain dot for
              the rest. Static pose : nothing here ever walks
              on its own (no patrol logic), so no walk-cycle animation — a
              standing NPC that endlessly cycles its walk frames looks like
              it's marching in place forever (issue 13, bug B). Solid to walk
              into; A in front of one gives a wordless beat. Never rendered
              on a door tile : ROM objects with a `FLAG_HIDE_*` eventFlag
              (715 in the whole game) are conditional cameos our engine has
              no state to gate — unconditionally showing them is wrong in
              general, and glaringly so on a door (Mom stuck in her own
              front door at Bourg Geon, issue 13). A door is always
              traversable regardless of its contents (bug H) ; not drawing
              anyone on it removes the visual half of the same bug. Skipped
              too when a curated NPC with the same `sprite_id` sits within a
              tile of this object : same character placed twice in the data
              (ROM decor object + curated dialogue entry), and now that
              curated NPCs can carry their own verified sprite (HNS_PEOPLE),
              both would otherwise render side by side — e.g. two Pr. Elm at
              Bourg Geon's lab (issue 13, regression from that change). The
              curated NPC wins : it's the one with working interaction.
              Same idea for `SPRITE_ALIASES` pairs, but zone-wide (no
              adjacency check) — the ROM's `SPRITE_GSRIVEL` (a permanent,
              un-gated decor object) and our curated Silver (`sprite_id:
              SPRITE_HNS_SILVER`, gated by `unlock_conditions`, positioned
              apart on purpose — spying from a distance, not greeting at the
              door) are the same red-haired character rendered by two
              different mechanisms ; showing both reads as an obvious
              duplicate even a few tiles apart (issue 13). */}
          {zone.objects.map(obj => {
            if (progress.cleared.includes(`${zone.name}#${obj.id}`)) return null
            if (warpAt(zone, obj.x, obj.z)) return null
            // Objet posé dans un mur ou hors de la grille : ce n'est pas un
            // figurant, c'est un emplacement de garage. La ROM y range les
            // objets qu'un script fera apparaître ailleurs (coin haut-droit
            // d'une cellule de carte — (31,0) à Bourg Geon, (63,0) à Ville
            // Griotte — ou coordonnées carrément négatives). 93 objets dans
            // tout le jeu. Les dessiner donnait des PNJ en lévitation hors
            // carte : le Pr. Elm flottait dans le noir au coin de Bourg Geon,
            // ce qui explique aussi qu'on ne le trouvait nulle part en ville
            // (issue 13). Personne ne peut se tenir dans un mur — s'il y est,
            // c'est qu'il n'y est pas.
            if (!isWalkable(zone, obj.x, obj.z)) return null
            if (
              npcs.some(n => {
                if (!n.sprite_id) return false
                if (n.sprite_id === obj.spriteId) {
                  return Math.abs(n.world_x - obj.x) <= 1 && Math.abs(n.world_z - obj.z) <= 1
                }
                return SPRITE_ALIASES[obj.spriteId] === n.sprite_id
              })
            )
              return null
            const px = worldToPixel(obj.x, obj.z)
            const sprite = resolveNpcSprite(obj.spriteId, obj.eventFlag)
            const frame = sprite
              ? spriteFrameOffset(sprite, DIRECTION_BY_CODE[obj.facingDirection] ?? 'south')
              : null
            return (
              <div
                key={obj.id}
                style={{
                  position: 'absolute',
                  left: px.x - (sprite ? SPRITE_FRAME_SIZE / 2 : 8) + zone.scale_x / 2,
                  top: px.y - (sprite ? SPRITE_FRAME_SIZE : 14) + zone.scale_y,
                  width: sprite ? SPRITE_FRAME_SIZE : 16,
                  height: sprite ? SPRITE_FRAME_SIZE : 16,
                  pointerEvents: 'none',
                }}
                title={obj.id}
              >
                {sprite && (
                  <div
                    style={{
                      width: SPRITE_FRAME_SIZE,
                      height: SPRITE_FRAME_SIZE,
                      backgroundImage: `url(${sprite.url})`,
                      backgroundPosition: `${frame?.x ?? 0}px ${frame?.y ?? 0}px`,
                      backgroundRepeat: 'no-repeat',
                      imageRendering: 'pixelated',
                    }}
                  />
                )}
              </div>
            )
          })}

          {/* Garde d'un verrou de progression (issue 13) : acteur transitoire,
              absent de la liste des PNJ de la zone — il surgit de son poste,
              barre la route, puis s'efface. Même géométrie de rendu que les
              PNJ pour qu'il se fonde dans le décor. */}
          {roadblockGuard &&
            (() => {
              const px = worldToPixel(roadblockGuard.world_x, roadblockGuard.world_z)
              const sprite = resolveNpcSprite(roadblockGuard.sprite_id)
              const frame = sprite ? spriteFrameOffset(sprite, roadblockGuard.facing) : null
              return (
                <div
                  data-testid="roadblock-guard"
                  style={{
                    position: 'absolute',
                    left: px.x - (sprite ? SPRITE_FRAME_SIZE / 2 : 9) + zone.scale_x / 2,
                    top: px.y - (sprite ? SPRITE_FRAME_SIZE : 16) + zone.scale_y,
                    width: sprite ? SPRITE_FRAME_SIZE : 18,
                    height: sprite ? SPRITE_FRAME_SIZE : 18,
                    pointerEvents: 'none',
                    zIndex: 8,
                    transition: `left ${STEP_MS / 1000}s linear, top ${STEP_MS / 1000}s linear`,
                  }}
                >
                  {roadblockGuard.bang && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-amber-300 text-base font-bold animate-bounce">
                      ！
                    </div>
                  )}
                  {sprite && (
                    <div
                      style={{
                        width: SPRITE_FRAME_SIZE,
                        height: SPRITE_FRAME_SIZE,
                        backgroundImage: `url(${sprite.url})`,
                        backgroundPosition: `${frame?.x ?? 0}px ${frame?.y ?? 0}px`,
                        backgroundRepeat: 'no-repeat',
                        imageRendering: 'pixelated',
                      }}
                    />
                  )}
                </div>
              )
            })()}

          {/* Curated NPC markers — comme dans le jeu d'origine : on se place
              à côté et on appuie sur A (issue 12 : plus AUCUNE interaction au
              tap sur le contenu de la carte). Aucun badge « je suis
              parlable » (issue 13, bug C, durci ensuite sur demande
              explicite) — HGSS n'affiche aucune icône flottante sur un PNJ
              au repos, seulement le sprite du personnage. La plupart des
              PNJ curatés n'ont pas de sprite (contenu séparé des objets de
              décor ROM) → invisibles jusqu'à ce qu'un `sprite_id` vérifié
              (issue 13, HNS_PEOPLE) leur en donne un, affiché dans la bonne
              direction (`facing`). Un Roadblock en interception glisse vers
              le joueur (transition sur left/top) avec un ！ au-dessus,
              comme l'embuscade des dresseurs — ce signal-là est fidèle au
              jeu et reste. */}
          {npcs.map(npc => {
            const px = worldToPixel(npc.world_x, npc.world_z)
            const intercepting = interceptingNpc === npc.npc_id
            const sprite = npc.sprite_id ? resolveNpcSprite(npc.sprite_id) : null
            const frame = sprite ? spriteFrameOffset(sprite, npc.facing ?? 'south') : null
            return (
              <div
                key={npc.npc_id}
                style={{
                  position: 'absolute',
                  left: px.x - (sprite ? SPRITE_FRAME_SIZE / 2 : 9) + zone.scale_x / 2,
                  top: px.y - (sprite ? SPRITE_FRAME_SIZE : 16) + zone.scale_y,
                  width: sprite ? SPRITE_FRAME_SIZE : 18,
                  height: sprite ? SPRITE_FRAME_SIZE : 18,
                  pointerEvents: 'none',
                  zIndex: 5,
                  transition: `left ${STEP_MS / 1000}s linear, top ${STEP_MS / 1000}s linear`,
                }}
                title={npc.name}
              >
                {intercepting && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-amber-300 text-base font-bold animate-bounce">
                    ！
                  </div>
                )}
                {sprite && (
                  <div
                    style={{
                      width: SPRITE_FRAME_SIZE,
                      height: SPRITE_FRAME_SIZE,
                      backgroundImage: `url(${sprite.url})`,
                      backgroundPosition: `${frame?.x ?? 0}px ${frame?.y ?? 0}px`,
                      backgroundRepeat: 'no-repeat',
                      imageRendering: 'pixelated',
                    }}
                  />
                )}
              </div>
            )
          })}

          {/* Trainer markers — entrer dans la ligne de vue d'un dresseur
              rôle battle non battu déclenche le combat (checkSightLine) ;
              battu = éteint, Talk (A adjacent) → post_battle. Le tap de
              contournement de l'issue 10 est supprimé (issue 12) : les
              placements injoignables — Silver #1 en tête — sont corrigés
              dans le contenu, voir a1-traversal.test.ts. Aucun badge combat
              permanent au repos (issue 13, durci — même principe que les
              PNJ : pas d'icône flottante fidèle au jeu) — seul le ！
              d'embuscade, déjà fidèle au jeu, reste. */}
          {trainers.map(trainer => {
            const px = worldToPixel(trainer.world_x, trainer.world_z)
            const engaging = engagingTrainer === trainer.trainer_id
            // Un dresseur se dessine comme un PNJ. Il ne l'était pas : ce bloc
            // ne rendait qu'un div vide de 18px, donc RIEN à l'écran — d'où
            // « les dresseurs ne font rien », on ne pouvait pas les voir, et
            // encore moins deviner où passait leur ligne de vue (issue 13).
            const sprite = trainer.sprite_id ? resolveNpcSprite(trainer.sprite_id) : null
            const frame = sprite ? spriteFrameOffset(sprite, trainer.facing) : null
            return (
              <div
                key={trainer.trainer_id}
                style={{
                  position: 'absolute',
                  left: px.x - (sprite ? SPRITE_FRAME_SIZE / 2 : 9) + zone.scale_x / 2,
                  top: px.y - (sprite ? SPRITE_FRAME_SIZE : 16) + zone.scale_y,
                  width: sprite ? SPRITE_FRAME_SIZE : 18,
                  height: sprite ? SPRITE_FRAME_SIZE : 18,
                  pointerEvents: 'none',
                  zIndex: 5,
                }}
                title={trainer.name}
              >
                {sprite && (
                  <div
                    style={{
                      width: SPRITE_FRAME_SIZE,
                      height: SPRITE_FRAME_SIZE,
                      backgroundImage: `url(${sprite.url})`,
                      backgroundPosition: `${frame?.x ?? 0}px ${frame?.y ?? 0}px`,
                      backgroundRepeat: 'no-repeat',
                      imageRendering: 'pixelated',
                      opacity: trainer.defeated ? 0.75 : 1,
                    }}
                  />
                )}
                {engaging && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-amber-300 text-base font-bold animate-bounce">
                    ！
                  </div>
                )}
              </div>
            )
          })}

          {/* Portes/warps : ni carré ni icône (issue 13, demande explicite —
              HGSS ne les indique jamais visuellement, une porte se reconnaît
              au décor lui-même). On marche dessus, ou A face à elle
              (issue 12 : plus de tap sur un marqueur, qui n'existe plus). */}

          {/* Suivi du compagnon (issue 10) : une case derrière le joueur, sur
              la tuile qu'il vient de quitter, tourné dans la même direction
              que lui. Pose fixe : l'ancien cycle `ow-sprite-idle` (8 pas)
              parcourait en fait les 4 directions de la planche — le compagnon
              tournoyait sur lui-même (issue 13, même famille que la frame 0
              « de dos » des PNJ). */}
          {followerSprite &&
            followerPos &&
            (followerPos.world_x !== playerPos.world_x ||
              followerPos.world_z !== playerPos.world_z) && (
              <div
                style={{
                  position: 'absolute',
                  left: worldToPixel(followerPos.world_x, followerPos.world_z).x - SPRITE_FRAME_SIZE / 2 + zone.scale_x / 2,
                  top: worldToPixel(followerPos.world_x, followerPos.world_z).y - SPRITE_FRAME_SIZE + zone.scale_y,
                  width: SPRITE_FRAME_SIZE,
                  height: SPRITE_FRAME_SIZE,
                  transition: `left ${STEP_MS / 1000}s linear, top ${STEP_MS / 1000}s linear`,
                  pointerEvents: 'none',
                  zIndex: 9,
                }}
              >
                <div
                  style={{
                    width: SPRITE_FRAME_SIZE,
                    height: SPRITE_FRAME_SIZE,
                    backgroundImage: `url(${followerSprite.url})`,
                    backgroundPosition: (() => {
                      const f = spriteFrameOffset(followerSprite, facing)
                      return `${f.x}px ${f.y}px`
                    })(),
                    backgroundRepeat: 'no-repeat',
                    imageRendering: 'pixelated',
                  }}
                />
              </div>
            )}

          {/* Player avatar — direction row from the sheet, walk cycle while
              a step is in flight */}
          <div
            style={{
              position: 'absolute',
              left: avatarPx.x - SPRITE_FRAME_SIZE / 2 + zone.scale_x / 2,
              top: avatarPx.y - SPRITE_FRAME_SIZE + zone.scale_y,
              width: SPRITE_FRAME_SIZE,
              height: SPRITE_FRAME_SIZE,
              transition: `left ${STEP_MS / 1000}s linear, top ${STEP_MS / 1000}s linear`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div
              key={bumpKey}
              className={`${stepping ? 'ow-sprite-walk' : ''} ${bumpKey ? 'ow-bump' : ''}`}
              style={
                {
                  width: SPRITE_FRAME_SIZE,
                  height: SPRITE_FRAME_SIZE,
                  backgroundImage: `url(${playerSpriteUrl})`,
                  backgroundPositionX: 0,
                  backgroundPositionY: -SPRITE_ROW[facing] * SPRITE_FRAME_SIZE,
                  backgroundRepeat: 'no-repeat',
                  imageRendering: 'pixelated',
                  '--bump-x': `${DIRECTION_DELTA[facing].dx * 3}px`,
                  '--bump-y': `${DIRECTION_DELTA[facing].dz * 3}px`,
                } as React.CSSProperties
              }
            />
          </div>
        </div>
      </div>
      </div>
      </div>

      {/* Panneau de nom de zone, à l'entrée d'une nouvelle zone. Le jeu
          d'origine le pose en HAUT À GAUCHE (pas centré), sous la forme d'une
          plaque arrondie à double liseré — bord extérieur sombre, filet blanc
          intérieur, fond dégradé clair, nom en texte foncé — qui glisse depuis
          le bord puis se retire. Reconstruit en CSS : les assets de chrome
          extraits de la ROM (public/sprites/ui/menus/) sont inexploitables,
          palettes perdues à l'extraction (issue 13). */}
      {banner && (
        <div
          key={banner.key}
          data-testid="zone-banner"
          className="zone-banner fixed top-3 left-3 z-50 pointer-events-none"
        >
          <div className="zone-banner-plate font-reading">{banner.label}</div>
        </div>
      )}

      {/* Elevator floor picker — step on the elevator panel (violet tile)
          to open; B closes */}
      {floorPicker && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
          onClick={e => {
            e.stopPropagation()
            setFloorPicker(false)
          }}
        >
          <div
            className="w-64 max-h-80 overflow-y-auto bg-gray-900 border-2 border-white rounded-lg p-2"
            onClick={e => e.stopPropagation()}
          >
            {zone.elevator_floors.map(floor => (
              <button
                key={floor.name}
                onClick={() => {
                  setFloorPicker(false)
                  goToZoneWithFade(floor.name, () => ({ world_x: floor.x, world_z: floor.z }))
                }}
                className="w-full text-left px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded"
              >
                {zoneLabel(floor.name)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Combat (issue 07) — overlay plein écran au-dessus de tout le chrome
          carte ; état 100 % client, un remount = un nouveau combat */}
      {battle && <BattleScreen battle={battle} onFinish={finishBattle} />}

      {/* Dialogue overlay — pagination, X/Y, kinds spéciaux (issue 03) */}
      {activeDialogue && (
        <DialogueBox
          ref={dialogueBoxRef}
          name={activeDialogue.name}
          pages={activeDialogue.pages}
          onClose={closeDialogue}
          onChooseCompanion={async id => {
            await chooseCompanion(id)
          }}
        />
      )}

      {/* Manette posée SUR le jeu, à la façon d'un émulateur (issue 13) :
          translucide, sans fond opaque qui mange l'écran. La croix à gauche,
          les quatre boutons en losange à droite comme sur une DS — B en bas,
          A à droite, Y à gauche, X en haut. Le bouton muet a disparu : le son
          se règle dans せってい (menu START), pas par un bouton flottant. */}
      <div
        className="fixed bottom-6 left-4 z-[70]"
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateAreas: `". up ." "left . right" ". down ."`,
            gap: 2,
          }}
        >
          {dirButton('north', '▲', 'up')}
          {dirButton('west', '◀', 'left')}
          {dirButton('east', '▶', 'right')}
          {dirButton('south', '▼', 'down')}
        </div>
      </div>

      <div
        className="fixed bottom-6 right-4 z-[70]"
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateAreas: `". x ." "y . a" ". b ."`,
            gap: 2,
          }}
        >
          {faceButton('x', 'X', onX, !dialogueOpen)}
          {faceButton('y', 'Y', onY, !dialogueOpen)}
          {faceButton('a', 'A', onA, false)}
          {faceButton('b', 'B', onB, false)}
        </div>
      </div>

      {/* HUD overlay — stopPropagation so taps on it never fall through */}
      <div className="fixed bottom-0 left-0 right-0 z-50" onClick={e => e.stopPropagation()}>
        {/* Zone picker drawer (dev navigation) with CS-Kanji dev toggles —
            the real acquisition flow (gym rewards) isn't built yet, so the
            chips grant/revoke abilities directly for testing.
            M4 (revue jalon 1) : dev uniquement — jamais rendu en production
            (et le serveur refuse de toute façon le téléport / les drapeaux
            CS : saveMapPosition C1, saveMapProgress M4). */}
        {devDrawerEnabled && showZonePicker && (
          <div className="bg-black/90 border-t border-white/20 max-h-60 overflow-y-auto">
            <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-b border-white/10 sticky top-0 bg-black/90">
              {(
                [
                  ['kudaku', '砕'],
                  ['kiru', '切'],
                  ['mizu', '水'],
                  ['chikara', '力'],
                  ['tobu', '飛'],
                  ['uzu', '渦'],
                  ['taki', '滝'],
                  ['arrosoir', '🚿'],
                  ['radio', '📻'],
                ] as const
              ).map(([flag, label]) => (
                <button
                  key={flag}
                  onClick={() => updateProgress({ [flag]: !progress[flag] })}
                  className={`w-8 h-8 rounded border text-sm font-bold shrink-0 ${
                    progress[flag]
                      ? 'bg-amber-400/90 border-amber-600 text-black'
                      : 'bg-white/10 border-white/25 text-white/60'
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className="text-white/30 text-[10px] ml-1 shrink-0">dev</span>
            </div>
            {allZoneNames.map(z => (
              <button
                key={z.name}
                onClick={() => handleZoneChange(z.name)}
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-white/5 transition-colors ${
                  z.name === zone.name
                    ? 'text-amber-400 font-medium'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {progress.visited.includes(z.name) ? '✓ ' : ''}
                {zoneLabel(z.name)}
              </button>
            ))}
          </div>
        )}

        {/* Main HUD bar */}
        <div className="bg-black/80 backdrop-blur-sm border-t border-white/10 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => devDrawerEnabled && setShowZonePicker(v => !v)}
            className="flex-1 text-left"
          >
            <div className="text-white font-semibold text-sm leading-tight">{zoneLabel(zone.name)}</div>
            <div className="text-white/40 text-xs mt-0.5">
              💬 {npcs.length} · 🚪 {zone.warps.filter(w => typeof w.header === 'string').length}
              {trainers.length > 0 && ` · ⚔ ${trainers.length}`}
              {beatCount > 0 && ` · ◎ ${beatCount}`}
            </div>
          </button>

          <div className="text-right">
            <div className="text-white/40 font-mono text-[10px] leading-tight">
              {playerPos.world_x},{playerPos.world_z}
            </div>
          </div>
        </div>
      </div>

      {/* Fondu de warp (issue 13, QA humaine) — écran plein, au-dessus de
          tout le chrome (D-pad/A-B compris, comme une vraie transition
          d'écran). Purement visuel : l'entrée est déjà gelée par
          warpFadeActiveRef côté attemptStep/onA, pointer-events reste
          'none' pour ne rien changer d'autre au DOM pendant les tests. */}
      <div
        aria-hidden="true"
        data-testid="warp-fade"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 90,
          background: '#000',
          opacity: warpFading ? 1 : 0,
          pointerEvents: 'none',
          transition: `opacity ${WARP_FADE_MS}ms ease`,
        }}
      />
    </div>
  )
}
