// Données de l'écran-livre (issue 05) — builders purs, côté serveur.
//
// Le Book Screen ne lit jamais content/ ni src/data/ directement : la page
// serveur assemble ici un objet sérialisable (une double page par kanji +
// page grammaire) passé au composant client BookScreen.

import type { GrammarOverlayPoint, GrammarSourceEntry } from './content'
import { primaryMeaning, type KanjiContentMap } from './lesson-quiz'

export interface BookExample {
  jp: string
  en: string | null
  audio: string | null
}

/** Une double page kanji : gauche = identité (caractère, lectures, mot-clé
 * anglais, icône, audio), droite = usage (lesson_examples). */
export interface KanjiPageData {
  character: string
  /** Mot-clé anglais — keyword prioritaire sur meanings[0] (contrat § 7). */
  keyword: string
  onReadings: string[]
  kunReadings: string[]
  /** Emoji du concept — nullable, pas d'illustration forcée. */
  icon: string | null
  /** Audio du caractère — null = icône désactivée, jamais un crash. */
  audio: string | null
  examples: BookExample[]
}

export function buildKanjiPages(kanjiIds: string[], content: KanjiContentMap): KanjiPageData[] {
  return kanjiIds.map(kanjiId => {
    const entry = content[kanjiId] ?? { meanings: [], on: [], kun: [] }
    return {
      character: kanjiId,
      keyword: primaryMeaning(entry),
      onReadings: entry.on ?? [],
      kunReadings: entry.kun ?? [],
      icon: entry.icon_ref ?? null,
      audio: entry.audio ?? null,
      examples: (entry.lesson_examples ?? []).map(example => ({
        jp: example.jp,
        en: example.en ?? null,
        audio: example.audio_ref ?? null,
      })),
    }
  })
}

/** La page grammaire : overlay de zone (jp avec furigana ADR-0002) fusionné
 * avec la base Hanabira (title, explication anglaise, audio) — la base peut
 * manquer, la page tient alors sur l'overlay seul. */
export interface GrammarPageData {
  grammarId: string
  title: string
  shortExplanation: string
  examples: BookExample[]
}

export function buildGrammarPage(
  point: GrammarOverlayPoint,
  source: GrammarSourceEntry | null
): GrammarPageData {
  return {
    grammarId: point.grammar_id,
    title: source?.title ?? point.title,
    shortExplanation: source?.short_explanation ?? '',
    examples: point.selected_examples.map(example => {
      const sourceExample = source?.examples[example.source_example_index]
      return {
        jp: example.jp,
        en: sourceExample?.en ?? null,
        audio: sourceExample?.grammar_audio ?? null,
      }
    }),
  }
}
