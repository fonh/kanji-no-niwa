// Relative path, not the `@/` alias: unlike `import`, Vitest's node-project
// `require()` doesn't consistently resolve `resolve.alias` for JSON targets
// (confirmed: this file had zero direct test coverage before issue 13's
// SPRITE_BONGURI fix — every existing test mocked resolveNpcSprite entirely,
// so the alias was never actually exercised). `src/lib/zones.ts` already
// requires its own JSON data file this same relative way — same convention.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const overworldSprites = require('../data/overworld-sprite-labels.json') as OverworldSheet[]

import type { Direction } from '@/lib/zone-geometry'

/** Rangée par direction des planches converties 4-rangées (HNS_PEOPLE) —
 * ces planches-là, et elles seules, sont organisées une direction par rangée. */
export const SPRITE_ROW: Record<Direction, number> = { south: 0, north: 1, west: 2, east: 3 }

interface OverworldSheet {
  label: string
  cols: number
  rows?: number
  /** Index de frame par direction, quand la disposition de la planche est
   * décodée (scripts/build/tag-overworld-sprite-directions.py). */
  dirs?: Record<Direction, number>
}

// Les planches overworld sont des grilles de frames 32×32. La frame (0,0)
// n'est PAS le personnage de face : c'est son DOS, sur toutes les planches
// ROM vérifiées — d'où « tous les PNJ nous tournent le dos » (issue 13). Les
// 4 directions existent bel et bien, à des index décodés hors ligne et
// stockés dans overworld-sprite-labels.json (`dirs`).
export const SPRITE_FRAME_SIZE = 32
// Version query bump — voir onboarding.ts SPRITE_ASSET_VERSION (même fichier,
// contenu différent depuis la refonte 4-directions de l'issue 13 : sans ce
// cache-bust, un navigateur qui a déjà chargé l'ancienne planche la garde).
export const PLAYER_SPRITE_URL = '/sprites/characters/protagonist_ethan_ow.png?v=4'
export const PLAYER_SPRITE_COLS = 8

export interface ResolvedSprite {
  url: string
  cols: number
  /** Nombre de rangées de la planche. `4` marque les planches converties
   * (HNS_PEOPLE) où une rangée = une direction, col 0 (voir SPRITE_ROW). */
  rows?: number
  /** Index de frame par direction pour les planches ROM dont la disposition
   * est décodée. Absent = planche non orientable, on reste sur la frame 0. */
  dirs?: Record<Direction, number>
}

const spriteByLabel = new Map(overworldSprites.map(s => [s.label, s]))

function fromLabel(label: string): ResolvedSprite | null {
  const entry = spriteByLabel.get(label)
  return entry
    ? { url: `/sprites/overworld/${label}.png`, cols: entry.cols, dirs: entry.dirs }
    : null
}

/** Décalage `background-position` de la frame à afficher pour une direction.
 *
 * Trois cas, du plus fidèle au plus dégradé :
 *  - planche convertie 4 rangées (HNS_PEOPLE) : une rangée par direction ;
 *  - planche ROM décodée (`dirs`) : un index de frame par direction, converti
 *    en (colonne, rangée) avec le nombre de colonnes de la planche ;
 *  - planche non décodée : frame 0, faute de mieux — c'est un dos, mais on ne
 *    sait pas où est la face, et inventer serait pire.
 */
export function spriteFrameOffset(
  sprite: ResolvedSprite,
  direction: Direction
): { x: number; y: number } {
  // `+ 0` normalise le -0 de JavaScript (0 * -32), qui traverse `toEqual`
  // et rendrait `background-position: -0px` — inoffensif à l'écran, mais
  // c'est une valeur en trop dans les comparaisons.
  if (sprite.rows === 4) {
    return { x: 0, y: -SPRITE_ROW[direction] * SPRITE_FRAME_SIZE + 0 }
  }
  const frame = sprite.dirs?.[direction]
  if (frame === undefined) return { x: 0, y: 0 }
  const cols = Math.max(1, sprite.cols)
  return {
    x: -(frame % cols) * SPRITE_FRAME_SIZE + 0,
    y: -Math.floor(frame / cols) * SPRITE_FRAME_SIZE + 0,
  }
}

/** A handful of ROM-extracted overworld sheets resolve to a real file that's
 * simply broken content, not a missing/wrong lookup — verified pixel-by-pixel
 * (PIL getcolors): `bonguri.png` and its 7 unused colour variants
 * (bonguri_b/bk/g/p/r/w/y) are 100% solid black (0,0,0), unlike `bonmi_r`/
 * `bonmi_y` (the same berry as a held-item icon), which have the expected
 * distinct colours — a lost palette at ROM extraction, scoped to this one
 * sprite family (issue 13: reported as an unidentifiable black silhouette
 * floating near a Route 29 clearing; `SPRITE_BONGURI` decorates 31 objects
 * across ~24 outdoor zones game-wide, not just Route 29). No committed
 * extraction script reproduces this pipeline to re-derive the right palette,
 * so this redirects to `tree` — a different, already-verified-correct
 * plant-decor sprite already used elsewhere on these same routes — rather
 * than either an invented recolour or a floating black blob. */
const BROKEN_SPRITE_FALLBACKS: Record<string, string> = {
  SPRITE_BONGURI: 'tree',
}

function fromBrokenSpriteFallback(spriteId: string): ResolvedSprite | null {
  const label = BROKEN_SPRITE_FALLBACKS[spriteId]
  return label ? fromLabel(label) : null
}

/** Planches à 4 directions vérifiées, converties depuis PokemonHnS
 * (github.com/PokemonHnS-Development/pokemonHnS — projet fan open source
 * basé sur pokeemerald ; dépôt public, aucun fichier de licence explicite
 * trouvé au moment de l'écriture — à re-vérifier avant tout usage
 * commercial), via
 * `scripts/build/convert-hns-people-sprite.py` — format standard Gen 3
 * (9 frames 16×32 : sud/nord/ouest fixes + marche, est en miroir),
 * recentré sur la géométrie 32×32 de ce moteur. `rows: 4` = une direction
 * par rangée, col 0 (voir SPRITE_ROW).
 *
 * À RÉSORBER : ces planches n'ont été importées que parce qu'on croyait les
 * planches ROM limitées à une seule rangée exploitable. C'était faux — elles
 * ont bien les 4 directions, à des index de frame décodés depuis
 * (`dirs`, scripts/build/tag-overworld-sprite-directions.py). Ces 4 sprites
 * restent donc les seuls du jeu en style Gen 3/GBA au milieu de sprites DS,
 * pour un bénéfice devenu nul, avec en prime une licence non vérifiée. Les
 * repasser sur leur planche ROM native est une suppression de lignes, pas un
 * chantier — laissé de côté ici pour ne pas mélanger avec la correction
 * d'orientation elle-même. */
const HNS_PEOPLE: Record<string, string> = {
  SPRITE_DOCTOR: 'elm', // Pr. Elm — Bourg Geon
  SPRITE_POLICEMAN: 'policeman', // Bourg Geon (labo + PNJ curaté en ville)
  SPRITE_GSMAMA: 'mom', // Maman — Bourg Geon
  SPRITE_HNS_SILVER: 'silver', // identifiant synthétique : Silver n'a jamais eu
  // de spriteId ROM à Bourg Geon (PNJ curaté généré, pas d'objet décor matché)
}

function fromHnsPeople(spriteId: string): ResolvedSprite | null {
  const name = HNS_PEOPLE[spriteId]
  return name ? { url: `/sprites/hns/people/${name}.png`, cols: 8, rows: 4 } : null
}

/** Planche overworld du compagnon choisi (issue 10) — le suivi derrière le
 * joueur. Rend la planche résolue (pas juste son URL) pour que le suiveur
 * puisse s'orienter comme les PNJ : ces planches ont bien 4 directions
 * (issue 13, cf. `dirs`). Un compagnon sans planche exploitable rend null et
 * le suivi n'apparaît pas (noté pour la passe assets — content/companions.json
 * vise public/sprites/followers/, répertoire encore inexistant : la planche
 * overworld extraite fait foi). */
export function followerSpriteForCompanion(companionId: string | null): ResolvedSprite | null {
  if (!companionId) return null
  return fromLabel(companionId)
}

/** SPRITE_VAR_n is a reused "whichever character the story needs here" slot
 * — not one fixed sprite in the original game. It's your rival/friend
 * (opposite-gender protagonist) in most towns, but Silver at Dragon's Den,
 * and one of ~10 rotating trainers at the Kanto Trainer House (a different
 * one per real-world day of the week). We don't track player gender, story
 * state, or the current day, so this is a best-effort default for the map
 * display, not a faithful per-save reproduction: Silver's sprite when the
 * flag says so, Lyra (the default friend, since our player avatar defaults
 * to Ethan) when it says "friend", and left unresolved for the Trainer
 * House slots (no single trainer is a sensible default there). */
function resolveVarSlot(spriteId: string, eventFlag: string | undefined): ResolvedSprite | null {
  if (!/^SPRITE_VAR_\d+$/.test(spriteId)) return null
  const flag = eventFlag ?? ''
  if (/RIVAL|SILVER/.test(flag)) return fromLabel('gsrivel')
  if (/FRIEND/.test(flag)) return fromLabel('heroine')
  return null
}

/** Resolves a ROM spriteId (e.g. "SPRITE_GSRIVEL", "SPRITE_BABYBOY1_8") to an
 * overworld sprite sheet extracted directly from the ROM (NARC a/0/8/1, see
 * scripts/build/extract_hgss_sprites.py) — covers ~98% of map object
 * instances that aren't a Pokémon follower. Repeated background NPCs share
 * one base sprite with a numeric suffix per placement (e.g. "BABYBOY1_8"),
 * so that suffix is stripped before falling back. Returns null for the
 * Kanto Trainer House's rotating trainers and a handful of gate/fence props
 * with no fixed visual in this NARC. */
export function resolveNpcSprite(spriteId: string, eventFlag?: string): ResolvedSprite | null {
  const hns = fromHnsPeople(spriteId)
  if (hns) return hns

  const brokenFallback = fromBrokenSpriteFallback(spriteId)
  if (brokenFallback) return brokenFallback

  const varSlot = resolveVarSlot(spriteId, eventFlag)
  if (varSlot) return varSlot

  const label = spriteId.replace(/^SPRITE_/, '').toLowerCase()
  const direct = fromLabel(label)
  if (direct) return direct

  const stripped = label.replace(/_\d+$/, '')
  return stripped !== label ? fromLabel(stripped) : null
}
