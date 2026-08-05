// Réglages joueur (issue 13, écran せってい du menu START).
//
// Logique pure + un petit store externe : aucune I/O réelle ici, `localStorage`
// est passé en argument (comme readMutePreference dans audio-tracks.ts) pour
// que tout soit testable sans navigateur.
//
// Le store passe par useSyncExternalStore côté React, PAS par un useState
// initialisé depuis localStorage : le serveur ne connaît pas les réglages du
// joueur, donc lire le stockage au premier rendu produit un HTML client
// différent du HTML serveur — c'est exactement l'erreur d'hydratation déjà
// corrigée pour le bouton muet (issue 13). Le snapshot serveur rend les
// valeurs par défaut, le client se resynchronise après montage.

const STORAGE_KEY = 'kanji-no-niwa:settings'

/** Vitesse d'écriture, comme もじのはやさ dans le jeu d'origine. `instant`
 * n'existe pas dans HGSS mais rend le jeu praticable pour qui relit une
 * leçon pour la cinquième fois. */
export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant'

/** Millisecondes par caractère. 0 = tout le texte d'un coup. */
export const TEXT_SPEED_MS: Record<TextSpeed, number> = {
  slow: 55,
  normal: 28,
  fast: 12,
  instant: 0,
}

/** Volumes en 4 crans plutôt qu'un curseur continu : c'est la granularité du
 * jeu d'origine, et un cran se règle à la manette (gauche/droite) alors qu'un
 * curseur demande la souris. */
export type VolumeLevel = 0 | 1 | 2 | 3

export const VOLUME_GAIN: Record<VolumeLevel, number> = {
  0: 0,
  1: 0.3,
  2: 0.65,
  3: 1,
}

export interface GameSettings {
  textSpeed: TextSpeed
  /** Bip à chaque avancée de dialogue. Séparé du volume des bruitages : c'est
   * le son le plus répété du jeu, certains veulent le couper lui seul. */
  textSound: boolean
  bgmVolume: VolumeLevel
  sfxVolume: VolumeLevel
  /** Furigana affichés d'office, au lieu d'être révélés au bouton Y. */
  showReadings: boolean
  /** Traduction anglaise affichée d'office, au lieu du bouton X. */
  showEnglish: boolean
}

export const DEFAULT_SETTINGS: GameSettings = {
  textSpeed: 'normal',
  textSound: true,
  bgmVolume: 3,
  sfxVolume: 3,
  showReadings: false,
  showEnglish: false,
}

const TEXT_SPEEDS: TextSpeed[] = ['slow', 'normal', 'fast', 'instant']
const VOLUMES: VolumeLevel[] = [0, 1, 2, 3]

function isTextSpeed(v: unknown): v is TextSpeed {
  return typeof v === 'string' && (TEXT_SPEEDS as string[]).includes(v)
}

function isVolume(v: unknown): v is VolumeLevel {
  return typeof v === 'number' && (VOLUMES as number[]).includes(v)
}

/** Lit les réglages, en ignorant tout champ absent ou aberrant : un stockage
 * écrit par une version précédente (ou trafiqué à la main) ne doit jamais
 * casser l'app, seulement retomber sur les valeurs par défaut. */
export function readSettings(storage: Pick<Storage, 'getItem'>): GameSettings {
  let raw: unknown
  try {
    raw = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null')
  } catch {
    return DEFAULT_SETTINGS
  }
  if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS
  const o = raw as Record<string, unknown>
  return {
    textSpeed: isTextSpeed(o.textSpeed) ? o.textSpeed : DEFAULT_SETTINGS.textSpeed,
    textSound: typeof o.textSound === 'boolean' ? o.textSound : DEFAULT_SETTINGS.textSound,
    bgmVolume: isVolume(o.bgmVolume) ? o.bgmVolume : DEFAULT_SETTINGS.bgmVolume,
    sfxVolume: isVolume(o.sfxVolume) ? o.sfxVolume : DEFAULT_SETTINGS.sfxVolume,
    showReadings:
      typeof o.showReadings === 'boolean' ? o.showReadings : DEFAULT_SETTINGS.showReadings,
    showEnglish:
      typeof o.showEnglish === 'boolean' ? o.showEnglish : DEFAULT_SETTINGS.showEnglish,
  }
}

export function writeSettings(storage: Pick<Storage, 'setItem'>, s: GameSettings): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(s))
}

/** Valeur suivante d'un réglage, en bouclant — un cran à gauche depuis le
 * premier revient au dernier, comme un sélecteur de manette. */
export function cycle<T>(values: readonly T[], current: T, direction: 1 | -1): T {
  const i = values.indexOf(current)
  const next = (i < 0 ? 0 : i + direction + values.length) % values.length
  return values[next]
}

export const SETTING_VALUES = {
  textSpeed: TEXT_SPEEDS,
  bgmVolume: VOLUMES,
  sfxVolume: VOLUMES,
  toggle: [false, true] as const,
} as const

// ── Store externe (un seul par onglet) ──────────────────────────────────────

/** `localStorage` n'est pas toujours utilisable : navigation privée, stockage
 * désactivé, iframe tierce, jsdom sans origine (les tests de composants de ce
 * projet). Un réglage d'interface ne doit jamais faire tomber l'app pour ça —
 * on retombe sur un stockage mémoire, qui vaut le temps de la session. */
const memoryStore = new Map<string, string>()

function safeStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  try {
    const ls = globalThis.localStorage
    if (ls && typeof ls.getItem === 'function' && typeof ls.setItem === 'function') return ls
  } catch {
    /* accès refusé (SecurityError) : mémoire */
  }
  return {
    getItem: k => memoryStore.get(k) ?? null,
    setItem: (k, v) => {
      memoryStore.set(k, v)
    },
  }
}

let cached: GameSettings | null = null
let listeners: (() => void)[] = []

export function subscribeSettings(listener: () => void): () => void {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

export function getSettingsSnapshot(): GameSettings {
  if (cached === null) cached = readSettings(safeStorage())
  return cached
}

/** Snapshot serveur : les valeurs par défaut, jamais le stockage (inexistant
 * côté serveur) — c'est ce qui garde le HTML serveur et le premier HTML client
 * identiques. */
export function getSettingsServerSnapshot(): GameSettings {
  return DEFAULT_SETTINGS
}

export function updateSettings(patch: Partial<GameSettings>): void {
  cached = { ...getSettingsSnapshot(), ...patch }
  writeSettings(safeStorage(), cached)
  listeners.forEach(l => l())
}

/** Uniquement pour les tests : vide le cache mémoire du store. */
export function resetSettingsCache(): void {
  cached = null
  memoryStore.clear()
}
