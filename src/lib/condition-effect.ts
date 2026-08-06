// Moteur Condition/Effect — lib pure, zéro I/O (issue 02, jalon 1).
//
// Sémantique de référence : CONTEXT.md (Condition, Effect, State Rule, Quest,
// Quest Step), docs/adr/0003-condition-effect-quest-model.md, PRD § Schéma.
// Les invariants clés :
//  - Condition[] est un ET pur ; chaque Condition accepte `negate`.
//  - `quest_step` teste « à ce stade ou après » via l'ordre des steps[] de la
//    quête (jamais une égalité stricte).
//  - Tous les Effect sont idempotents ; `grant_item` est piloté par
//    l'item_kind (`unique` inerte si possédé, `fungible` incrémente).
//  - Un Effect no-op retourne le MÊME objet PlayerState (comparaison de
//    référence = « rien à persister » pour la couche serveur).
//
// L'état joueur est un objet TS pur (PlayerState) hydraté depuis
// user_map_state + npc_quest_progress par src/lib/player-state.ts.

// ── Conditions ────────────────────────────────────────────────────────────────

export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'

export type Condition =
  | { type: 'count'; metric: string; threshold: number; negate?: boolean }
  | { type: 'item_owned'; item_id: string; negate?: boolean }
  | { type: 'quest_step'; quest_id: string; step: string; negate?: boolean }
  | { type: 'npc_cleared'; npc_id: string; negate?: boolean }
  | { type: 'event_cleared'; event_id: string; negate?: boolean }
  | { type: 'badge_earned'; badge_id: string; negate?: boolean }
  | { type: 'time_window'; days_of_week?: DayOfWeek[]; hour_range?: [number, number]; negate?: boolean }

// ── Effects ───────────────────────────────────────────────────────────────────

export type Effect =
  | { type: 'advance_quest'; quest_id: string; step_id: string }
  | { type: 'grant_item'; item_id: string }
  | { type: 'remove_item'; item_id: string }
  | { type: 'grant_badge'; badge_id: string }
  | { type: 'unlock_text'; text_id: string }
  | { type: 'unlock_zone'; zone_id: string }
  | { type: 'set_companion'; companion_id: string }

export type ItemKind = 'unique' | 'fungible'

// ── State rules ───────────────────────────────────────────────────────────────

export interface StateRule {
  if?: Condition[]
  default?: boolean
  state: string
}

// ── Player state ──────────────────────────────────────────────────────────────

export interface QuestProgress {
  current_step: string
  step_entered_at: string // ISO 8601, horodatage serveur
}

export interface EarnedBadge {
  badge_id: string
  earned_at: string // ISO 8601
}

export interface PlayerState {
  // user_map_state (PRD § Schéma)
  current_zone: string
  avatar_x: number
  avatar_y: number
  unlocked_zones: string[]
  visited_zones: string[]
  defeated_trainers: string[]
  completed_lessons: string[]
  completed_quests: string[]
  inventory: Record<string, number> // item_id → quantité (unique → 1)
  badges: EarnedBadge[]
  cleared_events: string[]
  unlocked_texts: string[]
  registered_trainers: string[]
  companion_id: string | null
  pokeathlon_score: number
  // npc_quest_progress, indexé par quest_id
  quest_progress: Record<string, QuestProgress>
  // Compteurs hydratés hors user_map_state (kanji_studied depuis cards,
  // texts_read depuis text_completions…) pour Condition.count — jamais
  // persistés ici, recalculés à chaque hydratation.
  metrics: Record<string, number>
}

export function defaultPlayerState(): PlayerState {
  return {
    current_zone: 'MAP_NEW_BARK',
    avatar_x: 695,
    avatar_y: 396,
    unlocked_zones: [],
    visited_zones: [],
    defeated_trainers: [],
    completed_lessons: [],
    completed_quests: [],
    inventory: {},
    badges: [],
    cleared_events: [],
    unlocked_texts: [],
    registered_trainers: [],
    companion_id: null,
    pokeathlon_score: 0,
    quest_progress: {},
    metrics: {},
  }
}

// ── Contexts ──────────────────────────────────────────────────────────────────

/** quest_id → steps[] ordonnés (content/quests/<id>.json), fourni par
 * src/lib/content.ts côté serveur, ou construit à la main dans les tests. */
export type QuestStepsIndex = Record<string, string[]>

export interface EvalContext {
  questSteps: QuestStepsIndex
  /** Horloge pour time_window — injectée (jamais Date.now() implicite). */
  now: Date
}

export interface ApplyContext {
  questSteps: QuestStepsIndex
  /** Horodatage serveur des step_entered_at / earned_at. */
  now: Date
  /** item_id → item_kind ; absent → `unique` (comportement historique). */
  itemKinds?: Record<string, ItemKind>
}

// ── Évaluation des conditions ─────────────────────────────────────────────────

const DAY_NAMES: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

function metricValue(state: PlayerState, metric: string): number {
  switch (metric) {
    case 'badges_earned':
      return state.badges.length
    case 'pokeathlon_score':
      return state.pokeathlon_score
    default:
      return state.metrics[metric] ?? 0
  }
}

function questStepIndex(ctx: EvalContext, questId: string, stepId: string): number {
  return (ctx.questSteps[questId] ?? []).indexOf(stepId)
}

function inHourRange(hour: number, [start, end]: [number, number]): boolean {
  if (start === end) return true
  // [20, 4] = du soir au petit matin (fenêtre qui enjambe minuit)
  return start < end ? hour >= start && hour < end : hour >= start || hour < end
}

export function evalCondition(cond: Condition, state: PlayerState, ctx: EvalContext): boolean {
  let result: boolean
  switch (cond.type) {
    case 'count':
      result = metricValue(state, cond.metric) >= cond.threshold
      break
    case 'item_owned':
      result = (state.inventory[cond.item_id] ?? 0) > 0
      break
    case 'quest_step': {
      // « À ce stade ou après » — comparaison sur l'ordre des steps de la quête
      const target = questStepIndex(ctx, cond.quest_id, cond.step)
      const progress = state.quest_progress[cond.quest_id]
      const current = progress ? questStepIndex(ctx, cond.quest_id, progress.current_step) : -1
      result = target !== -1 && current >= target
      break
    }
    case 'npc_cleared':
      // « Cleared » = combat gagné / interaction résolue ; l'unique magasin
      // est defeated_trainers[] (les usages réels gatent sur des dresseurs).
      result = state.defeated_trainers.includes(cond.npc_id)
      break
    case 'event_cleared':
      result = state.cleared_events.includes(cond.event_id)
      break
    case 'badge_earned':
      result = state.badges.some(b => b.badge_id === cond.badge_id)
      break
    case 'time_window': {
      const dayOk = !cond.days_of_week || cond.days_of_week.includes(DAY_NAMES[ctx.now.getDay()])
      const hourOk = !cond.hour_range || inHourRange(ctx.now.getHours(), cond.hour_range)
      result = dayOk && hourOk
      break
    }
  }
  return cond.negate === true ? !result : result
}

/** Condition[] = ET pur ; un tableau vide est vrai. */
export function evalConditions(conds: Condition[], state: PlayerState, ctx: EvalContext): boolean {
  return conds.every(cond => evalCondition(cond, state, ctx))
}

/** Présence d'une entité de carte : sans unlock_conditions elle existe
 * toujours ; sinon elle « n'existe pas sur la tuile » tant que les
 * conditions ne sont pas remplies (CONTEXT.md § Condition). */
export function isUnlocked(
  conds: Condition[] | undefined,
  state: PlayerState,
  ctx: EvalContext
): boolean {
  return !conds || evalConditions(conds, state, ctx)
}

/** Premier match gagnant, `default` final (State Rule, CONTEXT.md).
 * Retourne null si aucune règle ne matche et qu'il n'y a pas de default —
 * le lint de contenu garantit qu'un default existe toujours. */
export function selectDialogueState(
  rules: StateRule[],
  state: PlayerState,
  ctx: EvalContext
): string | null {
  for (const rule of rules) {
    if (rule.default === true) return rule.state
    if (evalConditions(rule.if ?? [], state, ctx)) return rule.state
  }
  return null
}

// ── Application des effets ────────────────────────────────────────────────────

/** Applique un Effect. Idempotent : un no-op retourne le même objet (===). */
export function applyEffect(effect: Effect, state: PlayerState, ctx: ApplyContext): PlayerState {
  switch (effect.type) {
    case 'advance_quest': {
      const steps = ctx.questSteps[effect.quest_id] ?? []
      const target = steps.indexOf(effect.step_id)
      if (target === -1) return state // quête ou étape inconnue : inerte
      const progress = state.quest_progress[effect.quest_id]
      const current = progress ? steps.indexOf(progress.current_step) : -1
      if (current >= target) return state // déjà atteinte ou dépassée
      const next: PlayerState = {
        ...state,
        quest_progress: {
          ...state.quest_progress,
          [effect.quest_id]: {
            current_step: effect.step_id,
            step_entered_at: ctx.now.toISOString(),
          },
        },
      }
      // Dernière étape atteinte = quête terminée (completed_quests[])
      if (target === steps.length - 1 && !state.completed_quests.includes(effect.quest_id)) {
        next.completed_quests = [...state.completed_quests, effect.quest_id]
      }
      return next
    }
    case 'grant_item': {
      const kind: ItemKind = ctx.itemKinds?.[effect.item_id] ?? 'unique'
      const owned = state.inventory[effect.item_id] ?? 0
      if (kind === 'unique' && owned > 0) return state
      return {
        ...state,
        inventory: { ...state.inventory, [effect.item_id]: kind === 'unique' ? 1 : owned + 1 },
      }
    }
    case 'remove_item': {
      const owned = state.inventory[effect.item_id] ?? 0
      if (owned <= 0) return state
      const inventory = { ...state.inventory }
      if (owned <= 1) {
        delete inventory[effect.item_id]
      } else {
        inventory[effect.item_id] = owned - 1
      }
      return { ...state, inventory }
    }
    case 'grant_badge':
      if (state.badges.some(b => b.badge_id === effect.badge_id)) return state
      return {
        ...state,
        badges: [...state.badges, { badge_id: effect.badge_id, earned_at: ctx.now.toISOString() }],
      }
    case 'unlock_text':
      if (state.unlocked_texts.includes(effect.text_id)) return state
      return { ...state, unlocked_texts: [...state.unlocked_texts, effect.text_id] }
    case 'unlock_zone':
      if (state.unlocked_zones.includes(effect.zone_id)) return state
      return { ...state, unlocked_zones: [...state.unlocked_zones, effect.zone_id] }
    case 'set_companion':
      // Écrit une seule fois, jamais re-choisi (PRD § Compagnon)
      if (state.companion_id !== null) return state
      return { ...state, companion_id: effect.companion_id }
  }
}

/** Applique les Effect[] d'un dialogue_state atteint, dans l'ordre. */
export function applyEffects(effects: Effect[], state: PlayerState, ctx: ApplyContext): PlayerState {
  return effects.reduce((acc, effect) => applyEffect(effect, acc, ctx), state)
}
