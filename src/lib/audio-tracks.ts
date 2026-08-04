// Musique et SFX (issue audio jalon 1) — logique pure, zéro I/O réel (aucun
// élément <audio>, voir audio-manager.tsx pour le Provider React qui pilote
// la lecture). Portée : PRD § Audio, scope MVP jalon 1 uniquement — les 4
// zones extérieures (New Bark Town, Route 29, Cherrygrove City, Route 30) +
// leurs intérieurs, plus les contextes universels (Centre Pokémon/SRS,
// combat dresseur, écran-livre des leçons).
//
// content/map/zones.json est la source de vérité pour la carte — cette
// table-ci ne fait QUE la relier au fichier audio servi (`music_ref` y est
// déjà le chemin public, pas de transformation supplémentaire nécessaire) ;
// musicRefForMapName() est le seul point de lookup, testé isolément.

import zonesRegistry from '../../content/map/zones.json'

export interface ZoneMusicEntry {
  zone_id: string
  map_name: string
  name: { jp: string; en: string } | null
  region: string
  music_ref: string
  is_interior: boolean
  note?: string
}

const ZONE_ENTRIES = zonesRegistry.zones as ZoneMusicEntry[]

const ZONE_BY_MAP_NAME = new Map<string, ZoneMusicEntry>(ZONE_ENTRIES.map(z => [z.map_name, z]))

/** La piste de carte pour une zone (zone.name = MAP_* du registre carte,
 * src/data/zone-registry.json) — null si la zone est hors scope jalon 1
 * (pas encore d'entrée dans content/map/zones.json, silence plutôt qu'un
 * mauvais choix). */
export function musicRefForMapName(mapName: string): string | null {
  return ZONE_BY_MAP_NAME.get(mapName)?.music_ref ?? null
}

export function getZoneMusicEntries(): readonly ZoneMusicEntry[] {
  return ZONE_ENTRIES
}

// ── Contextes universels (PRD § Audio, table Contexte → Piste) ─────────────
// Combat 門弟/師範, cérémonie badge, Silver, Rocket... restent hors scope
// (jalon 1 n'a que le combat dresseur générique) — voir l'issue de suivi.

export const CONTEXT_TRACKS = {
  pokemonCenter: '/audio/bgm/pokemon-center.mp3',
  battleTrainer: '/audio/bgm/battle-trainer.mp3',
} as const

export const SFX = {
  menuConfirm: '/audio/sfx/game/menu-confirm.opus',
  victoryJingle: '/audio/sfx/game/victory-jingle.opus',
} as const

// ── Rotation de l'écran-livre (leçons) ──────────────────────────────────────
// Pas l'OST HGSS (contexte carte uniquement) : PRD § Audio — « rotation de 6
// pistes calmes libres de droits (CC-BY/no-copyright, koto/shakuhachi),
// sourcées Pixabay + free-stock-music.com ». Pixabay inaccessible cette passe
// (Cloudflare bloque scraping/curl, pas de clé API) — 2 pistes CC BY sourcées
// depuis free-stock-music.com (licences et attribution : voir l'issue de
// suivi). Rotation partielle assumée (2/6), extensible : ajouter une entrée
// suffit, lessonTrackForLesson() s'adapte à la longueur du tableau.
export const LESSON_TRACKS = [
  {
    url: '/audio/bgm/lesson/japanese-garden.mp3',
    title: '日本庭園 (Japanese Garden)',
  },
  {
    url: '/audio/bgm/lesson/one-with-everything.mp3',
    title: 'One With Everything',
  },
] as const

/** Choix déterministe (même leçon → toujours la même piste, pas de re-tirage
 * disruptif à chaque re-render) — hash simple de "zoneId#sequenceIndex". */
export function lessonTrackForLesson(zoneId: string, sequenceIndex: number): string {
  const key = `${zoneId}#${sequenceIndex}`
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return LESSON_TRACKS[hash % LESSON_TRACKS.length].url
}

// ── Préférence muet (persistée client, PWA — pas de table user_settings à
// ce stade, voir PRD § Audio / scope de cette passe) ────────────────────────

const MUTE_STORAGE_KEY = 'audio-muted'

export function readMutePreference(storage: Pick<Storage, 'getItem'>): boolean {
  return storage.getItem(MUTE_STORAGE_KEY) === '1'
}

export function writeMutePreference(storage: Pick<Storage, 'setItem'>, muted: boolean): void {
  storage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0')
}
