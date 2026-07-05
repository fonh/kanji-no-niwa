// eslint-disable-next-line @typescript-eslint/no-require-imports
const overworldSprites = require('@/data/overworld-sprite-labels.json') as { label: string; cols: number }[]

// Overworld sprite sheets are 32x32 tiles, first row = facing down (idle) —
// the only direction these ROM-extracted sheets reliably have more than one
// frame for (see MapClient comments). Column count varies per sprite (most
// are 8, some are single-frame icons), so it's carried alongside the URL
// instead of assumed.
export const SPRITE_FRAME_SIZE = 32
export const PLAYER_SPRITE_URL = '/sprites/characters/protagonist_ethan_ow.png'
export const PLAYER_SPRITE_COLS = 8

export interface ResolvedSprite {
  url: string
  cols: number
}

const spriteByLabel = new Map(overworldSprites.map(s => [s.label, s]))

function fromLabel(label: string): ResolvedSprite | null {
  const entry = spriteByLabel.get(label)
  return entry ? { url: `/sprites/overworld/${label}.png`, cols: entry.cols } : null
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
  const varSlot = resolveVarSlot(spriteId, eventFlag)
  if (varSlot) return varSlot

  const label = spriteId.replace(/^SPRITE_/, '').toLowerCase()
  const direct = fromLabel(label)
  if (direct) return direct

  const stripped = label.replace(/_\d+$/, '')
  return stripped !== label ? fromLabel(stripped) : null
}
