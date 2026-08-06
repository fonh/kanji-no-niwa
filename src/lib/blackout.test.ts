// Retour au Centre Pokémon après trois défaites (2026-08-06).
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_CENTER,
  DEFEAT_LIMIT,
  defeatsLeft,
  isPokemonCenter,
  recordDefeat,
} from './blackout'

describe('recordDefeat', () => {
  it('les deux premières défaites laissent le joueur sur place', () => {
    expect(recordDefeat(0, null)).toEqual({ defeats: 1, sendTo: null })
    expect(recordDefeat(1, null)).toEqual({ defeats: 2, sendTo: null })
  })

  it('la troisième renvoie au dernier Centre visité, et remet le compteur à zéro', () => {
    const anchor = { zone: 'MAP_VIOLET_POKECENTER_1F', world_x: 8, world_z: 12 }
    expect(recordDefeat(DEFEAT_LIMIT - 1, anchor)).toEqual({ defeats: 0, sendTo: anchor })
  })

  it('sans Centre visité, on repart de celui de Ville Griotte', () => {
    // Les premiers dresseurs du jeu sont sur la Route 30, donc APRÈS Ville
    // Griotte : y renvoyer quelqu'un qui n'a encore visité aucun Centre reste
    // cohérent avec son parcours.
    expect(recordDefeat(DEFEAT_LIMIT - 1, null).sendTo).toEqual(DEFAULT_CENTER)
  })

  it('compte ce qu’il reste, jamais moins que zéro', () => {
    expect(defeatsLeft(0)).toBe(DEFEAT_LIMIT)
    expect(defeatsLeft(2)).toBe(1)
    expect(defeatsLeft(9)).toBe(0)
  })
})

describe('isPokemonCenter', () => {
  it('reconnaît l’accueil d’un Centre, quelle que soit la ville', () => {
    expect(isPokemonCenter('MAP_CHERRYGROVE_POKECENTER_1F')).toBe(true)
    expect(isPokemonCenter('MAP_VIOLET_POKECENTER_1F')).toBe(true)
  })

  it('le sous-sol Wi-Fi n’en est pas un — on n’y soigne pas', () => {
    expect(isPokemonCenter('MAP_VIOLET_POKECENTER_B1F')).toBe(false)
  })

  it('ni le Mart, ni une maison, ni une zone extérieure', () => {
    for (const zone of ['MAP_VIOLET_POKEMART', 'MAP_NEW_BARK_PLAYER_HOUSE_1F', 'MAP_ROUTE_30']) {
      expect(isPokemonCenter(zone), zone).toBe(false)
    }
  })
})
