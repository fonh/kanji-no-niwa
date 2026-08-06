// Répliques d'ambiance des personnages de décor (issue 13).
//
// La carte est peuplée de deux populations très différentes :
//  - ~176 PNJ CURATÉS (content/map/npcs.json), chacun avec son fichier de
//    dialogue écrit à la main — ceux-là parlent depuis toujours ;
//  - ~2093 personnages de DÉCOR, qui viennent des objets de la ROM et n'ont ni
//    fiche ni dialogue. Le moteur leur servait un « ・・・・・・ » muet.
//
// Ce module donne une réplique aux seconds, tirée d'un pool commun
// (content/dialogues/ambient/lines.json).
//
// Le tirage est DÉTERMINISTE par personnage, pas aléatoire : un villageois qui
// change de phrase à chaque fois qu'on lui parle casse l'illusion plus qu'un
// villageois muet. Même identifiant → même réplique, pour toute la partie et
// d'une partie à l'autre.

// Chemin relatif (pas l'alias @/) : même convention que zones.ts et
// npc-sprites.ts, `require` d'un JSON que Vitest résout mal via l'alias.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pool = require('../../content/dialogues/ambient/lines.json') as AmbientPool

/** Une page de dialogue ordinaire. L'index signature aligne le type sur
 * `DialoguePageEntry` (src/lib/content.ts), pour que ces pages passent
 * directement dans la boîte de dialogue sans conversion. */
export interface AmbientPage {
  jp: string
  en: string
  [key: string]: unknown
}

export interface AmbientLine {
  id: string
  theme: string
  pages: AmbientPage[]
}

interface AmbientPool {
  lines: AmbientLine[]
}

/** Hash FNV-1a 32 bits — court, stable, sans dépendance. On veut seulement
 * répartir des identifiants sur un pool, pas résister à quoi que ce soit. */
function hash(key: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function ambientLineCount(): number {
  return pool.lines.length
}

/** Réplique d'ambiance d'un personnage de décor, ou null si le pool est vide
 * (le moteur retombe alors sur le battement muet — jamais de page blanche). */
export function ambientLineFor(objectId: string): AmbientLine | null {
  if (pool.lines.length === 0) return null
  return pool.lines[hash(objectId) % pool.lines.length]
}
