/**
 * Imports Tatoeba JP-EN sentence pairs into the sentences table.
 * Also tokenizes each sentence with kuromoji (build-time only) to populate
 * the chunks[] column used by the Disposition battle mode.
 *
 * Chunks are grouped by attaching 助詞 and 助動詞 to the preceding content word,
 * so "私はリンゴを食べました" becomes ["私は", "リンゴを", "食べました"].
 * Only sentences producing 5–9 chunks get a non-empty chunks[].
 *
 * Run: npm run import:tatoeba
 *
 * File formats (tab-separated):
 *   jpn_sentences.tsv / eng_sentences.tsv: id  lang  text
 *   links.csv (or jpn-eng_links.tsv):      sentence_id  translation_id
 */

import { createReadStream } from 'fs'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { createInterface } from 'readline'
import kuromoji from 'kuromoji'
import { supabase } from '../lib/supabase'

const SOURCES = join(import.meta.dirname, '../sources')
const BATCH_SIZE = 500

// ── Kuromoji init ─────────────────────────────────────────────────────────────

type Tokenizer = kuromoji.Tokenizer<kuromoji.IpadicFeatures>

function buildTokenizer(): Promise<Tokenizer> {
  const dicPath = join(process.cwd(), 'node_modules/kuromoji/dict')
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath }).build((err, tokenizer) => {
      if (err) reject(err)
      else resolve(tokenizer)
    })
  })
}

/**
 * Groups kuromoji morphemes into semantic chunks by attaching particles (助詞)
 * and auxiliary verbs (助動詞) to the preceding content word.
 * Returns [] if the sentence produces fewer than 5 or more than 9 chunks.
 */
function groupIntoChunks(tokenizer: Tokenizer, text: string): string[] {
  const tokens = tokenizer.tokenize(text)
  const chunks: string[] = []
  let current = ''

  for (const token of tokens) {
    const { surface_form, pos } = token

    if (pos === '記号') {
      // Punctuation appends to current chunk but never starts one
      if (current) current += surface_form
      continue
    }

    if (pos === '助詞' || pos === '助動詞') {
      current += surface_form
    } else {
      if (current) chunks.push(current)
      current = surface_form
    }
  }
  if (current) chunks.push(current)

  // Strip chunks that are pure punctuation
  const filtered = chunks.filter(c => !/^[。、！？…・「」『』（）【】〜\s]+$/.test(c))

  return filtered.length >= 5 && filtered.length <= 9 ? filtered : []
}

// ── Data loading helpers ──────────────────────────────────────────────────────

function loadJoyoSet(): Set<string> {
  const raw = readFileSync(join(SOURCES, 'joyo-list.json'), 'utf8')
  const list = JSON.parse(raw) as Array<{ character: string }>
  return new Set(list.map(k => k.character))
}

async function loadTsvFile(filePath: string): Promise<Map<number, string>> {
  const map = new Map<number, string>()
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity })
  for await (const line of rl) {
    const parts = line.split('\t')
    if (parts.length >= 3) map.set(parseInt(parts[0]), parts[2])
  }
  return map
}

async function buildLinksMap(linksPath: string, jpnIds: Set<number>): Promise<Map<number, number[]>> {
  const map = new Map<number, number[]>()
  const rl = createInterface({ input: createReadStream(linksPath), crlfDelay: Infinity })
  for await (const line of rl) {
    const parts = line.split('\t')
    if (parts.length < 2) continue
    const src = parseInt(parts[0])
    const dst = parseInt(parts[1])
    if (!jpnIds.has(src)) continue
    if (!map.has(src)) map.set(src, [])
    map.get(src)!.push(dst)
  }
  return map
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Initializing kuromoji tokenizer…')
  const tokenizer = await buildTokenizer()
  console.log('Tokenizer ready.')

  const joyo = loadJoyoSet()
  console.log(`${joyo.size} Jōyō kanji loaded.`)

  console.log('Loading Japanese sentences…')
  const jpnSentences = await loadTsvFile(join(SOURCES, 'jpn_sentences.tsv'))
  console.log(`${jpnSentences.size} JP sentences loaded.`)

  console.log('Loading English sentences…')
  const engSentences = await loadTsvFile(join(SOURCES, 'eng_sentences.tsv'))
  console.log(`${engSentences.size} EN sentences loaded.`)

  const jpnIds = new Set(jpnSentences.keys())

  // Support both filename variants
  const linksFile = existsSync(join(SOURCES, 'jpn-eng_links.tsv'))
    ? join(SOURCES, 'jpn-eng_links.tsv')
    : join(SOURCES, 'links.csv')
  console.log(`Building JP→EN links map from ${linksFile}…`)
  const linksMap = await buildLinksMap(linksFile, jpnIds)
  console.log(`${linksMap.size} JP sentences have at least one link.`)

  type Row = {
    id: number
    text: string
    translation: string | null
    kanji_ids: string[]
    chunks: string[]
  }

  const rows: Row[] = []
  let dispositionEligible = 0

  for (const [jpnId, jpnText] of jpnSentences) {
    // Length filter: skip very short or very long sentences
    if (jpnText.length < 4 || jpnText.length > 80) continue

    const joyoChars = [...new Set([...jpnText].filter(c => joyo.has(c)))]
    if (joyoChars.length === 0) continue

    const translationIds = linksMap.get(jpnId) ?? []
    let translation: string | null = null
    for (const tid of translationIds) {
      const eng = engSentences.get(tid)
      if (eng) { translation = eng; break }
    }

    const chunks = groupIntoChunks(tokenizer, jpnText)
    if (chunks.length > 0) dispositionEligible++

    rows.push({ id: jpnId, text: jpnText, translation, kanji_ids: joyoChars, chunks })
  }

  console.log(`${rows.length} sentences to import (contain Jōyō kanji).`)
  console.log(`${dispositionEligible} eligible for Disposition mode (5–9 chunks).`)

  let imported = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('sentences').upsert(batch, { onConflict: 'id' })
    if (error) { console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message); continue }
    imported += batch.length
    process.stdout.write(`\r${imported}/${rows.length} imported…`)
  }
  console.log(`\nDone. ${imported} sentences imported.`)
}

main().catch(err => { console.error(err); process.exit(1) })
