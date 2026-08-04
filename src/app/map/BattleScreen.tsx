'use client'

// Écran de combat (issue 07) — overlay plein écran rendu par MapClient.
//
// Choix overlay-plutôt-que-route (documenté au board) : l'état du combat vit
// CLIENT et n'est JAMAIS persisté (PRD : fermer l'app = fuite, retour carte) —
// un overlay le garantit par construction (aucune URL rejouable, un remount =
// un nouveau combat), et le retour carte/post_battle réutilise la DialogueBox
// et le rafraîchissement de zone déjà en place dans MapClient.
//
// Séquence PRD § Système de Combat : transition diagonale (9 layers HGSS) →
// écran VS → accroche battle_intro (DialogueBox) → questions avec barres de
// HP symétriques. Mauvaise réponse : correction affichée feedbackMs (1,5 s),
// vie perdue, question suivante — JAMAIS de retry. Victoire → winBattle +
// post_battle. Défaite → écran bref, retour carte, rejouable immédiatement.
// En combat : B/START/SELECT inertes (aucun abandon possible).

import { useCallback, useEffect, useRef, useState } from 'react'
import DialogueBox, { type DialogueBoxHandle } from './DialogueBox'
import KanaInput from '@/components/KanaInput'
import JpText from '@/components/JpText'
import { shuffledIndices } from '@/lib/dialogue-pages'
import {
  accuracyOf,
  applyAnswer,
  isSaisieCorrect,
  opponentHpFraction,
  playerHpFraction,
  startProgress,
  type BattleQuestion,
} from '@/lib/battle'
import { winBattle, type BattleVictory, type TrainerBattleStart } from './battle-actions'
import uiStrings from '@/data/ui-strings.json'
import { useAudioManager } from '@/lib/audio-manager'
import { CONTEXT_TRACKS, SFX } from '@/lib/audio-tracks'

const TRANSITION_FRAMES = [
  '/sprites/ui/battle/transition/transition_00_rcsn22.png',
  '/sprites/ui/battle/transition/transition_01_rcsn25.png',
  '/sprites/ui/battle/transition/transition_02_rcsn28.png',
  '/sprites/ui/battle/transition/transition_03_rcsn31.png',
  '/sprites/ui/battle/transition/transition_04_rcsn34.png',
  '/sprites/ui/battle/transition/transition_05_rcsn37.png',
  '/sprites/ui/battle/transition/transition_06_rcsn40.png',
  '/sprites/ui/battle/transition/transition_07_rcsn43.png',
  '/sprites/ui/battle/transition/transition_08_rcsn46.png',
]

export interface BattlePacing {
  transitionMs: number
  vsMs: number
  /** Durée d'affichage de la correction après une mauvaise réponse (PRD :
   * 1-2 s). 0 = enchaînement immédiat (tests). */
  feedbackMs: number
  typewriterMsPerChar: number
}

const DEFAULT_PACING: BattlePacing = {
  transitionMs: 850,
  vsMs: 1200,
  feedbackMs: 1500,
  typewriterMsPerChar: 28,
}

// victoire/défaite ne sont pas des phases posées : elles se DÉRIVENT de
// progress.outcome (une seule source de vérité, pas de setState d'effet).
type Phase = 'transition' | 'vs' | 'intro' | 'battle'

interface BattleScreenProps {
  battle: TrainerBattleStart
  onFinish: (result: { won: boolean }) => void
  pacing?: Partial<BattlePacing>
  /** rng du re-mélange des choix À L'AFFICHAGE (contrat § 8) — injectable. */
  displayRng?: () => number
}

export default function BattleScreen({
  battle,
  onFinish,
  pacing,
  displayRng = Math.random,
}: BattleScreenProps) {
  const p = { ...DEFAULT_PACING, ...pacing }
  const [phase, setPhase] = useState<Phase>(() =>
    p.transitionMs > 0 ? 'transition' : p.vsMs > 0 ? 'vs' : 'intro'
  )
  const [progress, setProgress] = useState(() =>
    startProgress(battle.questions.length, battle.lives)
  )
  // Correction en cours d'affichage (mauvaise OU bonne réponse — la bonne
  // enchaîne vite, la mauvaise montre la bonne réponse en vert)
  const [feedback, setFeedback] = useState<{ correct: boolean } | null>(null)
  const [victory, setVictory] = useState<BattleVictory | null>(null)
  const [transitionFrame, setTransitionFrame] = useState(0)
  const dialogueRef = useRef<DialogueBoxHandle>(null)
  const winCalledRef = useRef(false)
  const jingleCalledRef = useRef(false)

  // Thème dresseur (PRD § Audio) — posé le temps du combat entier (couche
  // 'battle' : gagne toujours sur la BGM de zone posée par MapClient en
  // dessous, restaurée automatiquement au démontage de cet overlay, voir
  // audio-manager.tsx). Jingle de victoire (SFX court, pas l'OST) au moment
  // exact où l'issue bascule — même garde anti-double-déclenchement que
  // winBattle ci-dessous.
  const { setBgmLayer, playSfx } = useAudioManager()
  useEffect(() => {
    setBgmLayer('battle', { url: CONTEXT_TRACKS.battleTrainer, loop: true })
    return () => setBgmLayer('battle', null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (progress.outcome !== 'victory' || jingleCalledRef.current) return
    jingleCalledRef.current = true
    playSfx(SFX.victoryJingle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.outcome])

  // ── Cinématique d'entrée ────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'transition') return
    const frameMs = Math.max(1, Math.floor(p.transitionMs / TRANSITION_FRAMES.length))
    const frames = setInterval(
      () => setTransitionFrame(f => Math.min(f + 1, TRANSITION_FRAMES.length - 1)),
      frameMs
    )
    const done = setTimeout(() => setPhase(p.vsMs > 0 ? 'vs' : 'intro'), p.transitionMs)
    return () => {
      clearInterval(frames)
      clearTimeout(done)
    }
  }, [phase, p.transitionMs, p.vsMs])

  useEffect(() => {
    if (phase !== 'vs') return
    const done = setTimeout(() => setPhase('intro'), p.vsMs)
    return () => clearTimeout(done)
  }, [phase, p.vsMs])

  // ── Réponses ────────────────────────────────────────────────────────────────

  const advance = useCallback((correct: boolean) => {
    setFeedback(null)
    setProgress(prev => applyAnswer(prev, correct))
  }, [])

  const answer = useCallback(
    (correct: boolean) => {
      if (feedback !== null || progress.outcome !== 'ongoing') return
      if (p.feedbackMs > 0) setFeedback({ correct })
      else advance(correct)
    },
    [feedback, progress.outcome, p.feedbackMs, advance]
  )

  useEffect(() => {
    if (feedback === null) return
    const timer = setTimeout(() => advance(feedback.correct), p.feedbackMs)
    return () => clearTimeout(timer)
  }, [feedback, p.feedbackMs, advance])

  // ── Fin de combat ───────────────────────────────────────────────────────────
  // Victoire : la server action écrit defeated_trainers + battle_results et
  // retourne le post_battle. Défaite : RIEN n'est écrit (rejouable).

  useEffect(() => {
    if (progress.outcome !== 'victory' || winCalledRef.current) return
    winCalledRef.current = true
    winBattle(battle.trainer_id, {
      lives_lost: progress.livesLost,
      modes_used: battle.questions.map(q => q.mode),
      accuracy: accuracyOf(progress),
    })
      .then(result => setVictory(result ?? { name: battle.trainer_name_jp, pages: [] }))
      .catch(err => {
        console.error('Failed to record battle victory', err)
        setVictory({ name: battle.trainer_name_jp, pages: [] })
      })
  }, [battle, progress])

  // ── Entrées : A relayé, B/Escape inertes (aucun abandon en combat) ──────────

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        dialogueRef.current?.pressA()
      }
      // Escape/Backspace volontairement ignorés : B n'abandonne pas.
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const question = battle.questions[progress.index]
  const outcome = progress.outcome

  return (
    <div className="fixed inset-0 z-[80] bg-gray-950 font-chrome select-none overflow-hidden">
      {phase === 'transition' && (
        <img
          src={TRANSITION_FRAMES[transitionFrame]}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }}
        />
      )}

      {phase === 'vs' && (
        <div className="absolute inset-0 flex items-center justify-center gap-8 bg-gray-900">
          <SpriteBox
            sheet={battle.player_back_sprite}
            frame={64}
            className="translate-y-2"
          />
          {/* 「たい」 (対) plutôt que « VS » : l'écran d'engagement HGSS affiche
              VS, mais le latin visible joueur est hors exceptions PRD (revue
              jalon 1, m1) — kana, pas le kanji 対 (N3, jamais pré-enseigné). */}
          <span className="font-reading text-amber-400 text-5xl font-bold italic tracking-widest">
            たい
          </span>
          <div className="flex flex-col items-center gap-2">
            <TrainerSprite src={battle.battle_sprite} />
            <span className="font-reading text-white/90 text-sm">{battle.trainer_name_jp}</span>
          </div>
        </div>
      )}

      {phase !== 'transition' && phase !== 'vs' && (
        <Arena battle={battle} progress={progress}>
          {phase === 'battle' && outcome === 'ongoing' && question && (
            <QuestionView
              key={progress.index}
              question={question}
              feedback={feedback}
              onAnswer={answer}
              displayRng={displayRng}
            />
          )}
          {outcome === 'defeat' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <TrainerSprite src={battle.battle_sprite} />
              <p className="font-reading text-white text-lg">{uiStrings.battle_defeat.jp}</p>
              <button
                onClick={() => onFinish({ won: false })}
                className="px-4 py-2 rounded border-2 border-white/40 text-white/90 bg-white/10 active:bg-white/25"
              >
                {uiStrings.back_to_map.jp}
              </button>
            </div>
          )}
        </Arena>
      )}

      {phase === 'intro' && (
        <DialogueBox
          ref={dialogueRef}
          name={battle.trainer_name_jp}
          pages={battle.intro_pages}
          onClose={() => setPhase('battle')}
          typewriterMsPerChar={p.typewriterMsPerChar}
        />
      )}

      {outcome === 'victory' && victory && (
        <DialogueBox
          ref={dialogueRef}
          name={victory.name}
          pages={victory.pages}
          onClose={() => onFinish({ won: true })}
          typewriterMsPerChar={p.typewriterMsPerChar}
        />
      )}
    </div>
  )
}

// ── Arène : barres de HP symétriques + sprites ────────────────────────────────

function HpBar({
  fraction,
  testId,
  align,
}: {
  fraction: number
  testId: string
  align: 'left' | 'right'
}) {
  return (
    <div
      data-testid={testId}
      className={`w-40 h-3 rounded-full border border-white/50 bg-gray-800 overflow-hidden ${
        align === 'right' ? 'ml-auto' : ''
      }`}
    >
      <div
        className={`h-full transition-all duration-300 ${
          fraction > 0.5 ? 'bg-emerald-400' : fraction > 0.2 ? 'bg-amber-400' : 'bg-red-500'
        }`}
        style={{ width: `${Math.round(fraction * 100)}%` }}
      />
    </div>
  )
}

function TrainerSprite({ src }: { src: string | null }) {
  if (!src) {
    return (
      <div
        className="w-[120px] h-[120px] flex items-center justify-center text-white/40 text-4xl bg-white/5 rounded"
        aria-hidden
      >
        ？
      </div>
    )
  }
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      width={120}
      height={120}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

/** Première frame d'une planche verticale (dos du joueur, 64px). */
function SpriteBox({
  sheet,
  frame,
  className = '',
}: {
  sheet: string
  frame: number
  className?: string
}) {
  const scale = 2
  return (
    <div
      aria-hidden
      className={className}
      style={{
        width: frame * scale,
        height: frame * scale,
        backgroundImage: `url(${sheet})`,
        backgroundPosition: '0 0',
        backgroundSize: `${frame * scale}px auto`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    />
  )
}

function Arena({
  battle,
  progress,
  children,
}: {
  battle: TrainerBattleStart
  progress: ReturnType<typeof startProgress>
  children: React.ReactNode
}) {
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Adversaire : barre en haut à gauche, sprite à droite */}
      <div className="flex items-start justify-between px-4 pt-3">
        <div>
          <p className="font-reading text-white/90 text-sm mb-1">{battle.trainer_name_jp}</p>
          <HpBar fraction={opponentHpFraction(progress)} testId="hp-opponent" align="left" />
        </div>
        <TrainerSprite src={battle.battle_sprite} />
      </div>

      {/* Zone de question */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        <div className="w-full max-w-lg">{children}</div>
      </div>

      {/* Joueur : dos à gauche, barre en bas à droite */}
      <div className="flex items-end justify-between px-4 pb-3">
        <SpriteBox sheet={battle.player_back_sprite} frame={64} />
        <div>
          <HpBar fraction={playerHpFraction(progress)} testId="hp-player" align="right" />
          <p className="text-white/50 text-[10px] mt-1 text-right">
            {progress.index}/{progress.totalQuestions}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Questions ─────────────────────────────────────────────────────────────────

interface QuestionViewProps {
  question: BattleQuestion
  feedback: { correct: boolean } | null
  onAnswer: (correct: boolean) => void
  displayRng: () => number
}

function QuestionView({ question, feedback, onAnswer, displayRng }: QuestionViewProps) {
  switch (question.mode) {
    case 'sens':
    case 'lecture':
    case 'grammaire':
      return (
        <ChoiceQuestion question={question} feedback={feedback} onAnswer={onAnswer} displayRng={displayRng} />
      )
    case 'saisie':
      return <SaisieQuestion question={question} feedback={feedback} onAnswer={onAnswer} />
    case 'composition':
      return (
        <CompositionQuestion
          question={question}
          feedback={feedback}
          onAnswer={onAnswer}
          displayRng={displayRng}
        />
      )
  }
}

function promptLabel(mode: 'sens' | 'lecture' | 'grammaire'): string {
  if (mode === 'sens') return uiStrings.battle_prompt_sens.jp
  if (mode === 'lecture') return uiStrings.battle_prompt_lecture.jp
  return ''
}

function ChoiceQuestion({
  question,
  feedback,
  onAnswer,
  displayRng,
}: {
  question: Extract<BattleQuestion, { choices: string[] }>
  feedback: { correct: boolean } | null
  onAnswer: (correct: boolean) => void
  displayRng: () => number
}) {
  // Re-mélange OBLIGATOIRE à l'affichage (contrat § 8) — jamais l'ordre stocké
  const [order] = useState(() => shuffledIndices(question.choices.length, displayRng))
  const [chosen, setChosen] = useState<number | null>(null)

  const pick = (index: number) => {
    if (feedback !== null || chosen !== null) return
    setChosen(index)
    onAnswer(index === question.correct_index)
  }

  const feedbackFor = (index: number): string | undefined => {
    if (feedback === null) return undefined
    if (index === question.correct_index) return 'correct'
    if (index === chosen) return 'wrong'
    return undefined
  }

  return (
    <div>
      <div className="text-center mb-4">
        {question.mode === 'grammaire' ? (
          <p className="font-reading text-white text-xl leading-loose">
            <JpText jp={question.cloze} showReadings />
          </p>
        ) : (
          <>
            <p className="text-white/60 text-xs mb-2">{promptLabel(question.mode)}</p>
            <p className="font-reading text-white text-6xl">{question.item}</p>
          </>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {order.map(i => {
          const mark = feedbackFor(i)
          return (
            <button
              key={i}
              data-choice={i}
              data-feedback={mark}
              disabled={feedback !== null}
              onClick={() => pick(i)}
              className={`px-3 py-2.5 rounded border-2 font-reading text-base text-left transition-colors ${
                mark === 'correct'
                  ? 'border-emerald-400 bg-emerald-500/30 text-white'
                  : mark === 'wrong'
                    ? 'border-red-500 bg-red-500/20 text-white/80'
                    : 'border-white/30 bg-white/5 text-white hover:bg-white/15 active:bg-white/25'
              }`}
            >
              {question.choices[i]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SaisieQuestion({
  question,
  feedback,
  onAnswer,
}: {
  question: Extract<BattleQuestion, { mode: 'saisie' }>
  feedback: { correct: boolean } | null
  onAnswer: (correct: boolean) => void
}) {
  const [value, setValue] = useState('')
  const submit = () => {
    if (feedback !== null || value === '') return
    onAnswer(isSaisieCorrect(value, question.accepted))
  }

  return (
    <div className="text-center">
      <p className="text-white/60 text-xs mb-2">{uiStrings.battle_prompt_saisie.jp}</p>
      <p className="text-white text-4xl font-semibold mb-4">{question.prompt_en}</p>
      <div className="flex items-center justify-center gap-2">
        <KanaInput
          value={value}
          onChange={setValue}
          onSubmit={submit}
          autoFocus
          ariaLabel={uiStrings.battle_prompt_saisie.jp}
          className="font-reading w-48 px-3 py-2 rounded border-2 border-white/40 bg-white text-gray-900 text-lg text-center"
        />
        <button
          onClick={submit}
          disabled={feedback !== null || value === ''}
          className="px-3 py-2 rounded border-2 border-white/30 bg-white/10 text-white disabled:opacity-40 active:bg-white/25"
        >
          {uiStrings.confirm.jp}
        </button>
      </div>
      {feedback !== null && !feedback.correct && (
        <p
          data-testid="correction"
          className="font-reading inline-block mt-3 px-3 py-1.5 rounded border-2 border-emerald-400 bg-emerald-500/30 text-white text-lg"
        >
          {uiStrings.battle_answer_label.jp}：{question.accepted[0]}
        </p>
      )}
    </div>
  )
}

function CompositionQuestion({
  question,
  feedback,
  onAnswer,
  displayRng,
}: {
  question: Extract<BattleQuestion, { mode: 'composition' }>
  feedback: { correct: boolean } | null
  onAnswer: (correct: boolean) => void
  displayRng: () => number
}) {
  const [order] = useState(() => shuffledIndices(question.tiles.length, displayRng))
  /** Index (dans tiles) des tuiles choisies, dans l'ordre de sélection. */
  const [selected, setSelected] = useState<number[]>([])

  const toggle = (index: number) => {
    if (feedback !== null) return
    setSelected(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : prev.length < 2 ? [...prev, index] : prev
    )
  }

  const submit = () => {
    if (feedback !== null || selected.length !== 2) return
    const attempt = question.tiles[selected[0]] + question.tiles[selected[1]]
    onAnswer(attempt === question.word)
  }

  return (
    <div className="text-center">
      <p className="text-white/60 text-xs mb-3">{uiStrings.battle_prompt_composition.jp}</p>
      <div className="flex items-center justify-center gap-3 mb-4">
        {order.map(i => {
          const pos = selected.indexOf(i)
          return (
            <button
              key={i}
              data-tile={i}
              onClick={() => toggle(i)}
              disabled={feedback !== null}
              className={`relative w-16 h-16 rounded border-2 font-reading text-3xl text-white transition-colors ${
                pos >= 0
                  ? 'border-amber-400 bg-amber-500/25'
                  : 'border-white/30 bg-white/5 active:bg-white/20'
              }`}
            >
              {question.tiles[i]}
              {pos >= 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-400 text-black text-xs flex items-center justify-center">
                  {pos + 1}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <button
        onClick={submit}
        disabled={feedback !== null || selected.length !== 2}
        className="px-4 py-2 rounded border-2 border-white/30 bg-white/10 text-white disabled:opacity-40 active:bg-white/25"
      >
        {uiStrings.confirm.jp}
      </button>
      {feedback !== null && !feedback.correct && (
        <p
          data-testid="correction"
          className="font-reading block mx-auto mt-3 w-fit px-3 py-1.5 rounded border-2 border-emerald-400 bg-emerald-500/30 text-white text-lg"
        >
          {uiStrings.battle_answer_label.jp}：{question.word}（{question.reading}）
        </p>
      )}
    </div>
  )
}
