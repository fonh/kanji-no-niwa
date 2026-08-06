/**
 * prune-parasites.ts
 *
 * Supprime les fichiers de src/ non couverts par le PRD.
 * Doit être lancé après audit-prd.ts (lit scripts/modules.json).
 * Vérifie TypeScript + tests après suppression.
 */

import { readFileSync, rmSync, existsSync, statSync } from 'fs'
import { execSync } from 'child_process'
import { createInterface } from 'readline'

const MODULES_PATH = 'scripts/modules.json'

// ── Lecture de l'audit ────────────────────────────────────────────────────────

if (!existsSync(MODULES_PATH)) {
  console.error(`❌ ${MODULES_PATH} introuvable.`)
  console.error('   Lancez d\'abord : npx tsx scripts/audit-prd.ts\n')
  process.exit(1)
}

const { orphans } = JSON.parse(readFileSync(MODULES_PATH, 'utf-8')) as {
  orphans: string[]
  modules: Record<string, string[]>
}

// Vérifier que modules.json est plus récent que le PRD
const PRD_PATH = '.scratch/kanji-no-niwa/PRD.md'
if (existsSync(PRD_PATH)) {
  const prdMtime = statSync(PRD_PATH).mtimeMs
  const jsonMtime = statSync(MODULES_PATH).mtimeMs
  if (prdMtime > jsonMtime) {
    console.warn('⚠️  Le PRD a été modifié depuis le dernier audit.')
    console.warn('   Relancez audit-prd.ts pour être sûr.\n')
  }
}

if (orphans.length === 0) {
  console.log('✅ Aucun parasite à supprimer.')
  process.exit(0)
}

// ── Liste des fichiers à supprimer ────────────────────────────────────────────

console.log(`\n⚠️  ${orphans.length} fichier(s) parasite(s) :`)
for (const f of orphans) {
  console.log(`   ${f}`)
}

// ── Confirmation interactive ──────────────────────────────────────────────────

const rl = createInterface({ input: process.stdin, output: process.stdout })

function ask(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve))
}

async function main() {
  const mode = await ask('\nMode ? [t]out supprimer / [u]n par un / [a]nnuler : ')

  if (mode.toLowerCase() === 'a' || mode === '') {
    console.log('Annulé.')
    rl.close()
    return
  }

  const toDelete: string[] = []

  if (mode.toLowerCase() === 't') {
    toDelete.push(...orphans)
  } else if (mode.toLowerCase() === 'u') {
    for (const f of orphans) {
      const answer = await ask(`   Supprimer ${f} ? (y/N) `)
      if (answer.toLowerCase() === 'y') toDelete.push(f)
    }
  } else {
    console.log('Réponse non reconnue. Annulé.')
    rl.close()
    return
  }

  rl.close()

  if (toDelete.length === 0) {
    console.log('\nAucun fichier sélectionné.')
    return
  }

  // ── Suppression ───────────────────────────────────────────────────────────

  console.log(`\n🗑️  Suppression de ${toDelete.length} fichier(s)...`)
  let deleted = 0
  for (const f of toDelete) {
    if (existsSync(f)) {
      rmSync(f)
      console.log(`   ✅ ${f}`)
      deleted++
    } else {
      console.log(`   ⏭️  Déjà absent : ${f}`)
    }
  }
  console.log(`\n${deleted} fichier(s) supprimé(s).`)

  // ── Vérification TypeScript ────────────────────────────────────────────────

  console.log('\n🔍 Vérification TypeScript (tsc --noEmit)...')
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' })
    console.log('✅ TypeScript OK\n')
  } catch {
    console.error('❌ Erreurs TypeScript — des imports cassés restent à corriger.\n')
  }

  // ── Tests ──────────────────────────────────────────────────────────────────

  console.log('🧪 Tests (vitest run)...')
  try {
    execSync('npm test', { stdio: 'inherit' })
    console.log('✅ Tests OK\n')
  } catch {
    console.error('❌ Des tests échouent.\n')
  }
}

main()
