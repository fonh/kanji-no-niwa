// Routage des kinds de pages[] (engine-contract.md § 8) — TDD : écrits avant
// src/lib/dialogue-pages.ts. Charge de vrais fichiers de content/ pour vérifier
// le routage sur le contenu réel (prof_elm_lab, joey_route30, gabarit 会話).
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import {
  routeDialoguePages,
  attachCompanionOptions,
  findConversationTurn,
  resolveConversationNext,
  shuffledIndices,
  type RoutedPage,
} from './dialogue-pages'
import type { DialogueFile, DialoguePageEntry } from './content'

function loadDialogue(rel: string): DialogueFile {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), 'content', 'dialogues', rel), 'utf-8')
  ) as DialogueFile
}

const COMPANIONS = [
  { companion_id: 'pikachu', name: { jp: 'ピカチュウ', en: 'Pikachu' }, sprite_ref: 'x', status: 'confirmed' },
  { companion_id: 'tbd_2', name: { jp: '？？？', en: '???' }, sprite_ref: null, status: 'à trancher' },
  { companion_id: 'tbd_3', name: { jp: '？？？', en: '???' }, sprite_ref: null, status: 'à trancher' },
]

describe('routeDialoguePages — pages de texte', () => {
  it('une page {jp, en} devient une page text', () => {
    expect(routeDialoguePages([{ jp: 'こんにちは', en: 'Hello' }])).toEqual([
      { kind: 'text', jp: 'こんにちは', en: 'Hello' },
    ])
  })

  it('en manquant → chaîne vide (pages système : obstacles, beat muet)', () => {
    expect(routeDialoguePages([{ jp: '・・・・・・' }])).toEqual([
      { kind: 'text', jp: '・・・・・・', en: '' },
    ])
  })

  it('un kind inconnu ne crashe jamais : loggué et sauté', () => {
    const warn = vi.fn()
    const routed = routeDialoguePages(
      [{ jp: 'a', en: 'a' }, { kind: 'weird_future_kind', foo: 1 }, { jp: 'b', en: 'b' }],
      warn
    )
    expect(routed.map(p => p.kind)).toEqual(['text', 'text'])
    expect(warn).toHaveBeenCalledOnce()
  })

  it('une entrée sans jp ni kind est sautée avec log', () => {
    const warn = vi.fn()
    expect(routeDialoguePages([{ en: 'orphan' }], warn)).toEqual([])
    expect(warn).toHaveBeenCalledOnce()
  })
})

describe('routeDialoguePages — companion_choice (prof_elm_lab.welcome)', () => {
  const welcome = loadDialogue('npcs/new-bark-town/prof_elm_lab.json').dialogue_states.welcome
  const enriched = attachCompanionOptions(welcome.pages, COMPANIONS)

  it('les 7 entrées du state welcome sont toutes routées', () => {
    const routed = routeDialoguePages(enriched)
    expect(routed).toHaveLength(7)
    expect(routed.map(p => p.kind)).toEqual([
      'text', 'text', 'text', 'companion_choice', 'text', 'text', 'text',
    ])
  })

  it('la page companion_choice porte prompt + 3 options, tbd_2/tbd_3 indisponibles', () => {
    const page = routeDialoguePages(enriched)[3]
    expect(page.kind).toBe('companion_choice')
    if (page.kind !== 'companion_choice') throw new Error('unreachable')
    expect(page.prompt.jp).toBe('だれと　いっしょに　いく？')
    expect(page.options).toHaveLength(3)
    expect(page.options[0]).toEqual({
      companion_id: 'pikachu',
      name: { jp: 'ピカチュウ', en: 'Pikachu' },
      available: true,
    })
    expect(page.options[1].available).toBe(false)
    expect(page.options[2].available).toBe(false)
  })

  it('companion_choice sans options attachées (contenu brut, non enrichi serveur) → sauté avec log', () => {
    const warn = vi.fn()
    const routed = routeDialoguePages(welcome.pages, warn)
    expect(routed.every(p => p.kind === 'text')).toBe(true)
    expect(warn).toHaveBeenCalledOnce()
  })

  it('attachCompanionOptions ne mute pas les entrées d’origine (elles sortent du cache module)', () => {
    expect(welcome.pages[3].options).toBeUndefined()
  })
})

describe('routeDialoguePages — instant_response (joey_route30)', () => {
  const call = loadDialogue('calls/joey_route30.json').dialogue_states.call

  it('route la page instant_response avec prompt et 3 choix + réactions', () => {
    const routed = routeDialoguePages(call.pages)
    expect(routed.map(p => p.kind)).toEqual(['text', 'instant_response', 'text'])
    const page = routed[1]
    if (page.kind !== 'instant_response') throw new Error('unreachable')
    expect(page.prompt.jp).toBe('今日（きょう）は　あついですね。')
    expect(page.choices).toHaveLength(3)
    expect(page.choices[0].jp).toBe('そうですね。あついです。')
    expect(page.choices[0].reaction).toEqual([{ jp: 'うん！　いい　てんきだね！', en: 'Yeah! Nice weather, huh!' }])
    expect(page.choices[1].reaction).toHaveLength(2)
  })
})

describe('routeDialoguePages — conversation_turn (gabarit 会話)', () => {
  const chat = JSON.parse(
    readFileSync(path.join(process.cwd(), 'content', 'gabarits', 'conversation-example.json'), 'utf-8')
  ).dialogue_states.chat as { pages: DialoguePageEntry[] }
  const routed = routeDialoguePages(chat.pages)

  it('chaque tour est routé avec turn_id, npc_line et choix (réaction + next)', () => {
    expect(routed.every(p => p.kind === 'conversation_turn')).toBe(true)
    const t1 = routed[0]
    if (t1.kind !== 'conversation_turn') throw new Error('unreachable')
    expect(t1.turn_id).toBe('t1')
    expect(t1.npc_line.jp).toContain('たびの')
    expect(t1.choices).toHaveLength(3)
    expect(t1.choices[0].next).toBe('t2_center')
    expect(t1.choices[0].reaction?.jp).toContain('まっすぐ')
  })

  it('findConversationTurn retrouve un tour par turn_id', () => {
    expect(findConversationTurn(routed, 't2_center')).toBe(1)
    expect(findConversationTurn(routed, 'absent')).toBe(-1)
  })

  it('resolveConversationNext : turn_id → index du tour ; end → première page après le bloc', () => {
    expect(resolveConversationNext(routed, 0, 't2_center')).toBe(1)
    // 'end' depuis le dernier bloc : tout le dialogue est des tours → fin des pages
    expect(resolveConversationNext(routed, 0, 'end')).toBe(routed.length)
  })

  it('resolveConversationNext : end saute le bloc de tours contigu et atterrit sur la page de texte suivante', () => {
    const mixed: RoutedPage[] = [
      { kind: 'text', jp: 'a', en: '' },
      ...routed.slice(0, 2),
      { kind: 'text', jp: 'b', en: '' },
    ]
    expect(resolveConversationNext(mixed, 1, 'end')).toBe(3)
  })

  it('un next vers un turn_id inconnu retombe sur la sortie de bloc (robustesse)', () => {
    expect(resolveConversationNext(routed, 0, 'typo_turn')).toBe(routed.length)
  })
})

describe('shuffledIndices — mélange obligatoire des choix affichés (engine-contract § 8)', () => {
  it('est une permutation complète de [0, n)', () => {
    const order = shuffledIndices(5)
    expect([...order].sort()).toEqual([0, 1, 2, 3, 4])
  })

  it('déterministe à rng fixé (Fisher-Yates)', () => {
    // rng qui retourne toujours 0 → chaque échange se fait avec l'index 0
    expect(shuffledIndices(3, () => 0)).toEqual([1, 2, 0])
    // rng ~1 → aucun échange effectif
    expect(shuffledIndices(3, () => 0.999)).toEqual([0, 1, 2])
  })

  it('n=0 et n=1 : trivial, jamais de crash', () => {
    expect(shuffledIndices(0)).toEqual([])
    expect(shuffledIndices(1)).toEqual([0])
  })

  it('la position stockée ne prédit pas la position affichée (statistique : 50 tirages)', () => {
    const firsts = new Set(Array.from({ length: 50 }, () => shuffledIndices(3)[0]))
    expect(firsts.size).toBeGreaterThan(1)
  })
})
