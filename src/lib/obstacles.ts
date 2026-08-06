import type { ZoneObject } from '@/lib/zone-geometry'

// Obstacle objects placed by the ROM's zone events, opened exactly like the
// original game (PRD § CS-Kanji, corrigé 2026-07-03): each CS-Kanji is
// handed over by an NPC (or found) at the same narrative moment as the
// original HM — never unlocked through the SRS — and the two story blockers
// take a key item:
//  - trees   → 切 (Coupe, Maître du Charbon, Ecorcia)
//  - cracked rocks → 砕 (Éclate-Roc, garçon de la Route 36)
//  - boulders → 力 (Force, Hiker de la Route 42)
//  - Sudowoodo → Arrosoir (Boutique de Fleurs, Doublonville)
//  - Snorlax → radio améliorée (carte EXPN, quête de la Centrale, Kanto)
// The acquisition flow (NPC hands it over) isn't built yet — the map's dev
// drawer can toggle each flag until quests land.
export type ObstacleKind = 'tree' | 'rock' | 'boulder' | 'sudowoodo' | 'snorlax'

const OBSTACLE_BY_SPRITE: Record<string, ObstacleKind> = {
  SPRITE_TREE: 'tree',
  SPRITE_BREAKROCK: 'rock',
  SPRITE_ROCK: 'boulder',
  SPRITE_USOKKY: 'sudowoodo',
  SPRITE_KABIGON: 'snorlax',
}

export interface MapProgress {
  // CS-Kanji — given by NPCs / found, like the original HMs
  tobu: boolean // 飛 (Vol — femme de Chuck)
  mizu: boolean // 水 (Surf — Gentleman du Théâtre)
  chikara: boolean // 力 (Force — Hiker Route 42)
  kiru: boolean // 切 (Coupe — Maître du Charbon)
  kudaku: boolean // 砕 (Éclate-Roc — garçon Route 36)
  taki: boolean // 滝 (Cascade — trouvé au Chemin Glacé)
  uzu: boolean // 渦 (Tourbillon — Lance, QG Rocket)
  // Objets-clés
  arrosoir: boolean // SquirtBottle (Boutique de Fleurs, Doublonville)
  radio: boolean // carte EXPN / émission Flûte Poké (Kanto)
  cleared: string[] // obstacle keys, see obstacleKey()
  visited: string[] // MAP_* names
  /** Défaites depuis le dernier passage au Centre Pokémon (2026-08-06,
   * src/lib/blackout.ts). La troisième renvoie au Centre. */
  defeats: number
  /** Dernier Centre Pokémon visité — le point de retour. null tant que le
   * joueur n'en a visité aucun (repli : celui de Ville Griotte). */
  last_center: { zone: string; world_x: number; world_z: number } | null
}

export const DEFAULT_PROGRESS: MapProgress = {
  tobu: false,
  mizu: false,
  chikara: false,
  kiru: false,
  kudaku: false,
  taki: false,
  uzu: false,
  arrosoir: false,
  radio: false,
  cleared: [],
  visited: [],
  defeats: 0,
  last_center: null,
}

export function parseProgress(raw: unknown): MapProgress {
  const p = (raw ?? {}) as Partial<MapProgress>
  return {
    tobu: p.tobu === true,
    mizu: p.mizu === true,
    chikara: p.chikara === true,
    kiru: p.kiru === true,
    kudaku: p.kudaku === true,
    taki: p.taki === true,
    uzu: p.uzu === true,
    arrosoir: p.arrosoir === true,
    radio: p.radio === true,
    cleared: Array.isArray(p.cleared) ? p.cleared : [],
    visited: Array.isArray(p.visited) ? p.visited : [],
    defeats: typeof p.defeats === 'number' && p.defeats >= 0 ? Math.floor(p.defeats) : 0,
    last_center:
      p.last_center &&
      typeof p.last_center.zone === 'string' &&
      typeof p.last_center.world_x === 'number' &&
      typeof p.last_center.world_z === 'number'
        ? p.last_center
        : null,
  }
}

export function obstacleKindOf(obj: ZoneObject): ObstacleKind | null {
  return OBSTACLE_BY_SPRITE[obj.spriteId] ?? null
}

export function obstacleKey(zoneName: string, obj: ZoneObject): string {
  return `${zoneName}#${obj.id}`
}

/** The MapProgress flag that clears this obstacle. */
export function requiredFlag(
  kind: ObstacleKind
): 'kiru' | 'kudaku' | 'chikara' | 'arrosoir' | 'radio' {
  switch (kind) {
    case 'tree':
      return 'kiru'
    case 'rock':
      return 'kudaku'
    case 'boulder':
      return 'chikara'
    case 'sudowoodo':
      return 'arrosoir'
    case 'snorlax':
      return 'radio'
  }
}

// Minimal system lines (Japanese only — PRD § Langue du Jeu). Content team:
// these are placeholders to review, kept at N5 with readings inline.
export function blockedLine(kind: ObstacleKind): string {
  switch (kind) {
    case 'tree':
      return '大（おお）きな木（き）が　道（みち）を　ふさいでいる。'
    case 'rock':
      return 'ひびわれた岩（いわ）が　道（みち）を　ふさいでいる。'
    case 'boulder':
      return '大（おお）きな岩（いわ）は　びくとも　しない。'
    case 'sudowoodo':
      return 'へんな木（き）が　道（みち）を　ふさいでいる。……ゆれた？'
    case 'snorlax':
      return '大（おお）きな　なにかが　ねむっている……。'
  }
}

export function clearedLine(kind: ObstacleKind): string {
  switch (kind) {
    case 'tree':
      return '切（せつ）の漢字（かんじ）で　木（き）を　きりたおした！'
    case 'rock':
      return '砕（さい）の漢字（かんじ）で　岩（いわ）を　くだいた！'
    case 'boulder':
      return '力（りょく）の漢字（かんじ）で　岩（いわ）を　うごかした！'
    case 'sudowoodo':
      return 'じょうろで　水（みず）を　かけた！　おどろいて　にげていった！'
    case 'snorlax':
      return 'ラジオの　メロディで　目（め）を　さました！　のそのそと　たちさった！'
  }
}
