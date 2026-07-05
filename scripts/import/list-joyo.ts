/**
 * Extracts all 2136 Jōyō kanji from kanjidic2 with grade/JLPT metadata.
 * Run: npx tsx scripts/list-joyo.ts
 */
import { createReadStream } from 'fs'
import { createGunzip } from 'zlib'
import { join } from 'path'
import { XMLParser } from 'fast-xml-parser'
import { writeFileSync } from 'fs'

const SOURCES = join(import.meta.dirname, '../sources')
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
  const xml = await readGzip(join(SOURCES, 'kanjidic2.xml.gz'))
  const parser = new XMLParser({
    ignoreAttributes: false, attributeNamePrefix: '@_',
    isArray: (name) => ['reading', 'meaning', 'cp_value', 'q_code'].includes(name)
  })
  const doc = parser.parse(xml)
  const characters: unknown[] = doc.kanjidic2.character

  const joyo: { char: string; grade: number; jlpt: string; meanings: string[]; on: string[]; kun: string[] }[] = []

  for (const char of characters) {
    const c = char as Record<string, unknown>
    const misc = c.misc as Record<string, unknown> | undefined
    const grade = misc?.grade ? Number(misc.grade) : null
    if (!grade || (grade > 6 && grade !== 8)) continue

    const literal = c.literal as string
    const rmgroup = ((c.reading_meaning as Record<string, unknown>)?.rmgroup) as Record<string, unknown> | undefined
    const readings = (rmgroup?.reading as { '#text'?: string; '@_r_type': string }[] | undefined) ?? []
    const meanings = (rmgroup?.meaning as (string | { '#text': string; '@_m_lang': string })[] | undefined) ?? []

    joyo.push({
      char: literal,
      grade,
      jlpt: misc?.jlpt ? JLPT_MAP[String(misc.jlpt)] ?? 'N1' : 'N1',
      meanings: meanings.filter(m => typeof m === 'string').map(m => m as string),
      on: readings.filter(r => r['@_r_type'] === 'ja_on').map(r => r['#text'] ?? '').filter(Boolean),
      kun: readings.filter(r => r['@_r_type'] === 'ja_kun').map(r => r['#text'] ?? '').filter(Boolean),
    })
  }

  // Sort by grade then JLPT
  const jlptOrder: Record<string, number> = { N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 }
  joyo.sort((a, b) => a.grade - b.grade || jlptOrder[a.jlpt] - jlptOrder[b.jlpt])

  console.log(`Total Jōyō kanji: ${joyo.length}`)

  const byGrade: Record<number, number> = {}
  const byJlpt: Record<string, number> = {}
  for (const k of joyo) {
    byGrade[k.grade] = (byGrade[k.grade] || 0) + 1
    byJlpt[k.jlpt] = (byJlpt[k.jlpt] || 0) + 1
  }
  console.log('Par grade:', byGrade)
  console.log('Par JLPT:', byJlpt)

  writeFileSync(join(SOURCES, 'joyo-list.json'), JSON.stringify(joyo, null, 2))
  console.log('Written to scripts/sources/joyo-list.json')
}

main().catch(e => { console.error(e); process.exit(1) })
