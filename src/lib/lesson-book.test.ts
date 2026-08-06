// Données de l'écran-livre (issue 05) — builders purs testés avant le module.
import { describe, it, expect } from 'vitest'
import kanjiContent from '@/data/kanji-content.json'
import { getGrammarPoint, getGrammarSourceEntry, getLessonsForZone } from './content'
import type { KanjiContentMap } from './lesson-quiz'
import { buildGrammarPage, buildKanjiPages } from './lesson-book'

const content = kanjiContent as KanjiContentMap
const lesson1 = getLessonsForZone('new-bark-town')[0]

describe('buildKanjiPages', () => {
  const pages = buildKanjiPages(lesson1.kanji_ids, content)

  it('une double page par kanji, dans l’ordre du groupe', () => {
    expect(pages.map(p => p.character)).toEqual(['一', '二', '人', '先', '入', '八'])
  })

  it('keyword prioritaire sur meanings[0] (engine-contract § 7)', () => {
    const school = buildKanjiPages(['校'], content)[0]
    expect(school.keyword).toBe('school') // meanings[0] = "exam"
    expect(pages[0].keyword).toBe('one') // fallback meanings[0]
  })

  it('lectures, icône nullable, audio nullable, exemples', () => {
    const first = pages[0]
    expect(first.onReadings).toEqual(['イチ', 'イツ'])
    expect(first.kunReadings).toEqual(['ひと-', 'ひと.つ'])
    expect(first.icon).toBe(null) // icon_ref absent → pas d'illustration forcée
    expect(first.audio).toBe('/audio/kanji/一.mp3')
    expect(first.examples.length).toBeGreaterThan(0)
    // Lecture inline présente (ADR-0002) ; le run couvrant 一 peut être groupé
    // avec un kanji voisin (一緒（いっしょ）, etc.), donc on vérifie la
    // présence d'une lecture plutôt qu'un run exact « 一（ » figé.
    expect(first.examples[0].jp).toContain('一')
    expect(first.examples[0].jp).toContain('（')
  })

  it('kanji sans audio ni exemples : champs null/[] — jamais un crash', () => {
    const bare = buildKanjiPages(['一'], { 一: { meanings: ['one'], on: [], kun: [] } })[0]
    expect(bare.audio).toBe(null)
    expect(bare.examples).toEqual([])
    expect(bare.keyword).toBe('one')
  })
})

describe('buildGrammarPage', () => {
  it('fusionne l’overlay réel et la base Hanabira (title, explication EN, audio)', () => {
    const point = getGrammarPoint('new-bark-town', 'N5-001')!
    const source = getGrammarSourceEntry(point)!
    const page = buildGrammarPage(point, source)
    expect(page.grammarId).toBe('N5-001')
    expect(page.title).toContain('いちばん')
    expect(page.shortExplanation).toContain('superlative')
    // Les exemples viennent de l'overlay (jp avec furigana ADR-0002), l'en
    // et l'audio de la base par source_example_index
    expect(page.examples).toHaveLength(2)
    expect(page.examples[0].jp).toContain('（')
    expect(page.examples[0].en).toContain('sushi')
    expect(page.examples[0].audio).toContain('/audio/japanese/grammar/n5/')
  })

  it('base absente : la page tient sur l’overlay seul (en/audio null)', () => {
    const point = getGrammarPoint('new-bark-town', 'N5-002')!
    const page = buildGrammarPage(point, null)
    expect(page.title).toContain('けれども')
    expect(page.shortExplanation).toBe('')
    expect(page.examples[0].en).toBe(null)
    expect(page.examples[0].audio).toBe(null)
  })
})
