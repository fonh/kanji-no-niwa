// Écran-titre — « presse START » (issue 04). jsdom, navigation mockée.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

import StartPrompt from './StartPrompt'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.clearAllMocks()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<StartPrompt destination="/map" />))
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('StartPrompt', () => {
  it('affiche l’invite en japonais, sans latin', () => {
    expect(container.textContent).toContain('スタートを　おしてね')
    expect(container.textContent).not.toMatch(/[A-Za-z]/)
  })

  it('un tap déclenche la navigation vers la destination', () => {
    const button = container.querySelector('button') as HTMLButtonElement
    act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(push).toHaveBeenCalledWith('/map')
  })

  it('Enter (touche START clavier) déclenche aussi la navigation', () => {
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })
    expect(push).toHaveBeenCalledWith('/map')
  })
})
