'use client'

// Écran-livre des leçons (issue 05) — le Book Screen (CONTEXT.md).
//
// Paysage, chrome livre ancien esprit Wagotabi (parchemin, cadre bois) avec
// l'identité DS déjà établie (fontes DotGothic16/BIZ UDGothic). Une DOUBLE
// page par kanji : gauche = identité (caractère très grand, lecture en
// couleur distincte, mot-clé anglais — keyword prioritaire, contrat § 7 —
// icône de concept, audio) ; droite = usage (lesson_examples, lectures
// inline masquées, Y révèle). Puis la page grammaire (overlay de zone +
// base Hanabira, segments tapables → popup lecture), puis le mini-quiz
// (1 question par kanji + 1 grammaire — mauvaise réponse : on recommence la
// MÊME question, pas de skip). B = fermeture avec confirmation, reprise
// page 1 (aucun curseur stocké). Relecture d'une leçon complétée : même
// écran, sans quiz (`quiz: null`).
//
// Aucun français visible joueur : chrome en japonais (ui-strings), anglais
// uniquement pédagogique (mot-clé, explication Hanabira, traductions X).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import JpText from '@/components/JpText'
import { parseInlineReadings, type ReadingSegment } from '@/lib/inline-reading'
import { shuffledIndices } from '@/lib/dialogue-pages'
import type { GrammarPageData, KanjiPageData } from '@/lib/lesson-book'
import type { LessonQuizQuestion } from '@/lib/lesson-quiz'
import uiStrings from '@/data/ui-strings.json'
import { completeLesson } from './actions'
import { useAudioManager } from '@/lib/audio-manager'
import { lessonTrackForLesson } from '@/lib/audio-tracks'

export interface BookScreenLesson {
  zoneId: string
  sequenceIndex: number
  kanjiPages: KanjiPageData[]
  grammar: GrammarPageData | null
  /** null = relecture d'une leçon complétée (même écran, sans quiz). */
  quiz: LessonQuizQuestion[] | null
}

type Phase = 'book' | 'quiz' | 'saving' | 'done' | 'error'

/** Audio best-effort : fichier manquant ou lecteur indisponible → silence,
 * jamais un crash (l'icône est déjà désactivée quand la ref est nulle).
 *
 * `onDone` remonte la musique : sans ça, la piste de leçon couvrait la voix
 * qui prononce la phrase d'exemple (issue 13). Il est appelé à la fin, à
 * l'erreur, ET si la lecture ne démarre jamais — une musique restée baissée
 * pour toujours serait pire que le problème d'origine. */
function playAudio(src: string, onDone?: () => void) {
  try {
    const el = new Audio(src)
    if (onDone) {
      el.addEventListener('ended', onDone, { once: true })
      el.addEventListener('error', onDone, { once: true })
    }
    const p = el.play()
    if (p) p.catch(() => onDone?.())
    else onDone?.()
  } catch {
    onDone?.()
  }
}

/** Lecture kun affichée : okurigana entre parenthèses (ひと.つ → ひと（つ）). */
function formatKun(kun: string): string {
  const cleaned = kun.replace(/-/g, '')
  const dot = cleaned.indexOf('.')
  return dot === -1 ? cleaned : `${cleaned.slice(0, dot)}（${cleaned.slice(dot + 1)}）`
}

const AUDIO_ICON = '♪'

export default function BookScreen({ lesson }: { lesson: BookScreenLesson }) {
  const router = useRouter()
  const spreadCount = lesson.kanjiPages.length + (lesson.grammar ? 1 : 0)

  const [phase, setPhase] = useState<Phase>('book')
  const [pageIndex, setPageIndex] = useState(0)
  const [showReadings, setShowReadings] = useState(false)
  const [showEn, setShowEn] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [popup, setPopup] = useState<ReadingSegment | null>(null)

  const [quizIndex, setQuizIndex] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [wrongFlash, setWrongFlash] = useState(false)

  // Musique calme de l'écran-livre (PRD § Audio) — PAS l'OST HGSS (contexte
  // carte uniquement) : rotation de pistes libres de droits, choix
  // déterministe par leçon (voir audio-tracks.ts). Couche 'zone' : BookScreen
  // est une route à part, MapClient n'est jamais monté en même temps.
  const { setBgmLayer, duckBgm } = useAudioManager()
  useEffect(() => {
    const track = lessonTrackForLesson(lesson.zoneId, lesson.sequenceIndex)
    setBgmLayer('zone', { url: track, loop: true })
    return () => setBgmLayer('zone', null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.zoneId, lesson.sequenceIndex])

  const question = phase === 'quiz' ? (lesson.quiz?.[quizIndex] ?? null) : null
  // Mélange des choix À L'AFFICHAGE, re-tiré à chaque question ET à chaque
  // tentative — l'ordre stocké ne transparaît jamais (contrat § 8).
  const displayOrder = useMemo(
    () => (question ? shuffledIndices(question.choices.length) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [question, quizIndex, attempt]
  )

  const goToPage = useCallback((index: number) => {
    setPageIndex(index)
    setShowReadings(false)
    setShowEn(false)
    setPopup(null)
  }, [])

  const nextPage = useCallback(() => {
    if (pageIndex + 1 < spreadCount) {
      goToPage(pageIndex + 1)
    } else if (lesson.quiz) {
      setPhase('quiz')
    } else {
      setPhase('done') // relecture : pas de quiz, pas d'écriture
    }
  }, [pageIndex, spreadCount, lesson.quiz, goToPage])

  const finish = useCallback(() => {
    setPhase('saving')
    completeLesson(lesson.zoneId, lesson.sequenceIndex, new Date().getTimezoneOffset())
      .then(result => setPhase(result.completed ? 'done' : 'error'))
      .catch(() => setPhase('error'))
  }, [lesson.zoneId, lesson.sequenceIndex])

  const answer = useCallback(
    (choiceIndex: number) => {
      if (!question || !lesson.quiz) return
      if (choiceIndex === question.correct_index) {
        setWrongFlash(false)
        if (quizIndex + 1 < lesson.quiz.length) {
          setQuizIndex(quizIndex + 1)
          setAttempt(0)
        } else {
          finish()
        }
      } else {
        // Mauvaise réponse : on recommence la MÊME question (retry, jamais
        // de correction-puis-suite, jamais de skip)
        setWrongFlash(true)
        setAttempt(attempt + 1)
      }
    },
    [question, lesson.quiz, quizIndex, attempt, finish]
  )

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
          if (phase === 'book' && !confirmClose) {
            e.preventDefault()
            nextPage()
          }
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [requestClose, nextPage, phase, confirmClose])

  const spread: { kind: 'kanji'; data: KanjiPageData } | { kind: 'grammar'; data: GrammarPageData } | null =
    phase === 'book'
      ? pageIndex < lesson.kanjiPages.length
        ? { kind: 'kanji', data: lesson.kanjiPages[pageIndex] }
        : lesson.grammar
          ? { kind: 'grammar', data: lesson.grammar }
          : null
      : null

  const audioButton = (src: string | null, label: string, large = false) => (
    <button
      aria-label={label}
      disabled={src === null}
      onClick={e => {
        e.stopPropagation()
        if (src) playAudio(src, duckBgm())
      }}
      className={`${large ? 'w-9 h-9 text-lg' : 'w-7 h-7 text-sm'} shrink-0 rounded-full border-2 font-chrome ${
        src === null
          ? 'border-[#c9b489] text-[#c9b489] cursor-not-allowed'
          : 'border-[#7a5a33] text-[#7a5a33] hover:bg-[#7a5a33]/10 active:bg-[#7a5a33]/20'
      }`}
    >
      {AUDIO_ICON}
    </button>
  )

  /** Segments tapables (page grammaire) : tap sur un run à lecture → popup
   * lecture, dismiss en tapant ailleurs. */
  const tappableJp = (jp: string) => {
    const segments = parseInlineReadings(jp)
    return (
      <span lang="ja" className="jp-inline font-reading">
        {segments.map((seg, i) =>
          seg.reading !== undefined ? (
            <ruby
              key={i}
              className="cursor-pointer underline decoration-dotted decoration-[#a4452e]/50 underline-offset-4"
              onClick={e => {
                e.stopPropagation()
                setPopup(seg)
              }}
            >
              {seg.base}
              <rt>{showReadings ? seg.reading : ''}</rt>
            </ruby>
          ) : (
            <span key={i}>{seg.base}</span>
          )
        )}
      </span>
    )
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden book-chrome select-none flex items-center justify-center"
      onClick={() => setPopup(null)}
    >
      {/* ── Le livre ouvert ─────────────────────────────────────────────── */}
      {phase === 'book' && spread && (
        <div className="book-frame w-full max-w-3xl mx-3 my-4">
          <div className="flex items-stretch min-h-[19rem]">
            {spread.kind === 'kanji' ? (
              <>
                {/* Page gauche — identité */}
                <div className="book-page flex-1 rounded-l-sm p-4 flex flex-col items-center justify-center gap-2 text-center">
                  {spread.data.icon && <div className="text-3xl">{spread.data.icon}</div>}
                  <div className="flex items-center gap-3">
                    <div
                      data-testid="book-character"
                      lang="ja"
                      className="font-reading text-8xl leading-none"
                    >
                      {spread.data.character}
                    </div>
                    {audioButton(spread.data.audio, 'audio', true)}
                  </div>
                  <div lang="ja" className="font-reading book-accent text-xl">
                    {spread.data.onReadings.join('・')}
                  </div>
                  {spread.data.kunReadings.length > 0 && (
                    <div lang="ja" className="font-reading text-[#6b5433]">
                      {spread.data.kunReadings.map(formatKun).join('・')}
                    </div>
                  )}
                  {/* Mot-clé anglais : derrière le bouton X, comme toute autre
                      langue étrangère à l'écran (2026-08-06). Il était affiché
                      d'office — le seul mot d'anglais permanent du jeu, et
                      surtout la réponse au quiz qui suit, donnée avant la
                      question. Masqué, la double page ne montre plus que le
                      kanji et ses lectures : on tente le sens, puis on
                      vérifie. La place reste réservée (aucun saut de mise en
                      page au basculement) et l'espace réservé dit qu'il y a
                      quelque chose à révéler. */}
                  <div
                    data-testid="book-keyword"
                    className={`font-chrome text-lg tracking-wide ${
                      showEn ? 'text-[#3b2c1a]' : 'text-[#b3a184] select-none'
                    }`}
                  >
                    {showEn ? spread.data.keyword : '・・・・・・'}
                  </div>
                </div>
                <div className="book-spine" />
                {/* Page droite — usage */}
                <div className="book-page flex-1 rounded-r-sm p-4 flex flex-col justify-center gap-4">
                  {spread.data.examples.map((example, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {audioButton(example.audio, 'example-audio')}
                      <div className="min-w-0">
                        <JpText
                          jp={example.jp}
                          showReadings={showReadings}
                          className="font-reading text-lg leading-loose"
                        />
                        {showEn && example.en && (
                          <p className="text-sm text-[#6b5433] mt-0.5">{example.en}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Page gauche — le point (explication Hanabira, EN pédagogique) */}
                <div className="book-page flex-1 rounded-l-sm p-4 flex flex-col justify-center gap-3">
                  <h2 lang="ja" className="font-reading book-accent text-xl">
                    {spread.data.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-[#3b2c1a]">
                    {spread.data.shortExplanation}
                  </p>
                </div>
                <div className="book-spine" />
                {/* Page droite — exemples, segments tapables */}
                <div className="book-page flex-1 rounded-r-sm p-4 flex flex-col justify-center gap-4">
                  {spread.data.examples.map((example, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {audioButton(example.audio, 'example-audio')}
                      <div className="min-w-0 text-lg leading-loose">
                        {tappableJp(example.jp)}
                        {showEn && example.en && (
                          <p className="text-sm text-[#6b5433] mt-0.5">{example.en}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Coin bas : ◀ / compteur / ▶ (transition de page franche) */}
          <div className="flex items-center justify-between px-3 py-2">
            <button
              aria-label="prev"
              onClick={() => pageIndex > 0 && goToPage(pageIndex - 1)}
              className={`font-chrome text-xl px-2 ${pageIndex === 0 ? 'opacity-0 pointer-events-none' : 'text-[#e8d9b0] hover:text-white'}`}
            >
              ◀
            </button>
            <span className="font-chrome text-xs text-[#c9b489]">
              {pageIndex + 1}/{spreadCount}
            </span>
            <button
              aria-label="next"
              onClick={nextPage}
              className="font-chrome text-xl px-2 text-[#e8d9b0] hover:text-white"
            >
              ▶
            </button>
          </div>
        </div>
      )}

      {/* ── Mini-quiz (même carte de question que le combat, habillage livre) ─ */}
      {(phase === 'quiz' || phase === 'saving') && question && (
        <div className="book-frame w-full max-w-xl mx-3">
          <div className="book-page rounded-sm p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span lang="ja" className="font-chrome text-sm text-[#7a5a33]">
                {uiStrings.quiz_title.jp}
              </span>
              <span className="font-chrome text-xs text-[#7a5a33]">
                {quizIndex + 1}/{lesson.quiz?.length}
              </span>
            </div>
            <div className="text-center py-2">
              {question.kind === 'grammaire' ? (
                <JpText
                  jp={question.prompt}
                  showReadings={showReadings}
                  className="font-reading text-xl leading-loose"
                />
              ) : (
                <span lang="ja" className="font-reading text-7xl leading-none">
                  {question.prompt}
                </span>
              )}
            </div>
            {wrongFlash && (
              <p lang="ja" className="font-reading text-center book-accent">
                {uiStrings.quiz_retry.jp}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {displayOrder.map(i => (
                <button
                  key={`${attempt}-${i}`}
                  lang="ja"
                  disabled={phase === 'saving'}
                  onClick={e => {
                    e.stopPropagation()
                    answer(i)
                  }}
                  className="font-reading text-base px-3 py-2.5 rounded border-2 border-[#7a5a33] bg-[#fbf4e2] text-[#3b2c1a] hover:bg-[#f1e5c6] active:bg-[#e8d9b0] disabled:opacity-60"
                >
                  {question.choices[i]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Fin (le livre se referme) / erreur de sauvegarde ────────────── */}
      {phase === 'done' && (
        <div className="book-frame w-full max-w-md mx-3">
          <div className="book-page rounded-sm p-8 flex flex-col items-center gap-5">
            <p lang="ja" className="font-reading text-2xl">
              {uiStrings.lesson_done.jp}
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
              onClick={finish}
              className="font-chrome px-5 py-2.5 rounded border-2 border-[#7a5a33] text-[#3b2c1a] hover:bg-[#f1e5c6]"
            >
              {uiStrings.retry.jp}
            </button>
          </div>
        </div>
      )}

      {/* Popup de segment (palette du livre, dismiss en tapant ailleurs) */}
      {popup && (
        <div
          data-testid="segment-popup"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 book-page border-2 border-[#7a5a33] rounded px-4 py-2 shadow-lg"
          onClick={e => e.stopPropagation()}
        >
          <span lang="ja" className="font-reading text-lg">
            {popup.base}
          </span>
          <span lang="ja" className="font-reading book-accent text-sm ml-2">
            {popup.reading}
          </span>
        </div>
      )}

      {/* Boutons overlay Y / X / B (chrome console, comme la boîte de
          dialogue — X/Y n'ont d'effet que sur la page courante) */}
      <div className="fixed bottom-4 right-3 z-10 flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
        <div className="flex gap-2">
          <button
            aria-label="translation"
            onClick={() => setShowEn(v => !v)}
            className={`w-9 h-9 rounded-full border text-xs font-bold ${
              showEn ? 'bg-amber-400/90 border-amber-600 text-black' : 'bg-white/10 border-white/25 text-white/70'
            }`}
          >
            X
          </button>
          <button
            aria-label="readings"
            onClick={() => setShowReadings(v => !v)}
            className={`w-9 h-9 rounded-full border text-xs font-bold ${
              showReadings ? 'bg-amber-400/90 border-amber-600 text-black' : 'bg-white/10 border-white/25 text-white/70'
            }`}
          >
            Y
          </button>
        </div>
        <button
          aria-label="close"
          onClick={requestClose}
          className="w-11 h-11 rounded-full bg-white/10 active:bg-white/30 border border-white/25 text-white/80 font-bold"
        >
          B
        </button>
      </div>

      {/* Confirmation de fermeture (B) — reprise page 1, rien n'est retenu */}
      {confirmClose && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50" onClick={e => e.stopPropagation()}>
          <div className="book-page border-2 border-[#7a5a33] rounded p-5 mx-4 max-w-sm flex flex-col gap-4">
            <p lang="ja" className="font-reading">
              {uiStrings.lesson_close_confirm.jp}
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
