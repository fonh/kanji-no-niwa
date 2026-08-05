// Lectures inline — parseur pur, zéro I/O (issue 03, jalon 1).
//
// Norme du format : ADR-0002 (docs/adr/0002-hand-written-dialogue-content-language.md)
// et CONTEXT.md « Inline Reading » :
//  - une lecture est écrite à la main dans la chaîne `jp`, entre parenthèses
//    pleine largeur （…） collées au run de kanji contigu qu'elle couvre :
//    道場（どうじょう） — groupée par mot/run, jamais kanji par kanji ;
//  - les parenthèses pleine largeur qui suivent immédiatement un kanji sont
//    RÉSERVÉES aux lectures ; une vraie parenthèse de texte doit être ASCII.
//    Le parser reste néanmoins robuste : sans run de kanji devant, ou si le
//    contenu n'est pas du kana, la parenthèse est conservée telle quelle ;
//  - le rendu masque les lectures par défaut ; le bouton Y révèle celles de
//    la page courante, en ruby ≥ 10px (rendu : src/components/JpText.tsx).

/** Un tronçon de texte affichable : `base` visible, `reading` optionnelle
 * (furigana couvrant exactement `base`). */
export interface ReadingSegment {
  base: string
  reading?: string
}

// Run de kanji : idéogrammes CJK (+ ext. A), marques 々〆〇 et petits ヵヶ
// (compteurs du type 一ヶ月) — le run contigu maximal avant la parenthèse.
// Lecture : kana (hiragana/katakana) + prolongation ー et point médian ・,
// même classe que l'ancien stripReadings de MapClient.
const READING_RE = /([㐀-䶿一-鿿々〆〇ヵヶ]+)（([ぁ-ゖァ-ヶー・]+)）/g

/** Découpe une chaîne `jp` en segments {base, reading?}. Les parties sans
 * lecture sont fusionnées en segments plats. */
export function parseInlineReadings(jp: string): ReadingSegment[] {
  // Un trou de contenu (un `label` écrit en chaîne nue au lieu de {jp, en},
  // vu sur cherrygrove_welcome.json) ne doit pas faire tomber tout un écran :
  // le journal de quêtes plantait avec « Cannot read properties of undefined
  // (reading 'matchAll') » dès que la quête concernée était en cours. Le trou
  // se corrige dans le contenu ; ici on refuse juste de crasher.
  if (typeof jp !== 'string' || jp === '') return []
  const segments: ReadingSegment[] = []
  let plainStart = 0
  for (const match of jp.matchAll(READING_RE)) {
    const [, kanjiRun, reading] = match
    if (match.index > plainStart) {
      segments.push({ base: jp.slice(plainStart, match.index) })
    }
    segments.push({ base: kanjiRun, reading })
    plainStart = match.index + match[0].length
  }
  if (plainStart < jp.length) segments.push({ base: jp.slice(plainStart) })
  return segments
}

/** Le texte tel qu'affiché par défaut (lectures retirées, parenthèses de
 * texte conservées). */
export function stripReadings(jp: string): string {
  return parseInlineReadings(jp)
    .map(s => s.base)
    .join('')
}

/** Nombre de caractères visibles (bases seules) — l'unité de progression de
 * l'effet machine à écrire. */
export function totalBaseLength(segments: ReadingSegment[]): number {
  return segments.reduce((sum, s) => sum + s.base.length, 0)
}

/** Tronque les segments aux `count` premiers caractères visibles. Un segment
 * à lecture coupé en plein milieu perd sa lecture : le ruby n'apparaît que
 * lorsque son run est entièrement tapé. */
export function sliceSegments(segments: ReadingSegment[], count: number): ReadingSegment[] {
  const out: ReadingSegment[] = []
  let remaining = count
  for (const s of segments) {
    if (remaining <= 0) break
    if (s.base.length <= remaining) {
      out.push(s)
      remaining -= s.base.length
    } else {
      out.push({ base: s.base.slice(0, remaining) })
      remaining = 0
    }
  }
  return out
}
