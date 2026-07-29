// Applique un fichier de migration SQL sur la base Neon pointée par DATABASE_URL.
//
// Usage : npm run db:migrate -- db/migrations/002_xxx.sql
//
// Contrairement à scripts/lib/db.ts (driver HTTP, une requête par statement),
// on utilise ici le Client WebSocket de @neondatabase/serverless : le protocole
// « simple query » de Postgres accepte un fichier multi-statements en un seul
// query(), exécuté dans une transaction implicite (tout ou rien). Node ≥ 22
// fournit WebSocket en global, aucun polyfill nécessaire.

import { readFileSync } from 'node:fs'
import { Client } from '@neondatabase/serverless'

async function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage : npm run db:migrate -- <fichier.sql>')
    process.exit(1)
  }

  const url = process.env.DATABASE_URL
  if (!url) {
    console.error(
      'DATABASE_URL est absente ou vide (voir .env.local) — impossible de se connecter à Neon.'
    )
    process.exit(1)
  }

  let sqlText: string
  try {
    sqlText = readFileSync(file, 'utf8')
  } catch {
    console.error(`Fichier introuvable ou illisible : ${file}`)
    process.exit(1)
  }

  const client = new Client({ connectionString: url })
  await client.connect()
  try {
    await client.query(sqlText)
    console.log(`Migration appliquée : ${file}`)
  } finally {
    await client.end()
  }
}

main().catch(err => {
  console.error('Échec de la migration :', err instanceof Error ? err.message : err)
  process.exit(1)
})
