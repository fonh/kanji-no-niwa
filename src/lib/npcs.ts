import type { Zone } from '@/lib/zone-geometry'
import { zoneSlugForMapName } from '@/lib/zone-slug'
import {
  evalConditions,
  type Condition,
  type EvalContext,
  type PlayerState,
} from '@/lib/condition-effect'

/** Un poste possible pour un PNJ, gardé par des conditions.
 *
 * Le jeu d'origine déplace ses figurants au fil de l'histoire : l'assistant
 * d'Elm tient le fond du labo pendant toute la course de l'œuf, puis quitte
 * Bourg Geon pour le comptoir du Mart de Mauville quand Elm rappelle le joueur,
 * juste après le premier badge. Sans ça, il faudrait le supprimer et le recréer
 * sous un autre identifiant — donc perdre son dialogue et son rôle (voir
 * content/opening-sequence.md). */
export interface NpcPlacement {
  /** Zone MAP_* de ce poste. Absent = celle du PNJ (`map_zone` ou `zone_id`). */
  map_zone?: string
  tile_x: number
  tile_y: number
  facing?: 'north' | 'south' | 'east' | 'west'
  /** Absent ou vide = poste par défaut. Le DERNIER placement doit être dans ce
   * cas, sinon le PNJ n'existe nulle part avant sa première condition. */
  conditions?: Condition[]
}

interface RawNpc {
  npc_id: string
  zone_id: string
  name: string
  // Zone MAP_* explicite (issue 12) — pour les PNJ qui vivent DANS un
  // intérieur (Mom au 1F de la maison, Elm dans son labo…) : le slug de
  // contenu `zone_id` ne désigne que la zone extérieure de rattachement,
  // et l'heuristique zone-slug ne sert jamais les intérieurs. tile_x/tile_y
  // sont alors locaux à cette zone-là.
  map_zone?: string
  tile_x: number
  tile_y: number
  trigger_type: string
  dialogue_ref: string
  // Champs de cône de vision (Roadblock NPC, issue 10) — présents seulement
  // sur les PNJ à trigger_type sight_auto (ex. rocket_grunt_azalea).
  facing?: 'north' | 'south' | 'east' | 'west'
  sight_range?: number
  sight_auto_result?: string
  repeats?: boolean
  // Identifiant de sprite optionnel (issue 13) — absent pour l'immense
  // majorité des PNJ curatés (contenu séparé des objets de décor ROM, voir
  // src/lib/npc-sprites.ts), posé au cas par cas quand un vrai sprite
  // 4-directions vérifié existe (HNS_PEOPLE).
  sprite_id?: string
  /** L'objet ROM que ce personnage représente, quand il n'est pas posé
   * exactement dessus — voir DecorOccupant (src/lib/rom-decor.ts). */
  rom_object?: string
  /** Postes successifs, du plus tardif au plus précoce — le PREMIER dont les
   * conditions sont remplies gagne. Absent : le PNJ ne bouge jamais et
   * `tile_x`/`tile_y` font foi (cas de la grande majorité). */
  placements?: NpcPlacement[]
}

export interface ZoneNpc {
  npc_id: string
  zone_id: string
  name: string
  world_x: number
  world_z: number
  dialogue_ref: string
  /** talk (défaut) ou sight_auto — un sight_auto à résultat `block` déclenche
   * l'interception Roadblock (CONTEXT.md) dès l'entrée dans la ligne de vue. */
  trigger_type: string
  facing?: 'north' | 'south' | 'east' | 'west'
  sight_range?: number
  sight_auto_result?: string
  repeats?: boolean
  sprite_id?: string
  rom_object?: string
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawNpcs = require('../../content/map/npcs.json') as RawNpc[]

const knownZoneIds = Array.from(new Set(rawNpcs.map(n => n.zone_id)))

// content/map/npcs.json uses human zone_id slugs ("new-bark-town") while the
// zone registry uses ROM map names ("MAP_NEW_BARK") — the shared mapping
// heuristic lives in zone-slug.ts (issue 09), applied here to the slugs the
// NPC registry actually uses.
function zoneIdForMapName(mapName: string): string | undefined {
  return zoneSlugForMapName(mapName, knownZoneIds)
}

/** Le poste occupé par ce PNJ pour cet état de joueur.
 *
 * Sans état (appelants purs : tests de traversée, audits), c'est le poste par
 * défaut — le dernier de la liste — qui répond. C'est le bon repli : il décrit
 * le PNJ au début du jeu, donc l'état où la carte doit être franchissable. */
export function activePlacement(
  npc: Pick<RawNpc, 'map_zone' | 'tile_x' | 'tile_y' | 'facing' | 'placements'>,
  resolver?: { state: PlayerState; ctx: EvalContext }
): Required<Pick<NpcPlacement, 'tile_x' | 'tile_y'>> & NpcPlacement {
  const legacy: NpcPlacement = {
    map_zone: npc.map_zone,
    tile_x: npc.tile_x,
    tile_y: npc.tile_y,
    facing: npc.facing,
  }
  const list = npc.placements
  if (!list || list.length === 0) return legacy
  const chosen = resolver
    ? list.find(p => evalConditions(p.conditions ?? [], resolver.state, resolver.ctx))
    : list.find(p => (p.conditions ?? []).length === 0)
  const active = chosen ?? list[list.length - 1]
  return { ...legacy, ...active }
}

export function getNpcsForZone(
  zone: Zone,
  resolver?: { state: PlayerState; ctx: EvalContext }
): ZoneNpc[] {
  const zoneId = zoneIdForMapName(zone.name)

  // Un PNJ à `map_zone` explicite n'est servi QUE dans cette zone (c'est ce
  // qui place Mom dans sa maison et Elm dans son labo — issue 12) ; les
  // autres suivent l'heuristique de slug (zone extérieure de rattachement).
  // Avec des placements, c'est le poste ACTIF qui décide de la zone : un PNJ
  // peut légitimement changer de carte au fil de l'histoire.
  return rawNpcs
    .map(n => ({ n, at: activePlacement(n, resolver) }))
    .filter(({ n, at }) =>
      at.map_zone ? at.map_zone === zone.name : zoneId !== undefined && n.zone_id === zoneId
    )
    .map(({ n, at }) => ({
      npc_id: n.npc_id,
      zone_id: n.zone_id,
      name: n.name,
      world_x: zone.world_origin_x + at.tile_x,
      world_z: zone.world_origin_y + at.tile_y,
      dialogue_ref: n.dialogue_ref,
      trigger_type: n.trigger_type,
      facing: at.facing ?? n.facing,
      sight_range: n.sight_range,
      sight_auto_result: n.sight_auto_result,
      repeats: n.repeats,
      sprite_id: n.sprite_id,
      rom_object: n.rom_object,
    }))
}
