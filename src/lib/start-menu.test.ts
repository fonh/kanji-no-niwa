// Logique de présentation du menu START (issue 09) — pur, testé avant l'UI :
// Journal de quêtes (ぼうけんノート), Journal de lecture (どくしょノート),
// Sac par catégories, statuts du Kanjidex (maîtrisé = stabilité FSRS ≥ 14 j),
// libellés jp de zones.
import { describe, it, expect } from 'vitest'
import { defaultPlayerState, type PlayerState } from './condition-effect'
import type { QuestFile } from './content'
import {
  MASTERED_STABILITY_DAYS,
  buildQuestJournal,
  buildReadingJournal,
  groupBagItems,
  kanjidexStatusMap,
  zoneJpLabel,
  type BagItemLabels,
} from './start-menu'

// ── Journal de quêtes ─────────────────────────────────────────────────────────

const MYSTERY_EGG: QuestFile = {
  quest_id: 'mystery_egg_errand',
  name: { jp: 'ふしぎな　たまごの　おつかい', en: 'The Mystery Egg Errand' },
  zone_ids: ['new-bark-town', 'route-30'],
  steps: [
    { step_id: 'sent_by_elm', label: { jp: 'いく', en: 'Go' }, target_zone_id: 'route-30' },
    { step_id: 'egg_received', label: { jp: 'かえろう', en: 'Head back' }, target_zone_id: 'new-bark-town' },
    { step_id: 'egg_delivered', label: { jp: 'あずけた', en: 'Delivered' }, target_zone_id: 'new-bark-town' },
  ],
}

function stateWith(patch: Partial<PlayerState>): PlayerState {
  return { ...defaultPlayerState(), ...patch }
}

const questsById = (id: string) => (id === 'mystery_egg_errand' ? MYSTERY_EGG : null)

describe('buildQuestJournal — quêtes en cours uniquement', () => {
  it('une quête en cours : nom jp/en, label de l’étape courante, zone cible', () => {
    const state = stateWith({
      quest_progress: {
        mystery_egg_errand: { current_step: 'egg_received', step_entered_at: '2026-07-30T10:00:00.000Z' },
      },
    })
    expect(buildQuestJournal(state, questsById)).toEqual([
      {
        quest_id: 'mystery_egg_errand',
        name: MYSTERY_EGG.name,
        step: { jp: 'かえろう', en: 'Head back' },
        target_zone_id: 'new-bark-town',
      },
    ])
  })

  it('la quête implicite lessons-<zone> (aucun fichier) est ignorée', () => {
    const state = stateWith({
      quest_progress: {
        'lessons-new-bark-town': { current_step: 'lesson-2', step_entered_at: '2026-07-30T09:00:00.000Z' },
        mystery_egg_errand: { current_step: 'sent_by_elm', step_entered_at: '2026-07-30T10:00:00.000Z' },
      },
    })
    const rows = buildQuestJournal(state, questsById)
    expect(rows.map(r => r.quest_id)).toEqual(['mystery_egg_errand'])
  })

  it('une quête terminée (completed_quests) ne figure plus', () => {
    const state = stateWith({
      quest_progress: {
        mystery_egg_errand: { current_step: 'egg_delivered', step_entered_at: '2026-07-30T11:00:00.000Z' },
      },
      completed_quests: ['mystery_egg_errand'],
    })
    expect(buildQuestJournal(state, questsById)).toEqual([])
  })

  it('tri par ancienneté de l’étape courante (la plus ancienne d’abord)', () => {
    const other: QuestFile = {
      quest_id: 'other_quest',
      name: { jp: 'べつの　クエスト', en: 'Other' },
      zone_ids: [],
      steps: [{ step_id: 's1', label: { jp: 'やる', en: 'Do' } }],
    }
    const state = stateWith({
      quest_progress: {
        mystery_egg_errand: { current_step: 'sent_by_elm', step_entered_at: '2026-07-30T12:00:00.000Z' },
        other_quest: { current_step: 's1', step_entered_at: '2026-07-30T08:00:00.000Z' },
      },
    })
    const rows = buildQuestJournal(state, id =>
      id === 'other_quest' ? other : questsById(id)
    )
    expect(rows.map(r => r.quest_id)).toEqual(['other_quest', 'mystery_egg_errand'])
    // Étape sans target_zone_id → null
    expect(rows[0].target_zone_id).toBeNull()
  })

  it('étape inconnue du fichier (contenu désynchronisé) → ligne sautée, jamais un crash', () => {
    const state = stateWith({
      quest_progress: {
        mystery_egg_errand: { current_step: 'ghost_step', step_entered_at: '2026-07-30T10:00:00.000Z' },
      },
    })
    expect(buildQuestJournal(state, questsById)).toEqual([])
  })
})

// ── Journal de lecture ────────────────────────────────────────────────────────

const TEXTS = [
  {
    text_id: 'lyra_mail_new_bark',
    title: { jp: 'コハルからの　メール', en: 'A Mail from Lyra' },
    zone_id: 'new-bark-town',
    npc_ref: null,
    found_object_ref: 'player_pc_new_bark',
    event_ref: null,
  },
  {
    text_id: 'elm_great_text_new_bark',
    title: { jp: '漢字の　庭', en: 'The Kanji Garden' },
    zone_id: 'new-bark-town',
    npc_ref: 'prof_elm_lab',
    found_object_ref: null,
    event_ref: null,
  },
  {
    text_id: 'johto_entrance_sign_route29',
    title: { jp: 'みちの　かんばん', en: 'The Road Sign' },
    zone_id: 'route-29',
    npc_ref: null,
    found_object_ref: 'sign_johto_entrance_route29',
    event_ref: null,
  },
]

describe('buildReadingJournal — statuts blanc/doré/en-cours/non-découvert', () => {
  it('complété sans gold_at → read (blanc) ; gold_at → gold (doré)', () => {
    const rows = buildReadingJournal(
      TEXTS,
      ['lyra_mail_new_bark', 'johto_entrance_sign_route29'],
      [
        { text_id: 'lyra_mail_new_bark', gold_at: null },
        { text_id: 'johto_entrance_sign_route29', gold_at: '2026-07-30T10:00:00.000Z' },
      ]
    )
    expect(rows.find(r => r.text_id === 'lyra_mail_new_bark')!.status).toBe('read')
    expect(rows.find(r => r.text_id === 'johto_entrance_sign_route29')!.status).toBe('gold')
  })

  it('débloqué mais quiz non fini → in_progress (rouvrable)', () => {
    const rows = buildReadingJournal(TEXTS, ['lyra_mail_new_bark'], [])
    expect(rows.find(r => r.text_id === 'lyra_mail_new_bark')!.status).toBe('in_progress')
  })

  it('non débloqué → undiscovered, avec l’indice du porteur (npc_ref prioritaire, sinon found_object_ref)', () => {
    const rows = buildReadingJournal(TEXTS, [], [])
    const elm = rows.find(r => r.text_id === 'elm_great_text_new_bark')!
    expect(elm.status).toBe('undiscovered')
    expect(elm.holder_ref).toBe('prof_elm_lab')
    expect(elm.holder_kind).toBe('npc')
    const mail = rows.find(r => r.text_id === 'lyra_mail_new_bark')!
    expect(mail.holder_ref).toBe('player_pc_new_bark')
    expect(mail.holder_kind).toBe('object')
  })

  it('l’ordre des textes fournis (ordre du voyage) est conservé', () => {
    const rows = buildReadingJournal(TEXTS, [], [])
    expect(rows.map(r => r.text_id)).toEqual([
      'lyra_mail_new_bark',
      'elm_great_text_new_bark',
      'johto_entrance_sign_route29',
    ])
  })

  it('une complétion orpheline (texte hors zones fournies) est ignorée', () => {
    const rows = buildReadingJournal(TEXTS, ['ghost_text'], [{ text_id: 'ghost_text', gold_at: null }])
    expect(rows).toHaveLength(3)
    expect(rows.every(r => r.text_id !== 'ghost_text')).toBe(true)
  })
})

// ── Sac ───────────────────────────────────────────────────────────────────────

const LABELS: BagItemLabels = {
  categories: [
    { id: 'key_items', jp: 'たいせつなもの' },
    { id: 'tools', jp: 'どうぐ' },
    { id: 'other', jp: 'そのほか' },
  ],
  items: {
    mystery_egg: { jp: 'ふしぎな　タマゴ', category: 'key_items' },
    pokegear: { jp: 'ポケギア', category: 'key_items' },
    old_rod: { jp: 'ボロの　つりざお', category: 'tools' },
  },
}

describe('groupBagItems — inventaire par catégorie', () => {
  it('groupe par catégorie dans l’ordre déclaré, catégories vides omises', () => {
    const grouped = groupBagItems({ old_rod: 1, mystery_egg: 1, pokegear: 1 }, LABELS)
    expect(grouped.map(c => c.id)).toEqual(['key_items', 'tools'])
    expect(grouped[0].jp).toBe('たいせつなもの')
    expect(grouped[0].items.map(i => i.item_id)).toEqual(['mystery_egg', 'pokegear'])
    expect(grouped[1].items).toEqual([{ item_id: 'old_rod', jp: 'ボロの　つりざお', quantity: 1 }])
  })

  it('item hors registre → catégorie other, libellé = item_id (repli dev, documenté)', () => {
    const grouped = groupBagItems({ unknown_thing: 3 }, LABELS)
    expect(grouped).toEqual([
      { id: 'other', jp: 'そのほか', items: [{ item_id: 'unknown_thing', jp: 'unknown_thing', quantity: 3 }] },
    ])
  })

  it('quantité 0 ou négative → item omis ; inventaire vide → aucune catégorie', () => {
    expect(groupBagItems({ mystery_egg: 0 }, LABELS)).toEqual([])
    expect(groupBagItems({}, LABELS)).toEqual([])
  })
})

// ── Kanjidex ──────────────────────────────────────────────────────────────────

describe('kanjidexStatusMap — maîtrisé = les DEUX facettes à stabilité ≥ 14 j', () => {
  it('seuil du PRD (14, plus jamais 30)', () => {
    expect(MASTERED_STABILITY_DAYS).toBe(14)
  })

  it('deux facettes ≥ 14 → mastered ; une seule → studied ; aucune carte → absent', () => {
    const map = kanjidexStatusMap([
      { item_id: '一', facet: 'sens', stability: 20 },
      { item_id: '一', facet: 'lecture', stability: 14 },
      { item_id: '二', facet: 'sens', stability: 20 },
      { item_id: '二', facet: 'lecture', stability: 13.9 },
      { item_id: '人', facet: 'sens', stability: 0.4 },
      { item_id: '人', facet: 'lecture', stability: 0.4 },
    ])
    expect(map['一']).toBe('mastered')
    expect(map['二']).toBe('studied')
    expect(map['人']).toBe('studied')
    expect(map['八']).toBeUndefined()
  })

  it('une seule carte présente (l’autre facette manque) → studied, jamais mastered', () => {
    const map = kanjidexStatusMap([{ item_id: '一', facet: 'sens', stability: 99 }])
    expect(map['一']).toBe('studied')
  })
})

// ── Libellés jp de zones ──────────────────────────────────────────────────────

describe('zoneJpLabel', () => {
  const labels = { 'new-bark-town': { jp: 'ワカバタウン' } }

  it('slug connu → libellé jp du registre', () => {
    expect(zoneJpLabel('new-bark-town', labels)).toBe('ワカバタウン')
  })

  it('route-N → 「Nばんどうろ」 dérivé', () => {
    expect(zoneJpLabel('route-29', labels)).toBe('29ばんどうろ')
    expect(zoneJpLabel('route-30', labels)).toBe('30ばんどうろ')
  })

  it('slug inconnu → repli lisible (prettify, jamais un crash)', () => {
    expect(zoneJpLabel('dark-cave', labels)).toBe('Dark Cave')
  })
})
