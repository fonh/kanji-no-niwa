'use server'

// Écriture unique de l'onboarding (issue 04) : avatar + nom kana persistés,
// puis spawn dans la chambre du joueur (MAP_NEW_BARK_PLAYER_HOUSE_2F). La
// validation vit dans src/lib/onboarding.ts (pure, testée) ; ici seulement
// la revalidation systématique du payload client et les upserts.

import { requireUserId } from '@/lib/auth'
import { sql } from '@/lib/db'
import { defaultPlayerState } from '@/lib/condition-effect'
import { savePlayerState } from '@/lib/player-state'
import { isOnboarded, parseOnboarding, ONBOARDING_SPAWN } from '@/lib/onboarding'

export async function completeOnboarding(avatar: string, name: string) {
  const userId = await requireUserId()

  const parsed = parseOnboarding(avatar, name)
  if (!parsed) throw new Error('Invalid onboarding payload')

  // Garde d'idempotence : un compte déjà onboardé ne peut pas être réécrit
  // (rejouer l'action n'efface jamais une sauvegarde existante).
  const [row] = await sql`select trainer_name, avatar from users where id = ${userId}`
  if (isOnboarded(row)) return

  await sql`
    update users set trainer_name = ${parsed.name}, avatar = ${parsed.avatar}
    where id = ${userId}
  `

  // Spawn chambre : état neuf, la chambre comme première zone visitée —
  // même sémantique que saveMapPosition (première entrée de visited_zones).
  await savePlayerState(userId, {
    ...defaultPlayerState(),
    current_zone: ONBOARDING_SPAWN.zone,
    avatar_x: ONBOARDING_SPAWN.x,
    avatar_y: ONBOARDING_SPAWN.z,
    visited_zones: [ONBOARDING_SPAWN.zone],
  })
}
