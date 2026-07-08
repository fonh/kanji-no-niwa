/**
 * Parses kradfile and kradfile2 (plain text) and supplements kanji_components
 * with edges not already present from KanjiVG.
 * Run: npx tsx scripts/import-kradfile.ts
 *
 * KRADFILE format (EUC-JP encoded, one line per kanji):
 *   明 : 日 月
 * kradfile and kradfile2 from scripts/sources/ (extracted from kradzip.zip).
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { sql, getKnownKanjiIds, upsertBatch } from '../lib/db'

const SOURCES = join(import.meta.dirname, '../sources')
const BATCH_SIZE = 200

function parseKradfile(content: string): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const colonIdx = trimmed.indexOf(' : ')
    if (colonIdx === -1) continue
    const kanji = trimmed.slice(0, colonIdx).trim()
    const components = trimmed.slice(colonIdx + 3).split(' ').map(s => s.trim()).filter(Boolean)
    if (kanji && components.length) map.set(kanji, components)
  }
  return map
}

async function main() {
  console.log('Reading kradfile and kradfile2…')
  const content1 = readFileSync(join(SOURCES, 'kradfile'), 'latin1')
  const content2 = readFileSync(join(SOURCES, 'kradfile2'), 'latin1')

  const map1 = parseKradfile(content1)
  const map2 = parseKradfile(content2)
  // Merge: kradfile2 supplements kradfile
  for (const [k, v] of map2) {
    if (!map1.has(k)) map1.set(k, v)
  }

  // Fetch all known kanji IDs and existing kanjivg edges to avoid duplicating them
  const known = await getKnownKanjiIds()

  const existingRows = (await sql.query(
    `select parent_id, component_id from kanji_components where source = 'kanjivg'`
  )) as { parent_id: string; component_id: string }[]
  const existingEdges = new Set(existingRows.map(r => `${r.parent_id}:${r.component_id}`))

  const edges: { parent_id: string; component_id: string; source: string }[] = []

  for (const [kanji, components] of map1) {
    if (!known.has(kanji)) continue
    for (const comp of components) {
      if (!known.has(comp)) continue
      if (existingEdges.has(`${kanji}:${comp}`)) continue
      edges.push({ parent_id: kanji, component_id: comp, source: 'kradfile' })
    }
  }

  console.log(`Supplementing with ${edges.length} new edges from KRADFILE`)

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
