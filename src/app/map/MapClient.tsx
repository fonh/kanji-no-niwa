'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isWalkable, zoneCenter, type Zone, type ZoneWarp } from '@/lib/zone-geometry'
import type { ZoneNpc } from '@/lib/npcs'

export type { Zone, ZoneObject, ZoneWarp } from '@/lib/zone-geometry'
export type { ZoneNpc } from '@/lib/npcs'

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
  userId: string
  zone: Zone
  npcs: ZoneNpc[]
  initialPos: PlayerPos
  allZoneNames: { name: string; map_id: number }[]
}

function formatZoneName(name: string): string {
  return name.replace(/^MAP_/, '').replace(/_/g, ' ')
}

export default function MapClient({ userId, zone: initialZone, npcs: initialNpcs, initialPos, allZoneNames }: Props) {
  const [zone, setZone] = useState(initialZone)
  const [npcs, setNpcs] = useState(initialNpcs)
  const [playerPos, setPlayerPos] = useState(initialPos)
  const [viewSize, setViewSize] = useState({ w: 375, h: 667 })
  const [showZonePicker, setShowZonePicker] = useState(false)
  const [movingTo, setMovingTo] = useState<{ x: number; y: number; denied: boolean } | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [activeDialogue, setActiveDialogue] = useState<ActiveDialogue | null>(null)

  const supabase = useRef(createClient()).current

  useEffect(() => {
    const update = () => setViewSize({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const persistPosition = useCallback(
    (zoneName: string, x: number, z: number) => {
      supabase
        .from('users')
        .update({ map_zone: zoneName, map_x: x, map_z: z })
        .eq('id', userId)
        .then(({ error }) => {
          if (error) console.error('Failed to save map position', error)
        })
    },
    [supabase, userId]
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

  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      if (isTransitioning) return

      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      const wx = Math.round(clickX / zone.scale_x + zone.world_origin_x)
      const wz = Math.round(clickY / zone.scale_y + zone.world_origin_y)

      if (!isWalkable(zone, wx, wz)) {
        setMovingTo({ x: clickX, y: clickY, denied: true })
        setTimeout(() => setMovingTo(null), 300)
        return
      }

      setMovingTo({ x: clickX, y: clickY, denied: false })
      setPlayerPos({ world_x: wx, world_z: wz })
      persistPosition(zone.name, wx, wz)
      setTimeout(() => setMovingTo(null), 400)
    },
    [zone, isTransitioning, persistPosition]
  )

  const goToZone = useCallback(
    async (targetName: string, resolveSpawn?: (newZone: Zone) => PlayerPos) => {
      if (isTransitioning) return
      setIsTransitioning(true)
      try {
        const res = await fetch(`/api/zone?name=${encodeURIComponent(targetName)}`)
        if (!res.ok) return
        const { zone: newZone, npcs: newNpcs } = (await res.json()) as { zone: Zone; npcs: ZoneNpc[] }
        const pos = resolveSpawn ? resolveSpawn(newZone) : zoneCenter(newZone)
        setZone(newZone)
        setNpcs(newNpcs)
        setPlayerPos(pos)
        persistPosition(newZone.name, pos.world_x, pos.world_z)
      } finally {
        setIsTransitioning(false)
      }
    },
    [isTransitioning, persistPosition]
  )

  const handleWarpClick = useCallback(
    (e: React.MouseEvent, warp: ZoneWarp) => {
      e.stopPropagation()
      // The destination tile depends on the target zone's own warp list
      // (warp.anchor points back to the matching door there), so it can only
      // be resolved once that zone's data has been fetched.
      goToZone(warp.header, newZone => {
        const anchorWarp = newZone.warps[warp.anchor]
        return anchorWarp ? { world_x: anchorWarp.x, world_z: anchorWarp.z } : zoneCenter(newZone)
      })
    },
    [goToZone]
  )

  const handleZoneChange = useCallback(
    (name: string) => {
      setShowZonePicker(false)
      goToZone(name)
    },
    [goToZone]
  )

  const handleNpcClick = useCallback(async (e: React.MouseEvent, npc: ZoneNpc) => {
    e.stopPropagation()
    const res = await fetch(`/api/dialogue?ref=${encodeURIComponent(npc.dialogue_ref)}`)
    if (!res.ok) return
    const { name, pages } = (await res.json()) as { name: string; pages: DialoguePage[] }
    if (pages.length === 0) return
    setActiveDialogue({ name, pages, pageIndex: 0 })
  }, [])

  const advanceDialogue = useCallback(() => {
    setActiveDialogue(current => {
      if (!current) return current
      if (current.pageIndex + 1 >= current.pages.length) return null
      return { ...current, pageIndex: current.pageIndex + 1 }
    })
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden bg-black select-none">
      {/* World — translates to keep player centered */}
      <div
        style={{
          position: 'absolute',
          transform: `translate(${offsetX}px, ${offsetY}px)`,
          transition: 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
        }}
      >
        <div
          style={{ position: 'relative', width: zone.screenshot_w, height: zone.screenshot_h, cursor: 'crosshair' }}
          onClick={handleMapClick}
        >
          {/* Map screenshot */}
          <img
            src={zone.screenshot}
            width={zone.screenshot_w}
            height={zone.screenshot_h}
            alt={formatZoneName(zone.name)}
            draggable={false}
            style={{ display: 'block' }}
          />

          {/* Decorative object markers (trees, items, background sprites) */}
          {zone.objects.map(obj => {
            const px = worldToPixel(obj.x, obj.z)
            return (
              <div
                key={obj.id}
                style={{
                  position: 'absolute',
                  left: px.x - 8,
                  top: px.y - 14,
                  width: 16,
                  height: 16,
                  pointerEvents: 'none',
                }}
                title={obj.id}
              >
                <div
                  style={{ width: 16, height: 16, borderRadius: '50%' }}
                  className="bg-amber-400 border-2 border-amber-700 shadow-sm opacity-90 flex items-center justify-center text-[8px]"
                />
              </div>
            )
          })}

          {/* NPC markers — clickable, open dialogue */}
          {npcs.map(npc => {
            const px = worldToPixel(npc.world_x, npc.world_z)
            return (
              <div
                key={npc.npc_id}
                onClick={e => handleNpcClick(e, npc)}
                style={{
                  position: 'absolute',
                  left: px.x - 9,
                  top: px.y - 16,
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

          {/* Warp door markers */}
          {zone.warps.map((warp, i) => {
            const px = worldToPixel(warp.x, warp.z)
            return (
              <div
                key={i}
                onClick={e => handleWarpClick(e, warp)}
                style={{
                  position: 'absolute',
                  left: px.x - 7,
                  top: px.y - 7,
                  width: 14,
                  height: 14,
                  cursor: 'pointer',
                }}
                title={formatZoneName(warp.header)}
              >
                <div
                  style={{ width: 14, height: 14, borderRadius: 3 }}
                  className="bg-sky-400 border-2 border-sky-700 shadow-sm opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
            )
          })}

          {/* Tap indicator ripple */}
          {movingTo && (
            <div
              key={`${movingTo.x}-${movingTo.y}`}
              style={{
                position: 'absolute',
                left: movingTo.x - 12,
                top: movingTo.y - 12,
                width: 24,
                height: 24,
                pointerEvents: 'none',
              }}
              className={`rounded-full border-2 animate-ping ${movingTo.denied ? 'border-red-500/80' : 'border-white/60'}`}
            />
          )}

          {/* Player avatar */}
          <div
            style={{
              position: 'absolute',
              left: avatarPx.x - 14,
              top: avatarPx.y - 26,
              width: 28,
              height: 28,
              transition: 'left 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {/* Outer ring */}
            <div
              style={{ width: 28, height: 28, borderRadius: '50%' }}
              className="bg-red-600 border-[3px] border-white shadow-[0_0_0_2px_rgba(0,0,0,0.4)] flex items-center justify-center"
            >
              {/* Inner dot */}
              <div style={{ width: 8, height: 8, borderRadius: '50%' }} className="bg-white opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Dialogue overlay */}
      {activeDialogue && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/20"
          onClick={advanceDialogue}
        >
          <div className="w-full max-w-md m-4 bg-gray-900 border-2 border-white rounded-lg p-5">
            <p className="text-xs text-amber-400 uppercase tracking-widest mb-2">{activeDialogue.name}</p>
            <p className="text-white text-lg leading-relaxed mb-1">
              {activeDialogue.pages[activeDialogue.pageIndex].jp}
            </p>
            <p className="text-white/50 text-sm">{activeDialogue.pages[activeDialogue.pageIndex].en}</p>
            <p className="text-white/30 text-xs mt-3 text-right">
              {activeDialogue.pageIndex + 1}/{activeDialogue.pages.length} · tap to continue
            </p>
          </div>
        </div>
      )}

      {/* HUD overlay */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Zone picker drawer */}
        {showZonePicker && (
          <div className="bg-black/90 border-t border-white/20 max-h-60 overflow-y-auto">
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
                {formatZoneName(z.name)}
              </button>
            ))}
          </div>
        )}

        {/* Main HUD bar */}
        <div className="bg-black/80 backdrop-blur-sm border-t border-white/10 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setShowZonePicker(v => !v)}
            className="flex-1 text-left"
          >
            <div className="text-white font-semibold text-sm leading-tight">
              {formatZoneName(zone.name)}
            </div>
            <div className="text-white/40 text-xs mt-0.5">
              {npcs.length} NPC · {zone.warps.length} entrée{zone.warps.length !== 1 ? 's' : ''}
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
