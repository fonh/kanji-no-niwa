// Gate SRS quotidien (issue 10, PRD § Boucle Quotidienne pt 5) — logique pure.
// Le gate n'est JAMAIS une Condition (invariant de monotonie, finding 02-D4) :
// il vit ici, hors du vocabulaire Condition/Effect, et ne s'applique qu'à
// l'entrée en zone EXTÉRIEURE JAMAIS VISITÉE quand le SRS du jour n'est pas ✓.
import { describe, it, expect } from 'vitest'
import { gateBlocksEntry } from './zone-gate'

const route31 = { name: 'MAP_ROUTE_31', is_outdoor: true }
const elmsLab = { name: 'MAP_NEW_BARK_ELMS_LAB_1F', is_outdoor: false }

describe('gateBlocksEntry', () => {
  it('bloque une zone extérieure jamais visitée quand le SRS du jour n’est pas fait', () => {
    expect(gateBlocksEntry(route31, ['MAP_NEW_BARK', 'MAP_ROUTE_29'], false)).toBe(true)
  })

  it('ne bloque jamais une zone déjà visitée (retour en arrière libre)', () => {
    expect(gateBlocksEntry(route31, ['MAP_ROUTE_31'], false)).toBe(false)
  })

  it('ne bloque jamais un intérieur/étage, même jamais visité (finding 03-D5)', () => {
    expect(gateBlocksEntry(elmsLab, [], false)).toBe(false)
  })

  it('ne bloque rien quand le SRS du jour est ✓', () => {
    expect(gateBlocksEntry(route31, [], true)).toBe(false)
  })

  it('jour sans carte due = sessionDone true en amont → gate ouvert (pas de re-calcul ici)', () => {
    // getDailySRSStatus (issue 06) rend sessionDone=true quand la file est
    // vide — le gate ne re-décide rien, il consomme le booléen.
    expect(gateBlocksEntry(route31, [], true)).toBe(false)
  })
})
