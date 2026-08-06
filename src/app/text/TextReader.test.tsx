// Fenêtre de lecture des textes progressifs (issue 08) — jsdom,
// react-dom/client + act (outillage issue 01, mêmes conventions que
// BookScreen.test.tsx).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import uiStrings from '@/data/ui-strings.json'
import TextReader, { type TextReaderData } from './TextReader'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const pushMock = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const completeTextMock = vi.hoisted(() =>
  vi.fn(async () => ({ completed: true, gold: false }))
)
vi.mock('./actions', () => ({
  completeText: completeTextMock,
}))

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  pushMock.mockClear()
  completeTextMock.mockClear()
  completeTextMock.mockResolvedValue({ completed: true, gold: false })
  sessionStorage.clear()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

// Texte synthétique avec lectures inline et answer_span (les textes du jalon
// n'ont pas de span : la mécanique doit être testée quand même).
const JP = '庭（にわ）は　ひろい。はなが　さいて　いる。'
function makeData(overrides: Partial<TextReaderData> = {}): TextReaderData {
  return {
    textId: 'lyra_mail_new_bark',
    titleJp: 'コハルからの　メール',
    jpText: JP,
    enText: 'The garden is wide. Flowers are blooming.',
    docKind: 'letter',
    questions: [
      {
        promptJp: 'にわは　どうですか。',
        options: [
          { jp: 'ひろい', en: 'Wide' },
          { jp: 'せまい', en: 'Narrow' },
          { jp: 'くらい', en: 'Dark' },
          { jp: 'たかい', en: 'Tall' },
        ],
        correctIndex: 0,
        answerSpan: { start: 0, end: 10 },
      },
      {
        promptJp: 'なにが　さいて　いますか。',
        options: [
          { jp: 'はな', en: 'Flowers' },
          { jp: 'き', en: 'Trees' },
          { jp: 'くさ', en: 'Grass' },
          { jp: 'ゆき', en: 'Snow' },
        ],
        correctIndex: 0,
        answerSpan: null,
      },
    ],
    ...overrides,
  }
}

function render(data: TextReaderData) {
  act(() => root.render(<TextReader data={data} />))
}

const buttons = () => Array.from(container.querySelectorAll('button'))
const buttonByLabel = (label: string) =>
  buttons().find(b => b.getAttribute('aria-label') === label)
const buttonByText = (text: string) => buttons().find(b => b.textContent === text)
const click = (b: HTMLButtonElement | undefined) => {
  expect(b).toBeDefined()
  act(() => b!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
}
const flush = async () => {
  await act(async () => {})
}

const textPanel = () => container.querySelector('[data-testid="text-panel"]')
const startQuiz = () => click(buttonByText(uiStrings.text_quiz_start.jp))
/** Répond à la question courante par le libellé jp d'une option. */
const answerWith = (jp: string) => click(buttonByText(jp))

describe('fenêtre de lecture', () => {
  it('rend le texte jp lectures masquées ; Y les révèle ; X la traduction', () => {
    render(makeData())
    expect(container.textContent).toContain('庭')
    expect(container.textContent).not.toContain('にわ）') // pas de fuite du source brut
    const rts = Array.from(container.querySelectorAll('rt'))
    expect(rts.length).toBeGreaterThan(0)
    expect(rts.every(rt => rt.textContent === '')).toBe(true)
    expect(container.textContent).not.toContain('The garden is wide')

    click(buttonByLabel('readings'))
    expect(Array.from(container.querySelectorAll('rt')).some(rt => rt.textContent === 'にわ')).toBe(true)

    click(buttonByLabel('translation'))
    expect(container.textContent).toContain('The garden is wide')
  })

  it('texture selon le type de document (letter/sign/scroll)', () => {
    render(makeData({ docKind: 'letter' }))
    expect(container.querySelector('.text-doc-letter')).not.toBe(null)
    render(makeData({ docKind: 'sign' }))
    expect(container.querySelector('.text-doc-sign')).not.toBe(null)
    render(makeData({ docKind: 'scroll' }))
    expect(container.querySelector('.text-doc-scroll')).not.toBe(null)
  })
})

describe('quiz obligatoire (retry-jusqu\'à-correct)', () => {
  it('le texte RESTE consultable pendant le quiz (vue partagée)', () => {
    render(makeData())
    startQuiz()
    expect(container.textContent).toContain('にわは　どうですか。')
    expect(textPanel()).not.toBe(null)
    expect(textPanel()!.textContent).toContain('庭')
  })

  it('les 4 choix sont affichés ; mauvaise réponse → MÊME question + message retry', () => {
    render(makeData())
    startQuiz()
    for (const jp of ['ひろい', 'せまい', 'くらい', 'たかい']) {
      expect(buttonByText(jp)).toBeDefined()
    }
    answerWith('せまい')
    expect(container.textContent).toContain(uiStrings.quiz_retry.jp)
    expect(container.textContent).toContain('にわは　どうですか。')
  })

  it('bonne réponse → question suivante', () => {
    render(makeData())
    startQuiz()
    answerWith('ひろい')
    expect(container.textContent).toContain('なにが　さいて　いますか。')
    expect(container.textContent).not.toContain(uiStrings.quiz_retry.jp)
  })

  it('scaffolding : 2ᵉ échec sur une question à answer_span → passage surligné', () => {
    render(makeData())
    startQuiz()
    expect(container.querySelector('[data-testid="scaffold-highlight"]')).toBe(null)
    answerWith('せまい')
    expect(container.querySelector('[data-testid="scaffold-highlight"]')).toBe(null)
    answerWith('くらい')
    const mark = container.querySelector('[data-testid="scaffold-highlight"]')
    expect(mark).not.toBe(null)
    expect(mark!.textContent).toContain('庭')
    expect(mark!.textContent).toContain('は')
    // le passage se referme une fois la question franchie
    answerWith('ひろい')
    expect(container.querySelector('[data-testid="scaffold-highlight"]')).toBe(null)
  })

  it('jamais de scaffolding sans answer_span (question 2)', () => {
    render(makeData())
    startQuiz()
    answerWith('ひろい')
    answerWith('き')
    answerWith('くさ')
    answerWith('ゆき')
    expect(container.querySelector('[data-testid="scaffold-highlight"]')).toBe(null)
  })
})

describe('complétion (blanc/doré)', () => {
  it('passe sans faute → completeText(score 100, flawless) et écran doré', async () => {
    completeTextMock.mockResolvedValue({ completed: true, gold: true })
    render(makeData())
    startQuiz()
    answerWith('ひろい')
    answerWith('はな')
    await flush()
    expect(completeTextMock).toHaveBeenCalledWith('lyra_mail_new_bark', 100, true)
    expect(container.textContent).toContain(uiStrings.text_gold_done.jp)
  })

  it('une erreur → score première-tentative (50) et non-flawless, écran blanc', async () => {
    render(makeData())
    startQuiz()
    answerWith('ひろい')
    answerWith('き') // raté...
    answerWith('はな') // ...puis réussi
    await flush()
    expect(completeTextMock).toHaveBeenCalledWith('lyra_mail_new_bark', 50, false)
    expect(container.textContent).toContain(uiStrings.text_read_done.jp)
    expect(container.textContent).not.toContain(uiStrings.text_gold_done.jp)
  })
})

describe('B : fermeture avec confirmation, reprise dans la même session', () => {
  it('B ouvre la confirmation ; いいえ reste, はい retourne à la carte', () => {
    render(makeData())
    click(buttonByLabel('close'))
    expect(container.textContent).toContain(uiStrings.text_close_confirm.jp)
    click(buttonByText(uiStrings.no.jp))
    expect(pushMock).not.toHaveBeenCalled()
    click(buttonByLabel('close'))
    click(buttonByText(uiStrings.yes.jp))
    expect(pushMock).toHaveBeenCalledWith('/map')
  })

  it('réouverture dans la même session : le quiz reprend à la question courante', () => {
    render(makeData())
    startQuiz()
    answerWith('ひろい') // question 1 franchie
    // fermeture (unmount) puis réouverture — sessionStorage porte la reprise
    act(() => root.unmount())
    container.remove()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    render(makeData())
    // reprise directement en phase quiz, question 2
    expect(container.textContent).toContain('なにが　さいて　いますか。')
    expect(textPanel()).not.toBe(null)
  })

  it('un quiz fini ne laisse pas de reprise fantôme', async () => {
    render(makeData())
    startQuiz()
    answerWith('ひろい')
    answerWith('はな')
    await flush()
    act(() => root.unmount())
    container.remove()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    render(makeData())
    // relecture : on repart de la phase lecture, quiz remélangé au lancement
    expect(buttonByText(uiStrings.text_quiz_start.jp)).toBeDefined()
  })
})
