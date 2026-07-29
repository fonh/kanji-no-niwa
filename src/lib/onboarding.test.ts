// Logique de flux d'ouverture (issue 04) — pure, hors DOM : nouveau compte
// vs compte existant, validation avatar/nom, point de spawn de la chambre.
import { describe, it, expect } from 'vitest'
import {
  AVATARS,
  isAvatar,
  avatarOverworldSprite,
  avatarPortrait,
  isOnboarded,
  startDestination,
  parseOnboarding,
  ONBOARDING_SPAWN,
  MAX_NAME_KANA,
} from './onboarding'
import { readFileSync } from 'fs'
import path from 'path'
import { isWalkable, type Zone } from './zone-geometry'

describe('avatars', () => {
  it('deux avatars HGSS, sans variante inventée', () => {
    expect(AVATARS).toEqual(['ethan', 'lyra'])
  })

  it('isAvatar garde les valeurs client', () => {
    expect(isAvatar('ethan')).toBe(true)
    expect(isAvatar('lyra')).toBe(true)
    expect(isAvatar('silver')).toBe(false)
    expect(isAvatar('')).toBe(false)
    expect(isAvatar(null)).toBe(false)
  })

  it('les sprites pointent vers des planches existantes', () => {
    expect(avatarOverworldSprite('ethan')).toBe('/sprites/characters/protagonist_ethan_ow.png')
    expect(avatarOverworldSprite('lyra')).toBe('/sprites/characters/protagonist_lyra_ow.png')
    expect(avatarPortrait('ethan')).toBe('/sprites/characters/battle_000_ethan.png')
    expect(avatarPortrait('lyra')).toBe('/sprites/characters/battle_001_lyra.png')
  })
})

describe('flux nouveau / existant', () => {
  it("compte complet → carte, sans re-onboarding", () => {
    expect(isOnboarded({ trainer_name: 'ヒビキ', avatar: 'ethan' })).toBe(true)
    expect(startDestination(true)).toBe('/map')
  })

  it('compte incomplet ou absent → onboarding', () => {
    expect(isOnboarded(undefined)).toBe(false)
    expect(isOnboarded({ trainer_name: null, avatar: null })).toBe(false)
    expect(isOnboarded({ trainer_name: 'ヒビキ', avatar: null })).toBe(false)
    // compte d'avant cette issue : nom déjà saisi mais pas d'avatar → repasse
    expect(isOnboarded({ trainer_name: null, avatar: 'lyra' })).toBe(false)
    expect(startDestination(false)).toBe('/onboarding')
  })
})

describe('parseOnboarding — revalidation serveur', () => {
  it('accepte un avatar valide + nom kana (finalisé)', () => {
    expect(parseOnboarding('lyra', 'コトネ')).toEqual({ avatar: 'lyra', name: 'コトネ' })
    // le n en suspens est finalisé côté serveur aussi
    expect(parseOnboarding('ethan', 'けn')).toEqual({ avatar: 'ethan', name: 'けん' })
  })

  it('rejette avatar inconnu, nom vide, latin résiduel, nom trop long', () => {
    expect(parseOnboarding('silver', 'ヒビキ')).toBeNull()
    expect(parseOnboarding('ethan', '')).toBeNull()
    expect(parseOnboarding('ethan', 'katt')).toBeNull()
    expect(parseOnboarding('ethan', 'あ'.repeat(MAX_NAME_KANA + 1))).toBeNull()
    expect(parseOnboarding('ethan', 'あ'.repeat(MAX_NAME_KANA))).not.toBeNull()
  })
})

describe('spawn de la chambre', () => {
  it('la zone existe dans le registre et le tile de spawn est marchable', () => {
    // Le vrai registre (zones.ts le charge par require('@/…'), non résolu
    // sous vitest node — même contournement readFileSync que les tests de
    // contenu de l'issue 03).
    const registry = JSON.parse(
      readFileSync(path.join(process.cwd(), 'src', 'data', 'zone-registry.json'), 'utf-8')
    ) as { zones: Zone[] }
    const zone = registry.zones.find(z => z.name === ONBOARDING_SPAWN.zone)
    expect(zone).toBeDefined()
    expect(ONBOARDING_SPAWN.zone).toBe('MAP_NEW_BARK_PLAYER_HOUSE_2F')
    expect(isWalkable(zone!, ONBOARDING_SPAWN.x, ONBOARDING_SPAWN.z)).toBe(true)
  })
})
