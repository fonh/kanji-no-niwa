/**
 * audit-prd.ts
 *
 * Vérifie que le PRD nomme explicitement chaque fichier de src/ dans une section ## Modules.
 * Produit scripts/modules.json pour prune-parasites.ts.
 *
 * Format attendu dans le PRD :
 *
 *   ## Modules
 *
 *   - `NomModule` : `src/lib/fichier.ts`
 *   - `AutreModule` : `src/app/page.tsx`, `src/app/layout.tsx`
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join } from 'path'

const PRD_PATH = '.scratch/kanji-no-niwa/PRD.md'
const OUT_PATH = 'scripts/modules.json'

// Fichiers Next.js boilerplate sans module propriétaire
const DEFAULT_IGNORE = new Set([
  'src/app/globals.css',
  'src/app/favicon.ico',
])

// ── Lecture du PRD ────────────────────────────────────────────────────────────

if (!existsSync(PRD_PATH)) {
  console.error(`❌ PRD introuvable : ${PRD_PATH}`)
  process.exit(1)
}

const prd = readFileSync(PRD_PATH, 'utf-8')

// Extraire la section ## Modules jusqu'à la prochaine section ##
const sectionMatch = prd.match(/^## Modules\n([\s\S]*?)(?=\n## |\s*$)/m)

if (!sectionMatch) {
  console.error('❌ Section "## Modules" introuvable dans le PRD.\n')
  console.error('Ajoutez cette section à la fin du PRD avant de relancer :\n')
  console.error('## Modules\n')
  console.error('- `NomModule` : `src/lib/fichier.ts`')
  console.error('- `AutreModule` : `src/app/page.tsx`, `src/app/layout.tsx`\n')
  process.exit(1)
}

// ── Parsing des modules ───────────────────────────────────────────────────────

const modulesSection = sectionMatch[1]
const modules: Record<string, string[]> = {}
const coveredFiles = new Set<string>()

const lineRegex = /^-\s+`([^`]+)`\s*:\s*(.+)$/gm
let match: RegExpExecArray | null

while ((match = lineRegex.exec(modulesSection)) !== null) {
  const moduleName = match[1]
  const filesStr = match[2]
  const files: string[] = []
  const fileRegex = /`(src\/[^`]+)`/g
  let fm: RegExpExecArray | null
  while ((fm = fileRegex.exec(filesStr)) !== null) {
    const normalized = fm[1].replace(/\\/g, '/')
    files.push(normalized)
    coveredFiles.add(normalized)
  }
  if (files.length > 0) modules[moduleName] = files
}

if (Object.keys(modules).length === 0) {
  console.error('❌ Aucun module valide trouvé dans "## Modules".')
  console.error('Format attendu : - `NomModule` : `src/chemin/fichier.ts`\n')
  process.exit(1)
}

// ── Scan de src/ ─────────────────────────────────────────────────────────────

function scanDir(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...scanDir(full))
    } else {
      results.push(full.replace(/\\/g, '/'))
    }
  }
  return results
}

const allSrcFiles = scanDir('src')
const orphans = allSrcFiles.filter(f => !coveredFiles.has(f) && !DEFAULT_IGNORE.has(f))

// ── Rapport ───────────────────────────────────────────────────────────────────

console.log(`\n📋 Modules déclarés dans le PRD (${Object.keys(modules).length}) :`)
for (const [name, files] of Object.entries(modules)) {
  console.log(`   ${name}`)
  for (const f of files) {
    const exists = existsSync(f)
    console.log(`      ${exists ? '✅' : '⚠️ (absent)'} ${f}`)
  }
}

console.log(`\n📁 Fichiers dans src/ : ${allSrcFiles.length}`)
console.log(`   Couverts  : ${coveredFiles.size}`)
console.log(`   Ignorés   : ${DEFAULT_IGNORE.size} (boilerplate)`)
console.log(`   Parasites : ${orphans.length}`)

if (orphans.length === 0) {
  console.log('\n🎉 Aucun parasite — le PRD couvre tout src/.')
} else {
  console.log('\n⚠️  Fichiers non couverts par le PRD :')
  for (const f of orphans) {
    console.log(`   ${f}`)
  }
  console.log('\n→ Soit ajoutez-les à la section ## Modules du PRD,')
  console.log('  soit lancez scripts/prune-parasites.ts pour les supprimer.')
}

// ── Écriture modules.json ─────────────────────────────────────────────────────

writeFileSync(OUT_PATH, JSON.stringify({ modules, coveredFiles: [...coveredFiles], orphans }, null, 2))
console.log(`\n📄 ${OUT_PATH} mis à jour.\n`)
