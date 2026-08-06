// Routage des entrées de pages[] — logique pure, zéro I/O (issue 03).
//
// Contrat : content/engine-contract.md § 8. Une entrée de pages[] est soit une
// page de texte {jp, en}, soit une entrée à `kind` spécial :
//  - companion_choice   (choix unique du compagnon, labo d'Elm — requis jalon 1)
//  - instant_response   (即時応答, appels Pokégear)
//  - conversation_turn  (会話 à embranchements, champ next = turn_id | "end")
//  - item_get           (annonce « objet obtenu », fabriquée par le serveur —
//                        src/lib/item-get.ts ; une page de texte qui déclenche
//                        en plus la fanfare du jeu d'origine)
// Un kind inconnu ne crashe JAMAIS : il est loggué et sauté.
//
// Le serveur (src/app/map/actions.ts) enrichit les entrées companion_choice
// avec le roster de content/companions.json via attachCompanionOptions —
// le client ne lit jamais content/ directement.

import type { DialoguePageEntry } from './content'

export interface BilingualLine {
  jp: string
  en: string
}

export interface CompanionOption {
  companion_id: string
  name: BilingualLine
  /** Slots tbd_2/tbd_3 : affichés mais non choisissables tant que leur
   * identité n'est pas tranchée (CONTEXT.md § Companion Choice). */
  available: boolean
}

export interface ResponseChoice {
  jp: string
  en: string
  /** natural | too_formal | off_topic — jamais affiché, jamais un Effect. */
  quality?: string
  reaction: BilingualLine[]
}

export interface ConversationChoice {
  jp: string
  en: string
  tone?: string
  reaction: BilingualLine | null
  /** turn_id du tour suivant, ou "end". */
  next: string
}

export type RoutedPage =
  | { kind: 'text'; jp: string; en: string }
  | { kind: 'item_get'; jp: string; en: string; fanfare: 'item' | 'keyitem' }
  | { kind: 'companion_choice'; prompt: BilingualLine; options: CompanionOption[] }
  | { kind: 'instant_response'; prompt: BilingualLine; choices: ResponseChoice[] }
  | { kind: 'conversation_turn'; turn_id: string; npc_line: BilingualLine; choices: ConversationChoice[] }

// ── Helpers de validation (le contenu est lint-é, mais on ne crashe jamais) ──

function asLine(value: unknown): BilingualLine | null {
  if (typeof value !== 'object' || value === null) return null
  const { jp, en } = value as { jp?: unknown; en?: unknown }
  if (typeof jp !== 'string') return null
  return { jp, en: typeof en === 'string' ? en : '' }
}

function asReactionPages(value: unknown): BilingualLine[] {
  if (typeof value !== 'object' || value === null) return []
  const pages = (value as { pages?: unknown }).pages
  if (!Array.isArray(pages)) return []
  return pages.map(asLine).filter((line): line is BilingualLine => line !== null)
}

// ── Enrichissement serveur du companion_choice ────────────────────────────────

export interface CompanionRosterEntry {
  companion_id: string
  name: BilingualLine
  sprite_ref?: string | null
  status: string
}

/** Attache le roster de content/companions.json aux entrées companion_choice.
 * Retourne de NOUVELLES entrées (les originales sortent du cache module de
 * content.ts et ne doivent jamais être mutées). Un slot n'est choisissable que
 * confirmé — tbd_2/tbd_3 restent visibles mais indisponibles. */
export function attachCompanionOptions(
  pages: DialoguePageEntry[],
  roster: CompanionRosterEntry[]
): DialoguePageEntry[] {
  const options: CompanionOption[] = roster.map(c => ({
    companion_id: c.companion_id,
    name: { jp: c.name.jp, en: c.name.en },
    available: c.status === 'confirmed',
  }))
  return pages.map(page => (page.kind === 'companion_choice' ? { ...page, options } : page))
}

// ── Routage ───────────────────────────────────────────────────────────────────

export type RouteWarn = (message: string, entry: DialoguePageEntry) => void

/** Transforme les entrées brutes de pages[] en pages typées prêtes à rendre.
 * Toute entrée invalide ou de kind inconnu est logguée et sautée — jamais de
 * crash sur du contenu inattendu. */
export function routeDialoguePages(
  pages: DialoguePageEntry[],
  warn: RouteWarn = (message, entry) => console.warn(`[dialogue] ${message}`, entry)
): RoutedPage[] {
  const routed: RoutedPage[] = []
  for (const entry of pages) {
    switch (entry.kind) {
      case undefined: {
        if (typeof entry.jp !== 'string') {
          warn('page sans jp ignorée', entry)
          break
        }
        routed.push({ kind: 'text', jp: entry.jp, en: typeof entry.en === 'string' ? entry.en : '' })
        break
      }
      case 'item_get': {
        if (typeof entry.jp !== 'string') {
          warn('item_get sans jp ignorée', entry)
          break
        }
        routed.push({
          kind: 'item_get',
          jp: entry.jp,
          en: typeof entry.en === 'string' ? entry.en : '',
          fanfare: entry.fanfare === 'keyitem' ? 'keyitem' : 'item',
        })
        break
      }
      case 'companion_choice': {
        const prompt = asLine(entry.prompt)
        const rawOptions = Array.isArray(entry.options) ? (entry.options as CompanionOption[]) : []
        const options = rawOptions.filter(
          o => typeof o?.companion_id === 'string' && asLine(o.name) !== null
        )
        if (!prompt || options.length === 0) {
          warn('companion_choice sans prompt ou sans options (enrichissement serveur manquant ?) — sauté', entry)
          break
        }
        routed.push({ kind: 'companion_choice', prompt, options })
        break
      }
      case 'instant_response': {
        const prompt = asLine(entry.prompt)
        const rawChoices = Array.isArray(entry.choices) ? entry.choices : []
        const choices: ResponseChoice[] = []
        for (const raw of rawChoices) {
          const line = asLine(raw)
          if (!line) continue
          const { quality, reaction } = raw as { quality?: unknown; reaction?: unknown }
          choices.push({
            ...line,
            quality: typeof quality === 'string' ? quality : undefined,
            reaction: asReactionPages(reaction),
          })
        }
        if (!prompt || choices.length === 0) {
          warn('instant_response invalide — sauté', entry)
          break
        }
        routed.push({ kind: 'instant_response', prompt, choices })
        break
      }
      case 'conversation_turn': {
        const npcLine = asLine(entry.npc_line)
        const turnId = entry.turn_id
        const rawChoices = Array.isArray(entry.choices) ? entry.choices : []
        const choices: ConversationChoice[] = []
        for (const raw of rawChoices) {
          const line = asLine(raw)
          const next = (raw as { next?: unknown }).next
          if (!line || typeof next !== 'string') continue
          const { tone, reaction } = raw as { tone?: unknown; reaction?: unknown }
          choices.push({
            ...line,
            tone: typeof tone === 'string' ? tone : undefined,
            reaction: asLine(reaction),
            next,
          })
        }
        if (!npcLine || typeof turnId !== 'string' || choices.length === 0) {
          warn('conversation_turn invalide — sauté', entry)
          break
        }
        routed.push({ kind: 'conversation_turn', turn_id: turnId, npc_line: npcLine, choices })
        break
      }
      default:
        warn(`kind inconnu « ${String(entry.kind)} » — sauté`, entry)
    }
  }
  return routed
}

// ── Mélange des choix affichés ────────────────────────────────────────────────

/** Ordre d'affichage mélangé des choix (engine-contract.md § 8 : ne jamais
 * supposer que la position stockée reflète la position affichée — le contenu
 * liste souvent la réponse naturelle en premier). Fisher-Yates, rng injectable
 * pour les tests. S'applique aux choix d'instant_response/conversation_turn ;
 * PAS au companion_choice (roster fixe, pas un quiz). */
export function shuffledIndices(count: number, random: () => number = Math.random): number[] {
  const order = Array.from({ length: count }, (_, i) => i)
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

// ── Navigation dans un bloc 会話 ──────────────────────────────────────────────

/** Index du tour portant `turnId`, ou -1. */
export function findConversationTurn(pages: RoutedPage[], turnId: string): number {
  return pages.findIndex(p => p.kind === 'conversation_turn' && p.turn_id === turnId)
}

/** Première page après le bloc contigu de conversation_turn contenant
 * `fromIndex` (== pages.length si le dialogue se termine sur le bloc). */
function indexAfterConversationBlock(pages: RoutedPage[], fromIndex: number): number {
  let i = fromIndex
  while (i < pages.length && pages[i]?.kind === 'conversation_turn') i++
  return i
}

/** Résout le champ `next` d'un choix de 会話 : turn_id → index du tour ;
 * "end" (ou turn_id introuvable — robustesse) → sortie du bloc. */
export function resolveConversationNext(
  pages: RoutedPage[],
  fromIndex: number,
  next: string
): number {
  if (next !== 'end') {
    const target = findConversationTurn(pages, next)
    if (target !== -1) return target
  }
  return indexAfterConversationBlock(pages, fromIndex)
}
