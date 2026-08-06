// Réglages joueur (issue 13, écran せってい). Le point sensible n'est pas la
// lecture/écriture — c'est que le snapshot SERVEUR reste les valeurs par
// défaut : lire localStorage au premier rendu client rejouerait l'erreur
// d'hydratation déjà corrigée sur le bouton muet.
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SETTINGS,
  SETTING_VALUES,
  TEXT_SPEED_MS,
  VOLUME_GAIN,
  cycle,
  getSettingsServerSnapshot,
  readSettings,
  step,
  writeSettings,
  type GameSettings,
} from './settings'

function fakeStorage(initial: Record<string, string> = {}) {
  const store = { ...initial }
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v
    },
    dump: () => store,
  }
}

describe('readSettings', () => {
  it('stockage vide → valeurs par défaut', () => {
    expect(readSettings(fakeStorage())).toEqual(DEFAULT_SETTINGS)
  })

  it('aller-retour complet', () => {
    const s: GameSettings = {
      textSpeed: 'fast',
      textSound: false,
      bgmVolume: 1,
      sfxVolume: 0,
      showReadings: true,
      showEnglish: true,
    }
    const storage = fakeStorage()
    writeSettings(storage, s)
    expect(readSettings(storage)).toEqual(s)
  })

  it('JSON illisible → valeurs par défaut, jamais d’exception', () => {
    expect(readSettings(fakeStorage({ 'kanji-no-niwa:settings': '{oops' }))).toEqual(
      DEFAULT_SETTINGS
    )
  })

  it('champ aberrant → seul ce champ retombe au défaut', () => {
    const storage = fakeStorage({
      'kanji-no-niwa:settings': JSON.stringify({ textSpeed: 'turbo', bgmVolume: 9, textSound: false }),
    })
    const s = readSettings(storage)
    expect(s.textSpeed).toBe(DEFAULT_SETTINGS.textSpeed)
    expect(s.bgmVolume).toBe(DEFAULT_SETTINGS.bgmVolume)
    expect(s.textSound).toBe(false) // celui-là était valide, il est conservé
  })
})

describe('snapshot serveur', () => {
  it('rend les valeurs par défaut — c’est ce qui évite l’erreur d’hydratation', () => {
    expect(getSettingsServerSnapshot()).toEqual(DEFAULT_SETTINGS)
  })
})

describe('cycle', () => {
  it('avance et boucle', () => {
    expect(cycle(SETTING_VALUES.textSpeed, 'slow', 1)).toBe('normal')
    expect(cycle(SETTING_VALUES.textSpeed, 'instant', 1)).toBe('slow')
  })

  it('recule et boucle', () => {
    expect(cycle(SETTING_VALUES.textSpeed, 'slow', -1)).toBe('instant')
    expect(cycle(SETTING_VALUES.bgmVolume, 0, -1)).toBe(3)
  })
})

describe('step (volumes) — ne boucle jamais', () => {
  it('au maximum, un cran de plus ne retombe pas à zéro', () => {
    // Avec le bouclage, un clic de trop sur おんがく passait de « おおきく » à
    // « なし » : le jeu devenait muet d'un geste, sans rien annoncer, et le
    // réglage étant persistant, il le restait (issue 13).
    expect(step(SETTING_VALUES.bgmVolume, 3, 1)).toBe(3)
  })

  it('au minimum, un cran de moins ne remonte pas au maximum', () => {
    expect(step(SETTING_VALUES.bgmVolume, 0, -1)).toBe(0)
  })

  it('avance et recule normalement entre les bornes', () => {
    expect(step(SETTING_VALUES.bgmVolume, 1, 1)).toBe(2)
    expect(step(SETTING_VALUES.bgmVolume, 2, -1)).toBe(1)
  })
})

describe('tables', () => {
  it('la vitesse « すぐに » vaut 0 ms — la boîte de dialogue s’en sert comme sentinelle', () => {
    expect(TEXT_SPEED_MS.instant).toBe(0)
  })

  it('les vitesses vont du plus lent au plus rapide', () => {
    expect(TEXT_SPEED_MS.slow).toBeGreaterThan(TEXT_SPEED_MS.normal)
    expect(TEXT_SPEED_MS.normal).toBeGreaterThan(TEXT_SPEED_MS.fast)
  })

  it('le volume 0 coupe vraiment, le 3 est le plein volume', () => {
    expect(VOLUME_GAIN[0]).toBe(0)
    expect(VOLUME_GAIN[3]).toBe(1)
  })
})
