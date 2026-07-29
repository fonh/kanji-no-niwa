// Composant boîte de dialogue (issue 03) — jsdom, sans testing-library
// (react-dom/client + act, seul outillage configuré à l'issue 01).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { act, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import DialogueBox, { type DialogueBoxHandle } from './DialogueBox'
import { attachCompanionOptions, type CompanionRosterEntry } from '@/lib/dialogue-pages'
import type { DialogueFile, DialoguePageEntry } from '@/lib/content'

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
  vi.useRealTimers()
})

interface RenderProps {
  name?: string
  pages: DialoguePageEntry[]
  onClose?: () => void
  onChooseCompanion?: (id: string) => void | Promise<void>
  typewriterMsPerChar?: number
}

function render(props: RenderProps) {
  const ref = createRef<DialogueBoxHandle>()
  act(() =>
    root.render(
      <DialogueBox
        ref={ref}
        name={props.name ?? 'エルムはかせ'}
        pages={props.pages}
        onClose={props.onClose ?? (() => {})}
        onChooseCompanion={props.onChooseCompanion}
        typewriterMsPerChar={props.typewriterMsPerChar ?? 0}
      />
    )
  )
  return ref
}

const buttons = () => Array.from(container.querySelectorAll('button'))
const buttonByText = (text: string) => buttons().find(b => b.textContent === text)

const TWO_PAGES: DialoguePageEntry[] = [
  { jp: '今日（きょう）は　あついですね。', en: "It's hot today, isn't it." },
  { jp: 'また　バトルしようね！', en: 'Let’s battle again sometime!' },
]

describe('DialogueBox — rendu par défaut', () => {
  it('affiche le jp sans lectures ni anglais (jamais d’office)', () => {
    render({ pages: TWO_PAGES })
    expect(container.textContent).toContain('今日は　あついですね。')
    expect(container.textContent).not.toContain('きょう')
    expect(container.textContent).not.toContain("It's hot")
  })

  it('affiche le nom du personnage', () => {
    render({ pages: TWO_PAGES })
    expect(container.textContent).toContain('エルムはかせ')
  })

  it('rend le jp en ruby (structure prête pour Y) dans le registre lecture', () => {
    render({ pages: TWO_PAGES })
    const ruby = container.querySelector('ruby')
    expect(ruby).not.toBeNull()
    expect(ruby!.textContent).toContain('今日')
  })
})

describe('DialogueBox — boutons Y (lectures) et X (traduction)', () => {
  it('Y révèle les lectures de la page entière, Y à nouveau les masque', () => {
    const ref = render({ pages: TWO_PAGES })
    act(() => ref.current!.pressY())
    expect(container.textContent).toContain('きょう')
    act(() => ref.current!.pressY())
    expect(container.textContent).not.toContain('きょう')
  })

  it('X superpose la traduction de la page courante, X à nouveau la retire', () => {
    const ref = render({ pages: TWO_PAGES })
    act(() => ref.current!.pressX())
    expect(container.textContent).toContain("It's hot today")
    act(() => ref.current!.pressX())
    expect(container.textContent).not.toContain("It's hot today")
  })

  it('X et Y sont remis à zéro à chaque nouvelle page (jamais d’anglais/lectures d’office)', () => {
    const ref = render({ pages: TWO_PAGES })
    act(() => {
      ref.current!.pressX()
      ref.current!.pressY()
    })
    act(() => ref.current!.pressA())
    expect(container.textContent).toContain('また　バトルしようね！')
    expect(container.textContent).not.toContain('Let’s battle')
    // page 2 sans kanji : re-vérifie sur retour arrière impossible — les
    // toggles doivent être repartis à faux (l'état, pas juste l'affichage)
    act(() => ref.current!.pressA())
  })

  it('les boutons overlay X et Y sont rendus (visibles uniquement pendant un dialogue)', () => {
    render({ pages: TWO_PAGES })
    expect(buttonByText('X')).toBeDefined()
    expect(buttonByText('Y')).toBeDefined()
  })
})

describe('DialogueBox — pagination A / fermeture', () => {
  it('A avance ; à la dernière page, A ferme', () => {
    const onClose = vi.fn()
    const ref = render({ pages: TWO_PAGES, onClose })
    expect(container.textContent).toContain('1/2')
    act(() => ref.current!.pressA())
    expect(container.textContent).toContain('2/2')
    expect(onClose).not.toHaveBeenCalled()
    act(() => ref.current!.pressA())
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('un kind inconnu est sauté sans crash', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render({
      pages: [TWO_PAGES[0], { kind: 'hologram_message', jp: 'x' }, TWO_PAGES[1]],
    })
    expect(container.textContent).toContain('1/2')
    warnSpy.mockRestore()
  })

  it('aucune page affichable → se ferme immédiatement', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const onClose = vi.fn()
    render({ pages: [{ kind: 'unknown_kind' }], onClose })
    expect(onClose).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})

describe('DialogueBox — machine à écrire', () => {
  it('le texte apparaît progressivement ; A pendant la frappe complète la page au lieu d’avancer', () => {
    vi.useFakeTimers()
    const ref = render({ pages: TWO_PAGES, typewriterMsPerChar: 20 })
    expect(container.textContent).not.toContain('今日は　あついですね。')
    act(() => {
      vi.advanceTimersByTime(40)
    })
    expect(container.textContent).toContain('今日')
    expect(container.textContent).not.toContain('あついですね。')
    act(() => ref.current!.pressA())
    expect(container.textContent).toContain('今日は　あついですね。')
    expect(container.textContent).toContain('1/2')
  })
})

describe('DialogueBox — companion_choice', () => {
  const COMPANION_PAGES: DialoguePageEntry[] = [
    {
      kind: 'companion_choice',
      prompt: { jp: 'だれと　いっしょに　いく？', en: 'Who will you travel with?' },
      options: [
        { companion_id: 'pikachu', name: { jp: 'ピカチュウ', en: 'Pikachu' }, available: true },
        { companion_id: 'tbd_2', name: { jp: '？？？', en: '???' }, available: false },
        { companion_id: 'tbd_3', name: { jp: '？？？', en: '???' }, available: false },
      ],
    },
    { jp: 'いい　ともだちに　なりますよ。', en: "It'll make a great friend." },
  ]

  it('affiche le prompt et les 3 options ; les slots à venir sont désactivés', () => {
    render({ pages: COMPANION_PAGES })
    expect(container.textContent).toContain('だれと　いっしょに　いく？')
    const pikachu = buttonByText('ピカチュウ')
    expect(pikachu).toBeDefined()
    expect(pikachu!.disabled).toBe(false)
    const tbd = buttons().filter(b => b.textContent === '？？？')
    expect(tbd).toHaveLength(2)
    expect(tbd.every(b => b.disabled)).toBe(true)
  })

  it('A n’avance pas tant qu’aucun choix n’est fait', () => {
    const ref = render({ pages: COMPANION_PAGES })
    act(() => ref.current!.pressA())
    expect(container.textContent).toContain('だれと　いっしょに　いく？')
  })

  it('choisir Pikachu persiste via le callback puis avance', async () => {
    const onChooseCompanion = vi.fn().mockResolvedValue(undefined)
    render({ pages: COMPANION_PAGES, onChooseCompanion })
    await act(async () => {
      buttonByText('ピカチュウ')!.click()
    })
    expect(onChooseCompanion).toHaveBeenCalledExactlyOnceWith('pikachu')
    expect(container.textContent).toContain('いい　ともだちに　なりますよ。')
  })

  it('cliquer un slot indisponible ne fait rien', async () => {
    const onChooseCompanion = vi.fn()
    render({ pages: COMPANION_PAGES, onChooseCompanion })
    await act(async () => {
      buttons()
        .filter(b => b.textContent === '？？？')[0]
        .click()
    })
    expect(onChooseCompanion).not.toHaveBeenCalled()
    expect(container.textContent).toContain('だれと　いっしょに　いく？')
  })
})

describe('DialogueBox — instant_response (UI minimale)', () => {
  const CALL_PAGES: DialoguePageEntry[] = [
    {
      kind: 'instant_response',
      prompt: { jp: '今日（きょう）は　あついですね。', en: "It's hot today, isn't it." },
      choices: [
        {
          jp: 'そうですね。あついです。',
          en: 'That’s right, it is hot.',
          quality: 'natural',
          reaction: { pages: [{ jp: 'うん！　いい　てんきだね！', en: 'Yeah! Nice weather, huh!' }] },
        },
        {
          jp: 'さようでございます。',
          en: 'Indeed it is so.',
          quality: 'too_formal',
          reaction: {
            pages: [
              { jp: 'ふふっ、そんなに　かたく　ならなくても　いいよ。', en: '…' },
              { jp: '「そうですね」で　じゅうぶんだよ。', en: '…' },
            ],
          },
        },
      ],
    },
    { jp: 'また　バトルしようね！', en: 'Let’s battle again sometime!' },
  ]

  it('affiche le prompt et les choix ; un choix joue sa réaction puis reprend le fil', () => {
    render({ pages: CALL_PAGES })
    expect(container.textContent).toContain('今日は　あついですね。')
    const choice = buttonByText('さようでございます。')
    expect(choice).toBeDefined()
    act(() => choice!.click())
    expect(container.textContent).toContain('ふふっ、そんなに　かたく')
  })

  it('les pages de réaction s’enchaînent avec A puis le dialogue reprend', () => {
    const ref = render({ pages: CALL_PAGES })
    act(() => buttonByText('さようでございます。')!.click())
    act(() => ref.current!.pressA())
    expect(container.textContent).toContain('「そうですね」で　じゅうぶんだよ。')
    act(() => ref.current!.pressA())
    expect(container.textContent).toContain('また　バトルしようね！')
  })
})

describe('DialogueBox — séquence complète du labo d’Elm (contenu réel)', () => {
  const elm = JSON.parse(
    readFileSync(
      path.join(process.cwd(), 'content', 'dialogues', 'npcs', 'new-bark-town', 'prof_elm_lab.json'),
      'utf-8'
    )
  ) as DialogueFile
  const roster = (
    JSON.parse(readFileSync(path.join(process.cwd(), 'content', 'companions.json'), 'utf-8')) as {
      companions: CompanionRosterEntry[]
    }
  ).companions
  const welcomePages = attachCompanionOptions(elm.dialogue_states.welcome.pages, roster)

  it('welcome se joue de bout en bout : 3 pages → choix persisté → 3 pages → fermeture', async () => {
    const onClose = vi.fn()
    const onChooseCompanion = vi.fn().mockResolvedValue(undefined)
    const ref = render({ pages: welcomePages, onClose, onChooseCompanion })

    // 3 pages de texte
    expect(container.textContent).toContain('あ、きたね。')
    act(() => ref.current!.pressA())
    act(() => ref.current!.pressA())
    expect(container.textContent).toContain('えらんで')
    act(() => ref.current!.pressA())

    // companion_choice : prompt + Pikachu choisissable, 2 slots à venir grisés
    expect(container.textContent).toContain('だれと　いっしょに　いく？')
    expect(buttonByText('ピカチュウ')!.disabled).toBe(false)
    expect(buttons().filter(b => b.textContent === '？？？').every(b => b.disabled)).toBe(true)
    await act(async () => {
      buttonByText('ピカチュウ')!.click()
    })
    expect(onChooseCompanion).toHaveBeenCalledExactlyOnceWith('pikachu')

    // 3 pages de texte restantes puis fermeture
    expect(container.textContent).toContain('いい　ともだちに　なりますよ。')
    act(() => ref.current!.pressA())
    act(() => ref.current!.pressA())
    expect(container.textContent).toContain('でんわしてね。')
    expect(onClose).not.toHaveBeenCalled()
    act(() => ref.current!.pressA())
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('X et Y togglent sur chaque page de chaque state ; les lectures ne fuient jamais par défaut', async () => {
    for (const [stateId, state] of Object.entries(elm.dialogue_states)) {
      // remontage complet entre deux states (le root garde sinon l'état de page)
      act(() => root.unmount())
      root = createRoot(container)
      const pages = attachCompanionOptions(state.pages, roster)
      const ref = render({ pages })
      const routedCount = pages.filter(p => p.kind === undefined || p.kind === 'companion_choice').length
      for (let i = 0; i < routedCount; i++) {
        // défaut : jamais de parenthèse de lecture ni d'anglais visibles
        expect(container.textContent, `${stateId} page ${i}`).not.toMatch(/（[ぁ-ゖ]+）/)
        act(() => ref.current!.pressX())
        const entry = pages[i]
        const en =
          typeof entry.en === 'string'
            ? entry.en
            : (entry.prompt as { en: string } | undefined)?.en
        if (en) expect(container.textContent, `${stateId} page ${i} +X`).toContain(en)
        act(() => ref.current!.pressX())
        act(() => ref.current!.pressY())
        act(() => ref.current!.pressY())
        // avance (les pages à choix n'avancent pas par A — on choisit)
        if (entry.kind === 'companion_choice') {
          const pick = buttons().find(b => !b.disabled && b.textContent === 'ピカチュウ')
          await act(async () => {
            pick!.click()
          })
        } else {
          act(() => ref.current!.pressA())
        }
      }
    }
  })
})

describe('DialogueBox — conversation_turn (UI minimale)', () => {
  const CONV_PAGES: DialoguePageEntry[] = [
    {
      kind: 'conversation_turn',
      turn_id: 't1',
      npc_line: { jp: 'どこへ　いくの？', en: 'Where are you headed?' },
      choices: [
        {
          jp: 'ポケモンセンターです。',
          en: 'The Pokémon Center.',
          tone: 'natural',
          reaction: { jp: 'まっすぐよ。', en: 'Straight ahead.' },
          next: 't2',
        },
      ],
    },
    {
      kind: 'conversation_turn',
      turn_id: 't2',
      npc_line: { jp: 'この　まちは　はじめて？', en: 'First time here?' },
      choices: [
        { jp: 'はい。', en: 'Yes.', tone: 'natural', reaction: null, next: 'end' },
      ],
    },
    { jp: 'いってらっしゃい。', en: 'Off you go.' },
  ]

  it('un choix joue la réaction puis saute au tour pointé par next', () => {
    const ref = render({ pages: CONV_PAGES })
    expect(container.textContent).toContain('どこへ　いくの？')
    act(() => buttonByText('ポケモンセンターです。')!.click())
    expect(container.textContent).toContain('まっすぐよ。')
    act(() => ref.current!.pressA())
    expect(container.textContent).toContain('この　まちは　はじめて？')
  })

  it('next: end sans réaction sort du bloc de tours', () => {
    const ref = render({ pages: CONV_PAGES })
    act(() => buttonByText('ポケモンセンターです。')!.click())
    act(() => ref.current!.pressA())
    act(() => buttonByText('はい。')!.click())
    expect(container.textContent).toContain('いってらっしゃい。')
    void ref
  })
})
