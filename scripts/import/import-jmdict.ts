/**
 * Parses JMdict_e.gz and upserts vocabulary entries that contain at least one Jōyō kanji.
 * Run: npx tsx scripts/import-jmdict.ts
 *
 * JMdict_e: English-only subset of JMdict. Each <entry> has one or more <k_ele> (kanji forms),
 * <r_ele> (reading forms), and <sense> elements (meanings + JLPT tag).
 * We only import entries where a k_ele contains at least one Jōyō kanji character.
 */

import { createReadStream } from 'fs'
import { createGunzip } from 'zlib'
import { join } from 'path'
import { XMLParser } from 'fast-xml-parser'
import { upsertBatch } from '../lib/db'
import { readFileSync } from 'fs'

const SOURCES = join(import.meta.dirname, '../sources')
const BATCH_SIZE = 500

const JLPT_TAG_MAP: Record<string, string> = {
  'jlpt-n5': 'N5', 'jlpt-n4': 'N4', 'jlpt-n3': 'N3', 'jlpt-n2': 'N2', 'jlpt-n1': 'N1',
}

async function readGzip(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    createReadStream(path).pipe(createGunzip())
      .on('data', (chunk: Buffer) => chunks.push(chunk))
      .on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      .on('error', reject)
  })
}

function loadJoyoSet(): Set<string> {
  const raw = readFileSync(join(SOURCES, 'joyo-list.json'), 'utf8')
  const list = JSON.parse(raw) as Array<{ character: string }>
  return new Set(list.map(k => k.character))
}

function extractKanjiChars(text: string): string[] {
  return [...text].filter(c => c.charCodeAt(0) >= 0x4e00 && c.charCodeAt(0) <= 0x9fff)
}

async function main() {
  console.log('Loading Jōyō kanji set…')
  const joyo = loadJoyoSet()
  console.log(`${joyo.size} Jōyō kanji loaded.`)

  console.log('Reading JMdict_e.gz…')
  const xml = await readGzip(join(SOURCES, 'JMdict_e.gz'))
  console.log('Parsing XML…')

  const parser = new XMLParser({ ignoreAttributes: false, isArray: (name) => ['entry', 'k_ele', 'r_ele', 'sense', 'gloss', 'ke_pri', 're_pri', 'pos', 'misc', 'field', 'dial', 'stagk', 'stagr', 'xref', 'ant', 'lsource'].includes(name) })
  const doc = parser.parse(xml)
  const entries: unknown[] = doc?.JMdict?.entry ?? []
  console.log(`${entries.length} entries found.`)

  const rows: { id: string; word: string; reading: string; meanings: string[]; kanji_ids: string[]; jlpt_level: string | null }[] = []

  for (const entry of entries as Record<string, unknown>[]) {
    const seq = String(entry['ent_seq'])
    const kEles = (entry['k_ele'] as Record<string, unknown>[] | undefined) ?? []
    if (kEles.length === 0) continue

    const word = String((kEles[0] as Record<string, unknown>)['keb'])
    const chars = extractKanjiChars(word)
    const joyoInWord = chars.filter(c => joyo.has(c))
    if (joyoInWord.length === 0) continue

    const rEles = (entry['r_ele'] as Record<string, unknown>[]) ?? []
    const reading = String((rEles[0] as Record<string, unknown>)['reb'] ?? '')

    const senses = (entry['sense'] as Record<string, unknown>[]) ?? []
    const meanings: string[] = []
    let jlptLevel: string | null = null

    for (const sense of senses) {
      const glosses = (sense['gloss'] as unknown[]) ?? []
      for (const g of glosses) {
        const text = typeof g === 'string' ? g : String((g as Record<string, unknown>)['#text'] ?? '')
        if (text) meanings.push(text)
      }
      const misc = (sense['misc'] as string[]) ?? []
      for (const m of misc) {
        if (JLPT_TAG_MAP[m]) jlptLevel = JLPT_TAG_MAP[m]
      }
    }

    if (meanings.length === 0) continue

    rows.push({ id: seq, word, reading, meanings, kanji_ids: joyoInWord, jlpt_level: jlptLevel })
  }

  console.log(`${rows.length} vocabulary entries to import.`)

  let imported = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE).map(r => ({ ...r, meanings: JSON.stringify(r.meanings) }))
    try {
      await upsertBatch('vocabulary', batch, ['id'])
      imported += batch.length
    } catch (err) {
      console.error(`Batch ${i / BATCH_SIZE + 1} error:`, err)
      continue
    }
    process.stdout.write(`\r${imported}/${rows.length} imported…`)
  }
  console.log(`\nDone. ${imported} vocabulary entries imported.`)
}

main().catch(err => { console.error(err); process.exit(1) })
