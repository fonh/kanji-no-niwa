// Parser des lectures inline (ADR-0002, CONTEXT.md « Inline Reading »).
// TDD : écrits avant src/lib/inline-reading.ts.
import { describe, it, expect } from 'vitest'
import {
  parseInlineReadings,
  stripReadings,
  totalBaseLength,
  sliceSegments,
  type ReadingSegment,
} from './inline-reading'

const seg = (base: string, reading?: string): ReadingSegment =>
  reading === undefined ? { base } : { base, reading }

describe('parseInlineReadings', () => {
  it('chaîne vide → aucun segment', () => {
    expect(parseInlineReadings('')).toEqual([])
  })

  it('texte sans lecture → un seul segment sans reading', () => {
    expect(parseInlineReadings('おかえりなさい。')).toEqual([seg('おかえりなさい。')])
  })

  it('une lecture simple collée à son run de kanji', () => {
    expect(parseInlineReadings('道場（どうじょう）')).toEqual([seg('道場', 'どうじょう')])
  })

  it('lecture au milieu d’une phrase', () => {
    expect(parseInlineReadings('あつさの　話（はなし）を　してた')).toEqual([
      seg('あつさの　'),
      seg('話', 'はなし'),
      seg('を　してた'),
    ])
  })

  it('runs multiples dans la même phrase', () => {
    expect(parseInlineReadings('今日（きょう）は　天気（てんき）が　いい')).toEqual([
      seg('今日', 'きょう'),
      seg('は　'),
      seg('天気', 'てんき'),
      seg('が　いい'),
    ])
  })

  it('le run couvert est le run de kanji contigu maximal (mot entier, pas kanji par kanji)', () => {
    // 研究所（けんきゅうじょ） : la lecture couvre les 3 kanji du run
    expect(parseInlineReadings('研究所（けんきゅうじょ）へ')).toEqual([
      seg('研究所', 'けんきゅうじょ'),
      seg('へ'),
    ])
  })

  it('kanji sans lecture → segment plein texte (le contenu doit toujours en fournir, mais le parser ne crashe pas)', () => {
    expect(parseInlineReadings('火が　すき')).toEqual([seg('火が　すき')])
  })

  it('parenthèses pleine largeur SANS kanji devant = vraies parenthèses de texte, conservées', () => {
    expect(parseInlineReadings('そう（ほんとう）です')).toEqual([seg('そう（ほんとう）です')])
  })

  it('parenthèses pleine largeur dont le contenu n’est pas kana = pas une lecture', () => {
    expect(parseInlineReadings('道場（DOJO）へ')).toEqual([seg('道場（DOJO）へ')])
  })

  it('noms de personnages en katakana : aucun faux positif', () => {
    expect(parseInlineReadings('エルムはかせが、あなたを　さがしていましたよ。')).toEqual([
      seg('エルムはかせが、あなたを　さがしていましたよ。'),
    ])
  })

  it('nom de personnage avec kanji + lecture (exemptés du budget, même règle Y)', () => {
    expect(parseInlineReadings('銀（ぎん）と　いいます')).toEqual([
      seg('銀', 'ぎん'),
      seg('と　いいます'),
    ])
  })

  it('lectures consécutives sans texte entre elles', () => {
    expect(parseInlineReadings('火（ひ）水（みず）')).toEqual([
      seg('火', 'ひ'),
      seg('水', 'みず'),
    ])
  })

  it('répétition 々 incluse dans le run', () => {
    expect(parseInlineReadings('時々（ときどき）くる')).toEqual([
      seg('時々', 'ときどき'),
      seg('くる'),
    ])
  })

  it('katakana ー et ・ acceptés dans la lecture', () => {
    expect(parseInlineReadings('道場（ドージョー）')).toEqual([seg('道場', 'ドージョー')])
  })

  it('phrase réelle du contenu (joey_route30)', () => {
    expect(parseInlineReadings('え、あつさの　話（はなし）を　してたんだけど……')).toEqual([
      seg('え、あつさの　'),
      seg('話', 'はなし'),
      seg('を　してたんだけど……'),
    ])
  })
})

describe('stripReadings', () => {
  it('retire uniquement les vraies lectures', () => {
    expect(stripReadings('今日（きょう）は　あついですね。')).toBe('今日は　あついですね。')
  })

  it('les parenthèses de texte survivent', () => {
    expect(stripReadings('そう（ほんとう）です')).toBe('そう（ほんとう）です')
  })

  it('texte sans lecture inchangé', () => {
    expect(stripReadings('もしもし、ジョーイです！')).toBe('もしもし、ジョーイです！')
  })
})

describe('totalBaseLength / sliceSegments (machine à écrire)', () => {
  const segments = parseInlineReadings('今日（きょう）は　あつい')

  it('totalBaseLength compte les caractères visibles (bases), pas les lectures', () => {
    expect(totalBaseLength(segments)).toBe('今日は　あつい'.length)
  })

  it('slice à 0 → rien', () => {
    expect(sliceSegments(segments, 0)).toEqual([])
  })

  it('slice partiel dans un segment à lecture → base partielle sans lecture (le ruby n’apparaît que complet)', () => {
    expect(sliceSegments(segments, 1)).toEqual([seg('今')])
  })

  it('segment à lecture complet → lecture conservée', () => {
    expect(sliceSegments(segments, 2)).toEqual([seg('今日', 'きょう')])
  })

  it('slice au-delà du total → tous les segments', () => {
    expect(sliceSegments(segments, 99)).toEqual(segments)
  })

  it('slice au milieu du texte plat', () => {
    expect(sliceSegments(segments, 4)).toEqual([seg('今日', 'きょう'), seg('は　')])
  })
})
