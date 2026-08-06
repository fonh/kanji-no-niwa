'use client'

// Fenêtre de lecture des textes progressifs (issue 08) — plein écran, même
// famille visuelle que l'écran-livre (book-chrome/book-frame), texture de
// page selon le type de document (letter/sign/scroll, déduit côté serveur).
//
// Lecture : jp en JpText (lectures inline masquées, Y les révèle), X = la
// traduction anglaise (pédagogique). Puis QUIZ OBLIGATOIRE retry-jusqu'à-
// correct — **vue partagée** : le texte reste affiché (panneau scrollable)
// AU-DESSUS du quiz pendant toute sa durée (PRD : « le texte reste
// consultable à tout moment pendant le quiz », comme au JLPT — choix split
// plutôt que toggle, documenté au board). Après un 2ᵉ échec sur une question
// à answer_span, le passage est surligné dans le panneau (scaffolding).
//
// B = fermeture avec confirmation. Reprise : la progression du quiz est un
// objet pur (src/lib/text-quiz.ts) rangé dans sessionStorage — la
// réouverture DANS la même session (même onglet) reprend à la question
// courante ; rien n'est persisté serveur au jalon 1 (décision documentée :
// « la question courante peut être re-dérivée client »). Le blob est validé
// (restoreTextQuiz) et purgé à la complétion.
//
// Complétion : completeText(score première-tentative, flawless) — le serveur
// horodate ; une passe sans faute (première lecture OU relecture, quiz
// remélangé à chaque affichage) pose gold_at.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import JpText from '@/components/JpText'
import DsFacePad from '@/components/DsFacePad'
import { shuffledIndices } from '@/lib/dialogue-pages'
import {
  answerTextQuestion,
  isFlawless,
  quizScore,
  restoreTextQuiz,
  shouldScaffold,
  splitForHighlight,
  startTextQuiz,
  type AnswerSpan,
  type DocumentKind,
  type TextQuizProgress,
} from '@/lib/text-quiz'
import uiStrings from '@/data/ui-strings.json'
import { completeText } from './actions'

export interface TextReaderQuestion {
  promptJp: string
  options: { jp: string; en: string }[]
  correctIndex: number
  answerSpan: AnswerSpan | null
}

export interface TextReaderData {
  textId: string
  titleJp: string
  jpText: string
  enText: string
  docKind: DocumentKind
  questions: TextReaderQuestion[]
}

type Phase = 'reading' | 'quiz' | 'saving' | 'done' | 'error'

const storageKey = (textId: string) => `text-quiz:${textId}`

function loadResume(textId: string, questionCount: number): TextQuizProgress | null {
  try {
    const raw = sessionStorage.getItem(storageKey(textId))
    if (!raw) return null
    const restored = restoreTextQuiz(JSON.parse(raw), questionCount)
    return restored && !restored.done ? restored : null
  } catch {
    return null
  }
}

function saveResume(textId: string, progress: TextQuizProgress) {
  try {
    if (progress.done) sessionStorage.removeItem(storageKey(textId))
    else sessionStorage.setItem(storageKey(textId), JSON.stringify(progress))
  } catch {
    /* stockage indisponible : la reprise est un confort, jamais un crash */
  }
}

export default function TextReader({ data }: { data: TextReaderData }) {
  const router = useRouter()
  const questionCount = data.questions.length

  // Reprise même-session : si une progression valide et inachevée existe,
  // on rouvre directement en phase quiz, à la question courante.
  const [resume] = useState(() => loadResume(data.textId, questionCount))
  const [phase, setPhase] = useState<Phase>(resume ? 'quiz' : 'reading')
  const [progress, setProgress] = useState<TextQuizProgress>(
    () => resume ?? startTextQuiz(questionCount)
  )
  const [showReadings, setShowReadings] = useState(false)
  const [showEn, setShowEn] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [goldPass, setGoldPass] = useState(false)

  const question =
    (phase === 'quiz' || phase === 'saving') && !progress.done
      ? (data.questions[progress.questionIndex] ?? null)
      : null

  // Mélange des choix À L'AFFICHAGE, re-tiré à chaque question ET à chaque
  // tentative — l'ordre stocké ne transparaît jamais (contrat § 8) et une
  // relecture rejoue un quiz remélangé.
  const displayOrder = useMemo(
    () => (question ? shuffledIndices(question.options.length) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [question, progress.questionIndex, progress.failsOnCurrent]
  )

  const scaffold = question ? shouldScaffold(progress, question.answerSpan) : false

  const finish = useCallback(
    (final: TextQuizProgress) => {
      setPhase('saving')
      const flawless = isFlawless(final)
      completeText(data.textId, quizScore(final), flawless)
        .then(result => {
          if (!result.completed) {
            setPhase('error')
            return
          }
          setGoldPass(flawless)
          setPhase('done')
        })
        .catch(() => setPhase('error'))
    },
    [data.textId]
  )

  const answer = useCallback(
    (optionIndex: number) => {
      if (!question) return
      const next = answerTextQuestion(progress, optionIndex === question.correctIndex)
      setProgress(next)
      saveResume(data.textId, next)
      if (next.done) finish(next)
    },
    [question, progress, data.textId, finish]
  )

  const beginQuiz = useCallback(() => {
    const fresh = startTextQuiz(questionCount)
    setProgress(fresh)
    if (questionCount === 0) {
      // Texte sans question (aucun au jalon) : complétion directe.
      finish(fresh)
      return
    }
    setPhase('quiz')
  }, [questionCount, finish])

  const close = useCallback(() => router.push('/map'), [router])
  const requestClose = useCallback(() => {
    if (phase === 'done') close()
    else setConfirmClose(true)
  }, [phase, close])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Escape':
        case 'Backspace':
          requestClose()
          break
        case 'KeyY':
          setShowReadings(v => !v)
          break
        case 'KeyX':
          setShowEn(v => !v)
          break
        case 'Space':
        case 'Enter':
          if (phase === 'reading' && !confirmClose) {
            e.preventDefault()
            beginQuiz()
          }
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [requestClose, beginQuiz, phase, confirmClose])

  // Le passage answer_span surligné (scaffolding) : le jp_text BRUT est
  // découpé sur les bornes du span, chaque tranche rendue en JpText — les
  // spans du contenu tombent sur des frontières de segments (vérifié).
  const textBody = (() => {
    const cls = 'font-reading text-lg leading-loose'
    if (scaffold && question?.answerSpan) {
      const parts = splitForHighlight(data.jpText, question.answerSpan)
      return (
        <p lang="ja">
          <JpText jp={parts.before} showReadings={showReadings} className={cls} />
          <mark data-testid="scaffold-highlight" className="text-scaffold-mark">
            <JpText jp={parts.highlighted} showReadings={showReadings} className={cls} />
          </mark>
          <JpText jp={parts.after} showReadings={showReadings} className={cls} />
        </p>
      )
    }
    return (
      <p lang="ja">
        <JpText jp={data.jpText} showReadings={showReadings} className={cls} />
      </p>
    )
  })()

  return (
    <div className="fixed inset-0 overflow-hidden book-chrome select-none flex items-center justify-center">
      {(phase === 'reading' || phase === 'quiz' || phase === 'saving') && (
        <div className="book-frame w-full max-w-3xl mx-3 my-4 flex flex-col max-h-[calc(100dvh-2rem)]">
          {/* Panneau texte — TOUJOURS présent (lecture ET quiz), scrollable */}
          <div
            data-testid="text-panel"
            className={`text-doc-${data.docKind} rounded-sm px-5 py-4 overflow-y-auto min-h-0 ${
              phase === 'reading' ? 'flex-1' : 'max-h-[45%]'
            }`}
          >
            <h1 lang="ja" className="font-reading text-sm opacity-70 mb-2">
              <JpText jp={data.titleJp} showReadings={showReadings} />
            </h1>
            {textBody}
            {showEn && <p className="text-sm opacity-75 mt-3">{data.enText}</p>}
          </div>

          {phase === 'reading' && (
            <div className="flex justify-center py-3">
              <button
                lang="ja"
                onClick={beginQuiz}
                className="font-chrome px-5 py-2.5 rounded border-2 border-[#7a5a33] bg-[#fbf4e2] text-[#3b2c1a] hover:bg-[#f1e5c6] active:bg-[#e8d9b0]"
              >
                {uiStrings.text_quiz_start.jp}
              </button>
            </div>
          )}

          {/* Quiz — sous le texte, même carte de question que le livre */}
          {(phase === 'quiz' || phase === 'saving') && question && (
            <div className="book-page rounded-sm mt-2 p-4 flex flex-col gap-3 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span lang="ja" className="font-chrome text-sm text-[#7a5a33]">
                  {uiStrings.text_quiz_title.jp}
                </span>
                <span className="font-chrome text-xs text-[#7a5a33]">
                  {progress.questionIndex + 1}/{questionCount}
                </span>
              </div>
              <div lang="ja" className="text-center">
                <JpText
                  jp={question.promptJp}
                  showReadings={showReadings}
                  className="font-reading text-lg leading-loose"
                />
              </div>
              {progress.failsOnCurrent > 0 && (
                <p lang="ja" className="font-reading text-center book-accent text-sm">
                  {uiStrings.quiz_retry.jp}
                  {scaffold && (
                    <span className="block mt-1">{uiStrings.text_scaffold_hint.jp}</span>
                  )}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {displayOrder.map(i => (
                  <button
                    key={`${progress.failsOnCurrent}-${i}`}
                    lang="ja"
                    disabled={phase === 'saving'}
                    onClick={e => {
                      e.stopPropagation()
                      answer(i)
                    }}
                    className="font-reading text-base px-3 py-2.5 rounded border-2 border-[#7a5a33] bg-[#fbf4e2] text-[#3b2c1a] hover:bg-[#f1e5c6] active:bg-[#e8d9b0] disabled:opacity-60"
                  >
                    {question.options[i].jp}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Fin : blanc (lu) ou doré (passe sans faute) ─────────────────── */}
      {phase === 'done' && (
        <div className="book-frame w-full max-w-md mx-3">
          <div className="book-page rounded-sm p-8 flex flex-col items-center gap-5">
            <p
              lang="ja"
              className={`font-reading text-xl text-center ${goldPass ? 'text-[#a4780e]' : ''}`}
            >
              {goldPass ? uiStrings.text_gold_done.jp : uiStrings.text_read_done.jp}
            </p>
            <button
              lang="ja"
              onClick={close}
              className="font-chrome px-5 py-2.5 rounded border-2 border-[#7a5a33] text-[#3b2c1a] hover:bg-[#f1e5c6]"
            >
              {uiStrings.back_to_map.jp}
            </button>
          </div>
        </div>
      )}
      {phase === 'error' && (
        <div className="book-frame w-full max-w-md mx-3">
          <div className="book-page rounded-sm p-8 flex flex-col items-center gap-5">
            <p lang="ja" className="font-reading text-lg text-center">
              {uiStrings.save_failed.jp}
            </p>
            <button
              lang="ja"
              onClick={() => finish(progress)}
              className="font-chrome px-5 py-2.5 rounded border-2 border-[#7a5a33] text-[#3b2c1a] hover:bg-[#f1e5c6]"
            >
              {uiStrings.retry.jp}
            </button>
          </div>
        </div>
      )}

      {/* La manette de la console — même composant, même losange, même place
          que sur la carte, dans le menu et en combat (2026-08-07). Cet écran
          gardait trois ronds d'un autre diamètre alignés autrement : un même
          geste doit trouver le même bouton au même endroit. A est estompé (la
          lecture n'avance pas au bouton, on fait défiler). */}
      <DsFacePad
        className="fixed bottom-6 right-4 z-10"
        buttons={[
          { area: 'x', label: 'X', onPress: () => setShowEn(v => !v), lit: showEn },
          { area: 'y', label: 'Y', onPress: () => setShowReadings(v => !v), lit: showReadings },
          { area: 'a', label: 'A', dimmed: true },
          { area: 'b', label: 'B', onPress: requestClose },
        ]}
      />

      {/* Confirmation de fermeture (B) — le quiz reprendra à la question
          courante dans la même session (sessionStorage) */}
      {confirmClose && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50"
          onClick={e => e.stopPropagation()}
        >
          <div className="book-page border-2 border-[#7a5a33] rounded p-5 mx-4 max-w-sm flex flex-col gap-4">
            <p lang="ja" className="font-reading">
              {uiStrings.text_close_confirm.jp}
            </p>
            <div className="flex justify-end gap-2 font-reading">
              <button
                lang="ja"
                onClick={() => setConfirmClose(false)}
                className="px-4 py-2 rounded border-2 border-[#7a5a33] text-[#3b2c1a] hover:bg-[#f1e5c6]"
              >
                {uiStrings.no.jp}
              </button>
              <button
                lang="ja"
                onClick={close}
                className="px-4 py-2 rounded border-2 border-[#a4452e] book-accent hover:bg-[#a4452e]/10"
              >
                {uiStrings.yes.jp}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
