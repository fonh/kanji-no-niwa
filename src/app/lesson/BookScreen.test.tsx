// Écran-livre (issue 05) — jsdom, react-dom/client + act (outillage issue 01).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import kanjiContent from '@/data/kanji-content.json'
import { getGrammarPoint, getGrammarSourceEntry, getLessonsForZone } from '@/lib/content'
import { buildGrammarPage, buildKanjiPages } from '@/lib/lesson-book'
import type { KanjiContentMap } from '@/lib/lesson-quiz'
import type { LessonQuizQuestion } from '@/lib/lesson-quiz'
import BookScreen, { type BookScreenLesson } from './BookScreen'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const pushMock = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const completeLessonMock = vi.hoisted(() =>
  vi.fn(async () => ({ completed: true }))
)
vi.mock('./actions', () => ({
  completeLesson: completeLessonMock,
}))

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  pushMock.mockClear()
  completeLessonMock.mockClear()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const content = kanjiContent as KanjiContentMap
const lesson1 = getLessonsForZone('new-bark-town')[0]
const point = getGrammarPoint('new-bark-town', 'N5-001')!
const grammarPage = buildGrammarPage(point, getGrammarSourceEntry(point))

const QUIZ: LessonQuizQuestion[] = [
  { kind: 'sens', prompt: '一', choices: ['one', 'two', 'three', 'four'], correct_index: 0 },
  {
    kind: 'grammaire',
    prompt: 'この中（なか）で、寿司（すし）が＿＿好（す）きです。',
    choices: ['いちばん', 'もっと', 'あまり', 'ぜんぜん'],
    correct_index: 0,
  },
]

function makeLesson(overrides: Partial<BookScreenLesson> = {}): BookScreenLesson {
  return {
    zoneId: 'new-bark-town',
    sequenceIndex: 1,
    kanjiPages: buildKanjiPages(lesson1.kanji_ids, content),
    grammar: grammarPage,
    quiz: QUIZ,
    ...overrides,
  }
}

function render(lesson: BookScreenLesson) {
  act(() => root.render(<BookScreen lesson={lesson} />))
}

const buttons = () => Array.from(container.querySelectorAll('button'))
const buttonByLabel = (label: string) =>
  buttons().find(b => b.getAttribute('aria-label') === label)
const buttonByText = (text: string) => buttons().find(b => b.textContent === text)
const click = (b: HTMLButtonElement | undefined) => {
  expect(b).toBeDefined()
  act(() => b!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
}

const turnPagesToQuiz = (spreads: number) => {
  for (let i = 0; i < spreads; i++) click(buttonByLabel('next'))
}

describe('double page kanji', () => {
  it('gauche : caractère très grand, mot-clé anglais, lecture ; droite : exemples', () => {
    render(makeLesson())
    expect(container.querySelector('[data-testid="book-character"]')!.textContent).toBe('一')
    expect(container.textContent).toContain('one') // keyword ?? meanings[0]
    expect(container.textContent).toContain('イチ')
    expect(container.textContent).toContain('一緒に') // lesson_examples[0] (source: tatoeba)
  })

  it('lectures inline des exemples masquées par défaut, Y les révèle', () => {
    render(makeLesson())
    const rts = () => Array.from(container.querySelectorAll('rt')).map(rt => rt.textContent)
    expect(container.textContent).not.toContain('いっしょ')
    expect(rts().every(t => t === '')).toBe(true)
    click(buttonByLabel('readings'))
    expect(rts().some(t => t === 'いっしょ')).toBe(true)
  })

  it('bouton audio actif si audio présent, désactivé sinon — jamais un crash', () => {
    render(makeLesson())
    expect(buttonByLabel('audio')!.disabled).toBe(false)
    render(
      makeLesson({
        kanjiPages: [{ ...buildKanjiPages(['一'], content)[0], audio: null, examples: [] }],
      })
    )
    expect(buttonByLabel('audio')!.disabled).toBe(true)
  })
})

describe('navigation du livre', () => {
  it('▶ tourne les 6 doubles pages kanji, puis la page grammaire, puis le quiz', () => {
    render(makeLesson())
    for (let i = 1; i < 6; i++) {
      click(buttonByLabel('next'))
      expect(container.querySelector('[data-testid="book-character"]')!.textContent).toBe(
        lesson1.kanji_ids[i]
      )
    }
    click(buttonByLabel('next'))
    expect(container.textContent).toContain('superlative') // page grammaire (EN Hanabira)
    click(buttonByLabel('next'))
    expect(container.textContent).toContain('ふくしゅうクイズ')
  })

  it('segments tapables de la page grammaire : popup lecture', () => {
    render(makeLesson())
    turnPagesToQuiz(6) // → grammaire
    const ruby = Array.from(container.querySelectorAll('ruby')).find(r =>
      r.textContent!.includes('寿司')
    )
    expect(ruby).toBeDefined()
    act(() => ruby!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(container.querySelector('[data-testid="segment-popup"]')!.textContent).toContain('すし')
  })
})

describe('mini-quiz', () => {
  it('mauvaise réponse → on recommence la même question ; pas de skip', () => {
    render(makeLesson())
    turnPagesToQuiz(7)
    expect(buttonByLabel('next')).toBeUndefined() // pas de skip
    click(buttonByText('two'))
    expect(container.textContent).toContain('ざんねん・・・　もういちど！')
    expect(container.textContent).toContain('一') // même question
    expect(completeLessonMock).not.toHaveBeenCalled()
  })

  it('bonne réponse → question suivante ; dernière → completeLesson puis écran de fin', async () => {
    render(makeLesson())
    turnPagesToQuiz(7)
    click(buttonByText('one'))
    expect(container.textContent).toContain('＿＿') // question grammaire
    click(buttonByText('いちばん'))
    await act(async () => {})
    expect(completeLessonMock).toHaveBeenCalledWith('new-bark-town', 1, expect.any(Number))
    expect(container.textContent).toContain('レッスン　おわり！')
    click(buttonByText('マップへ　もどる'))
    expect(pushMock).toHaveBeenCalledWith('/map')
  })

  it('les choix affichés sont re-mélangés (l’ordre stocké ne transparaît pas toujours)', () => {
    // Sur plusieurs rendus, la première position affichée doit varier —
    // proba d'échec ≈ (1/4)^40
    const seen = new Set<string>()
    for (let i = 0; i < 40 && seen.size < 2; i++) {
      act(() => root.unmount())
      root = createRoot(container)
      render(makeLesson())
      turnPagesToQuiz(7)
      const choiceButtons = buttons().filter(b => QUIZ[0].choices.includes(b.textContent ?? ''))
      seen.add(choiceButtons[0].textContent ?? '')
    }
    expect(seen.size).toBeGreaterThan(1)
  })
})

describe('relecture (leçon complétée) : même écran sans quiz', () => {
  it('après la dernière page, fin directe sans completeLesson', () => {
    render(makeLesson({ quiz: null }))
    turnPagesToQuiz(7)
    expect(container.textContent).not.toContain('ふくしゅうクイズ')
    expect(container.textContent).toContain('レッスン　おわり！')
    expect(completeLessonMock).not.toHaveBeenCalled()
  })
})

describe('fermeture (B)', () => {
  it('B ouvre une confirmation ; はい ferme vers la carte, いいえ reste', () => {
    render(makeLesson())
    click(buttonByLabel('close'))
    expect(container.textContent).toContain('レッスンを　やめる？')
    click(buttonByText('いいえ'))
    expect(container.textContent).not.toContain('レッスンを　やめる？')
    expect(pushMock).not.toHaveBeenCalled()
    click(buttonByLabel('close'))
    click(buttonByText('はい'))
    expect(pushMock).toHaveBeenCalledWith('/map')
  })
})
