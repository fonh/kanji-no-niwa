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
  it('couvre tout le parcours jouable, pas seulement le jalon 1', () => {
    // Le registre s'arrêtait aux 4 zones du jalon 1 : sortir de la Route 30
    // coupait la musique, sans que rien ne le signale (issue 13, « il n'y a
    // plus de musique »). Il est désormais généré depuis la table des pistes
    // et la BO du dépôt — scripts/build/build-zone-music.py.
    const names = new Set(getZoneMusicEntries().map(z => z.map_name))
    for (const required of [
      'MAP_NEW_BARK',
      'MAP_ROUTE_29',
      'MAP_CHERRYGROVE',
      'MAP_ROUTE_30',
      'MAP_ROUTE_31',
      'MAP_VIOLET',
      'MAP_SPROUT_TOWER_1F',
      'MAP_VIOLET_GYM',
    ]) {
      expect(names.has(required), required).toBe(true)
    }
  })

  it('les lieux à musique propre ne prennent pas celle de leur ville', () => {
    // On n'entend pas le thème de la ville dans un Centre Pokémon.
    const byName = new Map(getZoneMusicEntries().map(z => [z.map_name, z]))
    expect(byName.get('MAP_VIOLET_GYM')!.music_ref).toMatch(/Gym/)
    expect(byName.get('MAP_VIOLET_POKECENTER_1F')!.music_ref).toMatch(/Center/)
    expect(byName.get('MAP_VIOLET')!.music_ref).not.toMatch(/Gym/)
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
    expect(SFX.textAdvance).toMatch(/^\/audio\//)
    expect(SFX.victoryJingle).toMatch(/^\/audio\//)
  })
})
