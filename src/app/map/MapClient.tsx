'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { saveMapProgress, saveMapPosition, reachDialogueState } from './actions'
import {
  canTraverse,
  terrainAt,
  zoneSpawn,
  findOutdoorZoneAt,
  ledgeDirAt,
  warpAt,
  DIRECTION_BY_CODE,
  DIRECTION_DELTA,
  type Direction,
  type Zone,
  type ZoneWarp,
} from '@/lib/zone-geometry'
import type { ZoneNpc } from '@/lib/npcs'
import { isInSightLine, type ZoneTrainer } from '@/lib/trainers'
import type { ZoneListEntry } from '@/lib/zones'
import { resolveNpcSprite, PLAYER_SPRITE_URL, SPRITE_FRAME_SIZE } from '@/lib/npc-sprites'
import {
  obstacleKindOf,
  obstacleKey,
  requiredFlag,
  blockedLine,
  clearedLine,
  type MapProgress,
} from '@/lib/obstacles'

export type { Zone, ZoneObject, ZoneWarp } from '@/lib/zone-geometry'
export type { ZoneNpc } from '@/lib/npcs'
export type { ZoneTrainer } from '@/lib/trainers'

export interface PlayerPos {
  world_x: number
  world_z: number
}

interface DialoguePage {
  jp: string
  en: string
}

interface ActiveDialogue {
  name: string
  pages: DialoguePage[]
  pageIndex: number
}

interface Props {
  zone: Zone
  npcs: ZoneNpc[]
  trainers: ZoneTrainer[]
  initialPos: PlayerPos
  initialProgress: MapProgress
  allZoneNames: ZoneListEntry[]
}

// One tile per input (PRD "Mouvement de l'avatar"); holding a direction
// repeats at this cadence. The avatar's CSS transition matches it so steps
// chain into a continuous walk.
const STEP_MS = 170
const HOP_MS = 280
const SLIDE_MS = 110

// Player sheet rows (public/sprites/characters/protagonist_ethan_ow.png,
// 8×4 frames of 32px): 0=south, 1=north, 2=west, 3=east.
const SPRITE_ROW: Record<Direction, number> = { south: 0, north: 1, west: 2, east: 3 }

function formatZoneName(name: string): string {
  return name.replace(/^MAP_/, '').replace(/_/g, ' ')
}

// Deterministic per-object offset so idle sprite animations aren't all in
// lockstep — real value doesn't matter, just needs to spread across [0, 2.4).
function idDelay(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return (Math.abs(hash) % 240) / 100
}

// Dialogue text carries readings inline as 漢字（かな） — hidden by default
// (PRD: furigana are never auto-shown; Y reveals them on demand).
function stripReadings(jp: string): string {
  return jp.replace(/（[ぁ-ゖァ-ヶー・]+）/g, '')
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

export default function MapClient({ zone: initialZone, npcs: initialNpcs, trainers: initialTrainers, initialPos, initialProgress, allZoneNames }: Props) {
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
  // Trainers spotted this session — client-only, since there's no battle
  // system yet to actually clear them server-side (see ADR-0001/0003).
  const [spottedTrainers, setSpottedTrainers] = useState<Set<string>>(new Set())
  const [viewSize, setViewSize] = useState({ w: 375, h: 667 })
  const [showZonePicker, setShowZonePicker] = useState(false)
  const [activeDialogue, setActiveDialogue] = useState<ActiveDialogue | null>(null)
  const [showEn, setShowEn] = useState(false)
  const [showFurigana, setShowFurigana] = useState(false)
  const [banner, setBanner] = useState<{ label: string; key: number } | null>(null)

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
  zoneRef.current = zone
  playerPosRef.current = playerPos
  facingRef.current = facing
  npcsRef.current = npcs
  trainersRef.current = trainers
  dialogueRef.current = activeDialogue
  progressRef.current = progress
  floorPickerRef.current = floorPicker

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

  useEffect(
    () => () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current)
      if (stepSettleTimeoutRef.current) clearTimeout(stepSettleTimeoutRef.current)
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current)
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current)
    },
    []
  )

  const displayNameByZone = useRef(new Map(allZoneNames.map(z => [z.name, z.display_name]))).current
  const zoneLabel = useCallback(
    (name: string) => displayNameByZone.get(name) || formatZoneName(name),
    [displayNameByZone]
  )

  useEffect(() => {
    const update = () => setViewSize({ w: window.innerWidth, h: window.innerHeight })
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
        saveMapPosition(zoneName, x, z).catch(err => console.error('Failed to save map position', err))
      }, 400)
    },
    []
  )

  const worldToPixel = useCallback(
    (wx: number, wz: number) => ({
      x: (wx - zone.world_origin_x) * zone.scale_x,
      y: (wz - zone.world_origin_y) * zone.scale_y,
    }),
    [zone]
  )

  const avatarPx = worldToPixel(playerPos.world_x, playerPos.world_z)

  // Map container offset so avatar is centered in viewport
  const offsetX = viewSize.w / 2 - avatarPx.x
  const offsetY = viewSize.h / 2 - avatarPx.y

  const openDialogue = useCallback((name: string, pages: DialoguePage[]) => {
    if (pages.length === 0) return
    setShowEn(false)
    setShowFurigana(false)
    setActiveDialogue({ name, pages, pageIndex: 0 })
  }, [])

  // Server action : sélectionne le dialogue_state actif contre le vrai état
  // joueur et applique ses Effect[] côté serveur (issue 02) — remplace
  // l'ancien GET /api/dialogue qui servait toujours l'état default.
  const fetchDialogue = useCallback(
    (ref: string) => {
      reachDialogueState(ref)
        .then(data => {
          // Les entrées à `kind` spécial (companion_choice…) seront routées
          // par l'issue 03 — ici on ne rend que les pages de texte.
          const pages = (data?.pages ?? [])
            .filter(p => typeof p.jp === 'string')
            .map(p => ({ jp: p.jp as string, en: typeof p.en === 'string' ? p.en : '' }))
          if (data && pages.length) openDialogue(data.name, pages)
        })
        .catch(err => console.error('Failed to load dialogue', err))
    },
    [openDialogue]
  )

  // Line-of-sight trigger (ADR-0001): no battle system exists yet to
  // actually fight, so "spotted" just opens the trainer's battle_intro
  // dialogue once per session — a stub for the real trigger.
  const checkSightLine = useCallback(
    (trainerList: ZoneTrainer[], wx: number, wz: number) => {
      const spotted = trainerList.find(
        t => !spottedTrainers.has(t.trainer_id) && isInSightLine(t, wx, wz)
      )
      if (!spotted) return
      setSpottedTrainers(prev => new Set(prev).add(spotted.trainer_id))
      fetchDialogue(spotted.dialogue_ref)
    },
    [spottedTrainers, fetchDialogue]
  )

  const showBanner = useCallback((label: string) => {
    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current)
    setBanner({ label, key: Date.now() })
    bannerTimeoutRef.current = setTimeout(() => setBanner(null), 1900)
  }, [])

  const goToZone = useCallback(
    async (targetName: string, resolveSpawn?: (newZone: Zone) => PlayerPos | null) => {
      if (isTransitioningRef.current) return
      isTransitioningRef.current = true
      try {
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
        setFloorPicker(false)
        showBanner(zoneLabel(newZone.name))
        markVisited(newZone.name)
        persistPosition(newZone.name, pos.world_x, pos.world_z)
        checkSightLine(newTrainers, pos.world_x, pos.world_z)
      } catch (err) {
        console.error('Zone transition failed', err)
      } finally {
        isTransitioningRef.current = false
      }
    },
    [persistPosition, checkSightLine, showBanner, zoneLabel, markVisited]
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
      goToZone(warp.header, newZone => {
        const anchorWarp = newZone.warps[warp.anchor]
        if (anchorWarp) return { world_x: anchorWarp.x, world_z: anchorWarp.z }
        return zoneSpawn(newZone)
      })
    },
    [goToZone]
  )

  /** Obstacle already cleared by the player (力/水/飛 interactions)? */
  const isCleared = useCallback(
    (obj: Zone['objects'][number]) =>
      progressRef.current.cleared.includes(obstacleKey(zoneRef.current.name, obj)),
    []
  )

  /** Solid occupants: NPCs, trainers, and visible decorative objects all
   * block movement, like in the original game — minus cleared obstacles. */
  const isTileOccupied = useCallback(
    (wx: number, wz: number) => {
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
      setPlayerPos(pos)
      persistPosition(zoneRef.current.name, pos.world_x, pos.world_z)
      checkSightLine(trainersRef.current, pos.world_x, pos.world_z)
    },
    [persistPosition, checkSightLine, enterWarp, isTileOccupied]
  )

  const attemptStep = useCallback(
    (dir: Direction) => {
      if (dialogueRef.current || floorPickerRef.current || isTransitioningRef.current) return
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
    [allZoneNames, goToZone, isTileOccupied, settleStep]
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

  const advanceDialogue = useCallback(() => {
    setActiveDialogue(current => {
      if (!current) return current
      if (current.pageIndex + 1 >= current.pages.length) return null
      return { ...current, pageIndex: current.pageIndex + 1 }
    })
  }, [])

  const onA = useCallback(() => {
    if (dialogueRef.current) {
      advanceDialogue()
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
      fetchDialogue(npc.dialogue_ref)
      return
    }
    const trainer = trainersRef.current.find(t => t.world_x === fx && t.world_z === fz)
    if (trainer) {
      fetchDialogue(trainer.dialogue_ref)
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
    // ROM-extracted background characters have no authored dialogue yet —
    // a wordless beat instead of dead air (no invented content).
    openDialogue('', [{ jp: '・・・・・・', en: '' }])
  }, [advanceDialogue, fetchDialogue, enterWarp, openDialogue, isCleared, updateProgress])

  const onB = useCallback(() => {
    if (dialogueRef.current) setActiveDialogue(null)
    else if (floorPickerRef.current) setFloorPicker(false)
  }, [])

  const onX = useCallback(() => {
    if (dialogueRef.current) setShowEn(v => !v)
  }, [])

  const onY = useCallback(() => {
    if (dialogueRef.current) setShowFurigana(v => !v)
  }, [])

  // ── Keyboard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const dirForKey = (code: string): Direction | null => {
      switch (code) {
        case 'ArrowUp':
        case 'KeyW':
          return 'north'
        case 'ArrowDown':
        case 'KeyS':
          return 'south'
        case 'ArrowLeft':
        case 'KeyA':
          return 'west'
        case 'ArrowRight':
        case 'KeyD':
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
      switch (e.code) {
        case 'Space':
        case 'Enter':
          e.preventDefault()
          onA()
          break
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

  const handleNpcClick = useCallback(
    (e: React.MouseEvent, npc: ZoneNpc) => {
      e.stopPropagation()
      fetchDialogue(npc.dialogue_ref)
    },
    [fetchDialogue]
  )

  const handleWarpClick = useCallback(
    (e: React.MouseEvent, warp: ZoneWarp) => {
      e.stopPropagation()
      enterWarp(warp)
    },
    [enterWarp]
  )

  // Adjacent outdoor zones drawn around the current one so the shared
  // world reads as continuous instead of an island on black. Their images
  // are rescaled to this zone's px/tile so world coordinates line up.
  const neighborZones =
    zone.is_outdoor && zone.name !== 'MAP_EVERYWHERE'
      ? allZoneNames.filter(
          nz =>
            nz.is_outdoor &&
            nz.name !== zone.name &&
            nz.name !== 'MAP_EVERYWHERE' &&
            nz.screenshot &&
            nz.world_origin_x < zone.world_origin_x + zone.tile_width + 40 &&
            nz.world_origin_x + nz.tile_width > zone.world_origin_x - 40 &&
            nz.world_origin_y < zone.world_origin_y + zone.tile_height + 40 &&
            nz.world_origin_y + nz.tile_height > zone.world_origin_y - 40
        )
      : []

  const dirButton = (dir: Direction, label: string, gridArea: string) => (
    <button
      key={dir}
      aria-label={dir}
      style={{ gridArea, touchAction: 'none' }}
      className="w-11 h-11 bg-white/10 active:bg-white/30 border border-white/20 rounded flex items-center justify-center text-white/70 text-lg"
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

  const currentPage = activeDialogue?.pages[activeDialogue.pageIndex]
  const beatCount = allZoneNames.find(z => z.name === zone.name)?.beat_count ?? 0

  return (
    <div className="fixed inset-0 overflow-hidden bg-black select-none">
      {/* World — translates to keep player centered */}
      <div
        style={{
          position: 'absolute',
          transform: `translate(${offsetX}px, ${offsetY}px)`,
          transition: `transform ${STEP_MS / 1000}s linear`,
          willChange: 'transform',
        }}
      >
        {/* Neighboring outdoor zones, underneath the active zone */}
        {neighborZones.map(nz => (
          <img
            key={nz.name}
            src={nz.screenshot}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: (nz.world_origin_x - zone.world_origin_x) * zone.scale_x,
              top: (nz.world_origin_y - zone.world_origin_y) * zone.scale_y,
              width: nz.tile_width * zone.scale_x,
              height: nz.tile_height * zone.scale_y,
              // Visited zones read almost live; unvisited ones sit greyed
              // out until entered (PRD § Affichage de la carte).
              filter: progress.visited.includes(nz.name)
                ? 'brightness(0.75)'
                : 'brightness(0.45) saturate(0.35)',
            }}
          />
        ))}

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
              rendered as the real overworld sprite (idle-animated, row 0 of
              the sheet, for the ~90% of matches that have a standard 8-frame
              layout) for the ~98% of instances resolved via resolveNpcSprite,
              falling back to a plain dot for the rest. Solid to walk into;
              A in front of one gives a wordless beat. */}
          {zone.objects.map(obj => {
            if (progress.cleared.includes(`${zone.name}#${obj.id}`)) return null
            const px = worldToPixel(obj.x, obj.z)
            const sprite = resolveNpcSprite(obj.spriteId, obj.eventFlag)
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
                {sprite ? (
                  <div
                    className={sprite.cols === 8 ? 'ow-sprite-idle' : undefined}
                    style={{
                      width: SPRITE_FRAME_SIZE,
                      height: SPRITE_FRAME_SIZE,
                      backgroundImage: `url(${sprite.url})`,
                      backgroundPosition: '0 0',
                      imageRendering: 'pixelated',
                      animationDelay: `-${idDelay(obj.id)}s`,
                    }}
                  />
                ) : (
                  <div
                    style={{ width: 16, height: 16, borderRadius: '50%' }}
                    className="bg-amber-400 border-2 border-amber-700 shadow-sm opacity-90"
                  />
                )}
              </div>
            )
          })}

          {/* Curated NPC markers — face them and press A (or click) */}
          {npcs.map(npc => {
            const px = worldToPixel(npc.world_x, npc.world_z)
            return (
              <div
                key={npc.npc_id}
                onClick={e => handleNpcClick(e, npc)}
                style={{
                  position: 'absolute',
                  left: px.x - 9 + zone.scale_x / 2,
                  top: px.y - 16 + zone.scale_y,
                  width: 18,
                  height: 18,
                  cursor: 'pointer',
                  zIndex: 5,
                }}
                title={npc.name}
              >
                <div
                  style={{ width: 18, height: 18, borderRadius: '50%' }}
                  className="bg-emerald-400 border-2 border-emerald-700 shadow-sm hover:scale-110 transition-transform flex items-center justify-center text-[9px]"
                >
                  💬
                </div>
              </div>
            )
          })}

          {/* Trainer markers — walking into their line of sight triggers the
              battle_intro dialogue once (see checkSightLine). */}
          {trainers.map(trainer => {
            const px = worldToPixel(trainer.world_x, trainer.world_z)
            const spotted = spottedTrainers.has(trainer.trainer_id)
            return (
              <div
                key={trainer.trainer_id}
                style={{
                  position: 'absolute',
                  left: px.x - 9 + zone.scale_x / 2,
                  top: px.y - 16 + zone.scale_y,
                  width: 18,
                  height: 18,
                  pointerEvents: 'none',
                  zIndex: 5,
                }}
                title={trainer.name}
              >
                <div
                  style={{ width: 18, height: 18, borderRadius: '50%' }}
                  className={`border-2 shadow-sm flex items-center justify-center text-[9px] ${
                    spotted ? 'bg-gray-400 border-gray-600' : 'bg-red-500 border-red-800'
                  }`}
                >
                  {spotted ? '·' : '!'}
                </div>
              </div>
            )
          })}

          {/* Warp door markers — step on them (or click) to enter. Dynamic
              (elevator) warps are inert and rendered dimmer. */}
          {zone.warps.map((warp, i) => {
            const px = worldToPixel(warp.x, warp.z)
            const isElevator = typeof warp.header !== 'string'
            const active = !isElevator || zone.elevator_floors.length > 0
            return (
              <div
                key={i}
                onClick={active ? e => handleWarpClick(e, warp) : undefined}
                style={{
                  position: 'absolute',
                  left: px.x + zone.scale_x / 2 - 7,
                  top: px.y + zone.scale_y / 2 - 7,
                  width: 14,
                  height: 14,
                  cursor: active ? 'pointer' : 'default',
                }}
                title={isElevator ? undefined : zoneLabel(warp.header as string)}
              >
                <div
                  style={{ width: 14, height: 14, borderRadius: 3 }}
                  className={`border-2 shadow-sm transition-opacity ${
                    !active
                      ? 'bg-gray-500 border-gray-700 opacity-40'
                      : isElevator
                        ? 'bg-violet-400 border-violet-700 opacity-80 hover:opacity-100'
                        : 'bg-sky-400 border-sky-700 opacity-80 hover:opacity-100'
                  }`}
                />
              </div>
            )
          })}

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
                  backgroundImage: `url(${PLAYER_SPRITE_URL})`,
                  backgroundPositionX: 0,
                  backgroundPositionY: -SPRITE_ROW[facing] * SPRITE_FRAME_SIZE,
                  imageRendering: 'pixelated',
                  '--bump-x': `${DIRECTION_DELTA[facing].dx * 3}px`,
                  '--bump-y': `${DIRECTION_DELTA[facing].dz * 3}px`,
                } as React.CSSProperties
              }
            />
          </div>
        </div>
      </div>

      {/* Zone-name banner */}
      {banner && (
        <div key={banner.key} className="zone-banner fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-black/80 border border-white/30 rounded px-4 py-1.5 text-white text-sm font-semibold tracking-wide">
            {banner.label}
          </div>
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
                  goToZone(floor.name, () => ({ world_x: floor.x, world_z: floor.z }))
                }}
                className="w-full text-left px-3 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded"
              >
                {zoneLabel(floor.name)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dialogue overlay */}
      {activeDialogue && currentPage && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/20"
          onClick={e => {
            e.stopPropagation()
            advanceDialogue()
          }}
        >
          <div className="w-full max-w-md m-4 mb-24 bg-gray-900 border-2 border-white rounded-lg p-5">
            {activeDialogue.name && (
              <p className="text-xs text-amber-400 uppercase tracking-widest mb-2">{activeDialogue.name}</p>
            )}
            <p className="text-white text-lg leading-relaxed mb-1">
              {showFurigana ? currentPage.jp : stripReadings(currentPage.jp)}
            </p>
            {showEn && currentPage.en && <p className="text-white/50 text-sm">{currentPage.en}</p>}
            <p className="text-white/30 text-xs mt-3 text-right">
              {activeDialogue.pageIndex + 1}/{activeDialogue.pages.length} ▼
            </p>
          </div>
        </div>
      )}

      {/* DS-style controls — D-pad bottom-left, A/B bottom-right, X/Y only
          during a dialogue (PRD § Interface) */}
      <div className="fixed bottom-20 left-3 z-[70]" onClick={e => e.stopPropagation()}>
        <div
          style={{
            display: 'grid',
            gridTemplateAreas: `". up ." "left . right" ". down ."`,
            gap: 2,
            opacity: 0.85,
          }}
        >
          {dirButton('north', '▲', 'up')}
          {dirButton('west', '◀', 'left')}
          {dirButton('east', '▶', 'right')}
          {dirButton('south', '▼', 'down')}
        </div>
      </div>

      <div className="fixed bottom-20 right-3 z-[70] flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
        {activeDialogue && (
          <div className="flex gap-2 mb-1">
            <button
              onClick={onX}
              className={`w-9 h-9 rounded-full border text-xs font-bold ${
                showEn ? 'bg-amber-400/90 border-amber-600 text-black' : 'bg-white/10 border-white/25 text-white/70'
              }`}
              title="EN"
            >
              X
            </button>
            <button
              onClick={onY}
              className={`w-9 h-9 rounded-full border text-xs font-bold ${
                showFurigana ? 'bg-amber-400/90 border-amber-600 text-black' : 'bg-white/10 border-white/25 text-white/70'
              }`}
              title="かな"
            >
              Y
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={onB}
            className="w-11 h-11 rounded-full bg-white/10 active:bg-white/30 border border-white/25 text-white/80 font-bold"
          >
            B
          </button>
          <button
            onClick={onA}
            className="w-12 h-12 rounded-full bg-white/15 active:bg-white/35 border border-white/30 text-white font-bold"
          >
            A
          </button>
        </div>
      </div>

      {/* HUD overlay — stopPropagation so taps on it never fall through */}
      <div className="fixed bottom-0 left-0 right-0 z-50" onClick={e => e.stopPropagation()}>
        {/* Zone picker drawer (dev navigation) with CS-Kanji dev toggles —
            the real acquisition flow (gym rewards) isn't built yet, so the
            three chips grant/revoke 力/水/飛 directly for testing. */}
        {showZonePicker && (
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
          <button onClick={() => setShowZonePicker(v => !v)} className="flex-1 text-left">
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
    </div>
  )
}
