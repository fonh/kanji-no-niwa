// Logique de conversion romaji→kana du composant KanaInput (issue 04) —
// pure, hors DOM. Réutilisée par le mode Saisie du combat (issue 07).
import { describe, it, expect } from 'vitest'
import { toKanaLive, finalizeKana, kanaLength, isKanaText } from './kana-input'

describe('toKanaLive — conversion IME au fil de la frappe', () => {
  it('convertit une syllabe complète', () => {
    expect(toKanaLive('ka')).toBe('か')
  })

  it("laisse le n final en suspens (il peut devenir な/に/…)", () => {
    expect(toKanaLive('kan')).toBe('かn')
  })

  it('résout le n devant une consonne', () => {
    expect(toKanaLive('kanji')).toBe('かんじ')
  })

  it("nn force ん", () => {
    expect(toKanaLive('kann')).toBe('かん')
  })

  it('petit tsu : consonne doublée en suspens puis résolue', () => {
    expect(toKanaLive('katt')).toBe('かtt')
    expect(toKanaLive('katta')).toBe('かった')
  })

  it('digraphes', () => {
    expect(toKanaLive('sha')).toBe('しゃ')
    expect(toKanaLive('nya')).toBe('にゃ')
  })

  it('majuscules → katakana (comme un IME)', () => {
    expect(toKanaLive('HIBIKI')).toBe('ヒビキ')
    expect(toKanaLive('KOTONE')).toBe('コトネ')
  })

  it('minuscules → hiragana', () => {
    expect(toKanaLive('hibiki')).toBe('ひびき')
  })

  it('trait allongé', () => {
    expect(toKanaLive('KA-')).toBe('カー')
  })

  it('les kana déjà saisis passent inchangés (conversion idempotente)', () => {
    expect(toKanaLive('こんにちは')).toBe('こんにちは')
    expect(toKanaLive(toKanaLive('kanji'))).toBe('かんじ')
  })

  it('chaîne vide', () => {
    expect(toKanaLive('')).toBe('')
  })
})

describe('finalizeKana — résolution à la validation', () => {
  it('résout le n final en ん', () => {
    expect(finalizeKana('kan')).toBe('かん')
    expect(finalizeKana('かn')).toBe('かん')
  })

  it('ne change pas une chaîne déjà en kana', () => {
    expect(finalizeKana('ヒビキ')).toBe('ヒビキ')
    expect(finalizeKana('かんじ')).toBe('かんじ')
  })

  it('laisse les restes non convertibles (rejetés ensuite par isKanaText)', () => {
    expect(finalizeKana('katt')).toBe('かtt')
  })
})

describe('isKanaText — validation (aucun latin ne doit passer)', () => {
  it('accepte hiragana, katakana, ー', () => {
    expect(isKanaText('ひびき')).toBe(true)
    expect(isKanaText('ヒビキ')).toBe(true)
    expect(isKanaText('コトネー')).toBe(true)
    expect(isKanaText('みカ')).toBe(true)
  })

  it('rejette le vide, le latin résiduel, les espaces, les kanji', () => {
    expect(isKanaText('')).toBe(false)
    expect(isKanaText('かtt')).toBe(false)
    expect(isKanaText('かn')).toBe(false)
    expect(isKanaText('ひび き')).toBe(false)
    expect(isKanaText('漢字')).toBe(false)
  })
})

describe('kanaLength — longueur en kana finalisés', () => {
  it('compte les kana après finalisation', () => {
    expect(kanaLength('kanji')).toBe(3)
    expect(kanaLength('kan')).toBe(2) // かn → かん
    expect(kanaLength('HIBIKI')).toBe(3)
    expect(kanaLength('')).toBe(0)
  })

  it('les restes latins comptent (pour bloquer la saisie trop longue)', () => {
    expect(kanaLength('かtt')).toBe(3)
  })
})
