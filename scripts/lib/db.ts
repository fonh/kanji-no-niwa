import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const url = process.env.DATABASE_URL

if (!url) {
  console.error('Missing DATABASE_URL in .env.local')
  process.exit(1)
}

// HTTP-based client (not Pool): one-shot import scripts don't need a
// persistent connection, and the fetch-based driver needs no WebSocket
// polyfill and no explicit close — the process exits naturally when main()
// resolves, matching how the previous REST-based Supabase client behaved.
export const sql = neon(url)

// Fetch all known kanji IDs — used by both the kanjivg and kradfile
// importers to filter component edges down to kanji already in the table.
export async function getKnownKanjiIds() {
  const rows = (await sql.query('select id from kanji')) as { id: string }[]
  return new Set(rows.map(r => r.id))
}

// Bulk upsert: builds one multi-row `insert ... on conflict` statement from
// an array of same-shaped row objects, instead of one round-trip per row.
// `table`/column names come from the pipeline's own trusted code, never from
// parsed source data, so string-building them into the SQL text is safe here.
export async function upsertBatch(
  table: string,
  rows: Record<string, unknown>[],
  conflictColumns: string[],
  opts: { ignoreDuplicates?: boolean } = {}
) {
  if (rows.length === 0) return

  const columns = Object.keys(rows[0])
  const updateSet = columns
    .filter(c => !conflictColumns.includes(c))
    .map(c => `${c} = excluded.${c}`)
    .join(', ')

  const values: unknown[] = []
  const rowPlaceholders = rows.map(row => {
    const placeholders = columns.map(col => {
      values.push(row[col])
      return `$${values.length}`
    })
    return `(${placeholders.join(', ')})`
  })

  const action = opts.ignoreDuplicates || !updateSet ? 'do nothing' : `do update set ${updateSet}`

  await sql.query(
    `insert into ${table} (${columns.join(', ')})
     values ${rowPlaceholders.join(', ')}
     on conflict (${conflictColumns.join(', ')}) ${action}`,
    values
  )
}
