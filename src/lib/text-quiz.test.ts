// Quiz des textes progressifs (issue 08) — logique pure, tests d'abord.
//
// Le contrat vient du PRD § Textes Progressifs :
//  - retry-jusqu'à-correct : une mauvaise réponse rejoue la MÊME question ;
//  - `score` = % de questions réussies en PREMIÈRE tentative ;
//  - doré = une passe intégralement sans faute (première lecture ou relecture) ;
//  - scaffolding : après un 2ᵉ échec sur une question portant `answer_span`,
//    le passage est surligné dans le texte.
import { describe, it, expect } from 'vitest'
import {
  answerTextQuestion,
  documentKindForText,
  isFlawless,
  quizScore,
  restoreTextQuiz,
  shouldScaffold,
  splitForHighlight,
  startTextQuiz,
} from './text-quiz'

describe('startTextQuiz / answerTextQuestion (retry-jusqu\'à-correct)', () => {
  it('démarre à la question 0, rien de répondu', () => {
    const p = startTextQuiz(3)
    expect(p.questionCount).toBe(3)
    expect(p.questionIndex).toBe(0)
    expect(p.failsOnCurrent).toBe(0)
    expect(p.firstTryCorrect).toEqual([])
    expect(p.done).toBe(false)
  })

  it('bonne réponse → question suivante, compteur d\'échecs remis à zéro', () => {
    const p = answerTextQuestion(startTextQuiz(3), true)
    expect(p.questionIndex).toBe(1)
    expect(p.failsOnCurrent).toBe(0)
    expect(p.firstTryCorrect).toEqual([true])
    expect(p.done).toBe(false)
  })

  it('mauvaise réponse → MÊME question (retry), échec compté', () => {
    const p = answerTextQuestion(startTextQuiz(3), false)
    expect(p.questionIndex).toBe(0)
    expect(p.failsOnCurrent).toBe(1)
    expect(p.firstTryCorrect).toEqual([])
    expect(p.done).toBe(false)
  })

  it('réussite après échecs : la question compte comme ratée en première tentative', () => {
    let p = startTextQuiz(2)
    p = answerTextQuestion(p, false)
    p = answerTextQuestion(p, false)
    p = answerTextQuestion(p, true)
    expect(p.questionIndex).toBe(1)
    expect(p.failsOnCurrent).toBe(0)
    expect(p.firstTryCorrect).toEqual([false])
  })

  it('dernière question réussie → done', () => {
    let p = startTextQuiz(2)
    p = answerTextQuestion(p, true)
    p = answerTextQuestion(p, true)
    expect(p.done).toBe(true)
    expect(p.questionIndex).toBe(2)
  })

  it('répondre après done est inerte (même objet)', () => {
    let p = startTextQuiz(1)
    p = answerTextQuestion(p, true)
    expect(answerTextQuestion(p, true)).toBe(p)
    expect(answerTextQuestion(p, false)).toBe(p)
  })
})

describe('quizScore (première tentative) / isFlawless (doré)', () => {
  it('score = % de questions réussies du premier coup, arrondi', () => {
    let p = startTextQuiz(3)
    p = answerTextQuestion(p, true) // 1re : premier coup
    p = answerTextQuestion(p, false) // 2e : ratée...
    p = answerTextQuestion(p, true) // ...puis réussie
    p = answerTextQuestion(p, true) // 3e : premier coup
    expect(p.done).toBe(true)
    expect(quizScore(p)).toBe(67) // 2/3
    expect(isFlawless(p)).toBe(false)
  })

  it('passe sans faute → score 100 et doré', () => {
    let p = startTextQuiz(2)
    p = answerTextQuestion(p, true)
    p = answerTextQuestion(p, true)
    expect(quizScore(p)).toBe(100)
    expect(isFlawless(p)).toBe(true)
  })

  it('une seule erreur n\'importe où suffit à perdre le doré', () => {
    let p = startTextQuiz(2)
    p = answerTextQuestion(p, true)
    p = answerTextQuestion(p, false)
    p = answerTextQuestion(p, true)
    expect(quizScore(p)).toBe(50)
    expect(isFlawless(p)).toBe(false)
  })

  it('quiz vide (0 question) : score 100 par convention, jamais NaN', () => {
    const p = startTextQuiz(0)
    expect(p.done).toBe(true)
    expect(quizScore(p)).toBe(100)
  })
})

describe('shouldScaffold (2ᵉ échec + answer_span)', () => {
  const span = { start: 0, end: 5 }

  it('pas de scaffolding avant le 2ᵉ échec', () => {
    let p = startTextQuiz(1)
    expect(shouldScaffold(p, span)).toBe(false)
    p = answerTextQuestion(p, false)
    expect(shouldScaffold(p, span)).toBe(false)
  })

  it('2ᵉ échec sur une question à answer_span → surligner', () => {
    let p = startTextQuiz(1)
    p = answerTextQuestion(p, false)
    p = answerTextQuestion(p, false)
    expect(shouldScaffold(p, span)).toBe(true)
    // et ça persiste tant que la question n'est pas passée
    p = answerTextQuestion(p, false)
    expect(shouldScaffold(p, span)).toBe(true)
  })

  it('jamais de scaffolding sans answer_span', () => {
    let p = startTextQuiz(1)
    p = answerTextQuestion(p, false)
    p = answerTextQuestion(p, false)
    expect(shouldScaffold(p, null)).toBe(false)
    expect(shouldScaffold(p, undefined)).toBe(false)
  })
})

describe('splitForHighlight (surlignage du passage answer_span)', () => {
  it('découpe le jp_text brut sur les bornes du span', () => {
    // Les spans du contenu réel sont indexés sur le jp_text BRUT (lectures
    // inline comprises) et tombent sur des frontières de segments — vérifié
    // sur content/texts/ice-path/cs_taki.json.
    const jp = '滝（たき）は　上（うえ）から　下（した）へ　落（お）ちる　もの。だれもが　そう'
    const parts = splitForHighlight(jp, { start: 0, end: 31 })
    expect(parts.highlighted).toBe('滝（たき）は　上（うえ）から　下（した）へ　落（お）ちる　もの')
    expect(parts.before).toBe('')
    expect(parts.after).toBe('。だれもが　そう')
    expect(parts.before + parts.highlighted + parts.after).toBe(jp)
  })

  it('span au milieu : trois parties non vides', () => {
    const parts = splitForHighlight('あいうえお', { start: 1, end: 3 })
    expect(parts).toEqual({ before: 'あ', highlighted: 'いう', after: 'えお' })
  })

  it('span hors bornes : borné au texte, jamais un crash', () => {
    const parts = splitForHighlight('あいう', { start: -2, end: 99 })
    expect(parts).toEqual({ before: '', highlighted: 'あいう', after: '' })
  })
})

describe('restoreTextQuiz (reprise dans la même session)', () => {
  it('restaure une progression sérialisée valide', () => {
    let p = startTextQuiz(3)
    p = answerTextQuestion(p, true)
    p = answerTextQuestion(p, false)
    const restored = restoreTextQuiz(JSON.parse(JSON.stringify(p)), 3)
    expect(restored).toEqual(p)
  })

  it('rejette un blob corrompu ou un nombre de questions qui ne colle plus', () => {
    expect(restoreTextQuiz(null, 3)).toBe(null)
    expect(restoreTextQuiz({ nope: true }, 3)).toBe(null)
    const p = answerTextQuestion(startTextQuiz(3), true)
    expect(restoreTextQuiz(JSON.parse(JSON.stringify(p)), 4)).toBe(null)
    expect(restoreTextQuiz({ ...p, questionIndex: 99 }, 3)).toBe(null)
    expect(restoreTextQuiz({ ...p, firstTryCorrect: ['x'] }, 3)).toBe(null)
  })
})

describe('documentKindForText (texture de la fenêtre de lecture)', () => {
  // Aucun champ de type de document dans les fichiers texte (vérifié sur le
  // format réel) : le type est DÉDUIT du text_id / found_object_ref et
  // documenté ici — lettre (mail/letter/note), panneau (sign/inscription),
  // parchemin sinon.
  it('lyra_mail → lettre', () => {
    expect(documentKindForText('lyra_mail_new_bark', 'player_pc_new_bark')).toBe('letter')
  })
  it('panneau de Route 29 → panneau', () => {
    expect(documentKindForText('johto_entrance_sign_route29', 'sign_johto_entrance_route29')).toBe('sign')
  })
  it('inscription murale → panneau ; notes/lettres → lettre ; défaut → parchemin', () => {
    expect(documentKindForText('ancient_inscription_sprout_tower', 'inscription_sprout_tower')).toBe('sign')
    expect(documentKindForText('farewell_note_ice_path', null)).toBe('letter')
    expect(documentKindForText('son_in_law_letter_slowpoke_well', null)).toBe('letter')
    expect(documentKindForText('elm_great_text_new_bark', null)).toBe('scroll')
  })
})
