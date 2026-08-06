'use client'

// Boîte de dialogue complète (issue 03) — extraite de MapClient.
//
// Contrat PRD § Mouvement de l'avatar :
//  - A avance la page (ou complète la frappe en cours) ;
//  - B ferme à tout moment (géré par MapClient : onClose) ;
//  - X superpose la traduction `en` de la page courante — jamais d'office ;
//  - Y révèle les lectures inline de la page entière — masquées par défaut.
// X et Y repartent à zéro à chaque page (rappel actif : le joueur tente la
// lecture avant de révéler) — l'état par ligne vit dans DialogueLineView,
// remonté via `key` à chaque changement de ligne.
//
// Kinds spéciaux de pages[] (engine-contract.md § 8) : routés par
// src/lib/dialogue-pages.ts — companion_choice (requis jalon 1),
// instant_response et conversation_turn (UI minimale), kind inconnu sauté.
//
// API impérative (MapClient et, plus tard, les écrans 05/07/08 y branchent
// leurs entrées clavier/tactiles) : ref.pressA() / pressX() / pressY().

import { useCallback, useEffect, useImperativeHandle, useMemo, useState, type Ref } from 'react'
import JpText from '@/components/JpText'
import { totalBaseLength, parseInlineReadings } from '@/lib/inline-reading'
import {
  routeDialoguePages,
  resolveConversationNext,
  shuffledIndices,
  type BilingualLine,
  type RoutedPage,
} from '@/lib/dialogue-pages'
import type { DialoguePageEntry } from '@/lib/content'
import { useAudioManager } from '@/lib/audio-manager'
import { SFX } from '@/lib/audio-tracks'
import { useSettings } from '@/lib/use-settings'
import { TEXT_SPEED_MS } from '@/lib/settings'

export interface DialogueBoxHandle {
  /** Bouton A : complète la frappe, sinon avance (inerte sur une page à choix). */
  pressA(): void
  /** Bouton X : toggle la traduction anglaise de la page courante. */
  pressX(): void
  /** Bouton Y : toggle les lectures inline de la page courante. */
  pressY(): void
}

interface DialogueBoxProps {
  /** Nom affiché (forme jp — ADR-0002). */
  name: string
  /** pages[] brutes du dialogue_state atteint (server action issue 02). */
  pages: DialoguePageEntry[]
  /** Bouton B / fin de dialogue. */
  onClose: () => void
  /** Persistance du companion_choice (server action chooseCompanion). */
  onChooseCompanion?: (companionId: string) => void | Promise<void>
  /** Vitesse machine à écrire (ms/caractère) ; 0 = instantané. Non fourni :
   * le réglage もじの はやさ de l'écran せってい fait foi. */
  typewriterMsPerChar?: number
  ref?: Ref<DialogueBoxHandle>
}

/** Ligne jp/en portée par une page routée (prompt des pages à choix). */
function lineOfPage(page: RoutedPage): BilingualLine {
  switch (page.kind) {
    case 'text':
      return { jp: page.jp, en: page.en }
    case 'companion_choice':
    case 'instant_response':
      return page.prompt
    case 'conversation_turn':
      return page.npc_line
  }
}

/** Réactions en cours de lecture après un choix (instant_response / 会話). */
interface ActiveReaction {
  lines: BilingualLine[]
  index: number
  /** Index de pages routées où reprendre le fil une fois la réaction lue. */
  resumeIndex: number
}

export default function DialogueBox({
  name,
  pages,
  onClose,
  onChooseCompanion,
  typewriterMsPerChar,
  ref,
}: DialogueBoxProps) {
  const settings = useSettings()
  const msPerChar = typewriterMsPerChar ?? TEXT_SPEED_MS[settings.textSpeed]
  const routed = useMemo(() => routeDialoguePages(pages), [pages])
  const [pageIndex, setPageIndex] = useState(0)
  const [reaction, setReaction] = useState<ActiveReaction | null>(null)

  const page: RoutedPage | undefined = routed[pageIndex]
  const line: BilingualLine | null = reaction
    ? (reaction.lines[reaction.index] ?? null)
    : page
      ? lineOfPage(page)
      : null

  // Rien d'affichable (toutes les entrées sautées) → fermer proprement.
  const emptyDialogue = routed.length === 0
  useEffect(() => {
    if (emptyDialogue) onClose()
  }, [emptyDialogue, onClose])

  const goTo = useCallback(
    (index: number) => {
      if (index >= routed.length) onClose()
      else setPageIndex(index)
    },
    [routed.length, onClose]
  )

  // A une fois la frappe finie : réaction en cours → ligne suivante puis
  // reprise du fil ; page de texte → page suivante ; page à choix → inerte
  // (elle n'avance que par un choix).
  const advance = useCallback(() => {
    if (reaction) {
      if (reaction.index + 1 < reaction.lines.length) {
        setReaction({ ...reaction, index: reaction.index + 1 })
      } else {
        setReaction(null)
        goTo(reaction.resumeIndex)
      }
      return
    }
    if (page && page.kind !== 'text') return
    goTo(pageIndex + 1)
  }, [reaction, page, pageIndex, goTo])

  const chooseCompanion = useCallback(
    async (companionId: string) => {
      // Idempotent de bout en bout (Effect.set_companion écrit une fois) —
      // un double tap ne peut ni re-choisir ni sur-avancer (goTo même index).
      try {
        await onChooseCompanion?.(companionId)
      } catch (err) {
        console.error('Failed to persist companion choice', err)
      }
      goTo(pageIndex + 1)
    },
    [onChooseCompanion, goTo, pageIndex]
  )

  const chooseResponse = useCallback(
    (reactionLines: BilingualLine[]) => {
      if (reactionLines.length > 0) {
        setReaction({ lines: reactionLines, index: 0, resumeIndex: pageIndex + 1 })
      } else {
        goTo(pageIndex + 1)
      }
    },
    [pageIndex, goTo]
  )

  const chooseConversation = useCallback(
    (choiceReaction: BilingualLine | null, next: string) => {
      const resumeIndex = resolveConversationNext(routed, pageIndex, next)
      if (choiceReaction) {
        setReaction({ lines: [choiceReaction], index: 0, resumeIndex })
      } else {
        goTo(resumeIndex)
      }
    },
    [routed, pageIndex, goTo]
  )

  if (!line || !page) return null

  // key = la ligne affichée : chaque nouvelle ligne remonte DialogueLineView,
  // ce qui remet X/Y à masqué et relance la machine à écrire.
  const lineKey = reaction ? `r${reaction.resumeIndex}:${reaction.index}` : `p${pageIndex}`

  return (
    <DialogueLineView
      key={lineKey}
      ref={ref}
      name={name}
      page={page}
      line={line}
      inReaction={reaction !== null}
      counter={`${pageIndex + 1}/${routed.length}`}
      typewriterMsPerChar={msPerChar}
      onAdvance={advance}
      onChooseCompanion={chooseCompanion}
      onChooseResponse={chooseResponse}
      onChooseConversation={chooseConversation}
    />
  )
}

// ── Vue d'une ligne (état X/Y + machine à écrire, remis à zéro par remontage) ─

interface DialogueLineViewProps {
  name: string
  page: RoutedPage
  line: BilingualLine
  /** Une réaction de choix est en cours de lecture (masque les choix). */
  inReaction: boolean
  counter: string
  typewriterMsPerChar: number
  onAdvance: () => void
  onChooseCompanion: (companionId: string) => void
  onChooseResponse: (reaction: BilingualLine[]) => void
  onChooseConversation: (reaction: BilingualLine | null, next: string) => void
  ref?: Ref<DialogueBoxHandle>
}

function DialogueLineView({
  name,
  page,
  line,
  inReaction,
  counter,
  typewriterMsPerChar,
  onAdvance,
  onChooseCompanion,
  onChooseResponse,
  onChooseConversation,
  ref,
}: DialogueLineViewProps) {
  // X/Y partent de la préférence de l'écran せってい, et restent basculables
  // à la volée sur la ligne en cours (le réglage donne le défaut, pas une
  // contrainte).
  const settings = useSettings()
  const [showEn, setShowEn] = useState(settings.showEnglish)
  const [showReadings, setShowReadings] = useState(settings.showReadings)
  // Mélange obligatoire des choix affichés (engine-contract § 8) : le contenu
  // liste la réponse naturelle en premier — l'ordre stocké ne doit jamais
  // transparaître. Tiré une fois par ligne (remontage par key).
  const [choiceOrder] = useState(() =>
    page.kind === 'instant_response' || page.kind === 'conversation_turn'
      ? shuffledIndices(page.choices.length)
      : []
  )
  const totalChars = useMemo(() => totalBaseLength(parseInlineReadings(line.jp)), [line.jp])
  const [typedCount, setTypedCount] = useState(() =>
    typewriterMsPerChar <= 0 ? Number.MAX_SAFE_INTEGER : 0
  )
  const typingDone = typedCount >= totalChars

  useEffect(() => {
    if (typewriterMsPerChar <= 0) return
    const timer = setInterval(() => {
      setTypedCount(count => {
        if (count + 1 >= totalChars) clearInterval(timer)
        return count + 1
      })
    }, typewriterMsPerChar)
    return () => clearInterval(timer)
  }, [typewriterMsPerChar, totalChars])

  const { playSfx } = useAudioManager()
  const pressA = useCallback(() => {
    // テキストおん : le bip d'avancée est le son le plus répété du jeu, il se
    // coupe seul sans toucher au reste des bruitages.
    if (settings.textSound) playSfx(SFX.textAdvance)
    if (!typingDone) setTypedCount(Number.MAX_SAFE_INTEGER)
    else onAdvance()
  }, [typingDone, onAdvance, playSfx, settings.textSound])

  const pressX = useCallback(() => setShowEn(v => !v), [])
  const pressY = useCallback(() => setShowReadings(v => !v), [])

  useImperativeHandle(ref, () => ({ pressA, pressX, pressY }), [pressA, pressX, pressY])

  const showChoices = typingDone && !inReaction
  const isChoicePage = page.kind !== 'text'
  const canAdvance = typingDone && (!isChoicePage || inReaction)

  const choiceButton = (key: string, label: string, onPick: () => void, disabled = false) => (
    <button
      key={key}
      disabled={disabled}
      onClick={e => {
        e.stopPropagation()
        if (settings.textSound) playSfx(SFX.textAdvance)
        onPick()
      }}
      className={`block w-full text-left px-3 py-2 rounded border-2 text-base leading-relaxed ${
        disabled
          ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
          : 'border-gray-700 text-gray-900 bg-white hover:bg-amber-50 active:bg-amber-100'
      }`}
    >
      {label}
    </button>
  )

  return (
    <>
      {/* Overlay — un tap n'importe où vaut A (comme le bouton). Léger
          assombrissement (10%) : le vrai jeu ne tamise pas la vue de
          l'overworld derrière la boîte, mais un fond totalement transparent
          laisse transparaître la carte dans les coins arrondis (notches
          transparents du cadre pixel-art) — compromis pour rester lisible
          sur n'importe quel décor. */}
      <div
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/10"
        onClick={e => {
          e.stopPropagation()
          pressA()
        }}
      >
        <div className="w-full max-w-md m-4 mb-24 dialogue-frame text-gray-900">
          {name && (
            <p className="font-chrome text-xs text-amber-800 tracking-widest mb-1">{name}</p>
          )}
          <p className="font-reading text-lg leading-loose min-h-14">
            <JpText jp={line.jp} showReadings={showReadings} visibleChars={typedCount} />
          </p>

          {/* Traduction X — superposée à la demande, jamais d'office */}
          {showEn && line.en && (
            <p className="mt-1 px-2 py-1 rounded bg-gray-900/80 text-white/90 text-sm">{line.en}</p>
          )}

          {/* Choix (companion_choice / instant_response / conversation_turn) */}
          {showChoices && page.kind === 'companion_choice' && (
            <div className="mt-2 space-y-1.5 font-reading" onClick={e => e.stopPropagation()}>
              {page.options.map(option =>
                choiceButton(
                  option.companion_id,
                  option.name.jp,
                  () => onChooseCompanion(option.companion_id),
                  !option.available
                )
              )}
            </div>
          )}
          {showChoices && page.kind === 'instant_response' && (
            <div className="mt-2 space-y-1.5 font-reading" onClick={e => e.stopPropagation()}>
              {choiceOrder.map(i => {
                const choice = page.choices[i]
                return choiceButton(`${i}`, choice.jp, () => onChooseResponse(choice.reaction))
              })}
            </div>
          )}
          {showChoices && page.kind === 'conversation_turn' && (
            <div className="mt-2 space-y-1.5 font-reading" onClick={e => e.stopPropagation()}>
              {choiceOrder.map(i => {
                const choice = page.choices[i]
                return choiceButton(`${i}`, choice.jp, () => onChooseConversation(choice.reaction, choice.next))
              })}
            </div>
          )}

          <p className="font-chrome text-gray-400 text-[10px] mt-2 text-right">
            {counter}
            {canAdvance && (
              <span className="ml-1 text-sm text-gray-600 dialogue-cursor">▼</span>
            )}
          </p>
        </div>
      </div>

      {/* Les boutons X (traduction) et Y (lectures) vivaient ICI, donc
          n'existaient que pendant un dialogue — invisibles le reste du temps,
          au point qu'on oubliait qu'ils existaient (issue 13). Ils sont
          désormais permanents, au même rang que A et B, rendus par MapClient
          et relayés à cette boîte par la ref impérative. */}

    </>
  )
}
