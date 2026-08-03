// eslint-disable-next-line @typescript-eslint/no-require-imports
const overworldSprites = require('@/data/overworld-sprite-labels.json') as { label: string; cols: number }[]

// Overworld sprite sheets are 32x32 tiles, first row = facing down (idle) —
// the only direction these ROM-extracted sheets reliably have more than one
// frame for (see MapClient comments). Column count varies per sprite (most
// are 8, some are single-frame icons), so it's carried alongside the URL
// instead of assumed.
export const SPRITE_FRAME_SIZE = 32
// Version query bump — voir onboarding.ts SPRITE_ASSET_VERSION (même fichier,
// contenu différent depuis la refonte 4-directions de l'issue 13 : sans ce
// cache-bust, un navigateur qui a déjà chargé l'ancienne planche la garde).
export const PLAYER_SPRITE_URL = '/sprites/characters/protagonist_ethan_ow.png?v=4'
export const PLAYER_SPRITE_COLS = 8

export interface ResolvedSprite {
  url: string
  cols: number
  /** Nombre de rangées fiables (sud/nord/ouest/est, SPRITE_ROW), 1 par défaut
   * — la quasi-totalité des planches ROM-extraites (voir commentaire ci-dessus)
   * n'ont qu'une rangée exploitable. `4` seulement pour les planches où les 4
   * rangées ont été vérifiées correctes une par une (voir HNS_PEOPLE). */
  rows?: number
}

const spriteByLabel = new Map(overworldSprites.map(s => [s.label, s]))

function fromLabel(label: string): ResolvedSprite | null {
  const entry = spriteByLabel.get(label)
  return entry ? { url: `/sprites/overworld/${label}.png`, cols: entry.cols } : null
}

/** Planches à 4 directions vérifiées, converties depuis PokemonHnS
 * (github.com/PokemonHnS-Development/pokemonHnS — projet fan open source
 * basé sur pokeemerald ; dépôt public, aucun fichier de licence explicite
 * trouvé au moment de l'écriture — à re-vérifier avant tout usage
 * commercial), via
 * `scripts/build/convert-hns-people-sprite.py` — format standard Gen 3
 * (9 frames 16×32 : sud/nord/ouest fixes + marche, est en miroir),
 * recentré sur la géométrie 32×32 de ce moteur. Contrairement au reste des
 * planches ROM (une seule rangée fiable), celles-ci ont les 4 rangées
 * vérifiées une par une — `rows: 4` l'indique au renderer (MapClient) pour
 * qu'il utilise réellement `facingDirection`/`facing` au lieu de rester
 * figé sur la rangée 0. Style Gen 3/GBA, pas HGSS/DS natif — écart
 * assumé : mieux vaut une direction correcte dans un style un peu
 * différent qu'une planche DS qui tourne le dos en permanence (issue 13).
 * Étendre cette liste au cas par cas, un match vérifié à la fois — ne pas
 * mapper à l'aveugle les ~120 spriteId ROM restants. */
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
 * joueur. Le dump contient une planche `pikachu` (8 colonnes × 32 px, rangée
 * 0 = face sud animée, comme les autres planches ROM) ; un compagnon sans
 * planche exploitable rend null et le suivi n'apparaît pas (noté pour la
 * passe assets — content/companions.json vise public/sprites/followers/,
 * répertoire encore inexistant : la planche overworld extraite fait foi). */
export function followerSpriteForCompanion(companionId: string | null): string | null {
  if (!companionId) return null
  return fromLabel(companionId)?.url ?? null
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

  const varSlot = resolveVarSlot(spriteId, eventFlag)
  if (varSlot) return varSlot

  const label = spriteId.replace(/^SPRITE_/, '').toLowerCase()
  const direct = fromLabel(label)
  if (direct) return direct

  const stripped = label.replace(/_\d+$/, '')
  return stripped !== label ? fromLabel(stripped) : null
}
