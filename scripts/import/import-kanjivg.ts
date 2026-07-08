/**
 * Parses kanjivg-*.xml.gz and writes visual component relationships to kanji_components.
 * Only stores edges where both parent and component are already in the kanji table.
 * Run: npx tsx scripts/import-kanjivg.ts
 *
 * KanjiVG structure: each <kanji> contains nested <g> elements.
 * Direct children of the root <g> whose kvg:element differs from the parent are components.
 */

import { createReadStream } from 'fs'
import { createGunzip } from 'zlib'
import { join } from 'path'
import { readdirSync } from 'fs'
import { XMLParser } from 'fast-xml-parser'
import { getKnownKanjiIds, upsertBatch } from '../lib/db'

const SOURCES = join(import.meta.dirname, '../sources')
const BATCH_SIZE = 200

async function readGzip(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    createReadStream(path).pipe(createGunzip())
      .on('data', (chunk: Buffer) => chunks.push(chunk))
      .on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      .on('error', reject)
  })
}

function extractComponents(g: Record<string, unknown>, parentElement: string): string[] {
  const children = (g['g'] ? (Array.isArray(g['g']) ? g['g'] : [g['g']]) : []) as Record<string, unknown>[]
  const result: string[] = []
  for (const child of children) {
    const el = child['@_kvg:element'] as string | undefined
    if (el && el !== parentElement) result.push(el)
  }
  return [...new Set(result)]
}

async function main() {
  const kanjivgFile = readdirSync(SOURCES).find(f => f.startsWith('kanjivg-') && f.endsWith('.xml.gz'))
  if (!kanjivgFile) { console.error('No kanjivg-*.xml.gz found in scripts/sources/'); process.exit(1) }

  console.log(`Parsing ${kanjivgFile}…`)
  const xml = await readGzip(join(SOURCES, kanjivgFile))

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => name === 'kanji' || name === 'g',
  })
  const doc = parser.parse(xml)
  const kanjiNodes: Record<string, unknown>[] = doc.kanjivg?.kanji ?? []

  // Fetch all known kanji IDs from DB
  const known = await getKnownKanjiIds()

  const edges: { parent_id: string; component_id: string; source: string }[] = []

  for (const node of kanjiNodes) {
    const rootG = node['g'] as Record<string, unknown> | Record<string, unknown>[] | undefined
    const firstG = Array.isArray(rootG) ? rootG[0] : rootG
    if (!firstG) continue

    const parentEl = firstG['@_kvg:element'] as string | undefined
    if (!parentEl || !known.has(parentEl)) continue

    const components = extractComponents(firstG, parentEl)
    for (const comp of components) {
      if (known.has(comp)) edges.push({ parent_id: parentEl, component_id: comp, source: 'kanjivg' })
    }
  }

  console.log(`Found ${edges.length} component edges`)

  let inserted = 0
  for (let i = 0; i < edges.length; i += BATCH_SIZE) {
    const batch = edges.slice(i, i + BATCH_SIZE)
    await upsertBatch('kanji_components', batch, ['parent_id', 'component_id', 'source'], { ignoreDuplicates: true })
    inserted += batch.length
    process.stdout.write(`\r  ${inserted}/${edges.length}`)
  }
  console.log(`\nDone — upserted ${inserted} edges.`)
}

main().catch(e => { console.error(e); process.exit(1) })
