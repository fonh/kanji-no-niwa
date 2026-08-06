// Moteur de combat (issue 07) — tests écrits AVANT src/lib/battle.ts (TDD).
//
// PRD § Système de Combat — Barres de HP : vies = max(2, ceil(q × 0.10)),
// la N-ième erreur est fatale ; § Dresseurs de Route : pool = 50 derniers
// items étudiés, 70 % fenêtre / 30 % historique (ratio annulé si < 50) ;
// § Pas de répétition de contenu : tirage sans remise, remise si épuisé ;
// § Modes indisponibles : gardes d'exclusion + redistribution proportionnelle
// à chaque tirage ; engine-contract § 8 : mélange des choix.

import { describe, it, expect } from 'vitest'
import {
  livesFor,
  getBattlePool,
  drawBattleContent,
  selectBattleMode,
  studiedKanjiInOrder,
  battleTypeForTrainer,
  validReadingsOf,
  kataToHira,
  buildSensQuestion,
  buildLectureQuestion,
  buildSaisieQuestion,
  buildCompositionLexicon,
  buildCompositionQuestion,
  hasComposableTarget,
  buildGrammarQuestion,
  buildBattleScript,
  startProgress,
  applyAnswer,
  accuracyOf,
  isSaisieCorrect,
  exampleWordsOf,
  BATTLE_MODE_WEIGHTS,
  type BattleQuestion,
} from './battle'
import { getLessonsForZone, getGrammarForZone, getCompositionLexiconWords } from './content'
import type { KanjiContentMap } from './lesson-quiz'
import kanjiContentJson from '@/data/kanji-content.json'

const kanjiContent = kanjiContentJson as unknown as KanjiContentMap

/** rng déterministe : rejoue la séquence donnée en boucle. */
function seq(...values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]
}

// ── Vies ──────────────────────────────────────────────────────────────────────

describe('livesFor', () => {
  it('plancher à 2 pour les combats courts (5-8 questions)', () => {
    expect(livesFor(5)).toBe(2)
    expect(livesFor(8)).toBe(2)
  })
  it('Silver #1 (12 questions) = 2 vies', () => {
    expect(livesFor(12)).toBe(2)
  })
  it('bornes de la table PRD : 20→2, 21→3, 24→3, 72→8, 100→10', () => {
    expect(livesFor(20)).toBe(2)
    expect(livesFor(21)).toBe(3)
    expect(livesFor(24)).toBe(3)
    expect(livesFor(72)).toBe(8)
    expect(livesFor(100)).toBe(10)
  })
})

// ── Items étudiés (dérivés de completed_lessons + fichiers de leçons) ─────────

describe('studiedKanjiInOrder', () => {
  it('déplie les leçons complétées dans leur ordre de complétion', () => {
    const items = studiedKanjiInOrder(['new-bark-town#1', 'new-bark-town#2'], getLessonsForZone)
    expect(items).toEqual(['一', '二', '人', '先', '入', '八', '円', '十', '口', '四', '土', '大'])
  })
  it('ignore les entrées inconnues et dédoublonne', () => {
    const items = studiedKanjiInOrder(
      ['zone-inconnue#9', 'new-bark-town#1', 'new-bark-town#1'],
      getLessonsForZone
    )
    expect(items).toEqual(['一', '二', '人', '先', '入', '八'])
  })
})

// ── Pool de combat (fenêtre 50, 70/30) ────────────────────────────────────────

describe('getBattlePool', () => {
  it('moins de 50 items : fenêtre = tout, ratio annulé (historique vide)', () => {
    const pool = getBattlePool(['一', '二', '三'])
    expect(pool.window).toEqual(['一', '二', '三'])
    expect(pool.history).toEqual([])
  })
  it('plus de 50 items : fenêtre = les 50 DERNIERS, historique = le reste', () => {
    const items = Array.from({ length: 60 }, (_, i) => `k${i}`)
    const pool = getBattlePool(items)
    expect(pool.window).toHaveLength(50)
    expect(pool.window[0]).toBe('k10')
    expect(pool.window[49]).toBe('k59')
    expect(pool.history).toEqual(items.slice(0, 10))
  })
})

describe('drawBattleContent', () => {
  const items = Array.from({ length: 60 }, (_, i) => `k${i}`)
  const pool = getBattlePool(items)

  it('rng < 0.7 → tirage dans la fenêtre ; ≥ 0.7 → dans l’historique', () => {
    expect(pool.window).toContain(drawBattleContent(pool, new Set(), seq(0.0, 0.0)))
    expect(pool.history).toContain(drawBattleContent(pool, new Set(), seq(0.9, 0.0)))
  })

  it('sans remise : ne retire jamais un item déjà utilisé tant que la pool n’est pas épuisée', () => {
    const used = new Set<string>()
    for (let i = 0; i < items.length; i++) {
      const item = drawBattleContent(pool, used, Math.random)
      expect(item).not.toBeNull()
      expect(used.has(item!)).toBe(false)
      used.add(item!)
    }
    expect(used.size).toBe(60)
  })

  it('pool épuisée → remise (retourne quand même un item)', () => {
    const used = new Set(items)
    const item = drawBattleContent(pool, used, seq(0.3, 0.5))
    expect(item).not.toBeNull()
    expect(items).toContain(item)
  })

  it('bucket choisi épuisé → retombe sur l’autre bucket', () => {
    const used = new Set(pool.window)
    // rng demande la fenêtre (0.0), entièrement utilisée → historique
    const item = drawBattleContent(pool, used, seq(0.0, 0.5))
    expect(pool.history).toContain(item)
  })
})

// ── Sélection de mode (gardes + redistribution à chaque tirage) ───────────────

describe('selectBattleMode', () => {
  it('les poids route/boss du PRD sont encodés pour les 9 modes fondateurs', () => {
    expect(BATTLE_MODE_WEIGHTS.route.sens).toBe(18)
    expect(BATTLE_MODE_WEIGHTS.route.composition).toBe(8)
    expect(BATTLE_MODE_WEIGHTS.boss.disposition).toBe(18)
    expect(BATTLE_MODE_WEIGHTS.boss.grammaire).toBe(10)
  })

  it('un seul mode disponible → toujours lui', () => {
    for (let i = 0; i < 20; i++) {
      expect(selectBattleMode('route', { sens: true }, Math.random)).toBe('sens')
    }
  })

  it('un mode exclu par sa garde n’est jamais tiré (grammaire sans rencontre)', () => {
    for (let i = 0; i < 200; i++) {
      const mode = selectBattleMode(
        'route',
        { sens: true, lecture: true, saisie: true, composition: true, grammaire: false },
        Math.random
      )
      expect(mode).not.toBe('grammaire')
      expect(['sens', 'lecture', 'saisie', 'composition']).toContain(mode)
    }
  })

  it('redistribution proportionnelle : sens/lecture seuls → seuils 18/33', () => {
    const availability = { sens: true, lecture: true }
    // 18/(18+15) ≈ 0.5454…
    expect(selectBattleMode('route', availability, seq(0.54))).toBe('sens')
    expect(selectBattleMode('route', availability, seq(0.55))).toBe('lecture')
  })

  it('aucun mode disponible → null', () => {
    expect(selectBattleMode('route', {}, Math.random)).toBeNull()
  })
})

describe('battleTypeForTrainer', () => {
  it('Silver = combat narratif (profil boss), dresseurs de route = route', () => {
    expect(battleTypeForTrainer('silver_apparition1_cherrygrove')).toBe('boss')
    expect(battleTypeForTrainer('youngster_joey_route30')).toBe('route')
    expect(battleTypeForTrainer('bug_catcher_don_route30')).toBe('route')
  })
})

// ── Lectures valides / normalisation kana ─────────────────────────────────────

describe('validReadingsOf / kataToHira', () => {
  it('convertit katakana → hiragana', () => {
    expect(kataToHira('イチ')).toBe('いち')
    expect(kataToHira('ひと')).toBe('ひと')
  })
  it('agrège on (hiragana) + kun (avec et sans okurigana, tirets ôtés)', () => {
    const readings = validReadingsOf({ on: ['イチ', 'イツ'], kun: ['ひと-', 'ひと.つ'] })
    expect(readings).toContain('いち')
    expect(readings).toContain('いつ')
    expect(readings).toContain('ひと')
    expect(readings).toContain('ひとつ')
  })
})

// ── Générateurs de questions ──────────────────────────────────────────────────

const POOL_12 = ['一', '二', '人', '先', '入', '八', '円', '十', '口', '四', '土', '大']

describe('buildSensQuestion', () => {
  it('4 sens EN uniques, keyword prioritaire, correct_index cohérent', () => {
    const q = buildSensQuestion('一', kanjiContent, POOL_12, Math.random)
    if (q === null || q.mode !== 'sens') throw new Error('expected sens question')
    expect(q.choices).toHaveLength(4)
    expect(new Set(q.choices).size).toBe(4)
    const entry = kanjiContent['一']
    const correct = entry.keyword ?? entry.meanings[0]
    expect(q.choices[q.correct_index]).toBe(correct)
  })
  it('pool trop petite pour 3 distracteurs → complète depuis le contenu global', () => {
    const q = buildSensQuestion('一', kanjiContent, ['一'], Math.random)
    if (q === null || q.mode !== 'sens') throw new Error('expected sens question')
    expect(q.choices).toHaveLength(4)
  })
})

describe('buildLectureQuestion', () => {
  it('4 lectures hiragana, aucun distracteur n’est une lecture valide de l’item', () => {
    for (let i = 0; i < 20; i++) {
      const q = buildLectureQuestion('一', kanjiContent, POOL_12, Math.random)
      if (q === null || q.mode !== 'lecture') throw new Error('expected lecture question')
      expect(q.choices).toHaveLength(4)
      const valid = validReadingsOf(kanjiContent['一'])
      q.choices.forEach((choice, idx) => {
        expect(choice).toMatch(/^[ぁ-ゖー]+$/) // hiragana pur
        if (idx !== q.correct_index) expect(valid).not.toContain(choice)
      })
      expect(valid).toContain(q.choices[q.correct_index])
    }
  })
})

describe('buildSaisieQuestion / isSaisieCorrect', () => {
  it('prompt = sens EN, accepte on OU kun', () => {
    const q = buildSaisieQuestion('一', kanjiContent)
    if (q === null || q.mode !== 'saisie') throw new Error('expected saisie question')
    expect(q.prompt_en.length).toBeGreaterThan(0)
    expect(isSaisieCorrect('いち', q.accepted)).toBe(true) // on
    expect(isSaisieCorrect('ひとつ', q.accepted)).toBe(true) // kun
    expect(isSaisieCorrect('イチ', q.accepted)).toBe(true) // katakana normalisé
    expect(isSaisieCorrect('いちn', q.accepted)).toBe(false) // latin résiduel
    expect(isSaisieCorrect('に', q.accepted)).toBe(false)
    expect(isSaisieCorrect('', q.accepted)).toBe(false)
  })
  it('finalise le n en suspens (かn → かん)', () => {
    expect(isSaisieCorrect('かn', ['かん'])).toBe(true)
  })
})

describe('composition', () => {
  const lexicon = buildCompositionLexicon(
    [
      { word: '一人', reading: 'ひとり' },
      { word: '二人', reading: 'ふたり' },
      { word: '大人', reading: 'おとな' },
      { word: '入口', reading: 'いりぐち' },
      { word: '人口', reading: 'じんこう' },
    ],
    ['口先']
  )

  it('buildCompositionLexicon : cibles = mots de 2 kanji ; paires valides incluent les mots additionnels', () => {
    expect(lexicon.targets).toHaveLength(5)
    expect(lexicon.validPairs.has('一人')).toBe(true)
    expect(lexicon.validPairs.has('口先')).toBe(true) // exclusion seulement, jamais une cible
    expect(lexicon.targets.some(t => t.word === '口先')).toBe(false)
  })

  it('4 tiles dont EXACTEMENT une paire ordonnée forme un mot du lexique', () => {
    for (let i = 0; i < 30; i++) {
      const q = buildCompositionQuestion(POOL_12, lexicon, new Set(), Math.random)
      if (q === null || q.mode !== 'composition') throw new Error('expected composition question')
      expect(q.tiles).toHaveLength(4)
      expect(new Set(q.tiles).size).toBe(4)
      expect(q.tiles).toContain(q.word[0])
      expect(q.tiles).toContain(q.word[1])
      // exactement une paire ordonnée valide parmi les 12 possibles
      let validCount = 0
      for (const a of q.tiles) {
        for (const b of q.tiles) {
          if (a !== b && lexicon.validPairs.has(a + b)) validCount++
        }
      }
      expect(validCount).toBe(1)
    }
  })

  it('paires déjà tirées exclues (sans remise) ; pool sans paire composable → null', () => {
    const used = new Set(['一人', '二人', '大人', '入口', '人口'])
    // toutes les cibles utilisées → null (le script gère la remise en amont)
    expect(buildCompositionQuestion(POOL_12, lexicon, used, Math.random)).toBeNull()
    expect(buildCompositionQuestion(['先', '八', '円', '十'], lexicon, new Set(), Math.random)).toBeNull()
    expect(hasComposableTarget(POOL_12, lexicon)).toBe(true)
    expect(hasComposableTarget(['先', '八', '円', '十'], lexicon)).toBe(false)
  })

  it('le vrai lexique fichier (yomitan-jlpt) est exploitable et couvre les 12 premiers kanji', () => {
    const words = getCompositionLexiconWords()
    expect(words.length).toBeGreaterThan(1000)
    const real = buildCompositionLexicon(words, exampleWordsOf(kanjiContent))
    expect(hasComposableTarget(POOL_12, real)).toBe(true)
    const q = buildCompositionQuestion(POOL_12, real, new Set(), Math.random)
    expect(q).not.toBeNull()
  })
})

describe('buildGrammarQuestion', () => {
  const points = getGrammarForZone('new-bark-town')
  it('cloze QCM depuis l’overlay réel : point_answer + 3 distracteurs du fichier', () => {
    const point = points.find(p => p.grammar_id === 'N5-001')!
    const q = buildGrammarQuestion(point, Math.random)
    if (q === null || q.mode !== 'grammaire') throw new Error('expected grammaire question')
    expect(q.grammar_id).toBe('N5-001')
    expect(q.cloze).toContain('＿＿')
    expect(q.choices).toHaveLength(4)
    expect(q.choices[q.correct_index]).toBe('いちばん')
    for (const d of ['もっと', 'あまり', 'ぜんぜん', 'すこし']) {
      if (q.choices.includes(d)) expect(q.choices.indexOf(d)).not.toBe(q.correct_index)
    }
  })
  it('l’ordre stocké des choix varie avec le rng (mélange à la construction)', () => {
    const point = points[0]
    const a = buildGrammarQuestion(point, seq(0.01))
    const b = buildGrammarQuestion(point, seq(0.93))
    if (a === null || a.mode !== 'grammaire' || b === null || b.mode !== 'grammaire') {
      throw new Error('expected grammaire questions')
    }
    expect(a.choices).not.toEqual(b.choices)
  })
})

// ── Script de combat complet ──────────────────────────────────────────────────

describe('buildBattleScript', () => {
  const grammarPoints = getGrammarForZone('new-bark-town').slice(0, 1)
  const lexicon = buildCompositionLexicon(getCompositionLexiconWords(), exampleWordsOf(kanjiContent))

  it('Silver #1 : 12 questions, 2 vies, uniquement les modes actifs du jalon', () => {
    const script = buildBattleScript({
      battleType: 'boss',
      questionCount: 12,
      studiedItems: POOL_12,
      content: kanjiContent,
      grammarPoints,
      lexicon,
    })
    expect(script.lives).toBe(2)
    expect(script.questions).toHaveLength(12)
    for (const q of script.questions) {
      expect(['sens', 'lecture', 'saisie', 'composition', 'grammaire']).toContain(q.mode)
    }
  })

  it('pas de répétition de contenu : jamais deux fois le même item en Sens/Lecture/Saisie, ni la même paire', () => {
    for (let run = 0; run < 5; run++) {
      const script = buildBattleScript({
        battleType: 'route',
        questionCount: 10,
        studiedItems: POOL_12,
        content: kanjiContent,
        grammarPoints,
        lexicon,
      })
      const items = script.questions
        .filter((q): q is Extract<BattleQuestion, { item: string }> => 'item' in q)
        .map(q => q.item)
      expect(new Set(items).size).toBe(items.length)
      const pairs = script.questions.filter(q => q.mode === 'composition').map(q => (q.mode === 'composition' ? q.word : ''))
      expect(new Set(pairs).size).toBe(pairs.length)
    }
  })

  it('gardes : sans grammaire rencontrée → aucune question grammaire ; sans lexique → aucune composition', () => {
    const script = buildBattleScript({
      battleType: 'route',
      questionCount: 12,
      studiedItems: POOL_12,
      content: kanjiContent,
      grammarPoints: [],
      lexicon: null,
    })
    for (const q of script.questions) {
      expect(q.mode).not.toBe('grammaire')
      expect(q.mode).not.toBe('composition')
      expect(['sens', 'lecture', 'saisie']).toContain(q.mode)
    }
    expect(script.grammarDrawn).toEqual([])
  })

  it('grammarDrawn liste les points tirés (pour times_drawn/last_drawn_at)', () => {
    // grammaire seule disponible impossible (sens toujours actif) — on force
    // beaucoup de questions et vérifie la cohérence du relevé
    const script = buildBattleScript({
      battleType: 'boss',
      questionCount: 30,
      studiedItems: POOL_12,
      content: kanjiContent,
      grammarPoints,
      lexicon,
    })
    const grammarQuestions = script.questions.filter(q => q.mode === 'grammaire')
    expect(script.grammarDrawn).toHaveLength(grammarQuestions.length)
    for (const id of script.grammarDrawn) {
      expect(grammarPoints.some(p => p.grammar_id === id)).toBe(true)
    }
  })

  it('pool plus petite que le combat : remise (le combat va au bout) sans jamais deux questions identiques consécutives d’item impossible à éviter', () => {
    const script = buildBattleScript({
      battleType: 'route',
      questionCount: 20,
      studiedItems: ['一', '二'],
      content: kanjiContent,
      grammarPoints: [],
      lexicon: null,
    })
    expect(script.questions).toHaveLength(20)
  })
})

// ── Déroulé (vies, victoire, défaite) ─────────────────────────────────────────

describe('progression du combat', () => {
  it('la N-ième erreur est fatale (Silver : 2 vies → 2e erreur = défaite)', () => {
    let p = startProgress(12, 2)
    p = applyAnswer(p, false)
    expect(p.outcome).toBe('ongoing')
    expect(p.livesLost).toBe(1)
    p = applyAnswer(p, true)
    expect(p.outcome).toBe('ongoing')
    p = applyAnswer(p, false)
    expect(p.outcome).toBe('defeat')
  })

  it('terminer les questions avec au moins une vie = victoire', () => {
    let p = startProgress(3, 2)
    p = applyAnswer(p, true)
    p = applyAnswer(p, false)
    p = applyAnswer(p, true)
    expect(p.outcome).toBe('victory')
    expect(p.livesLost).toBe(1)
    expect(accuracyOf(p)).toBeCloseTo(2 / 3)
  })

  it('une erreur fatale sur la dernière question reste une défaite', () => {
    let p = startProgress(2, 2)
    p = applyAnswer(p, false)
    p = applyAnswer(p, false)
    expect(p.outcome).toBe('defeat')
  })

  it('après la fin, les réponses supplémentaires sont ignorées', () => {
    let p = startProgress(1, 2)
    p = applyAnswer(p, true)
    const after = applyAnswer(p, false)
    expect(after).toEqual(p)
  })
})
