// Menu START (issue 09) — jsdom : ouverture/fermeture, 6 slots VO, slots
// grisés, navigation D-pad + A, B = retour d'UN niveau, re-appui START =
// fermeture directe où qu'on soit, SELECT inerte, et le rendu des 4 écrans
// (Carnet 4 états, Journal de quêtes + X, Sac + どくしょノート, Kanjidex).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getSettingsSnapshot, resetSettingsCache } from '@/lib/settings'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { StartMenuData } from './actions'
import StartMenu from './StartMenu'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const pushMock = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))
// L'effacement de partie est une server action : elle tire next-auth, que le
// projet jsdom de vitest ne sait pas résoudre. Seul le parcours d'UI est testé
// ici (le contenu de l'action a son propre test, reset-actions.test.ts).
const resetMock = vi.hoisted(() => vi.fn(async () => ({ ok: true })))
vi.mock('./reset-actions', () => ({ resetPlayerData: resetMock }))

const menuData = vi.hoisted(() => ({ current: null as unknown as StartMenuData }))
const getStartMenuDataMock = vi.hoisted(() => vi.fn(async () => menuData.current))
vi.mock('./actions', () => ({ getStartMenuData: getStartMenuDataMock }))

function fixture(): StartMenuData {
  return {
    lessonBook: [
      {
        zone_id: 'new-bark-town',
        zone_jp: 'ワカバタウン',
        completed: 2,
        total: 5,
        lines: [
          { sequence_index: 1, status: 'completed', kanji_ids: ['一', '二'], grammar_id: 'N5-001', npc_ref: 'prof_elm_lab', npc_jp: 'エルムはかせ' },
          { sequence_index: 2, status: 'completed', kanji_ids: ['円', '十'], grammar_id: 'N5-002', npc_ref: 'prof_elm_lab', npc_jp: 'エルムはかせ' },
          { sequence_index: 3, status: 'locked', kanji_ids: null, grammar_id: null, npc_ref: 'prof_elm_lab', npc_jp: 'エルムはかせ' },
          { sequence_index: 4, status: 'masked', kanji_ids: null, grammar_id: null, npc_ref: null, npc_jp: null },
          { sequence_index: 5, status: 'masked', kanji_ids: null, grammar_id: null, npc_ref: null, npc_jp: null },
        ],
      },
      {
        zone_id: 'route-29',
        zone_jp: '29ばんどうろ',
        completed: 0,
        total: 4,
        lines: [
          { sequence_index: 1, status: 'next', kanji_ids: null, grammar_id: null, npc_ref: 'tuscany_route29', npc_jp: 'ツバキ' },
          { sequence_index: 2, status: 'masked', kanji_ids: null, grammar_id: null, npc_ref: null, npc_jp: null },
          { sequence_index: 3, status: 'masked', kanji_ids: null, grammar_id: null, npc_ref: null, npc_jp: null },
          { sequence_index: 4, status: 'masked', kanji_ids: null, grammar_id: null, npc_ref: null, npc_jp: null },
        ],
      },
    ],
    questJournal: [
      {
        quest_id: 'mystery_egg_errand',
        name: { jp: 'ふしぎな　たまごの　おつかい', en: 'The Mystery Egg Errand' },
        step: { jp: 'ワカバタウンに　かえろう。', en: 'Time to head back to New Bark Town.' },
        target_zone_id: 'new-bark-town',
        target_zone_jp: 'ワカバタウン',
      },
    ],
    bag: [
      {
        id: 'key_items',
        jp: 'たいせつなもの',
        items: [
          { item_id: 'mystery_egg', jp: 'ふしぎな　タマゴ', quantity: 1 },
          { item_id: 'pokegear', jp: 'ポケギア', quantity: 1 },
        ],
      },
    ],
    readingJournal: [
      {
        text_id: 'lyra_mail_new_bark',
        title: { jp: 'コハルからの　メール', en: 'A Mail from Lyra' },
        zone_id: 'new-bark-town',
        status: 'read',
        holder_ref: 'player_pc_new_bark',
        holder_kind: 'object',
        holder_jp: 'じぶんの　パソコン',
      },
      {
        text_id: 'elm_great_text_new_bark',
        title: { jp: '漢字の　庭', en: 'The Kanji Garden' },
        zone_id: 'new-bark-town',
        status: 'undiscovered',
        holder_ref: 'prof_elm_lab',
        holder_kind: 'npc',
        holder_jp: 'エルムはかせ',
      },
      {
        text_id: 'johto_entrance_sign_route29',
        title: { jp: 'みちの　かんばん', en: 'The Road Sign' },
        zone_id: 'route-29',
        status: 'gold',
        holder_ref: 'sign_johto_entrance_route29',
        holder_kind: 'object',
        holder_jp: 'みちの　かんばん',
      },
    ],
    kanjidex: {
      kanji: [
        { id: '一', character: '一', jlpt_level: 'N5' },
        { id: '二', character: '二', jlpt_level: 'N5' },
        { id: '楽', character: '楽', jlpt_level: 'N4' },
      ],
      status: { '一': 'mastered', '二': 'studied' },
    },
  }
}

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  pushMock.mockClear()
  getStartMenuDataMock.mockClear()
  menuData.current = fixture()
  resetSettingsCache()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function render(initialScreen: 'zukan' | 'lessons' | 'bag' | 'journal' | null = null) {
  act(() => root.render(<StartMenu initialScreen={initialScreen} />))
}

const flush = () => act(async () => {})
const buttons = () => Array.from(container.querySelectorAll('button'))
const buttonByText = (text: string) => buttons().find(b => b.textContent?.includes(text))
const click = (b: Element | undefined) => {
  expect(b).toBeDefined()
  act(() => b!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
}
const startButton = () => container.querySelector('[data-testid="start-button"]')!
const key = (code: string) =>
  act(() => {
    document.body.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }))
  })

async function openMenu() {
  render()
  click(startButton())
  await flush()
}

describe('ouverture / fermeture', () => {
  it('START ouvre le menu : 6 slots en VO, seul プロフィール reste grisé', async () => {
    await openMenu()
    for (const label of ['図鑑', 'レッスン', 'バッグ', 'プロフィール', 'ぼうけんノート', 'せってい']) {
      expect(container.textContent).toContain(label)
    }
    const profile = buttonByText('プロフィール')!
    expect(profile.getAttribute('aria-disabled')).toBe('true')
    expect(buttonByText('せってい')!.getAttribute('aria-disabled')).toBe('false')
    // A sur un slot grisé : inerte
    click(profile)
    expect(container.querySelector('[data-testid="menu-root"]')).not.toBeNull()
  })

  // Issue 13 — l'écran せってい était un slot grisé « じゅんびちゅう ».
  it('せってい ouvre un écran de réglages qui persiste ce qu’on y change', async () => {
    await openMenu()
    click(buttonByText('せってい'))
    const screen = container.querySelector('[data-testid="screen-settings"]')
    expect(screen).not.toBeNull()
    // Vitesse d'écriture : ふつう par défaut, un clic passe au cran suivant.
    const speed = container.querySelector('[data-testid="setting-textSpeed"]')!
    expect(speed.textContent).toContain('ふつう')
    click(speed)
    expect(
      container.querySelector('[data-testid="setting-textSpeed"]')!.textContent
    ).toContain('はやい')
    expect(getSettingsSnapshot().textSpeed).toBe('fast')
  })

  // Issue 13 — « un bouton reset qui supprime ma partie ».
  it('l’effacement de partie demande confirmation avant d’effacer quoi que ce soit', async () => {
    await openMenu()
    click(buttonByText('せってい'))
    // Le bouton seul n'efface rien.
    click(container.querySelector('[data-testid="reset-open"]')!)
    expect(resetMock).not.toHaveBeenCalled()
    expect(container.querySelector('[data-testid="reset-confirm"]')).not.toBeNull()
    // On peut renoncer.
    click(container.querySelector('[data-testid="reset-no"]')!)
    expect(resetMock).not.toHaveBeenCalled()
    expect(container.querySelector('[data-testid="reset-confirm"]')).toBeNull()
    // C'est la confirmation qui efface.
    click(container.querySelector('[data-testid="reset-open"]')!)
    click(container.querySelector('[data-testid="reset-yes"]')!)
    await flush()
    expect(resetMock).toHaveBeenCalledTimes(1)
  })

  it('SELECT est présent mais inerte (le Pokégear complet est hors jalon)', async () => {
    render()
    const select = container.querySelector('[data-testid="select-button"]')!
    expect(select.getAttribute('aria-disabled')).toBe('true')
    click(select)
    expect(container.querySelector('[data-testid="menu-root"]')).toBeNull()
  })

  it('B (Escape) = retour d’un niveau : écran → racine → fermé', async () => {
    await openMenu()
    click(buttonByText('レッスン'))
    expect(container.textContent).toContain('ワカバタウン')
    key('Escape')
    expect(container.querySelector('[data-testid="menu-root"]')).not.toBeNull()
    key('Escape')
    expect(container.querySelector('[data-testid="menu-root"]')).toBeNull()
    // Le bouton START reste là
    expect(container.querySelector('[data-testid="start-button"]')).not.toBeNull()
  })

  it('re-appui START = fermeture directe, même au fond d’un écran', async () => {
    await openMenu()
    click(buttonByText('バッグ'))
    click(buttonByText('どくしょノート'))
    click(startButton())
    expect(container.querySelector('[data-testid="menu-root"]')).toBeNull()
    // Ré-ouverture : on repart de la racine
    click(startButton())
    await flush()
    expect(container.querySelector('[data-testid="menu-root"]')).not.toBeNull()
  })

  it('menu ouvert : les touches ne traversent pas vers MapClient (capture)', async () => {
    await openMenu()
    const spy = vi.fn()
    window.addEventListener('keydown', spy) // simule l'écouteur bubble de MapClient
    key('ArrowUp')
    expect(spy).not.toHaveBeenCalled()
    window.removeEventListener('keydown', spy)
  })

  it('navigation D-pad + A : → puis A ouvre レッスン', async () => {
    await openMenu()
    key('ArrowRight')
    expect(buttonByText('レッスン')!.getAttribute('data-selected')).toBe('true')
    key('Enter')
    expect(container.textContent).toContain('ワカバタウン')
    expect(container.textContent).toContain('2/5')
  })

  it('initialScreen (retour de fiche : /map?menu=zukan) ouvre directement l’écran', async () => {
    render('zukan')
    await flush()
    expect(container.querySelector('[data-testid="screen-zukan"]')).not.toBeNull()
  })
})

describe('レッスン — Carnet de leçons (4 états)', () => {
  it('complétée : tap → relecture /lesson/<zone>/<seq> ; kanji du groupe visibles', async () => {
    await openMenu()
    click(buttonByText('レッスン'))
    const line1 = container.querySelector('[data-testid="lesson-line-new-bark-town-1"]')!
    expect(line1.textContent).toContain('一')
    click(line1.querySelector('button') ?? line1)
    expect(pushMock).toHaveBeenCalledWith('/lesson/new-bark-town/1')
  })

  it('verrouillée : le PNJ est affiché avec la MENTION claire, pas de navigation', async () => {
    await openMenu()
    click(buttonByText('レッスン'))
    const locked = container.querySelector('[data-testid="lesson-line-new-bark-town-3"]')!
    expect(locked.textContent).toContain('エルムはかせ')
    expect(locked.textContent).toContain('まだ　じゅんびが　できていないみたい')
    expect(locked.querySelector('button')).toBeNull()
  })

  it('prochaine : qui-et-où seulement (PNJ, pas de contenu) ; suivantes : ？？？', async () => {
    await openMenu()
    click(buttonByText('レッスン'))
    const next = container.querySelector('[data-testid="lesson-line-route-29-1"]')!
    expect(next.textContent).toContain('ツバキ')
    expect(next.textContent).toContain('つぎの　レッスン')
    const masked = container.querySelector('[data-testid="lesson-line-new-bark-town-4"]')!
    expect(masked.textContent).toContain('？？？')
  })
})

describe('ぼうけんノート — Journal de quêtes', () => {
  it('quête en cours : nom jp, étape courante jp, zone cible ; X = anglais', async () => {
    await openMenu()
    click(buttonByText('ぼうけんノート'))
    expect(container.textContent).toContain('ふしぎな　たまごの　おつかい')
    expect(container.textContent).toContain('ワカバタウンに　かえろう。')
    expect(container.textContent).toContain('いきさき')
    expect(container.textContent).toContain('ワカバタウン')
    expect(container.textContent).not.toContain('Time to head back')
    click(buttonByText('X'))
    expect(container.textContent).toContain('Time to head back to New Bark Town.')
  })
})

describe('バッグ — Sac + どくしょノート', () => {
  it('inventaire par catégorie : l’œuf mystère dans たいせつなもの', async () => {
    await openMenu()
    click(buttonByText('バッグ'))
    expect(container.textContent).toContain('たいせつなもの')
    expect(container.textContent).toContain('ふしぎな　タマゴ')
  })

  it('どくしょノート : lu = rouvrable (tap → /text/<id>), doré distinct, non-découvert grisé avec indice du porteur', async () => {
    await openMenu()
    click(buttonByText('バッグ'))
    click(buttonByText('どくしょノート'))
    const mail = container.querySelector('[data-testid="text-line-lyra_mail_new_bark"]')!
    click(mail.querySelector('button') ?? mail)
    expect(pushMock).toHaveBeenCalledWith('/text/lyra_mail_new_bark')
    // Doré : marqueur non-coloré ★ en plus de la teinte
    const sign = container.querySelector('[data-testid="text-line-johto_entrance_sign_route29"]')!
    expect(sign.textContent).toContain('★')
    // Non découvert : grisé, pas de bouton, indice du porteur
    const great = container.querySelector('[data-testid="text-line-elm_great_text_new_bark"]')!
    expect(great.querySelector('button')).toBeNull()
    expect(great.textContent).toContain('もちぬし')
    expect(great.textContent).toContain('エルムはかせ')
  })
})

describe('図鑑 — Kanjidex', () => {
  it('grille : maîtrisé = doré + repère ★ ; tap → fiche /kanji/<id> ; filtre JLPT', async () => {
    await openMenu()
    click(buttonByText('図鑑'))
    const mastered = container.querySelector('[data-testid="kanjidex-tile-一"]')!
    expect(mastered.textContent).toContain('★')
    const studied = container.querySelector('[data-testid="kanjidex-tile-二"]')!
    expect(studied.textContent).not.toContain('★')
    click(mastered)
    expect(pushMock).toHaveBeenCalledWith(`/kanji/${encodeURIComponent('一')}`)
    // Filtre N5 : 楽 (N4) disparaît
    click(buttonByText('N5'))
    expect(container.querySelector('[data-testid="kanjidex-tile-楽"]')).toBeNull()
    expect(container.querySelector('[data-testid="kanjidex-tile-一"]')).not.toBeNull()
  })
})

// La manette du menu (2026-08-06) : mêmes boutons que la carte, même
// composant, même losange, même place. Avant, le menu dessinait deux ronds A/B
// d'un autre diamètre et d'une autre couleur, et X/Y n'existaient qu'en
// pastilles dans l'en-tête de certains écrans.
describe('manette du menu', () => {
  it('ouvre les quatre boutons A/B/X/Y du losange, pas seulement A et B', async () => {
    await openMenu()
    for (const area of ['a', 'b', 'x', 'y']) {
      expect(
        document.querySelector(`[data-testid="button-${area}"]`),
        `bouton ${area}`
      ).not.toBeNull()
    }
  })

  it('X et Y sont estompés sur l’écran racine (rien à basculer)', async () => {
    await openMenu()
    const x = document.querySelector('[data-testid="button-x"]')!
    expect(x.className).toContain('text-white/60')
  })
})
