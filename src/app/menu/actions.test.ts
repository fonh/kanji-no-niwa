// getStartMenuData (issue 09) — assemblage serveur des 4 écrans du menu
// START, DB mockée (DATABASE_URL absent ici), contenu RÉEL. Le scénario des
// critères d'acceptation : pendant la course chez Mr. Pokémon (leçons 1-2
// complétées, œuf reçu, retour pas encore fait), le Carnet montre 1-2
// complétées et la #3 verrouillée-AVEC-MENTION, le Journal de quêtes montre
// l'étape courante de mystery_egg_errand, le Sac montre l'œuf, le Journal de
// lecture montre lyra_mail.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defaultPlayerState, type PlayerState } from '@/lib/condition-effect'

const requireUserIdMock = vi.hoisted(() => vi.fn(async () => 'user-1'))
vi.mock('@/lib/auth', () => ({ requireUserId: requireUserIdMock }))

// sql routé par requête : kanji (grille du Kanjidex), cards (statuts),
// text_completions (Journal de lecture).
const dbRows = vi.hoisted(() => ({
  kanji: [] as Record<string, unknown>[],
  cards: [] as Record<string, unknown>[],
  completions: [] as Record<string, unknown>[],
}))
const sqlMock = vi.hoisted(() =>
  vi.fn(async (strings: TemplateStringsArray) => {
    const query = strings.join(' ')
    if (query.includes('from kanji')) return dbRows.kanji
    if (query.includes('from cards')) return dbRows.cards
    if (query.includes('from text_completions')) return dbRows.completions
    return []
  })
)
vi.mock('@/lib/db', () => ({ sql: sqlMock }))

const stateRef = vi.hoisted(() => ({ current: null as unknown as PlayerState }))
vi.mock('@/lib/player-state', () => ({
  getPlayerState: vi.fn(async () => stateRef.current),
}))

import { getStartMenuData } from './actions'

/** L'état joueur pendant la course chez Mr. Pokémon (œuf en poche, retour
 * pas encore fait) — celui des critères d'acceptation. */
function midErrandState(): PlayerState {
  return {
    ...defaultPlayerState(),
    current_zone: 'MAP_ROUTE_30',
    visited_zones: [
      'MAP_NEW_BARK',
      'MAP_NEW_BARK_ELMS_LAB_1F',
      'MAP_ROUTE_29',
      'MAP_CHERRYGROVE',
      'MAP_ROUTE_30',
    ],
    completed_lessons: ['new-bark-town#1', 'new-bark-town#2'],
    inventory: { running_shoes: 1, pokegear: 1, map_card: 1, mystery_egg: 1, pokedex: 1 },
    unlocked_texts: ['lyra_mail_new_bark'],
    quest_progress: {
      mystery_egg_errand: {
        current_step: 'egg_received',
        step_entered_at: '2026-07-30T10:00:00.000Z',
      },
      'lessons-new-bark-town': {
        current_step: 'lesson-2',
        step_entered_at: '2026-07-30T09:00:00.000Z',
      },
    },
  }
}

beforeEach(() => {
  stateRef.current = midErrandState()
  dbRows.kanji = [
    { id: '一', character: '一', jlpt_level: 'N5' },
    { id: '二', character: '二', jlpt_level: 'N5' },
    { id: '楽', character: '楽', jlpt_level: 'N4' },
  ]
  dbRows.cards = [
    { item_id: '一', facet: 'sens', fsrs_state: { stability: 20 } },
    { item_id: '一', facet: 'lecture', fsrs_state: { stability: 15 } },
    { item_id: '二', facet: 'sens', fsrs_state: { stability: 0.5 } },
    { item_id: '二', facet: 'lecture', fsrs_state: { stability: 0.5 } },
  ]
  dbRows.completions = [
    {
      text_id: 'lyra_mail_new_bark',
      score: 100,
      completed_at: '2026-07-30T08:00:00.000Z',
      gold_at: null,
    },
  ]
})

describe('getStartMenuData — pendant la course chez Mr. Pokémon', () => {
  it('Carnet : chapitres = zones visitées dans l’ordre, leçons 1-2 complétées, #3 VERROUILLÉE (pas next), 4-5 masquées', async () => {
    const data = await getStartMenuData()
    expect(data.lessonBook.map(c => c.zone_id)).toEqual([
      'new-bark-town',
      'route-29',
      'cherrygrove-city',
      'route-30',
    ])
    const newBark = data.lessonBook[0]
    expect(newBark.zone_jp).toBe('ワカバタウン')
    expect(newBark.completed).toBe(2)
    expect(newBark.total).toBe(5)
    expect(newBark.lines.map(l => l.status)).toEqual([
      'completed',
      'completed',
      'locked',
      'masked',
      'masked',
    ])
    // La #3 verrouillée par unlock_conditions (egg_delivered pas atteint)
    // montre QUI (le PNJ, nom jp du fichier dialogue) mais pas son contenu.
    const third = newBark.lines[2]
    expect(third.npc_jp).toBe('エルムはかせ')
    expect(third.kanji_ids).toBeNull()
  })

  it('Journal de quêtes : l’étape courante de mystery_egg_errand, zone cible résolue en jp', async () => {
    const data = await getStartMenuData()
    expect(data.questJournal).toHaveLength(1)
    const quest = data.questJournal[0]
    expect(quest.quest_id).toBe('mystery_egg_errand')
    expect(quest.name.jp).toBe('ふしぎな　たまごの　おつかい')
    expect(quest.step.jp).toContain('ふしぎな　たまごと　ポケモンずかんを　もらった')
    expect(quest.step.en).toBeTruthy() // X = anglais
    expect(quest.target_zone_id).toBe('new-bark-town')
    expect(quest.target_zone_jp).toBe('ワカバタウン')
  })

  it('Sac : l’œuf mystère dans たいせつなもの (libellé jp du registre)', async () => {
    const data = await getStartMenuData()
    const keyItems = data.bag.find(c => c.id === 'key_items')!
    expect(keyItems.jp).toBe('たいせつなもの')
    const egg = keyItems.items.find(i => i.item_id === 'mystery_egg')!
    expect(egg.jp).toBe('ふしぎな　タマゴ')
    expect(egg.quantity).toBe(1)
  })

  it('Journal de lecture : lyra_mail lue (blanc) ; les autres textes des zones visitées grisés avec indice du porteur', async () => {
    const data = await getStartMenuData()
    const mail = data.readingJournal.find(r => r.text_id === 'lyra_mail_new_bark')!
    expect(mail.status).toBe('read')
    // Le grand texte d'Elm : porteur PNJ → nom jp du fichier dialogue
    const great = data.readingJournal.find(r => r.text_id === 'elm_great_text_new_bark')!
    expect(great.status).toBe('undiscovered')
    expect(great.holder_kind).toBe('npc')
    expect(great.holder_jp).toBe('エルムはかせ')
    // Le panneau de Route 29 : porteur objet → registre des porteurs
    const sign = data.readingJournal.find(r => r.text_id === 'johto_entrance_sign_route29')!
    expect(sign.status).toBe('undiscovered')
    expect(sign.holder_kind).toBe('object')
    expect(sign.holder_jp).toBe('みちの　かんばん')
  })

  it('Kanjidex : grille + statuts (maîtrisé = les 2 facettes ≥ 14 j de stabilité)', async () => {
    const data = await getStartMenuData()
    expect(data.kanjidex.kanji).toHaveLength(3)
    expect(data.kanjidex.status['一']).toBe('mastered')
    expect(data.kanjidex.status['二']).toBe('studied')
    expect(data.kanjidex.status['楽']).toBeUndefined()
  })

  it('relecture doré : gold_at posé → statut gold', async () => {
    dbRows.completions[0].gold_at = '2026-07-30T12:00:00.000Z'
    const data = await getStartMenuData()
    expect(data.readingJournal.find(r => r.text_id === 'lyra_mail_new_bark')!.status).toBe('gold')
  })

  it('après la remise de l’œuf (egg_delivered) : la #3 devient next (qui-et-où seulement)', async () => {
    const state = midErrandState()
    state.quest_progress.mystery_egg_errand = {
      current_step: 'egg_delivered',
      step_entered_at: '2026-07-30T12:00:00.000Z',
    }
    stateRef.current = state
    const data = await getStartMenuData()
    const third = data.lessonBook[0].lines[2]
    expect(third.status).toBe('next')
    expect(third.npc_jp).toBe('エルムはかせ')
    expect(third.kanji_ids).toBeNull()
  })
})
