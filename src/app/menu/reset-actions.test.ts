// Issue 13 — « un bouton reset qui supprime ma partie, toutes mes données ».
//
// Une action qui promet d'effacer TOUT doit effacer tout : le risque n'est pas
// qu'elle plante, c'est qu'elle oublie une table en silence le jour où on en
// ajoute une. Ce test lit le schéma et la liste des suppressions, et exige
// qu'elles coïncident.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const MIGRATIONS = 'db/migrations'
const ACTION = 'src/app/menu/reset-actions.ts'

/** Tables déclarées avec une colonne `user_id`, hors `users` elle-même. */
function tablesWithUserId(): Set<string> {
  const found = new Set<string>()
  for (const file of readdirSync(MIGRATIONS).filter(f => f.endsWith('.sql'))) {
    const sql = readFileSync(join(MIGRATIONS, file), 'utf8')
    for (const block of sql.split(/create table\s+/i).slice(1)) {
      const name = block.match(/^(?:public\.)?([a-z_]+)/i)?.[1]
      if (!name || name === 'users') continue
      const body = block.slice(0, block.indexOf(');'))
      if (/^\s*user_id\b/m.test(body)) found.add(name)
    }
  }
  return found
}

function tablesDeletedByReset(): Set<string> {
  const src = readFileSync(ACTION, 'utf8')
  return new Set(
    Array.from(src.matchAll(/delete from\s+([a-z_]+)\s+where user_id/g)).map(m => m[1])
  )
}

describe('resetPlayerData — couverture du schéma', () => {
  it('efface toutes les tables qui portent un user_id', () => {
    const missing = [...tablesWithUserId()].filter(t => !tablesDeletedByReset().has(t)).sort()
    expect(missing, 'tables oubliées par le reset').toEqual([])
  })

  it('n’efface aucune table qui n’existe pas dans le schéma', () => {
    const schema = tablesWithUserId()
    const bogus = [...tablesDeletedByReset()].filter(t => !schema.has(t)).sort()
    expect(bogus).toEqual([])
  })

  it('remet le dresseur à zéro pour que le joueur repasse par l’onboarding', () => {
    // `isOnboarded()` = trainer_name ET avatar renseignés ; les deux doivent
    // repartir à null, sinon le joueur retombe sur une carte vide sans jamais
    // pouvoir se recréer un personnage.
    const src = readFileSync(ACTION, 'utf8')
    expect(src).toMatch(/trainer_name\s*=\s*null/)
    expect(src).toMatch(/avatar\s*=\s*null/)
  })

  it('ne supprime pas la ligne users (identité Google, session en cours)', () => {
    expect(readFileSync(ACTION, 'utf8')).not.toMatch(/delete from users\b/)
  })
})
