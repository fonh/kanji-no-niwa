/**
 * Pairs Japanese sentences (jpn_sentences.tsv) with their English translations
 * via links.csv, then upserts rows containing at least one Jōyō kanji into sentences table.
 * Run: npx tsx scripts/import-tatoeba.ts
 *
 * File formats (tab-separated):
 *   jpn_sentences.tsv / eng_sentences.tsv: id  lang  text
 *   links.csv:                              sentence_id  translation_id
 */

import { createReadStream } from 'fs'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createInterface } from 'readline'
import { supabase } from './supabase'

const SOURCES = join(import.meta.dirname, 'sources')
const BATCH_SIZE = 500

function loadJoyoSet(): Set<string> {
  const raw = readFileSync(join(SOURCES, 'joyo-list.json'), 'utf8')
  const list = JSON.parse(raw) as Array<{ character: string }>
  return new Set(list.map(k => k.character))
}

function extractJoyoChars(text: string, joyo: Set<string>): string[] {
  return [...new Set([...text].filter(c => joyo.has(c)))]
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

async function main() {
  const joyo = loadJoyoSet()
  console.log(`${joyo.size} Jōyō kanji loaded.`)

  console.log('Loading Japanese sentences…')
  const jpnSentences = await loadTsvFile(join(SOURCES, 'jpn_sentences.tsv'))
  console.log(`${jpnSentences.size} JP sentences loaded.`)

  console.log('Loading English sentences…')
  const engSentences = await loadTsvFile(join(SOURCES, 'eng_sentences.tsv'))
  console.log(`${engSentences.size} EN sentences loaded.`)

  const jpnIds = new Set(jpnSentences.keys())
  console.log('Building JP→EN links map…')
  const linksMap = await buildLinksMap(join(SOURCES, 'links.csv'), jpnIds)
  console.log(`${linksMap.size} JP sentences have at least one link.`)

  const rows: { id: number; text: string; translation: string | null; kanji_ids: string[] }[] = []

  for (const [jpnId, jpnText] of jpnSentences) {
    const joyoChars = extractJoyoChars(jpnText, joyo)
    if (joyoChars.length === 0) continue

    const translationIds = linksMap.get(jpnId) ?? []
    let translation: string | null = null
    for (const tid of translationIds) {
      const eng = engSentences.get(tid)
      if (eng) { translation = eng; break }
    }

    rows.push({ id: jpnId, text: jpnText, translation, kanji_ids: joyoChars })
  }

  console.log(`${rows.length} sentences to import (contain Jōyō kanji).`)

  let imported = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('sentences').upsert(batch, { onConflict: 'id' })
    if (error) { console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message); continue }
    imported += batch.length
    process.stdout.write(`\r${imported}/${rows.length} imported…`)
  }
  console.log(`\nDone. ${imported} sentences imported.`)
}

main().catch(err => { console.error(err); process.exit(1) })
