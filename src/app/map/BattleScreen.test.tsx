// Écran de combat (issue 07) — jsdom, react-dom/client + act.
//
// Contrat PRD § Système de Combat : intro (accroche battle_intro) →
// questions ; mauvaise réponse = correction affichée puis question suivante
// (JAMAIS de retry), vie perdue ; N-ième erreur fatale → écran de défaite ;
// victoire → post_battle + winBattle ; B inerte, aucun abandon ; l'état vit
// client (rien n'est persisté ici). Choix re-mélangés à l'affichage
// (contrat § 8).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { BattleQuestion } from '@/lib/battle'
import type { TrainerBattleStart } from './battle-actions'
import BattleScreen from './BattleScreen'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const winBattleMock = vi.hoisted(() =>
  vi.fn(async () => ({ name: 'あかいかみの　おとこのこ', pages: [{ jp: 'ふん。' }] }))
)
vi.mock('./battle-actions', () => ({ winBattle: winBattleMock }))

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  winBattleMock.mockClear()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const SENS_Q: BattleQuestion = {
  mode: 'sens',
  item: '一',
  choices: ['one', 'two', 'three', 'four'],
  correct_index: 0,
}
const LECTURE_Q: BattleQuestion = {
  mode: 'lecture',
  item: '二',
  choices: ['に', 'いち', 'さん', 'よん'],
  correct_index: 0,
}
const SAISIE_Q: BattleQuestion = {
  mode: 'saisie',
  item: '一',
  prompt_en: 'one',
  accepted: ['いち', 'ひとつ', 'ひと'],
}
const COMPOSITION_Q: BattleQuestion = {
  mode: 'composition',
  tiles: ['円', '一', '人', '十'],
  word: '一人',
  reading: 'ひとり',
}

function makeBattle(questions: BattleQuestion[], lives = 2): TrainerBattleStart {
  return {
    kind: 'battle',
    trainer_id: 'silver_apparition1_cherrygrove',
    trainer_name_jp: 'あかいかみの　おとこのこ',
    battle_sprite: null,
    player_back_sprite: '/sprites/characters/player_back/ethan_back_sheet.png',
    intro_pages: [{ jp: 'おまえが　あたらしい　こぞうか。' }],
    lives,
    questions,
  }
}

const onFinish = vi.fn()

function render(battle: TrainerBattleStart, extra: Record<string, unknown> = {}) {
  onFinish.mockClear()
  act(() =>
    root.render(
      <BattleScreen
        battle={battle}
        onFinish={onFinish}
        pacing={{ transitionMs: 0, vsMs: 0, feedbackMs: 0, typewriterMsPerChar: 0 }}
        {...extra}
      />
    )
  )
}

function click(el: Element | null | undefined) {
  expect(el).toBeTruthy()
  act(() => el!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
}

function buttonWithText(text: string): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find(b =>
    (b.textContent ?? '').includes(text)
  )
}

/** Passe l'accroche battle_intro (tap = A, pages avancées jusqu'aux questions). */
function skipIntro() {
  for (let i = 0; i < 10 && container.querySelector('.dialogue-frame'); i++) {
    click(container.querySelector('.dialogue-frame'))
  }
}

describe('BattleScreen', () => {
  it('accroche battle_intro affichée, puis la première question', () => {
    render(makeBattle([SENS_Q, LECTURE_Q]))
    expect(container.textContent).toContain('おまえが　あたらしい　こぞうか。')
    expect(container.textContent).not.toContain('いみは？')
    skipIntro()
    expect(container.textContent).toContain('いみは？')
    expect(container.textContent).toContain('一')
  })

  it('les choix affichés sont re-mélangés (jamais l’ordre stocké)', () => {
    // rng constant à 0 → shuffledIndices(4) = [1, 2, 3, 0]
    render(makeBattle([SENS_Q, LECTURE_Q]), { displayRng: () => 0 })
    skipIntro()
    const labels = Array.from(container.querySelectorAll('button[data-choice]')).map(
      b => b.textContent
    )
    expect(labels).toEqual(['two', 'three', 'four', 'one'])
  })

  it('bonne réponse : barre adverse entamée, question suivante, aucune vie perdue', () => {
    render(makeBattle([SENS_Q, LECTURE_Q]))
    skipIntro()
    click(buttonWithText('one'))
    expect(container.textContent).toContain('よみかたは？')
    const player = container.querySelector('[data-testid="hp-player"] > div') as HTMLElement
    const opponent = container.querySelector('[data-testid="hp-opponent"] > div') as HTMLElement
    expect(player.style.width).toBe('100%')
    expect(opponent.style.width).toBe('50%')
  })

  it('mauvaise réponse : correction affichée (bonne option surlignée), vie perdue, puis question suivante — jamais de retry', () => {
    vi.useFakeTimers()
    try {
      render(makeBattle([SENS_Q, LECTURE_Q]), {
        pacing: { transitionMs: 0, vsMs: 0, feedbackMs: 1500, typewriterMsPerChar: 0 },
      })
      skipIntro()
      click(buttonWithText('two'))
      // pendant la correction : la bonne réponse est marquée, rien n'avance
      const correct = buttonWithText('one')
      expect(correct?.getAttribute('data-feedback')).toBe('correct')
      expect(buttonWithText('two')?.getAttribute('data-feedback')).toBe('wrong')
      expect(container.textContent).toContain('いみは？')
      // re-cliquer pendant la correction ne fait rien (pas de retry)
      click(buttonWithText('one'))
      act(() => vi.advanceTimersByTime(1500))
      expect(container.textContent).toContain('よみかたは？')
      const player = container.querySelector('[data-testid="hp-player"] > div') as HTMLElement
      expect(player.style.width).toBe('50%') // 2 vies → 1/2 perdue
    } finally {
      vi.useRealTimers()
    }
  })

  it('la N-ième erreur est fatale : écran de défaite, retour carte, winBattle jamais appelé', () => {
    render(makeBattle([SENS_Q, LECTURE_Q, SENS_Q]))
    skipIntro()
    click(buttonWithText('two')) // erreur 1
    click(buttonWithText('いち')) // erreur 2 → défaite (2 vies)
    expect(container.textContent).toContain('めのまえが　まっくらに　なった・・・')
    expect(winBattleMock).not.toHaveBeenCalled()
    click(buttonWithText('マップへ　もどる'))
    expect(onFinish).toHaveBeenCalledWith({ won: false })
  })

  it('victoire : winBattle appelé avec les stats, post_battle affiché, onFinish({won:true})', async () => {
    render(makeBattle([SENS_Q, LECTURE_Q]))
    skipIntro()
    click(buttonWithText('one'))
    click(buttonWithText('いち')) // mauvaise (correct = に)… non : いち est un distracteur
    // → 1 erreur sur 2, il reste une vie : victoire quand même
    await act(async () => {})
    expect(winBattleMock).toHaveBeenCalledWith('silver_apparition1_cherrygrove', {
      lives_lost: 1,
      modes_used: ['sens', 'lecture'],
      accuracy: 0.5,
    })
    expect(container.textContent).toContain('ふん。')
    skipIntro() // referme le post_battle
    expect(onFinish).toHaveBeenCalledWith({ won: true })
  })

  it('mode Saisie : KanaInput, accepte on OU kun, refuse le reste', () => {
    render(makeBattle([SAISIE_Q, SENS_Q]))
    skipIntro()
    expect(container.textContent).toContain('one')
    expect(container.textContent).toContain('よみを　にゅうりょくしてね')
    const input = container.querySelector('input') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    act(() => {
      setter.call(input, 'ichi')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(input.value).toBe('いち')
    click(buttonWithText('けってい'))
    expect(container.textContent).toContain('いみは？') // question suivante
    const player = container.querySelector('[data-testid="hp-player"] > div') as HTMLElement
    expect(player.style.width).toBe('100%')
  })

  it('mode Composition : 2 tiles dans l’ordre ; mauvais ordre = erreur avec correction', () => {
    vi.useFakeTimers()
    try {
      render(makeBattle([COMPOSITION_Q, SENS_Q]), {
        pacing: { transitionMs: 0, vsMs: 0, feedbackMs: 1500, typewriterMsPerChar: 0 },
      })
      skipIntro()
      expect(container.textContent).toContain('２まいで　ことばを　つくってね')
      // mauvais ordre : 人 puis 一
      click(buttonWithText('人'))
      click(buttonWithText('一'))
      click(buttonWithText('けってい'))
      // correction : le mot attendu et sa lecture sont montrés
      const correction = container.querySelector('[data-testid="correction"]')
      expect(correction?.textContent).toContain('一人')
      expect(correction?.textContent).toContain('ひとり')
      act(() => vi.advanceTimersByTime(1500))
      expect(container.textContent).toContain('いみは？')
      const player = container.querySelector('[data-testid="hp-player"] > div') as HTMLElement
      expect(player.style.width).toBe('50%')
    } finally {
      vi.useRealTimers()
    }
  })

  it('B / Escape inertes : impossible d’abandonner un combat', () => {
    render(makeBattle([SENS_Q, LECTURE_Q]))
    skipIntro()
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }))
    })
    expect(container.textContent).toContain('いみは？')
    expect(onFinish).not.toHaveBeenCalled()
  })
})
