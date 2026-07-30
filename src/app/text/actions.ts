'use server'

// Server actions des textes progressifs (issue 08).
//
// Le déblocage (`unlock_text`) vit dans interactWithNpc (map/actions.ts,
// émission moteur) et dans les Effect[] des dialogues (lib 02) — ici, la
// COMPLÉTION : quiz passé en retry-jusqu'à-correct → text_completions.
// Idempotente et horodatée serveur ; `score` (première tentative) et
// `completed_at` sont figés à la PREMIÈRE complétion, seule `gold_at` peut
// encore passer de null à une date (une passe sans faute, première lecture
// ou relecture — PRD § Textes Progressifs, blanc/doré).

import { requireUserId } from '@/lib/auth'
import { sql } from '@/lib/db'
import { getTextById } from '@/lib/content'
import { getPlayerState } from '@/lib/player-state'

export interface TextCompletionResult {
  completed: boolean
  /** Statut doré APRÈS cette passe (déjà doré, ou vient de le devenir). */
  gold: boolean
}

export async function completeText(
  textId: string,
  score: number,
  flawless: boolean
): Promise<TextCompletionResult> {
  const userId = await requireUserId()
  // Le client n'est jamais cru : texte réel + réellement débloqué pour CE
  // joueur, sinon aucune écriture.
  if (!getTextById(textId)) return { completed: false, gold: false }
  const state = await getPlayerState(userId)
  if (!state.unlocked_texts.includes(textId)) return { completed: false, gold: false }

  const boundedScore = Math.min(100, Math.max(0, Math.round(score)))
  const rows = await sql`
    insert into text_completions (user_id, text_id, score, completed_at, gold_at)
    values (${userId}, ${textId}, ${boundedScore}, now(),
            case when ${flawless === true} then now() end)
    on conflict (user_id, text_id) do update set
      gold_at = coalesce(text_completions.gold_at, excluded.gold_at)
    returning gold_at
  `
  return { completed: true, gold: rows[0]?.gold_at != null }
}
