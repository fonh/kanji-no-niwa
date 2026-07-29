import { describe, it, expect } from 'vitest'
import {
  getTrainerRank, getLessonQueue, getAvailableKanji,
  selectQuestionMode, getDispositionChunks, BATTLE_WEIGHTS,
  type Lesson, type QuestionMode,
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

describe('BATTLE_WEIGHTS', () => {
  it('route weights sum to 1', () => {
    const sum = Object.values(BATTLE_WEIGHTS.route).reduce((s, w) => s + w, 0)
    expect(sum).toBeCloseTo(1, 10)
  })

  it('boss weights sum to 1', () => {
    const sum = Object.values(BATTLE_WEIGHTS.boss).reduce((s, w) => s + w, 0)
    expect(sum).toBeCloseTo(1, 10)
  })

  it('boss Disposition weight is > route Disposition weight', () => {
    expect(BATTLE_WEIGHTS.boss.disposition).toBeGreaterThan(BATTLE_WEIGHTS.route.disposition)
  })

  it('boss Disposition is the single dominant mode (> any other boss weight)', () => {
    const { disposition, ...others } = BATTLE_WEIGHTS.boss
    const maxOther = Math.max(...Object.values(others))
    expect(disposition).toBeGreaterThan(maxOther)
  })
})

describe('selectQuestionMode', () => {
  const ALL_MODES: QuestionMode[] = [
    'sens', 'lecture', 'ecriture', 'composition',
    'grammaire', 'conjugaison', 'traduction', 'disposition',
  ]

  it('always returns a valid mode', () => {
    for (let i = 0; i < 50; i++) {
      const mode = selectQuestionMode('route', 10, true)
      expect(ALL_MODES).toContain(mode)
    }
  })

  it('never returns disposition when hasDispositionSentences is false', () => {
    for (let i = 0; i < 200; i++) {
      expect(selectQuestionMode('boss', 10, false)).not.toBe('disposition')
    }
  })

  it('never returns grammaire or conjugaison when encounteredGrammarCount < 5', () => {
    for (let i = 0; i < 200; i++) {
      const mode = selectQuestionMode('boss', 4, true)
      expect(mode).not.toBe('grammaire')
      expect(mode).not.toBe('conjugaison')
    }
  })

  it('still returns a valid mode when both grammar and disposition are unavailable', () => {
    const remaining: QuestionMode[] = ['sens', 'lecture', 'ecriture', 'composition', 'traduction']
    for (let i = 0; i < 100; i++) {
      const mode = selectQuestionMode('boss', 0, false)
      expect(remaining).toContain(mode)
    }
  })

  it('disposition appears more often in boss than route battles (statistical)', () => {
    const N = 1000
    let routeDisp = 0
    let bossDisp = 0
    for (let i = 0; i < N; i++) {
      if (selectQuestionMode('route', 10, true) === 'disposition') routeDisp++
      if (selectQuestionMode('boss', 10, true) === 'disposition') bossDisp++
    }
    expect(bossDisp).toBeGreaterThan(routeDisp * 3)
  })
})

describe('getDispositionChunks', () => {
  it('returns the same elements regardless of order', () => {
    const chunks = ['私は', 'リンゴを', '食べました']
    const shuffled = getDispositionChunks(chunks)
    expect(shuffled.sort()).toEqual([...chunks].sort())
  })

  it('does not mutate the input array', () => {
    const chunks = ['彼女は', '本を', '読んでいます']
    const copy = [...chunks]
    getDispositionChunks(chunks)
    expect(chunks).toEqual(copy)
  })

  it('returns a different order at least sometimes (statistical)', () => {
    const chunks = ['A', 'B', 'C', 'D', 'E', 'F']
    let differentCount = 0
    for (let i = 0; i < 100; i++) {
      const shuffled = getDispositionChunks(chunks)
      if (shuffled.join('') !== chunks.join('')) differentCount++
    }
    expect(differentCount).toBeGreaterThan(80)
  })

  it('returns a single-element array unchanged', () => {
    expect(getDispositionChunks(['一人で'])).toEqual(['一人で'])
  })

  it('returns empty array for empty input', () => {
    expect(getDispositionChunks([])).toEqual([])
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
