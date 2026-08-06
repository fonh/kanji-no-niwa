// Flux d'onboarding côté client (issue 04) : avatar → nom → action serveur →
// carte. jsdom sans testing-library ; navigation et action serveur mockées.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

const completeOnboarding = vi.fn<(avatar: string, name: string) => Promise<void>>(async () => {})
vi.mock('./actions', () => ({
  completeOnboarding: (avatar: string, name: string) => completeOnboarding(avatar, name),
}))

import OnboardingClient from './OnboardingClient'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.clearAllMocks()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<OnboardingClient />))
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const buttons = () => Array.from(container.querySelectorAll('button'))
const buttonByText = (text: string) =>
  buttons().find(b => (b.textContent ?? '').includes(text)) as HTMLButtonElement

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

function typeName(text: string) {
  const el = container.querySelector('input') as HTMLInputElement
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setter.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function flush() {
  await act(async () => {})
}

describe('OnboardingClient', () => {
  it("étape 1 : choix d'avatar, libellés japonais, aucun latin affiché", () => {
    expect(container.textContent).toContain('おとこのこ')
    expect(container.textContent).toContain('おんなのこ')
    expect(container.textContent).not.toMatch(/[A-Za-z]/)
  })

  it("étape 2 : la saisie du nom s'affiche après le choix, en .font-reading, sans latin", () => {
    click(buttonByText('おとこのこ'))
    expect(container.textContent).toContain('きみの　なまえは？')
    const input = container.querySelector('input') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.value).toBe('')
    expect(input.className).toContain('font-reading')
    expect(container.textContent).not.toMatch(/[A-Za-z]/)
  })

  it('けってい inactif tant que le nom finalisé n’est pas un kana valide', () => {
    click(buttonByText('おんなのこ'))
    expect(buttonByText('けってい').disabled).toBe(true)
    typeName('katt') // reste latin après finalisation → toujours inactif
    expect(buttonByText('けってい').disabled).toBe(true)
    typeName('kotone')
    expect(buttonByText('けってい').disabled).toBe(false)
  })

  it("parcours complet : avatar + nom (n final résolu) → action serveur → carte", async () => {
    click(buttonByText('おとこのこ'))
    typeName('ken') // affiché けn, finalisé けん à la validation
    click(buttonByText('けってい'))
    await flush()
    expect(completeOnboarding).toHaveBeenCalledWith('ethan', 'けん')
    expect(push).toHaveBeenCalledWith('/map')
  })

  it('もどる revient au choix d’avatar', () => {
    click(buttonByText('おんなのこ'))
    click(buttonByText('もどる'))
    expect(container.textContent).toContain('おとこのこ？　おんなのこ？')
    expect(container.querySelector('input')).toBeNull()
  })

  it("échec de l'action : message japonais, pas de navigation", async () => {
    completeOnboarding.mockRejectedValueOnce(new Error('down'))
    click(buttonByText('おとこのこ'))
    typeName('hibiki')
    click(buttonByText('けってい'))
    await flush()
    expect(push).not.toHaveBeenCalled()
    expect(container.textContent).toContain('セーブできませんでした')
    expect(container.textContent).not.toMatch(/[A-Za-z]/)
  })
})
