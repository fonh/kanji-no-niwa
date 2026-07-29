// Conversion romaji→kana « IME-like » (issue 04) — logique pure du composant
// KanaInput (src/components/KanaInput.tsx), isolée pour être testée hors DOM
// et réutilisée par le mode Saisie du combat (issue 07).
//
// wanakana fait le vrai travail ; ce module fixe le contrat que le reste du
// jeu utilise : conversion au fil de la frappe (le n et les consonnes
// doublées restent en suspens comme dans un IME), finalisation à la
// validation, et validation kana-only (« aucun latin affiché » — PRD
// § Langue du Jeu : le romaji tapé n'existe que le temps de sa conversion).

import { toKana } from 'wanakana'

/** Conversion au fil de la frappe : minuscules → hiragana, MAJUSCULES →
 * katakana ; `n` seul et consonnes doublées restent affichés en latin tant
 * que la syllabe n'est pas résolue (IMEMode). Idempotente sur les kana. */
export function toKanaLive(raw: string): string {
  return toKana(raw, { IMEMode: true })
}

/** Finalisation à la validation : résout le `n` en suspens (かn → かん).
 * Les restes non convertibles (かtt) sont laissés tels quels — c'est
 * `isKanaText` qui les rejette. */
export function finalizeKana(raw: string): string {
  return toKana(toKanaLive(raw))
}

// Hiragana (3041-3096), katakana (30A1-30FA), prolongation ー (30FC),
// itérations ゝゞヽヾ exclues volontairement (jamais dans un nom).
const KANA_ONLY = /^[ぁ-ゖァ-ヺー]+$/

/** Vrai si la chaîne est entièrement en kana (et non vide) — la validation
 * qui garantit qu'aucun résidu latin n'est jamais persisté ni affiché. */
export function isKanaText(text: string): boolean {
  return KANA_ONLY.test(text)
}

/** Longueur de la saisie une fois finalisée — sert à borner le champ pendant
 * la frappe sans couper une syllabe en cours de conversion. */
export function kanaLength(raw: string): number {
  return finalizeKana(raw).length
}
