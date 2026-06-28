/**
 * Parses kanjidic2.xml.gz and upserts all 2136 Jōyō kanji into the kanji table.
 * Run: npx tsx scripts/import-kanjidic2.ts
 *
 * Jōyō kanji: grade 1–6 (elementary) + grade 8 (secondary, listed as "S" in some versions).
 * Kanjidic2 uses grade 8 for high-school Jōyō kanji.
 * JLPT mapping (old 4-level system → new N-level): 4→N5, 3→N4, 2→N3, 1→N2. No field → N1 or unranked.
 */

import { createReadStream } from 'fs'
import { createGunzip } from 'zlib'
import { join } from 'path'
import { XMLParser } from 'fast-xml-parser'
import { supabase } from './supabase'

const SOURCES = join(import.meta.dirname, 'sources')
const BATCH_SIZE = 100

const JLPT_MAP: Record<string, string> = { '4': 'N5', '3': 'N4', '2': 'N3', '1': 'N2' }

async function readGzip(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    createReadStream(path).pipe(createGunzip())
      .on('data', (chunk: Buffer) => chunks.push(chunk))
      .on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      .on('error', reject)
  })
}

async function main() {
  console.log('Parsing kanjidic2.xml.gz…')
  const xml = await readGzip(join(SOURCES, 'kanjidic2.xml.gz'))

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', isArray: (name) => ['reading', 'meaning', 'cp_value', 'q_code'].includes(name) })
  const doc = parser.parse(xml)
  const characters: unknown[] = doc.kanjidic2.character

  const joyo: {
    id: string; character: string; meanings: string[]; on_readings: string[]
    kun_readings: string[]; jlpt_level: string | null; grade: number | null; stroke_count: number | null; unicode_hex: string | null
  }[] = []

  for (const char of characters) {
    const c = char as Record<string, unknown>
    const misc = c.misc as Record<string, unknown> | undefined
    const grade = misc?.grade ? Number(misc.grade) : null
    // Jōyō: grades 1–6 (elementary) and 8 (secondary high-school Jōyō)
    if (!grade || (grade > 6 && grade !== 8)) continue

    const literal = c.literal as string
    const codepoints = (c.codepoint as Record<string, unknown>)?.cp_value as { '#text': string; '@_cp_type': string }[] | undefined
    const ucs = codepoints?.find(v => v['@_cp_type'] === 'ucs')
    const rmgroup = ((c.reading_meaning as Record<string, unknown>)?.rmgroup) as Record<string, unknown> | undefined

    const readings = (rmgroup?.reading as { '#text'?: string; '@_r_type': string }[] | undefined) ?? []
    const meanings = (rmgroup?.meaning as (string | { '#text': string; '@_m_lang': string })[] | undefined) ?? []

    joyo.push({
      id: literal,
      character: literal,
      meanings: meanings
        .filter(m => typeof m === 'string' || !('m_lang' in (m as object)))
        .map(m => typeof m === 'string' ? m : (m as { '#text': string })['#text']),
      on_readings: readings.filter(r => r['@_r_type'] === 'ja_on').map(r => r['#text'] ?? '').filter(Boolean),
      kun_readings: readings.filter(r => r['@_r_type'] === 'ja_kun').map(r => r['#text'] ?? '').filter(Boolean),
      jlpt_level: misc?.jlpt ? JLPT_MAP[String(misc.jlpt)] ?? null : null,
      grade,
      stroke_count: misc?.stroke_count ? Number(misc.stroke_count) : null,
      unicode_hex: ucs?.['#text'] ?? null,
    })
  }

  console.log(`Found ${joyo.length} Jōyō kanji`)

  let inserted = 0
  for (let i = 0; i < joyo.length; i += BATCH_SIZE) {
    const batch = joyo.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('kanji').upsert(batch, { onConflict: 'id' })
    if (error) { console.error('Batch error:', error.message); process.exit(1) }
    inserted += batch.length
    process.stdout.write(`\r  ${inserted}/${joyo.length}`)
  }
  console.log(`\nDone — upserted ${inserted} kanji.`)
}

main().catch(e => { console.error(e); process.exit(1) })
