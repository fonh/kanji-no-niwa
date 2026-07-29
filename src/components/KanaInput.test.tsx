// Composant KanaInput (issue 04) — jsdom, sans testing-library (react-dom/client
// + act, outillage de l'issue 01). La logique de conversion est testée hors DOM
// dans src/lib/kana-input.test.ts ; ici : câblage contrôlé, Enter, borne.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import KanaInput from './KanaInput'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

// Harnais contrôlé minimal — le parent réel (OnboardingClient, mode Saisie
// de l'issue 07) tient le state exactement comme ceci.
function Harness({ onSubmit, maxKana }: { onSubmit?: (v: string) => void; maxKana?: number }) {
  const [value, setValue] = useState('')
  return (
    <KanaInput
      value={value}
      onChange={setValue}
      onSubmit={onSubmit ? () => onSubmit(value) : undefined}
      maxKana={maxKana}
    />
  )
}

const input = () => container.querySelector('input') as HTMLInputElement

function type(text: string) {
  const el = input()
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setter.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('KanaInput', () => {
  it('vide par défaut, aucune suggestion', () => {
    act(() => root.render(<Harness />))
    expect(input().value).toBe('')
    expect(input().placeholder).toBe('')
  })

  it('convertit le romaji en kana au fil de la frappe', () => {
    act(() => root.render(<Harness />))
    type('kanji')
    expect(input().value).toBe('かんじ')
  })

  it("laisse le n en suspens pendant la frappe", () => {
    act(() => root.render(<Harness />))
    type('kan')
    expect(input().value).toBe('かn')
  })

  it('majuscules → katakana', () => {
    act(() => root.render(<Harness />))
    type('HIBIKI')
    expect(input().value).toBe('ヒビキ')
  })

  it('Enter déclenche onSubmit', () => {
    const onSubmit = vi.fn()
    act(() => root.render(<Harness onSubmit={onSubmit} />))
    type('ka')
    act(() => {
      input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('refuse la frappe au-delà de maxKana (sans couper une syllabe résolue)', () => {
    act(() => root.render(<Harness maxKana={3} />))
    type('kanji')
    expect(input().value).toBe('かんじ')
    type('かんじあ')
    expect(input().value).toBe('かんじ')
  })

  it("l'IME natif est désactivé (pas de double conversion)", () => {
    act(() => root.render(<Harness />))
    expect(input().getAttribute('autocomplete')).toBe('off')
    expect(input().getAttribute('spellcheck')).toBe('false')
  })
})
