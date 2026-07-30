// Session SRS (issue 06) — jsdom, react-dom/client + act (outillage issue 01).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import StudyClient, { type SessionCard } from './StudyClient'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const pushMock = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const rateCardMock = vi.hoisted(() =>
  vi.fn(async () => ({ sessionDone: false, cardsPending: 1, reviewedToday: 1, path: null as 'session' | 'no_cards_due' | null }))
)
const checkDailyStatusMock = vi.hoisted(() =>
  vi.fn(async () => ({ sessionDone: true, cardsPending: 0, reviewedToday: 0, path: 'no_cards_due' }))
)
const continueSessionMock = vi.hoisted(() =>
  vi.fn(async () => ({
    cards: [] as unknown[],
    status: {
      sessionDone: true,
      cardsPending: 0,
      reviewedToday: 1,
      path: 'session' as 'session' | 'no_cards_due' | null,
    },
  }))
)
vi.mock('./actions', () => ({
  rateCard: rateCardMock,
  checkDailyStatus: checkDailyStatusMock,
  continueSession: continueSessionMock,
}))

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  pushMock.mockClear()
  rateCardMock.mockClear()
  checkDailyStatusMock.mockClear()
  continueSessionMock.mockClear()
  rateCardMock.mockResolvedValue({ sessionDone: false, cardsPending: 1, reviewedToday: 1, path: null })
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const kanjiCard = (over: Partial<SessionCard> = {}): SessionCard => ({
  id: 'c-1',
  item_type: 'kanji',
  item_id: '一',
  facet: 'sens',
  kanji: {
    keyword: 'one',
    meanings: ['one', 'one radical (no.1)'],
    on_readings: ['イチ', 'イツ'],
    kun_readings: ['ひと-', 'ひと.つ'],
    mnemonic: 'A single stroke.',
  },
  word: null,
  needs_preface: false,
  ...over,
})

const wordCard = (facet: 'sens' | 'lecture', over: Partial<SessionCard> = {}): SessionCard => ({
  id: `w-${facet}`,
  item_type: 'word',
  item_id: 'w-100',
  facet,
  kanji: null,
  word: { word: '一つ', reading: 'ひとつ', meanings: ['one (thing)'] },
  needs_preface: true,
  ...over,
})

function render(cards: SessionCard[], over: { reviewedToday?: number; key?: string } = {}) {
  act(() =>
    root.render(
      <StudyClient key={over.key} cards={cards} reviewedToday={over.reviewedToday ?? 0} />
    )
  )
}

const buttons = () => Array.from(container.querySelectorAll('button'))
const buttonByText = (text: string) => buttons().find(b => b.textContent === text)
const click = (b: HTMLButtonElement | undefined) => {
  expect(b).toBeDefined()
  act(() => b!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
}
const flush = () => act(async () => {})

describe('carte → Révéler → 4 notes', () => {
  it('facette SENS : kanji en grand (.font-reading), badge いみ, réponse masquée avant Révéler', () => {
    render([kanjiCard()])
    const char = container.querySelector('[data-testid="srs-character"]')!
    expect(char.textContent).toBe('一')
    expect(char.className).toContain('font-reading')
    expect(container.textContent).toContain('いみ')
    expect(container.textContent).toContain('いみは？')
    expect(container.textContent).not.toContain('one')
    expect(buttonByText('もういちど')).toBeUndefined()
  })

  it('Révéler (sens) : keyword prioritaire + meanings + 4 notes', () => {
    render([kanjiCard()])
    click(buttonByText('こたえを　みる'))
    expect(container.querySelector('[data-testid="srs-answer"]')!.textContent).toContain('one')
    expect(container.textContent).toContain('one radical (no.1)')
    for (const label of ['もういちど', 'むずかしい', 'できた', 'かんたん']) {
      expect(buttonByText(label)).toBeDefined()
    }
  })

  it('facette LECTURE : badge よみ, Révéler montre on/kun — jamais les meanings', () => {
    render([kanjiCard({ facet: 'lecture' })])
    expect(container.textContent).toContain('よみかたは？')
    click(buttonByText('こたえを　みる'))
    expect(container.textContent).toContain('イチ')
    expect(container.textContent).toContain('ひと')
    expect(container.querySelector('[data-testid="srs-answer"]')!.textContent).not.toContain(
      'radical'
    )
  })

  it('noter appelle rateCard (id, note, offset client) et passe à la carte suivante masquée', async () => {
    render([kanjiCard(), kanjiCard({ id: 'c-2', item_id: '二', facet: 'lecture' })])
    click(buttonByText('こたえを　みる'))
    click(buttonByText('できた'))
    await flush()
    expect(rateCardMock).toHaveBeenCalledWith('c-1', 3, new Date().getTimezoneOffset())
    // Carte suivante, à nouveau masquée
    expect(container.textContent).toContain('よみかたは？')
    expect(buttonByText('こたえを　みる')).toBeDefined()
    expect(buttonByText('もういちど')).toBeUndefined()
  })

  it('les 4 notes portent les valeurs FSRS 1..4', async () => {
    for (const [label, rating] of [
      ['もういちど', 1],
      ['むずかしい', 2],
      ['できた', 3],
      ['かんたん', 4],
    ] as const) {
      render([kanjiCard({ id: `c-${rating}` })], { key: `run-${rating}` })
      click(buttonByText('こたえを　みる'))
      click(buttonByText(label))
      await flush()
      expect(rateCardMock).toHaveBeenLastCalledWith(
        `c-${rating}`,
        rating,
        new Date().getTimezoneOffset()
      )
    }
  })
})

describe('fins de session', () => {
  it('file épuisée → écran ✓ « ふくしゅう おわり », retour carte', async () => {
    rateCardMock.mockResolvedValueOnce({
      sessionDone: true,
      cardsPending: 0,
      reviewedToday: 1,
      path: 'session',
    })
    render([kanjiCard()])
    click(buttonByText('こたえを　みる'))
    click(buttonByText('できた'))
    await flush()
    expect(container.textContent).toContain('きょうの　ふくしゅう　おわり！')
    click(buttonByText('マップへ　もどる'))
    expect(pushMock).toHaveBeenCalledWith('/map')
  })

  it('aucune carte due → ✓ immédiat : écran « カードが ないよ » + checkDailyStatus (pose le ✓ serveur)', async () => {
    render([])
    await flush()
    expect(container.textContent).toContain('きょうは　ふくしゅうする　カードが　ないよ')
    expect(checkDailyStatusMock).toHaveBeenCalledWith(new Date().getTimezoneOffset())
    expect(buttonByText('マップへ　もどる')).toBeDefined()
  })

  it('file épuisée avec des reviews déjà faites (reprise) → écran ✓ aussi', async () => {
    render([], { reviewedToday: 12 })
    await flush()
    expect(container.textContent).toContain('きょうの　ふくしゅう　おわり！')
  })
})

// M3 (revue jalon 1) : le statut serveur retourné par rateCard fait foi —
// la fin de la file LOCALE n'est pas la fin de la session. Une carte
// もういちど (learning steps courts ts-fsrs) redevenue due pendant la session
// fait partie de la file du jour : l'écran propose de CONTINUER (recharge la
// file serveur) au lieu d'afficher « session finie » à tort.
describe('M3 — Encore → continuer (le ✓ ne s’affiche que si le serveur dit sessionDone)', () => {
  it('file locale épuisée mais cardsPending ≥ 1 → PAS de ✓ ni d’« おわり », bouton continuer', async () => {
    rateCardMock.mockResolvedValue({ sessionDone: false, cardsPending: 1, reviewedToday: 1, path: null })
    render([kanjiCard()])
    click(buttonByText('こたえを　みる'))
    click(buttonByText('もういちど'))
    await flush()
    expect(container.textContent).not.toContain('きょうの　ふくしゅう　おわり！')
    expect(container.textContent).toContain('まだ　ふくしゅうする　カードが　あるよ')
    expect(container.textContent).not.toContain('✓')
    expect(buttonByText('ふくしゅうを　つづける')).toBeDefined()
  })

  it('continuer recharge la file serveur et re-présente la carte ratée', async () => {
    rateCardMock.mockResolvedValue({ sessionDone: false, cardsPending: 1, reviewedToday: 1, path: null })
    continueSessionMock.mockResolvedValue({
      cards: [kanjiCard({ id: 'c-1b', item_id: '一' })],
      status: { sessionDone: false, cardsPending: 1, reviewedToday: 1, path: null },
    })
    render([kanjiCard()])
    click(buttonByText('こたえを　みる'))
    click(buttonByText('もういちど'))
    await flush()
    click(buttonByText('ふくしゅうを　つづける'))
    await flush()
    expect(continueSessionMock).toHaveBeenCalledWith(new Date().getTimezoneOffset())
    // La carte re-due est re-présentée, réponse masquée
    expect(container.querySelector('[data-testid="srs-character"]')!.textContent).toBe('一')
    expect(buttonByText('こたえを　みる')).toBeDefined()
    // …et la re-noter passe par rateCard normalement
    click(buttonByText('こたえを　みる'))
    rateCardMock.mockResolvedValue({ sessionDone: true, cardsPending: 0, reviewedToday: 2, path: 'session' })
    click(buttonByText('できた'))
    await flush()
    expect(container.textContent).toContain('きょうの　ふくしゅう　おわり！')
    expect(container.textContent).toContain('✓')
  })

  it('la recharge peut dire « session finie » (✓ posé entre-temps) : écran ✓ direct', async () => {
    rateCardMock.mockResolvedValue({ sessionDone: false, cardsPending: 1, reviewedToday: 1, path: null })
    continueSessionMock.mockResolvedValue({
      cards: [],
      status: { sessionDone: true, cardsPending: 0, reviewedToday: 1, path: 'session' },
    })
    render([kanjiCard()])
    click(buttonByText('こたえを　みる'))
    click(buttonByText('もういちど'))
    await flush()
    click(buttonByText('ふくしゅうを　つづける'))
    await flush()
    expect(container.textContent).toContain('きょうの　ふくしゅう　おわり！')
  })
})

describe('préface Carte Mot (engine-contract § 8 — inactif au jalon 1, prévu et testé)', () => {
  it('première review d’un mot : la Carte Mot s’affiche d’abord, 1 tap → la carte', async () => {
    render([wordCard('sens')])
    // Préface : le mot, sa lecture, son sens — pas encore de Révéler
    expect(container.textContent).toContain('あたらしい　ことば！')
    expect(container.textContent).toContain('一つ')
    expect(container.textContent).toContain('ひとつ')
    expect(container.textContent).toContain('one (thing)')
    expect(buttonByText('こたえを　みる')).toBeUndefined()
    click(buttonByText('つづける'))
    // La vraie carte, réponse masquée
    expect(container.textContent).toContain('いみは？')
    expect(container.textContent).not.toContain('one (thing)')
    expect(buttonByText('こたえを　みる')).toBeDefined()
  })

  it('une seule fois : la 2e facette du même mot plus loin dans la file n’a pas de préface', async () => {
    render([wordCard('sens'), kanjiCard(), wordCard('lecture')])
    click(buttonByText('つづける'))
    click(buttonByText('こたえを　みる'))
    click(buttonByText('できた'))
    await flush()
    // kanji intermédiaire
    click(buttonByText('こたえを　みる'))
    click(buttonByText('できた'))
    await flush()
    // 2e facette du mot : directement la carte (une review du mot existe)
    expect(container.textContent).not.toContain('あたらしい　ことば！')
    expect(container.textContent).toContain('よみかたは？')
  })

  it('jamais de préface pour une carte kanji, ni pour un mot déjà reviewé', () => {
    render([kanjiCard(), wordCard('sens', { needs_preface: false })])
    expect(container.textContent).not.toContain('あたらしい　ことば！')
  })
})
