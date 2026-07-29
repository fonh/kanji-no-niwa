// Flux d'ouverture (issue 04) — logique pure, sans I/O : avatars HGSS,
// nouveau compte vs compte existant, validation serveur du couple
// avatar/nom, point de spawn de la chambre du joueur. Les écritures vivent
// dans src/app/onboarding/actions.ts.

import { finalizeKana, isKanaText } from '@/lib/kana-input'

// Ethan/Lyra sourcés HGSS, sans variante inventée (PRD § Séquence
// d'ouverture). Persisté dans users.avatar (db/migrations/003_avatar.sql).
export const AVATARS = ['ethan', 'lyra'] as const
export type Avatar = (typeof AVATARS)[number]

export function isAvatar(value: unknown): value is Avatar {
  return typeof value === 'string' && (AVATARS as readonly string[]).includes(value)
}

/** Planche overworld 8×4 frames de 32px — même géométrie que la planche
 * Ethan que MapClient utilisait en dur avant cette issue. */
export function avatarOverworldSprite(avatar: Avatar): string {
  return `/sprites/characters/protagonist_${avatar}_ow.png`
}

/** Portrait 80×80 (sprite de combat, vue de face) pour l'écran de choix. */
export function avatarPortrait(avatar: Avatar): string {
  return avatar === 'ethan'
    ? '/sprites/characters/battle_000_ethan.png'
    : '/sprites/characters/battle_001_lyra.png'
}

// Longueur max du nom en kana — la grille de saisie des jeux DS japonais
// autorise 5 caractères ; un peu plus large ici (noms en digraphes).
export const MAX_NAME_KANA = 8

export interface OnboardingRow {
  trainer_name?: string | null
  avatar?: string | null
}

/** Un compte est « onboardé » quand nom ET avatar sont posés — un compte
 * d'avant cette issue (nom sans avatar) repasse par l'onboarding. */
export function isOnboarded(row: OnboardingRow | undefined): boolean {
  return Boolean(row?.trainer_name) && isAvatar(row?.avatar)
}

/** Cible du « presse START » de l'écran-titre. */
export function startDestination(onboarded: boolean): '/map' | '/onboarding' {
  return onboarded ? '/map' : '/onboarding'
}

/** Revalidation serveur du payload client : avatar connu, nom finalisé
 * entièrement en kana, borné. Null = payload refusé (rien n'est écrit). */
export function parseOnboarding(
  avatar: string,
  rawName: string
): { avatar: Avatar; name: string } | null {
  if (!isAvatar(avatar)) return null
  const name = finalizeKana(rawName.trim())
  if (!isKanaText(name) || name.length > MAX_NAME_KANA) return null
  return { avatar, name }
}

// Chambre du joueur (HGSS : la partie commence à l'étage de la maison).
// Tile vérifié marchable contre le registre dans onboarding.test.ts.
export const ONBOARDING_SPAWN = {
  zone: 'MAP_NEW_BARK_PLAYER_HOUSE_2F',
  x: 6,
  z: 6,
} as const
