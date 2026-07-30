import { describe, it, expect } from 'vitest'
import {
  getTrainerRank, getLessonQueue, getAvailableKanji,
  type Lesson,
} from './progression-engine'

describe('getTrainerRank', () => {
  it('returns level 1 for 0 kanji studied', () => {
    const rank = getTrainerRank(0)
    expect(rank.level).toBe(1)
    expect(rank.character).toBe('Gamin')
    expect(rank.rank).toBe('NPC')
  })

  it('stays at level 1 just below threshold (49)', () => {
    expect(getTrainerRank(49).level).toBe(1)
  })

  it('advances to level 2 at threshold (50)', () => {
    const rank = getTrainerRank(50)
    expect(rank.level).toBe(2)
    expect(rank.character).toBe('Fillette')
    expect(rank.rank).toBe('NPC')
  })

  // All 25 lower-boundary values from the PRD rank table
  const boundaries: [number, number, string, string][] = [
    [0,    1,  'Gamin',          'NPC'],
    [50,   2,  'Fillette',       'NPC'],
    [100,  3,  'Attrapeur',      'Beginner Trainer'],
    [150,  4,  'Randonneur',     'Beginner Trainer'],
    [200,  5,  'Pêcheur',        'Beginner Trainer'],
    [250,  6,  'Campeur',        'Intermediate Trainer'],
    [300,  7,  'Marin',          'Intermediate Trainer'],
    [370,  8,  'Jongleur',       'Intermediate Trainer'],
    [450,  9,  'Sage',           'Advanced Trainer'],
    [550,  10, 'Silver (Rival)', 'Rival'],
    [650,  11, 'Falkner',        '師範 — Flying'],
    [750,  12, 'Bugsy',          '師範 — Bug'],
    [850,  13, 'Whitney',        '師範 — Normal'],
    [950,  14, 'Morty',          '師範 — Ghost'],
    [1050, 15, 'Chuck',          '師範 — Fighting'],
    [1150, 16, 'Jasmine',        '師範 — Steel'],
    [1250, 17, 'Pryce',          '師範 — Ice'],
    [1350, 18, 'Clair',          '師範 — Dragon'],
    [1500, 19, 'Will',           'Elite Four — Psychic'],
    [1650, 20, 'Koga',           'Elite Four — Poison'],
    [1800, 21, 'Bruno',          'Elite Four — Fighting'],
    [1900, 22, 'Karen',          'Elite Four — Dark'],
    [2000, 23, 'Lance',          'Champion of Johto'],
    [2100, 24, 'Professor Elm',  'Pokémon Master'],
    [2136, 25, 'Red',            'Legend'],
  ]

  it.each(boundaries)(
    'studied=%i → level %i (%s, %s)',
    (studied, expectedLevel, expectedCharacter, expectedRank) => {
      const rank = getTrainerRank(studied)
      expect(rank.level).toBe(expectedLevel)
      expect(rank.character).toBe(expectedCharacter)
      expect(rank.rank).toBe(expectedRank)
    }
  )

  it('returns level 24 just before Red threshold (2135)', () => {
    expect(getTrainerRank(2135).level).toBe(24)
  })

  it('returns level 25 for counts beyond 2136', () => {
    expect(getTrainerRank(9999).level).toBe(25)
  })
})

describe('getLessonQueue', () => {
  const lessonA: Lesson = {
    id: 'lesson-a',
    title: 'A',
    bodyMarkdown: '',
    johtoZone: 'new-bark-town',
    kanjiIds: ['一', '二'],
    quizQuestions: [],
  }
  const lessonB: Lesson = {
    id: 'lesson-b',
    title: 'B',
    bodyMarkdown: '',
    johtoZone: 'new-bark-town',
    kanjiIds: ['三', '四'],
    quizQuestions: [],
  }

  it('returns all lessons when all kanji are available and none are completed', () => {
    const result = getLessonQueue(['一', '二', '三', '四'], [], [lessonA, lessonB], [])
    expect(result).toHaveLength(2)
    expect(result.map(l => l.id)).toEqual(['lesson-a', 'lesson-b'])
  })

  it('excludes a lesson whose kanji are not all available', () => {
    // lessonB needs 三 and 四; only 一, 二, 三 are available → lessonB excluded
    const result = getLessonQueue(['一', '二', '三'], [], [lessonA, lessonB], [])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('lesson-a')
  })

  it('excludes completed lessons even when all their kanji are available', () => {
    const result = getLessonQueue(['一', '二', '三', '四'], ['lesson-a'], [lessonA, lessonB], [])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('lesson-b')
  })

  it('returns empty array when no lessons qualify', () => {
    const result = getLessonQueue([], [], [lessonA, lessonB], [])
    expect(result).toHaveLength(0)
  })

  it('sorts lessons containing queued kanji before others', () => {
    // lessonB contains 三; queuing 三 should move lessonB first
    const result = getLessonQueue(['一', '二', '三', '四'], [], [lessonA, lessonB], ['三'])
    expect(result[0].id).toBe('lesson-b')
    expect(result[1].id).toBe('lesson-a')
  })

  it('keeps non-queued order when no lesson contains queued kanji', () => {
    const result = getLessonQueue(['一', '二', '三', '四'], [], [lessonA, lessonB], ['五'])
    expect(result.map(l => l.id)).toEqual(['lesson-a', 'lesson-b'])
  })
})

describe('getAvailableKanji', () => {
  it('returns kanji with no components when studiedSet is empty', () => {
    const result = getAvailableKanji(
      [],
      [{ id: '一', jlptLevel: 'N5' }],
      {}
    )
    expect(result).toContain('一')
  })

  it('excludes kanji already in studiedSet', () => {
    const result = getAvailableKanji(
      ['一'],
      [{ id: '一', jlptLevel: 'N5' }],
      {}
    )
    expect(result).not.toContain('一')
  })

  it('blocks kanji whose component is not yet studied', () => {
    // 明 = 日 + 月 ; neither studied
    const result = getAvailableKanji(
      [],
      [{ id: '明', jlptLevel: 'N4' }, { id: '日', jlptLevel: 'N5' }, { id: '月', jlptLevel: 'N5' }],
      { '明': ['日', '月'] }
    )
    expect(result).not.toContain('明')
    expect(result).toContain('日')
    expect(result).toContain('月')
  })

  it('unblocks kanji once all its components are studied', () => {
    const result = getAvailableKanji(
      ['日', '月'],
      [{ id: '明', jlptLevel: 'N4' }, { id: '日', jlptLevel: 'N5' }, { id: '月', jlptLevel: 'N5' }],
      { '明': ['日', '月'] }
    )
    expect(result).toContain('明')
  })

  it('returns N5 kanji before N4', () => {
    const result = getAvailableKanji(
      [],
      [{ id: '語', jlptLevel: 'N4' }, { id: '火', jlptLevel: 'N5' }],
      {}
    )
    expect(result.indexOf('火')).toBeLessThan(result.indexOf('語'))
  })

  it('returns unranked kanji last', () => {
    const result = getAvailableKanji(
      [],
      [{ id: '鬱', jlptLevel: null }, { id: '火', jlptLevel: 'N5' }, { id: '語', jlptLevel: 'N4' }],
      {}
    )
    expect(result[result.length - 1]).toBe('鬱')
  })
})

// ── Boucle quotidienne SRS (issue 06) ─────────────────────────────────────────

import {
  DAILY_CATCH_UP_CAP,
  localDayKey,
  localDayStart,
  getDailySRSStatus,
  buildDailyQueue,
  needsWordCardPreface,
} from './progression-engine'

describe('localDayKey / localDayStart', () => {
  it('UTC (offset 0) : la clé est la date UTC', () => {
    expect(localDayKey(new Date('2026-07-30T14:00:00Z'), 0)).toBe('2026-07-30')
    expect(localDayKey(new Date('2026-07-30T23:59:59Z'), 0)).toBe('2026-07-30')
    expect(localDayStart(new Date('2026-07-30T14:00:00Z'), 0).toISOString()).toBe(
      '2026-07-30T00:00:00.000Z'
    )
  })

  it('offset négatif (est de Greenwich, ex. Japon UTC+9 → -540) : le jour local est en avance', () => {
    // 2026-07-30 16:00 UTC = 2026-07-31 01:00 au Japon
    expect(localDayKey(new Date('2026-07-30T16:00:00Z'), -540)).toBe('2026-07-31')
    // Minuit local japonais du 31 = 15:00 UTC le 30
    expect(localDayStart(new Date('2026-07-30T16:00:00Z'), -540).toISOString()).toBe(
      '2026-07-30T15:00:00.000Z'
    )
  })

  it('offset positif (ouest, ex. New York UTC-4 → 240) : le jour local est en retard', () => {
    // 2026-07-30 02:00 UTC = 2026-07-29 22:00 à New York
    expect(localDayKey(new Date('2026-07-30T02:00:00Z'), 240)).toBe('2026-07-29')
  })

  it('borne l’offset client à ±14 h (valeur adverse)', () => {
    // Offset délirant de +48 h → borné à +14 h : 2026-07-30 02:00 UTC − 14 h = 2026-07-29
    expect(localDayKey(new Date('2026-07-30T02:00:00Z'), 48 * 60)).toBe('2026-07-29')
    expect(localDayKey(new Date('2026-07-30T02:00:00Z'), -48 * 60)).toBe('2026-07-30')
  })
})

describe('getDailySRSStatus', () => {
  const NOW = new Date('2026-07-31T08:00:00Z')
  const today = { serverNow: NOW, tzOffsetMinutes: 0 }
  const due = (iso: string) => ({ next_review_at: iso })
  const review = (iso: string) => ({ reviewed_at: iso })

  it('file vide, aucune review : ✓ immédiat (chemin no_cards_due)', () => {
    const status = getDailySRSStatus([], [], today)
    expect(status).toEqual({ sessionDone: true, cardsPending: 0, reviewedToday: 0 })
  })

  it('cartes dues → session à faire ; cartes futures pas comptées', () => {
    const cards = [
      due('2026-07-31T00:00:00Z'), // due (minuit passé)
      due('2026-07-31T08:00:00Z'), // due (pile maintenant)
      due('2026-08-01T00:00:00Z'), // demain — pas pendante
    ]
    const status = getDailySRSStatus([], cards, today)
    expect(status.sessionDone).toBe(false)
    expect(status.cardsPending).toBe(2)
  })

  it('file vidée après des reviews : ✓ (chemin session)', () => {
    const reviews = [review('2026-07-31T07:00:00Z'), review('2026-07-31T07:01:00Z')]
    const status = getDailySRSStatus(reviews, [], today)
    expect(status).toEqual({ sessionDone: true, cardsPending: 0, reviewedToday: 2 })
  })

  it('plafond de rattrapage : 200 cartes notées ce jour → ✓ malgré le backlog', () => {
    const reviews = Array.from({ length: DAILY_CATCH_UP_CAP }, (_, i) =>
      review(new Date(Date.parse('2026-07-31T06:00:00Z') + i * 1000).toISOString())
    )
    const backlog = Array.from({ length: 150 }, () => due('2026-07-25T00:00:00Z'))
    const status = getDailySRSStatus(reviews, backlog, today)
    expect(status.sessionDone).toBe(true)
    expect(status.reviewedToday).toBe(200)
    expect(status.cardsPending).toBe(150) // le reste du backlog s'étale
  })

  it('199 reviews + backlog : pas encore ✓', () => {
    const reviews = Array.from({ length: 199 }, () => review('2026-07-31T06:00:00Z'))
    const backlog = [due('2026-07-25T00:00:00Z')]
    expect(getDailySRSStatus(reviews, backlog, today).sessionDone).toBe(false)
  })

  it('les reviews d’hier ne comptent pas dans le jour courant', () => {
    const reviews = [review('2026-07-30T23:59:00Z'), review('2026-07-31T00:01:00Z')]
    const status = getDailySRSStatus(reviews, [due('2026-07-31T00:00:00Z')], today)
    expect(status.reviewedToday).toBe(1)
  })

  it('le bucket du jour suit le minuit LOCAL (offset client)', () => {
    // Japon (offset -540) : 2026-07-30T16:00Z = 31/07 01:00 local.
    // Une review à 14:30Z (23:30 local le 30) est d'hier ;
    // une review à 15:30Z (00:30 local le 31) est d'aujourd'hui.
    const jpToday = { serverNow: new Date('2026-07-30T16:00:00Z'), tzOffsetMinutes: -540 }
    const reviews = [review('2026-07-30T14:30:00Z'), review('2026-07-30T15:30:00Z')]
    expect(getDailySRSStatus(reviews, [], jpToday).reviewedToday).toBe(1)
  })

  it('✓ déjà posé (daily_status) : acquis jusqu’à la bascule de jour, même si de nouvelles cartes deviennent dues', () => {
    const status = getDailySRSStatus([], [due('2026-07-31T00:00:00Z')], today, true)
    expect(status.sessionDone).toBe(true)
    expect(status.cardsPending).toBe(1)
  })
})

describe('buildDailyQueue', () => {
  it('mélange reviews dues et nouvelles cartes en UNE file (pas de bloc reviews-d’abord)', () => {
    // 5 reviews puis 5 nouvelles dans l'ordre d'entrée : la sortie ne doit
    // pas préserver ce bloc. LCG déterministe pour un test reproductible.
    let seed = 42
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) % 2 ** 32
      return seed / 2 ** 32
    }
    const input = ['r1', 'r2', 'r3', 'r4', 'r5', 'n1', 'n2', 'n3', 'n4', 'n5']
    const output = buildDailyQueue(input, 0, rng)
    expect([...output].sort()).toEqual([...input].sort()) // permutation exacte
    expect(output).not.toEqual(input) // pas l'ordre stocké
    // Au moins une nouvelle carte apparaît avant la dernière review
    const lastReview = Math.max(...['r1', 'r2', 'r3', 'r4', 'r5'].map(r => output.indexOf(r)))
    const firstNew = Math.min(...['n1', 'n2', 'n3', 'n4', 'n5'].map(n => output.indexOf(n)))
    expect(firstNew).toBeLessThan(lastReview)
  })

  it('ne mute pas le tableau d’entrée', () => {
    const input = ['a', 'b', 'c']
    buildDailyQueue(input, 0, () => 0)
    expect(input).toEqual(['a', 'b', 'c'])
  })

  it('plafonne la file à 200 − déjà notées aujourd’hui (rattrapage)', () => {
    const backlog = Array.from({ length: 250 }, (_, i) => `c${i}`)
    expect(buildDailyQueue(backlog, 0).length).toBe(200)
    expect(buildDailyQueue(backlog, 150).length).toBe(50)
    expect(buildDailyQueue(backlog, 200).length).toBe(0)
    expect(buildDailyQueue(backlog, 500).length).toBe(0)
  })

  it('file plus courte que le plafond : tout passe', () => {
    expect(buildDailyQueue(['a', 'b'], 0).length).toBe(2)
  })
})

describe('needsWordCardPreface (engine-contract § 8 — inactif au jalon 1, prévu)', () => {
  it('jamais pour une carte kanji', () => {
    expect(needsWordCardPreface({ item_type: 'kanji', item_id: '一' }, new Set())).toBe(false)
  })

  it('carte word sans aucune review pour ce mot → préface', () => {
    expect(needsWordCardPreface({ item_type: 'word', item_id: 'w-123' }, new Set())).toBe(true)
  })

  it('carte word dont le mot a déjà une review (n’importe quelle facette) → pas de préface', () => {
    expect(needsWordCardPreface({ item_type: 'word', item_id: 'w-123' }, new Set(['w-123']))).toBe(
      false
    )
  })
})
