// Issue 13 — « je veux que tous les PNJ aient quelque chose à dire ».
//
// Les ~176 PNJ curatés parlaient déjà (172 fichiers de dialogue écrits à la
// main). Ce sont les ~2093 personnages de DÉCOR, tirés des objets de la ROM,
// qui servaient un « ・・・・・・ » muet. Ces tests verrouillent la propriété
// qui rend le pool crédible : un figurant donné dit TOUJOURS la même chose.
import { describe, it, expect } from 'vitest'
import { ambientLineFor, ambientLineCount } from './ambient-lines'

describe('ambientLineFor', () => {
  it('rend toujours la même réplique pour le même personnage', () => {
    const first = ambientLineFor('obj_R29_gsboy2')
    expect(first).not.toBeNull()
    for (let i = 0; i < 20; i++) {
      expect(ambientLineFor('obj_R29_gsboy2')!.id).toBe(first!.id)
    }
  })

  it('ne donne pas la même réplique à tout le monde', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(k => ambientLineFor(`obj_${k}`)!.id)
    expect(new Set(ids).size).toBeGreaterThan(1)
  })

  it('répartit correctement sur le pool (aucune réplique n’accapare la moitié)', () => {
    const counts = new Map<string, number>()
    const N = 2000
    for (let i = 0; i < N; i++) {
      const id = ambientLineFor(`obj_zone_${i}`)!.id
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    // Avec un hash correct, chaque réplique tombe autour de N/pool ; on ne
    // teste que l'absence d'effondrement, pas l'uniformité parfaite.
    expect(counts.size).toBeGreaterThan(ambientLineCount() * 0.8)
    expect(Math.max(...counts.values())).toBeLessThan(N / 4)
  })
})

describe('pool de répliques', () => {
  it('a de quoi peupler une carte sans répétition criante', () => {
    expect(ambientLineCount()).toBeGreaterThanOrEqual(40)
  })

  it('chaque réplique a au moins une page, jp et en renseignés', () => {
    const broken: string[] = []
    for (let i = 0; i < 500; i++) {
      const line = ambientLineFor(`obj_${i}`)!
      if (line.pages.length === 0) broken.push(`${line.id}: aucune page`)
      for (const p of line.pages) {
        if (!p.jp?.trim()) broken.push(`${line.id}: jp vide`)
        if (!p.en?.trim()) broken.push(`${line.id}: en vide`)
      }
    }
    expect([...new Set(broken)]).toEqual([])
  })

  it('n’utilise que l’espace pleine largeur entre les groupes de mots', () => {
    // Le japonais du jeu sépare les groupes par U+3000. Une espace ASCII qui
    // se glisse dans une réplique se voit immédiatement à l'écran.
    const bad: string[] = []
    for (let i = 0; i < 500; i++) {
      const line = ambientLineFor(`obj_${i}`)!
      for (const p of line.pages) {
        if (/ /.test(p.jp)) bad.push(line.id)
      }
    }
    expect([...new Set(bad)]).toEqual([])
  })
})
