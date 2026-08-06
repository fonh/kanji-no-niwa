// Appel du mentor + badge Pokégear (issue 06) — jsdom, react-dom/client + act.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import DailyLoop, { MENTOR_CALL_SEEN_KEY } from './DailyLoop'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const pushMock = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const checkDailyStatusMock = vi.hoisted(() =>
  vi.fn(async () => ({ sessionDone: false, cardsPending: 12, reviewedToday: 0, path: null as 'session' | 'no_cards_due' | null }))
)
vi.mock('@/app/study/actions', () => ({
  checkDailyStatus: checkDailyStatusMock,
}))

let container: HTMLDivElement
let root: Root

// Node ≥22 expose un localStorage expérimental désactivé (--localstorage-file
// absent) qui masque celui de jsdom : on installe un fake en mémoire.
const lsStore = new Map<string, string>()
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => lsStore.get(k) ?? null,
    setItem: (k: string, v: string) => void lsStore.set(k, String(v)),
    removeItem: (k: string) => void lsStore.delete(k),
    clear: () => lsStore.clear(),
  },
})

const NOW = new Date('2026-07-31T09:00:00')
const dayKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  pushMock.mockClear()
  checkDailyStatusMock.mockClear()
  checkDailyStatusMock.mockResolvedValue({
    sessionDone: false,
    cardsPending: 12,
    reviewedToday: 0,
    path: null,
  })
  window.localStorage.clear()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function render(now: Date = NOW) {
  act(() => root.render(<DailyLoop now={() => new Date(now)} />))
}

const flush = () => act(async () => {})
const buttons = () => Array.from(container.querySelectorAll('button'))
const buttonByText = (text: string) => buttons().find(b => b.textContent?.includes(text))
const click = (b: HTMLButtonElement | undefined) => {
  expect(b).toBeDefined()
  act(() => b!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
}

describe('appel du mentor au premier lancement du jour', () => {
  it('cartes dues : sprite d’Elm + invite, はじめる → session (tz du client)', async () => {
    render()
    await flush()
    expect(container.textContent).toContain('ウツギはかせ')
    expect(container.textContent).toContain('ふくしゅうが　まってるよ')
    expect(container.querySelector('[data-testid="mentor-sprite"]')).not.toBeNull()
    click(buttonByText('はじめる'))
    expect(pushMock).toHaveBeenCalledWith(`/study?tz=${NOW.getTimezoneOffset()}`)
    // Le jour est marqué : les lancements suivants seront silencieux
    expect(window.localStorage.getItem(MENTOR_CALL_SEEN_KEY)).toBe(dayKeyOf(NOW))
  })

  it('aucune carte due : appel court « tout est en ordre », ✓ immédiat (checkDailyStatus a posé le ✓)', async () => {
    checkDailyStatusMock.mockResolvedValue({
      sessionDone: true,
      cardsPending: 0,
      reviewedToday: 0,
      path: 'no_cards_due',
    })
    render()
    await flush()
    expect(checkDailyStatusMock).toHaveBeenCalledWith(NOW.getTimezoneOffset())
    expect(container.textContent).toContain('ふくしゅう　なしだよ')
    click(buttonByText('わかった'))
    expect(container.textContent).not.toContain('ふくしゅう　なしだよ')
    // Badge ✓ sur l'icône Pokégear
    expect(container.querySelector('[data-testid="pokegear-badge"]')!.textContent).toBe('✓')
  })

  it('lancements suivants du même jour : silencieux (pas d’appel), badge de rappel si session non faite', async () => {
    window.localStorage.setItem(MENTOR_CALL_SEEN_KEY, dayKeyOf(NOW))
    render()
    await flush()
    expect(container.textContent).not.toContain('まってるよ')
    expect(container.querySelector('[data-testid="pokegear-badge"]')!.textContent).toBe('！')
  })

  it('bascule de jour : l’appel revient le lendemain', async () => {
    window.localStorage.setItem(MENTOR_CALL_SEEN_KEY, '2026-07-30')
    render(new Date('2026-07-31T00:05:00'))
    await flush()
    expect(container.textContent).toContain('まってるよ')
  })
})

describe('refus → relançable via l’entrée téléphone minimale', () => {
  it('あとで ferme l’appel ; Pokégear → でんわ → ウツギはかせ → invite à nouveau', async () => {
    render()
    await flush()
    click(buttonByText('あとで'))
    expect(container.textContent).not.toContain('まってるよ')
    // Badge de rappel sur l'icône
    expect(container.querySelector('[data-testid="pokegear-badge"]')!.textContent).toBe('！')

    click(buttonByText('ポケギア'))
    expect(container.textContent).toContain('でんわ')
    click(buttonByText('でんわ'))
    click(buttonByText('ウツギはかせ'))
    expect(container.textContent).toContain('まってるよ')
    click(buttonByText('はじめる'))
    expect(pushMock).toHaveBeenCalledWith(`/study?tz=${NOW.getTimezoneOffset()}`)
  })

  it('session faite : l’appel téléphonique répond « tout est en ordre »', async () => {
    checkDailyStatusMock.mockResolvedValue({
      sessionDone: true,
      cardsPending: 0,
      reviewedToday: 12,
      path: 'session',
    })
    window.localStorage.setItem(MENTOR_CALL_SEEN_KEY, dayKeyOf(NOW))
    render()
    await flush()
    expect(container.querySelector('[data-testid="pokegear-badge"]')!.textContent).toBe('✓')
    click(buttonByText('ポケギア'))
    click(buttonByText('でんわ'))
    click(buttonByText('ウツギはかせ'))
    expect(container.textContent).toContain('ふくしゅう　なしだよ')
  })
})

describe('les touches ne traversent pas l’overlay', () => {
  it('pendant l’appel, les flèches (mouvement MapClient) sont avalées', async () => {
    render()
    await flush()
    const spy = vi.fn()
    window.addEventListener('keydown', spy) // simule l'écouteur de MapClient (bubble)
    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { code: 'ArrowUp', bubbles: true, cancelable: true })
      )
    })
    expect(spy).not.toHaveBeenCalled()
    window.removeEventListener('keydown', spy)
  })
})
