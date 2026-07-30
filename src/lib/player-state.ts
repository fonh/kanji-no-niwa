// Couche d'accès à la progression joueur (issue 02) — le SEUL module qui
// parle à user_map_state / npc_quest_progress. Toute la logique de jeu vit
// dans src/lib/condition-effect.ts (pur, testé) ; ici on ne fait qu'hydrater
// un PlayerState depuis Neon et le repersister.

import { sql } from '@/lib/db'
import {
  defaultPlayerState,
  type EarnedBadge,
  type PlayerState,
  type QuestProgress,
} from '@/lib/condition-effect'

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : []
}

export async function getPlayerState(userId: string): Promise<PlayerState> {
  const [rows, questRows, cardRows, textRows] = await Promise.all([
    sql`select * from user_map_state where user_id = ${userId}`,
    sql`select quest_id, current_step, step_entered_at from npc_quest_progress where user_id = ${userId}`,
    // Compteur hydraté pour Condition.count(kanji_studied, N) — jamais stocké
    // dans user_map_state (dérivé du SRS)
    sql`select count(distinct kanji_id)::int as kanji_studied from cards where user_id = ${userId}`,
    // Condition.count(texts_read, N) — seuils CS-Kanji (PRD § CS-Kanji) :
    // textes COMPLÉTÉS (quiz passé), jamais les simples déblocages (issue 08)
    sql`select count(*)::int as texts_read from text_completions where user_id = ${userId}`,
  ])

  const quest_progress: Record<string, QuestProgress> = {}
  for (const row of questRows) {
    quest_progress[row.quest_id as string] = {
      current_step: row.current_step as string,
      step_entered_at: new Date(row.step_entered_at as string).toISOString(),
    }
  }

  const metrics = {
    kanji_studied: (cardRows[0]?.kanji_studied as number) ?? 0,
    texts_read: (textRows[0]?.texts_read as number) ?? 0,
  }

  const row = rows[0]
  // Utilisateur d'avant la première sauvegarde (le backfill de la migration
  // couvre les comptes existants ; un compte tout neuf n'a pas encore de
  // ligne) : état par défaut, la première écriture fera l'upsert.
  if (!row) return { ...defaultPlayerState(), quest_progress, metrics }

  return {
    current_zone: row.current_zone as string,
    avatar_x: row.avatar_x as number,
    avatar_y: row.avatar_y as number,
    unlocked_zones: asStringArray(row.unlocked_zones),
    visited_zones: asStringArray(row.visited_zones),
    defeated_trainers: asStringArray(row.defeated_trainers),
    completed_lessons: asStringArray(row.completed_lessons),
    completed_quests: asStringArray(row.completed_quests),
    inventory: (row.inventory ?? {}) as Record<string, number>,
    badges: (row.badges ?? []) as EarnedBadge[],
    cleared_events: asStringArray(row.cleared_events),
    unlocked_texts: asStringArray(row.unlocked_texts),
    registered_trainers: asStringArray(row.registered_trainers),
    companion_id: (row.companion_id as string | null) ?? null,
    pokeathlon_score: (row.pokeathlon_score as number) ?? 0,
    quest_progress,
    metrics,
  }
}

export async function savePlayerState(userId: string, state: PlayerState): Promise<void> {
  await sql`
    insert into user_map_state (
      user_id, current_zone, avatar_x, avatar_y, unlocked_zones, visited_zones,
      defeated_trainers, completed_lessons, completed_quests, inventory, badges,
      cleared_events, unlocked_texts, registered_trainers, companion_id,
      pokeathlon_score, updated_at
    ) values (
      ${userId}, ${state.current_zone}, ${state.avatar_x}, ${state.avatar_y},
      ${state.unlocked_zones}, ${state.visited_zones}, ${state.defeated_trainers},
      ${state.completed_lessons}, ${state.completed_quests},
      ${JSON.stringify(state.inventory)}, ${JSON.stringify(state.badges)},
      ${state.cleared_events}, ${state.unlocked_texts}, ${state.registered_trainers},
      ${state.companion_id}, ${state.pokeathlon_score}, now()
    )
    on conflict (user_id) do update set
      current_zone = excluded.current_zone,
      avatar_x = excluded.avatar_x,
      avatar_y = excluded.avatar_y,
      unlocked_zones = excluded.unlocked_zones,
      visited_zones = excluded.visited_zones,
      defeated_trainers = excluded.defeated_trainers,
      completed_lessons = excluded.completed_lessons,
      completed_quests = excluded.completed_quests,
      inventory = excluded.inventory,
      badges = excluded.badges,
      cleared_events = excluded.cleared_events,
      unlocked_texts = excluded.unlocked_texts,
      registered_trainers = excluded.registered_trainers,
      companion_id = excluded.companion_id,
      pokeathlon_score = excluded.pokeathlon_score,
      updated_at = now()
  `

  for (const [questId, progress] of Object.entries(state.quest_progress)) {
    await sql`
      insert into npc_quest_progress (user_id, quest_id, current_step, step_entered_at)
      values (${userId}, ${questId}, ${progress.current_step}, ${progress.step_entered_at})
      on conflict (user_id, quest_id) do update set
        current_step = excluded.current_step,
        step_entered_at = excluded.step_entered_at
      where npc_quest_progress.current_step is distinct from excluded.current_step
    `
  }
}
