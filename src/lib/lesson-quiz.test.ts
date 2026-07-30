// Mini-quiz de fin de leçon (issue 05, PRD § Leçons « Mini-quiz ») — tests
// écrits avant le module. 1 question par kanji (Sens OU Lecture au sort) +
// 1 Grammaire si point présent ; distracteurs tirés globalement dans
// kanji-content ; l'ordre stocké ne reflète jamais la bonne réponse
// (engine-contract § 8).
import { describe, it, expect } from 'vitest'
import kanjiContent from '@/data/kanji-content.json'
import { getGrammarPoint, getLessonsForZone } from './content'
import {
  buildLessonQuiz,
  primaryMeaning,
  primaryReading,
  type KanjiContentMap,
} from './lesson-quiz'

const content = kanjiContent as KanjiContentMap
const lesson1 = getLessonsForZone('new-bark-town')[0]
const grammarN5001 = getGrammarPoint('new-bark-town', 'N5-001')

/** rng déterministe qui rejoue une séquence en boucle. */
function seqRng(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]
}

describe('primaryMeaning / primaryReading', () => {
  it('keyword prioritaire sur meanings[0] (engine-contract § 7)', () => {
    expect(primaryMeaning(content['校'])).toBe('school') // meanings[0] = "exam"
    expect(primaryMeaning(content['一'])).toBe('one') // pas de keyword → meanings[0]
  })

  it('lecture principale : on[0], sinon kun[0] nettoyée (sans . ni -)', () => {
    expect(primaryReading(content['一'])).toBe('イチ')
    expect(primaryReading({ on: [], kun: ['ひと.つ'] })).toBe('ひとつ')
    expect(primaryReading({ on: [], kun: ['ひと-'] })).toBe('ひと')
  })
})

describe('buildLessonQuiz — taille et composition', () => {
  it('leçon #1 réelle : 6 questions kanji + 1 grammaire = 7', () => {
    const quiz = buildLessonQuiz(lesson1, content, grammarN5001, seqRng([0.5]))
    expect(quiz).toHaveLength(7)
    expect(quiz.slice(0, 6).every(q => q.kind === 'sens' || q.kind === 'lecture')).toBe(true)
    expect(quiz[6].kind).toBe('grammaire')
  })

  it('sans point de grammaire : 6 questions', () => {
    const quiz = buildLessonQuiz(lesson1, content, null, seqRng([0.5]))
    expect(quiz).toHaveLength(6)
  })

  it('Sens OU Lecture tiré au sort par kanji', () => {
    // rng < 0.5 sur le tirage de mode → sens ; ≥ 0.5 → lecture
    const allSens = buildLessonQuiz(lesson1, content, null, seqRng([0]))
    expect(allSens.every(q => q.kind === 'sens')).toBe(true)
    const allLecture = buildLessonQuiz(lesson1, content, null, seqRng([0.99]))
    expect(allLecture.every(q => q.kind === 'lecture')).toBe(true)
  })
})

describe('buildLessonQuiz — contenu des questions', () => {
  it('question Sens : prompt = le kanji, bonne réponse = keyword ?? meanings[0]', () => {
    const quiz = buildLessonQuiz(lesson1, content, null, seqRng([0]))
    for (let i = 0; i < quiz.length; i++) {
      const q = quiz[i]
      const kanji = lesson1.kanji_ids[i]
      expect(q.prompt).toBe(kanji)
      expect(q.choices[q.correct_index]).toBe(primaryMeaning(content[kanji]))
    }
  })

  it('question Lecture : bonne réponse = lecture principale', () => {
    const quiz = buildLessonQuiz(lesson1, content, null, seqRng([0.99]))
    for (let i = 0; i < quiz.length; i++) {
      expect(quiz[i].choices[quiz[i].correct_index]).toBe(
        primaryReading(content[lesson1.kanji_ids[i]])
      )
    }
  })

  it('4 choix, distracteurs uniques et jamais égaux à la bonne réponse', () => {
    for (const rngVal of [0, 0.3, 0.7, 0.99]) {
      const quiz = buildLessonQuiz(lesson1, content, grammarN5001, seqRng([rngVal]))
      for (const q of quiz) {
        expect(q.choices).toHaveLength(4)
        expect(new Set(q.choices).size).toBe(4)
      }
    }
  })

  it('question Grammaire : cloze + point_answer + distractors[] du fichier réel', () => {
    const quiz = buildLessonQuiz(lesson1, content, grammarN5001, seqRng([0]))
    const g = quiz[6]
    expect(g.kind).toBe('grammaire')
    expect(g.prompt).toContain('＿＿')
    expect(g.choices[g.correct_index]).toBe('いちばん')
    const example = grammarN5001!.selected_examples.find(e => e.jp_cloze === g.prompt)
    expect(example).toBeDefined()
    for (const d of example!.distractors) expect(g.choices).toContain(d)
  })
})

describe('buildLessonQuiz — mélange (l’ordre stocké ne reflète jamais la réponse)', () => {
  it('correct_index varie selon le rng', () => {
    const positions = new Set<number>()
    for (const seq of [
      [0, 0.1, 0.2, 0.3, 0.0, 0.0, 0.0],
      [0, 0.1, 0.2, 0.3, 0.2, 0.5, 0.9],
      [0, 0.1, 0.2, 0.3, 0.6, 0.1, 0.4],
      [0, 0.1, 0.2, 0.3, 0.9, 0.9, 0.9],
    ]) {
      const quiz = buildLessonQuiz({ kanji_ids: ['一'] }, content, null, seqRng(seq))
      positions.add(quiz[0].correct_index)
    }
    expect(positions.size).toBeGreaterThan(1)
  })
})
