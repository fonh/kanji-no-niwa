'use server'

// Server actions du combat (issue 07).
//
// - engageTrainer : LE point d'entrée serveur d'un contact avec un dresseur
//   (embuscade Sight Cone comme Talk). Non battu → le script de combat
//   complet est assemblé ICI (pool des items étudiés, gardes de modes,
//   tirage sans remise — src/lib/battle.ts pur) ; battu → dialogue
//   post_battle, plus jamais de re-combat automatique.
// - winBattle : la fin de combat victorieuse — defeated_trainers[] +
//   battle_results (horodatage serveur), idempotente au re-combat.
//
// Règle PRD absolue : AUCUNE écriture SRS ici — le combat pioche les items
// étudiés (dérivés de completed_lessons), le SRS vit dans sa session
// quotidienne. Seul grammar_encounters (hors SRS) est incrémenté au tirage
// (times_drawn/last_drawn_at, PRD § graduation par point).
// L'état du combat lui-même vit CLIENT (BattleScreen) et n'est jamais
// persisté : fermer l'app = fuite.

import { requireUserId } from '@/lib/auth'
import { sql } from '@/lib/db'
import { applyEffects } from '@/lib/condition-effect'
import {
  getDialogue,
  getLessonsForZone,
  getMapTrainers,
  getQuestStepsIndex,
  getGrammarPointById,
  getCompositionLexiconWords,
  type DialoguePageEntry,
  type GrammarOverlayPoint,
} from '@/lib/content'
import { getPlayerState, savePlayerState } from '@/lib/player-state'
import {
  battleTypeForTrainer,
  buildBattleScript,
  buildCompositionLexicon,
  exampleWordsOf,
  studiedKanjiInOrder,
  type BattleQuestion,
} from '@/lib/battle'
import type { KanjiContentMap } from '@/lib/lesson-quiz'
import kanjiContentJson from '@/data/kanji-content.json'

const kanjiContent = kanjiContentJson as unknown as KanjiContentMap

// Sprites de combat extraits (public/sprites/trainers/battle/) — mapping par
// classe de dresseur ; null = pas de sprite extrait (silhouette côté UI,
// jamais un crash). Silver n'a pas encore de sprite de combat extrait.
const BATTLE_SPRITES: [prefix: string, path: string][] = [
  ['youngster_', '/sprites/trainers/battle/002_youngster.png'],
  ['lass_', '/sprites/trainers/battle/003_lass.png'],
  ['camper_', '/sprites/trainers/battle/004_camper.png'],
  ['bug_catcher_', '/sprites/trainers/battle/006_bug_catcher.png'],
]

function battleSpriteFor(trainerId: string): string | null {
  return BATTLE_SPRITES.find(([prefix]) => trainerId.startsWith(prefix))?.[1] ?? null
}

function playerBackSprite(avatar: unknown): string {
  return avatar === 'lyra'
    ? '/sprites/characters/player_back/lyra_back_sheet.png'
    : '/sprites/characters/player_back/ethan_back_sheet.png'
}

function dialogueNameJp(dialogueRef: string): string {
  const dialogue = getDialogue(dialogueRef)
  if (!dialogue) return ''
  return typeof dialogue.name === 'string' ? dialogue.name : dialogue.name.jp
}

function dialogueStatePages(dialogueRef: string, stateId: string): DialoguePageEntry[] {
  // Les fichiers dresseurs n'ont pas de state_rules : leurs états
  // battle_intro/post_battle sont choisis par le système de combat, pas par
  // le moteur Condition/Effect (contraste avec reachDialogueState).
  return getDialogue(dialogueRef)?.dialogue_states[stateId]?.pages ?? []
}

export interface TrainerBattleStart {
  kind: 'battle'
  trainer_id: string
  trainer_name_jp: string
  battle_sprite: string | null
  player_back_sprite: string
  intro_pages: DialoguePageEntry[]
  lives: number
  questions: BattleQuestion[]
}

export interface TrainerDialogueResult {
  kind: 'dialogue'
  name: string
  pages: DialoguePageEntry[]
}

export type TrainerEngagement = TrainerBattleStart | TrainerDialogueResult | null

export async function engageTrainer(trainerId: string): Promise<TrainerEngagement> {
  const userId = await requireUserId()
  const trainer = getMapTrainers().find(t => t.trainer_id === trainerId)
  if (!trainer || trainer.role !== 'battle') return null

  const state = await getPlayerState(userId)
  const nameJp = dialogueNameJp(trainer.dialogue_ref)

  // Battu → dialogue post_battle (les Effects éventuels ont été appliqués à
  // la victoire ; la relecture n'écrit rien).
  if (state.defeated_trainers.includes(trainerId)) {
    return {
      kind: 'dialogue',
      name: nameJp,
      pages: dialogueStatePages(trainer.dialogue_ref, 'post_battle'),
    }
  }

  const studiedItems = studiedKanjiInOrder(state.completed_lessons, getLessonsForZone)
  if (studiedItems.length === 0) {
    // Inatteignable sur le chemin critique (le premier dresseur exige déjà
    // des leçons) — filet : l'accroche seule, pas de combat impossible.
    return {
      kind: 'dialogue',
      name: nameJp,
      pages: dialogueStatePages(trainer.dialogue_ref, 'battle_intro'),
    }
  }

  // Grammaire rencontrée (dialogues/leçons/textes obligatoires) → points
  // d'overlay ; 0 rencontre = mode exclu par la garde.
  const grammarRows = (await sql`
    select grammar_id from grammar_encounters where user_id = ${userId}
  `) as { grammar_id: string }[]
  const grammarPoints = grammarRows
    .map(row => getGrammarPointById(row.grammar_id))
    .filter((p): p is GrammarOverlayPoint => p !== null)

  // Lexique de mots (Composition) : liste JLPT fichier + mots d'exemples du
  // pipeline pour la garde d'unicité. Vide → garde d'exclusion.
  const lexiconWords = getCompositionLexiconWords()
  const lexicon =
    lexiconWords.length > 0
      ? buildCompositionLexicon(lexiconWords, exampleWordsOf(kanjiContent))
      : null

  // battle_length : la valeur du registre fait foi (jamais le fichier
  // dialogue) ; absente = erreur de contenu, filet à 5 pour rester jouable.
  const questionCount = trainer.battle_length ?? 5
  if (trainer.battle_length === undefined) {
    console.warn(`trainers.json: battle_length manquant pour ${trainerId} — filet à 5`)
  }

  const script = buildBattleScript({
    battleType: battleTypeForTrainer(trainerId),
    questionCount,
    studiedItems,
    content: kanjiContent,
    grammarPoints,
    lexicon,
  })

  // Chaque tirage grammaire compte (graduation par point, PRD) — horodatage
  // serveur. Un combat perdu puis rejoué re-tire et re-compte : c'est le
  // nombre de TIRAGES, pas de combats.
  for (const grammarId of script.grammarDrawn) {
    await sql`
      update grammar_encounters
      set times_drawn = times_drawn + 1, last_drawn_at = now()
      where user_id = ${userId} and grammar_id = ${grammarId}
    `
  }

  const [userRow] = await sql`select avatar from users where id = ${userId}`

  return {
    kind: 'battle',
    trainer_id: trainerId,
    trainer_name_jp: nameJp,
    battle_sprite: battleSpriteFor(trainerId),
    player_back_sprite: playerBackSprite(userRow?.avatar),
    intro_pages: dialogueStatePages(trainer.dialogue_ref, 'battle_intro'),
    lives: script.lives,
    questions: script.questions,
  }
}

export interface BattleStats {
  lives_lost: number
  modes_used: string[]
  accuracy: number
}

export interface BattleVictory {
  name: string
  pages: DialoguePageEntry[]
}

export async function winBattle(
  trainerId: string,
  stats: BattleStats
): Promise<BattleVictory | null> {
  const userId = await requireUserId()
  const trainer = getMapTrainers().find(t => t.trainer_id === trainerId)
  if (!trainer || trainer.role !== 'battle') return null

  const state = await getPlayerState(userId)
  const alreadyDefeated = state.defeated_trainers.includes(trainerId)

  if (!alreadyDefeated) {
    // Effects éventuels de l'état post_battle (aucun au jalon 1 dans le
    // contenu réel — appliqués par la même lib idempotente que les dialogues)
    const postState = getDialogue(trainer.dialogue_ref)?.dialogue_states['post_battle']
    const ctx = { questSteps: getQuestStepsIndex(), now: new Date() }
    let next = postState?.effects?.length ? applyEffects(postState.effects, state, ctx) : state
    next = { ...next, defeated_trainers: [...next.defeated_trainers, trainerId] }
    await savePlayerState(userId, next)

    // Stats bornées serveur (ne jamais faire confiance au client) ;
    // played_at = default now() côté SQL, jamais fourni.
    const livesLost = Math.max(0, Math.round(stats.lives_lost))
    const accuracy = Math.min(1, Math.max(0, stats.accuracy))
    const modesUsed = stats.modes_used.filter(m => typeof m === 'string').slice(0, 200)
    await sql`
      insert into battle_results (user_id, battle_id, lives_lost, modes_used, accuracy)
      values (${userId}, ${trainerId}, ${livesLost}, ${modesUsed}, ${accuracy})
    `
  }

  return {
    name: dialogueNameJp(trainer.dialogue_ref),
    pages: dialogueStatePages(trainer.dialogue_ref, 'post_battle'),
  }
}
