// Logique pure de la musique/SFX (issue audio jalon 1) — voir audio-manager.tsx
// pour le Provider React (lecture réelle, non testée ici : jsdom n'a pas de
// vrai lecteur audio, cf. note de tâche).
import { describe, it, expect } from 'vitest'
import {
  musicRefForMapName,
  getZoneMusicEntries,
  lessonTrackForLesson,
  readMutePreference,
  writeMutePreference,
  LESSON_TRACKS,
  CONTEXT_TRACKS,
  SFX,
} from './audio-tracks'

describe('musicRefForMapName', () => {
  it('zones extérieures jalon 1 → leur piste OST dédiée (mapping guidebook § Musique)', () => {
    expect(musicRefForMapName('MAP_NEW_BARK')).toBe('/audio/bgm/new-bark-town.mp3')
    expect(musicRefForMapName('MAP_ROUTE_29')).toBe('/audio/bgm/route-29.mp3')
    expect(musicRefForMapName('MAP_CHERRYGROVE')).toBe('/audio/bgm/cherrygrove-city.mp3')
    expect(musicRefForMapName('MAP_ROUTE_30')).toBe('/audio/bgm/route-30.mp3')
  })

  it('intérieur sans piste dédiée → repli sur la piste de la zone d\'accès', () => {
    expect(musicRefForMapName('MAP_NEW_BARK_ELMS_LAB_1F')).toBe('/audio/bgm/new-bark-town.mp3')
    expect(musicRefForMapName('MAP_ROUTE_30_MR_POKEMON_HOUSE')).toBe('/audio/bgm/route-30.mp3')
    expect(musicRefForMapName('MAP_ROUTE_29_ROUTE_46_GATEHOUSE')).toBe('/audio/bgm/route-29.mp3')
  })

  it('Centre Pokémon (intérieur) : piste dédiée, pas le repli sur la ville', () => {
    expect(musicRefForMapName('MAP_CHERRYGROVE_POKECENTER_1F')).toBe('/audio/bgm/pokemon-center.mp3')
    expect(musicRefForMapName('MAP_CHERRYGROVE_POKECENTER_B1F')).toBe('/audio/bgm/pokemon-center.mp3')
  })

  it('zone hors scope jalon 1 → null (silence, jamais un mauvais choix)', () => {
    expect(musicRefForMapName('MAP_VIOLET_CITY')).toBeNull()
    expect(musicRefForMapName('MAP_EVERYWHERE')).toBeNull()
  })
})

describe('getZoneMusicEntries', () => {
  it('couvre exactement les 4 zones extérieures du jalon 1 + leurs intérieurs (20 entrées)', () => {
    const entries = getZoneMusicEntries()
    expect(entries).toHaveLength(20)
    const outdoor = entries.filter(z => !z.is_interior)
    expect(outdoor.map(z => z.map_name).sort()).toEqual([
      'MAP_CHERRYGROVE',
      'MAP_NEW_BARK',
      'MAP_ROUTE_29',
      'MAP_ROUTE_30',
    ])
  })

  it('chaque entrée a un zone_id unique (clé de jointure avec les 8 autres tables)', () => {
    const ids = getZoneMusicEntries().map(z => z.zone_id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('lessonTrackForLesson', () => {
  it('déterministe : la même leçon renvoie toujours la même piste', () => {
    const a = lessonTrackForLesson('new-bark-town', 1)
    const b = lessonTrackForLesson('new-bark-town', 1)
    expect(a).toBe(b)
  })

  it('renvoie toujours une piste connue de la rotation', () => {
    const urls = LESSON_TRACKS.map(t => t.url)
    for (let i = 0; i < 8; i++) {
      expect(urls).toContain(lessonTrackForLesson('route-29', i))
    }
  })

  it('varie selon la leçon (pas toujours la même piste sur toute une rotation)', () => {
    const picks = new Set(
      Array.from({ length: LESSON_TRACKS.length * 4 }, (_, i) =>
        lessonTrackForLesson('cherrygrove-city', i)
      )
    )
    expect(picks.size).toBeGreaterThan(1)
  })
})

describe('préférence muet (persistée localStorage)', () => {
  function fakeStorage() {
    const store = new Map<string, string>()
    return {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    }
  }

  it('rien d\'écrit → non muet par défaut', () => {
    expect(readMutePreference(fakeStorage())).toBe(false)
  })

  it('aller-retour écriture/lecture', () => {
    const storage = fakeStorage()
    writeMutePreference(storage, true)
    expect(readMutePreference(storage)).toBe(true)
    writeMutePreference(storage, false)
    expect(readMutePreference(storage)).toBe(false)
  })
})

describe('contextes universels', () => {
  it('CONTEXT_TRACKS et SFX exposent des chemins servis sous /audio', () => {
    expect(CONTEXT_TRACKS.pokemonCenter).toMatch(/^\/audio\//)
    expect(CONTEXT_TRACKS.battleTrainer).toMatch(/^\/audio\//)
    expect(SFX.menuConfirm).toMatch(/^\/audio\//)
    expect(SFX.victoryJingle).toMatch(/^\/audio\//)
  })
})
