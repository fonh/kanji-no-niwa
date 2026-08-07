// Quels objets du registre ROM la carte sert réellement (2026-08-06).
//
// POURQUOI
// --------
// `zone.objects` est le dump brut des `zone_event` de la ROM : tout ce que le
// jeu d'origine pose sur la carte, figurants scriptés compris. Le contenu
// curaté (`content/map/npcs.json`, `trainers.json`) décrit les MÊMES
// personnages, avec leur dialogue et leurs conditions. Les deux étaient
// dessinés, sans rien pour les réconcilier au-delà d'un cas particulier
// (Silver). Deux conséquences, toutes deux vues en jeu :
//
//   - **des personnages en double** — la Route 30 affichait quatre gamins
//     identiques : les trois dresseurs curatés (Don, Mikey, Joey) PLUS leurs
//     objets ROM d'origine sur la même tuile, PLUS la scène de combat scriptée
//     que le jeu d'origine cache après la livraison de l'œuf ;
//   - **des couloirs murés** — un objet ROM occupe sa tuile. Sur la Route 30,
//     la seule ouverture de la rangée 40 est la colonne x=8 ; les trois
//     figurants de cette scène scriptée (le gamin et ses deux Pokémon) y
//     étaient posés en (8,38), (8,39) et (8,41). Le joueur ne pouvait
//     physiquement plus monter vers Mauville.
//
// Le tri se fait ici, en logique pure, et sert AUX TROIS usages de MapClient
// (rendu, occupation de tuile, bouton A) — c'est justement leur divergence qui
// laissait un objet invisible continuer à bloquer une case.

import { isWalkable, warpAt, type Zone, type ZoneObject } from '@/lib/zone-geometry'
import { obstacleKey, obstacleKindOf } from '@/lib/obstacles'
import { resolveNpcSprite } from '@/lib/npc-sprites'
import { hasCollectible } from '@/lib/collectibles'

/** Objet de décor ROM → sprite du PNJ curaté qui représente le MÊME
 * personnage par un autre mécanisme. Sert à supprimer le doublon à l'échelle
 * de la zone, pas seulement quand les deux tombent sur la même tuile. */
const SPRITE_ALIASES: Record<string, string> = { SPRITE_GSRIVEL: 'SPRITE_HNS_SILVER' }

/** Le minimum qu'on a besoin de savoir d'un PNJ/dresseur curaté pour décider
 * si un objet ROM fait double emploi avec lui. */
export interface DecorOccupant {
  world_x: number
  world_z: number
  sprite_id?: string
  /** L'objet ROM que ce personnage REPRÉSENTE, quand il n'est pas posé
   * exactement dessus. Écrit par `scripts/build/assign-npc-sprites.py` : c'est
   * la façon explicite de dire « ces deux-là sont le même personnage », là où
   * la coïncidence de tuile ou de sprite ne suffit pas (le curateur l'a décalé
   * de trois cases pour le rendre joignable, par exemple). */
  rom_object?: string
}

/** Présence CONDITIONNELLE dans la ROM : le jeu d'origine décide de montrer
 * cet objet ou non d'après un drapeau de scénario (`FLAG_HIDE_*`,
 * `FLAG_UNK_*`…). Nous n'avons pas ces drapeaux — et nous n'en voulons pas :
 * tout personnage qui compte est décrit dans le contenu curaté, avec ses
 * `unlock_conditions`. Un figurant conditionnel affiché en permanence est donc
 * faux par construction : soit c'est un doublon du personnage curaté, soit
 * c'est un acteur d'une scène qu'on ne joue pas. */
function isConditional(obj: ZoneObject): boolean {
  const flag = obj.eventFlag
  return typeof flag === 'string' && flag !== '' && flag !== 'FLAG_NOTHING'
}

/** Les obstacles échappent à toutes les règles de figurants : ce sont des
 * éléments de TERRAIN (arbre à couper, rocher à briser, Simularbre, Ronflex),
 * leur drapeau ROM ne dit pas « caché » mais « pas encore franchi », et les
 * retirer ouvrirait des passages que le jeu ferme. */
function isObstacle(obj: ZoneObject): boolean {
  return obstacleKindOf(obj) !== null
}

/** Une Poké Ball posée au sol. Même exception que les obstacles : son drapeau
 * ROM (`FLAG_HIDE_ITEMBALL_*`) ne veut pas dire « figurant d'une scène qu'on ne
 * joue pas » mais « pas encore ramassée » — exactement l'état que le `cleared`
 * du joueur porte chez nous. Servie seulement si elle contient quelque chose :
 * promettre un ramassage qui ne donne rien est pire que ne rien montrer
 * (2026-08-06). */
export const ITEM_BALL_SPRITE = 'SPRITE_MONSTARBALL'

function isItemBall(obj: ZoneObject): boolean {
  return obj.spriteId === ITEM_BALL_SPRITE
}

/** L'apparence qu'un personnage curaté hérite du décor ROM qu'il remplace.
 *
 * Un PNJ curaté sans `sprite_id` n'était dessiné NULLE PART : le rendu ne
 * produisait qu'un div vide de 18 px. Le joueur croisait donc des tuiles vides
 * qui répondent au bouton A — Mr. Pokémon et le Prof. Chen invisibles dans leur
 * propre maison, le vieux monsieur d'Écorcia invisible sur le chemin de la
 * Route 30 (issue 13, QA du 2026-08-07).
 *
 * La curation repose la plupart de ces personnages SUR leur objet ROM, et
 * `visibleRomObjects` retire justement cet objet pour ne pas dessiner deux fois
 * le même personnage. L'apparence est donc là, sous ses pieds : on la lui rend
 * plutôt que de la jeter. Ça ne dispense pas d'écrire `sprite_id` — c'est un
 * filet, pas une source — mais aucun personnage posé sur son objet ROM ne peut
 * plus devenir invisible par oubli.
 */
export function inheritedSpriteId(
  zone: Zone,
  worldX: number,
  worldZ: number,
  romObject?: string
): string | undefined {
  const obj = romObject
    ? zone.objects.find(o => o.id === romObject)
    : zone.objects.find(o => o.x === worldX && o.z === worldZ)
  if (!obj || isObstacle(obj) || isItemBall(obj)) return undefined
  return resolveNpcSprite(obj.spriteId, obj.eventFlag) ? obj.spriteId : undefined
}

/** Les objets ROM que la carte sert vraiment, dans l'ordre du registre.
 *
 * @param occupants PNJ et dresseurs curatés DÉJÀ servis pour cette zone
 *                  (donc déjà filtrés par leurs `unlock_conditions`).
 * @param clearedKeys `progress.cleared` — obstacles franchis pour de bon.
 */
export function visibleRomObjects(
  zone: Zone,
  occupants: readonly DecorOccupant[],
  clearedKeys: readonly string[]
): ZoneObject[] {
  return zone.objects.filter(obj => {
    if (clearedKeys.includes(obstacleKey(zone.name, obj))) return false

    // Une porte est toujours franchissable, quoi qu'elle contienne : personne
    // n'est dessiné dessus (Maman coincée dans sa propre porte, issue 13).
    if (warpAt(zone, obj.x, obj.z)) return false

    // Objet posé dans un mur ou hors grille : ce n'est pas un figurant, c'est
    // une tuile de GARAGE. La ROM y range les objets qu'un script fera
    // apparaître ailleurs — 93 dans tout le jeu. Les dessiner donnait des PNJ
    // en lévitation hors carte (issue 13).
    if (!isWalkable(zone, obj.x, obj.z)) return false

    if (isObstacle(obj)) return true
    if (isItemBall(obj)) return hasCollectible(obj.id)

    // Doublon avec un personnage curaté : même tuile (quel que soit le sprite
    // — c'est le cas des dresseurs reposés sur leur objet ROM), ou même sprite
    // à une tuile près (le personnage a été décalé à la curation).
    const duplicated = occupants.some(o => {
      if (o.rom_object === obj.id) return true
      if (o.world_x === obj.x && o.world_z === obj.z) return true
      if (!o.sprite_id) return false
      const sameSprite =
        o.sprite_id === obj.spriteId || SPRITE_ALIASES[obj.spriteId] === o.sprite_id
      return sameSprite && Math.abs(o.world_x - obj.x) <= 1 && Math.abs(o.world_z - obj.z) <= 1
    })
    if (duplicated) return false

    if (isConditional(obj)) return false

    // Sprite non résoluble : on ne dessinait qu'un point, et ce point bloquait
    // une tuile. Un figurant qu'on ne sait pas dessiner ne doit pas non plus
    // barrer le chemin.
    return resolveNpcSprite(obj.spriteId, obj.eventFlag) !== null
  })
}
