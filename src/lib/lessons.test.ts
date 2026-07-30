// Règle leçon-ou-blocage + complétion (issue 05) — tests écrits AVANT le
// module (TDD). Sémantique de référence : CONTEXT.md « Lesson NPC »,
// PRD § Leçons (« Ordre des leçons imposé », « Coupure aller-retour »).
import { describe, it, expect } from 'vitest'
import {
  defaultPlayerState,
  type PlayerState,
  type QuestStepsIndex,
} from './condition-effect'
import { getLessonsForZone, type LessonEntry } from './content'
import {
  buildNewCards,
  getLessonBook,
  lessonId,
  lessonQuestId,
  lessonQuestSteps,
  lessonStepId,
  nextLessonInZone,
  nextMorningDue,
  resolveLessonInteraction,
  withLessonQuestSteps,
} from './lessons'

const NOW = new Date('2026-07-29T14:00:00Z')

const EGG_STEPS: QuestStepsIndex = {
  mystery_egg_errand: ['sent_by_elm', 'egg_received', 'egg_delivered'],
}

const elmLessons = getLessonsForZone('new-bark-town')

function ctxFor(lessons: LessonEntry[], zoneId = 'new-bark-town') {
  return { questSteps: withLessonQuestSteps(EGG_STEPS, zoneId, lessons), now: NOW }
}

/** État joueur avec la quête de l'œuf à `eggStep` et `n` leçons de la zone
 * complétées (quête implicite + completed_lessons, comme la complétion réelle). */
function stateWith(eggStep: string | null, lessonsDone: number, zoneId = 'new-bark-town'): PlayerState {
  const state = defaultPlayerState()
  if (eggStep) {
    state.quest_progress.mystery_egg_errand = { current_step: eggStep, step_entered_at: NOW.toISOString() }
  }
  if (lessonsDone > 0) {
    state.quest_progress[lessonQuestId(zoneId)] = {
      current_step: lessonStepId(lessonsDone),
      step_entered_at: NOW.toISOString(),
    }
    for (let i = 1; i <= lessonsDone; i++) state.completed_lessons.push(lessonId(zoneId, i))
  }
  return state
}

describe('identifiants', () => {
  it('quête implicite, step et id de leçon', () => {
    expect(lessonQuestId('new-bark-town')).toBe('lessons-new-bark-town')
    expect(lessonStepId(3)).toBe('lesson-3')
    expect(lessonId('new-bark-town', 1)).toBe('new-bark-town#1')
  })

  it('lessonQuestSteps suit sequence_index sur le vrai fichier d’Elm', () => {
    expect(lessonQuestSteps(elmLessons)).toEqual([
      'lesson-1',
      'lesson-2',
      'lesson-3',
      'lesson-4',
      'lesson-5',
    ])
  })

  it('withLessonQuestSteps enrichit l’index sans muter l’original', () => {
    const merged = withLessonQuestSteps(EGG_STEPS, 'new-bark-town', elmLessons)
    expect(merged['lessons-new-bark-town']).toHaveLength(5)
    expect(EGG_STEPS['lessons-new-bark-town']).toBeUndefined()
  })
})

describe('nextLessonInZone', () => {
  it('sans progression : la leçon #1', () => {
    expect(nextLessonInZone(elmLessons, stateWith(null, 0))?.sequence_index).toBe(1)
  })

  it('après la #2 : la #3', () => {
    expect(nextLessonInZone(elmLessons, stateWith('sent_by_elm', 2))?.sequence_index).toBe(3)
  })

  it('après la #5 : null (zone finie)', () => {
    expect(nextLessonInZone(elmLessons, stateWith('egg_delivered', 5))).toBe(null)
  })
})

describe('resolveLessonInteraction — règle leçon-ou-blocage (toutes les branches)', () => {
  const ctx = ctxFor(elmLessons)

  it('PNJ sans leçon dans la zone → dialogue ordinaire', () => {
    const res = resolveLessonInteraction('mom_new_bark', elmLessons, stateWith('sent_by_elm', 0), ctx)
    expect(res).toEqual({ kind: 'fallback_dialogue' })
  })

  it('toute première approche d’Elm (quête pas commencée) : leçon #1 verrouillée par ses unlock_conditions → dialogue ordinaire (choix du compagnon)', () => {
    const res = resolveLessonInteraction('prof_elm_lab', elmLessons, stateWith(null, 0), ctx)
    expect(res).toEqual({ kind: 'fallback_dialogue' })
  })

  it('après sent_by_elm : la leçon #1 s’ouvre', () => {
    const res = resolveLessonInteraction('prof_elm_lab', elmLessons, stateWith('sent_by_elm', 0), ctx)
    expect(res.kind).toBe('lesson')
    if (res.kind === 'lesson') expect(res.lesson.sequence_index).toBe(1)
  })

  it('leçons #1-2 faites, œuf pas livré : la #3 (gated egg_delivered) → dialogue ordinaire', () => {
    const res = resolveLessonInteraction('prof_elm_lab', elmLessons, stateWith('sent_by_elm', 2), ctx)
    expect(res).toEqual({ kind: 'fallback_dialogue' })
  })

  it('œuf livré : les leçons #3 à #5 se servent dans l’ordre', () => {
    for (let done = 2; done < 5; done++) {
      const res = resolveLessonInteraction('prof_elm_lab', elmLessons, stateWith('egg_delivered', done), ctx)
      expect(res.kind).toBe('lesson')
      if (res.kind === 'lesson') expect(res.lesson.sequence_index).toBe(done + 1)
    }
  })

  it('les 5 leçons faites → dialogue ordinaire (la relecture passe par le Carnet)', () => {
    const res = resolveLessonInteraction('prof_elm_lab', elmLessons, stateWith('egg_delivered', 5), ctx)
    expect(res).toEqual({ kind: 'fallback_dialogue' })
  })

  // Zone synthétique à deux PNJ-leçon pour la branche « hors d'ordre »
  const twoNpcs: LessonEntry[] = [
    { zone_id: 'test-zone', npc_ref: 'npc_a', sequence_index: 1, kanji_ids: ['一'] },
    { zone_id: 'test-zone', npc_ref: 'npc_b', sequence_index: 2, kanji_ids: ['二'] },
  ]
  const twoCtx = ctxFor(twoNpcs, 'test-zone')

  it('PNJ en avance sur l’ordre → blocked (jamais le dialogue ordinaire)', () => {
    const res = resolveLessonInteraction('npc_b', twoNpcs, stateWith(null, 0, 'test-zone'), twoCtx)
    expect(res).toEqual({ kind: 'blocked' })
  })

  it('hors d’ordre bloque MÊME si la leçon en tête (d’un autre PNJ) est verrouillée', () => {
    const gated: LessonEntry[] = [
      {
        zone_id: 'test-zone',
        npc_ref: 'npc_a',
        sequence_index: 1,
        kanji_ids: ['一'],
        unlock_conditions: [{ type: 'quest_step', quest_id: 'mystery_egg_errand', step: 'sent_by_elm' }],
      },
      { zone_id: 'test-zone', npc_ref: 'npc_b', sequence_index: 2, kanji_ids: ['二'] },
    ]
    const res = resolveLessonInteraction('npc_b', gated, stateWith(null, 0, 'test-zone'), ctxFor(gated, 'test-zone'))
    expect(res).toEqual({ kind: 'blocked' })
  })

  it('sa propre leçon en tête, sans unlock_conditions → leçon', () => {
    const res = resolveLessonInteraction('npc_a', twoNpcs, stateWith(null, 0, 'test-zone'), twoCtx)
    expect(res.kind).toBe('lesson')
  })
})

describe('nextMorningDue — dues à partir du lendemain (minuit local, PRD § Jour calendaire)', () => {
  it('UTC+2 (offset -120), 22 h locales : due au prochain minuit local', () => {
    // 2026-07-29T20:00Z = 22:00 locales → minuit local = 2026-07-29T22:00Z
    const due = nextMorningDue(new Date('2026-07-29T20:00:00Z'), -120)
    expect(due.toISOString()).toBe('2026-07-29T22:00:00.000Z')
  })

  it('jamais le jour même : à 00 h 30 locale, due ~23 h 30 plus tard', () => {
    // UTC+2, 2026-07-29T22:30Z = 00:30 le 30 → due minuit local du 31 = 30T22:00Z
    const due = nextMorningDue(new Date('2026-07-29T22:30:00Z'), -120)
    expect(due.toISOString()).toBe('2026-07-30T22:00:00.000Z')
  })

  it('UTC-5 (offset 300)', () => {
    // 2026-07-29T14:00Z = 09:00 locales → minuit local suivant = 30T05:00Z
    const due = nextMorningDue(new Date('2026-07-29T14:00:00Z'), 300)
    expect(due.toISOString()).toBe('2026-07-30T05:00:00.000Z')
  })

  it('offset client aberrant : borné à ±14 h (jamais une due dans le passé lointain)', () => {
    const due = nextMorningDue(new Date('2026-07-29T14:00:00Z'), 100000)
    const clamped = nextMorningDue(new Date('2026-07-29T14:00:00Z'), 14 * 60)
    expect(due.toISOString()).toBe(clamped.toISOString())
  })
})

describe('buildNewCards — critère d’acceptation : leçon #1 = 12 cartes, toutes dues demain', () => {
  const dueAt = nextMorningDue(NOW, -120)
  const cards = buildNewCards(elmLessons[0].kanji_ids, NOW, dueAt)

  it('2 cartes par kanji (facettes sens/lecture), 6 kanji × 2 = 12', () => {
    expect(elmLessons[0].kanji_ids).toHaveLength(6)
    expect(cards).toHaveLength(12)
    for (const kanji of elmLessons[0].kanji_ids) {
      const facets = cards.filter(c => c.item_id === kanji).map(c => c.facet)
      expect(facets.sort()).toEqual(['lecture', 'sens'])
    }
  })

  it('toutes dues demain matin, item_type kanji, colonnes legacy remplies', () => {
    for (const card of cards) {
      expect(card.next_review_at).toBe(dueAt.toISOString())
      expect(card.item_type).toBe('kanji')
      expect(card.card_type).toBe(card.facet === 'sens' ? 'meaning' : 'reading')
    }
  })

  it('l’état FSRS est une carte New de ts-fsrs due au même moment', () => {
    const fsrsState = cards[0].fsrs_state as { due: Date; reps: number; state: number }
    expect(fsrsState.reps).toBe(0)
    expect(fsrsState.state).toBe(0) // State.New
    expect(new Date(fsrsState.due).toISOString()).toBe(dueAt.toISOString())
  })
})

describe('getLessonBook — lecture seule (consommé par l’issue 09)', () => {
  const zones = [{ zone_id: 'new-bark-town', lessons: elmLessons }]

  it('compteur de complétion par chapitre', () => {
    const book = getLessonBook(zones, stateWith('sent_by_elm', 2), ctxFor(elmLessons))
    expect(book).toHaveLength(1)
    expect(book[0].zone_id).toBe('new-bark-town')
    expect(book[0].completed).toBe(2)
    expect(book[0].total).toBe(5)
  })

  it('états : complétée (contenu visible) / verrouillée / masquée ???', () => {
    // #1-2 faites, œuf pas livré : la #3 est en tête mais gated → locked
    const book = getLessonBook(zones, stateWith('sent_by_elm', 2), ctxFor(elmLessons))
    const lines = book[0].lines
    expect(lines.map(l => l.status)).toEqual(['completed', 'completed', 'locked', 'masked', 'masked'])
    expect(lines[0].kanji_ids).toEqual(['一', '二', '人', '先', '入', '八'])
    expect(lines[0].grammar_id).toBe('N5-001')
    // Le contenu des leçons non complétées ne se révèle jamais (pas de pré-teaching)
    expect(lines[2].kanji_ids).toBe(null)
    expect(lines[3].kanji_ids).toBe(null)
    expect(lines[3].npc_ref).toBe(null)
  })

  it('prochaine leçon disponible : qui (npc_ref), jamais son contenu', () => {
    const book = getLessonBook(zones, stateWith('egg_delivered', 2), ctxFor(elmLessons))
    const next = book[0].lines[2]
    expect(next.status).toBe('next')
    expect(next.npc_ref).toBe('prof_elm_lab')
    expect(next.kanji_ids).toBe(null)
    expect(next.grammar_id).toBe(null)
  })

  it('zone finie : tout est completed', () => {
    const book = getLessonBook(zones, stateWith('egg_delivered', 5), ctxFor(elmLessons))
    expect(book[0].lines.every(l => l.status === 'completed')).toBe(true)
    expect(book[0].completed).toBe(5)
  })
})
