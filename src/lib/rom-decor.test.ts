// Tri des figurants du décor ROM (2026-08-06) — sur le contenu réel.
//
// Deux bugs vus en jeu, une seule cause : `zone.objects` (dump brut des
// zone_event de la ROM) était servi en entier, en plus du contenu curaté.
import { describe, it, expect } from 'vitest'
import { getZoneByName } from './zones'
import { getNpcsForZone } from './npcs'
import { getTrainersForZone } from './trainers'
import { visibleRomObjects, inheritedSpriteId } from './rom-decor'
import { canTraverse, warpAt } from './zone-geometry'
import { resolveNpcSprite } from './npc-sprites'

const ROUTE_30 = getZoneByName('MAP_ROUTE_30')!
const occupantsOf = (zone: typeof ROUTE_30) => [
  ...getNpcsForZone(zone),
  ...getTrainersForZone(zone),
]

const served = (zone: typeof ROUTE_30) =>
  visibleRomObjects(zone, occupantsOf(zone), []).map(o => o.id)

describe('doublons avec le contenu curaté', () => {
  it('les trois dresseurs de la Route 30 ne sont plus dessinés deux fois', () => {
    // Don, Mikey et Joey ont été reposés sur leurs objets ROM : les deux
    // tombent sur la même tuile, et la carte affichait quatre gamins
    // identiques là où il y en a trois.
    const ids = served(ROUTE_30)
    expect(ids).not.toContain('obj_R30_gsboy3') // Bug Catcher Don
    expect(ids).not.toContain('obj_R30_gsboy2_2') // Youngster Mikey
    expect(ids).not.toContain('obj_R30_gsboy2') // Youngster Joey
  })

  it('les trois figurants d’ambiance de la Route 30, promus, ne doublent pas non plus', () => {
    // 2026-08-07 : ces trois-là étaient l'exemple même du « figurant sans
    // équivalent curaté » — ils sont désormais des personnages à part entière
    // (content/map/npcs.json), reposés sur ces mêmes objets. Le tri doit donc
    // les retirer du décor exactement comme les dresseurs ci-dessus, sans quoi
    // chacun serait dessiné deux fois sur sa propre tuile.
    const ids = served(ROUTE_30)
    expect(ids).not.toContain('obj_R30_gsman1') // road_man_route30
    expect(ids).not.toContain('obj_R30_gsgirl2') // north_girl_route30
    expect(ids).not.toContain('obj_R30_gsboy3_2') // entrance_boy_route30
  })

  it('les figurants d’ambiance sans équivalent curaté restent, eux', () => {
    // Une zone encore non passée en revue : le tri ne doit pas dépeupler la
    // carte, il ne doit retirer que les doublons.
    const ids = served(getZoneByName('MAP_ROUTE_31')!)
    expect(ids).toContain('obj_R31_gsman1')
    expect(ids).toContain('obj_R31_gsboy1')
    // obj_R31_gsbigman, lui, a rejoint le contenu curaté le 2026-08-07 :
    // black_apricorn_man_route31 était posé 4 cases à l'est et invisible, il est
    // revenu sur son objet — donc trié comme un doublon, comme il se doit.
    expect(ids).not.toContain('obj_R31_gsbigman')
  })

  it('le Silver du décor ne double pas le Silver curaté, à Bourg Geon', () => {
    expect(served(getZoneByName('MAP_NEW_BARK')!)).not.toContain('obj_T20_gsrivel')
  })
})

describe('figurants de scènes conditionnelles', () => {
  it('la scène de combat scriptée de la Route 30 n’est pas servie', () => {
    // FLAG_HIDE_ROUTE_30_BATTLERS : le jeu d'origine la cache dès la livraison
    // de l'œuf. Nous n'avons pas ce drapeau — et ces trois figurants tenaient
    // les tuiles (8,38), (8,39) et (8,41).
    const ids = served(ROUTE_30)
    for (const id of [
      'obj_R30_gsboy2_3',
      'obj_R30_tsure_poke_static_rattata',
      'obj_R30_tsure_poke_static_pidgey',
    ]) {
      expect(ids, id).not.toContain(id)
    }
  })

  it('un obstacle garde sa tuile, malgré son drapeau ROM', () => {
    // FLAG_MAPTEMP_* ne veut pas dire « caché » mais « pas encore franchi » :
    // retirer un arbre à couper ouvrirait un passage que le jeu ferme.
    expect(served(ROUTE_30)).toContain('obj_R30_tree')
    expect(served(getZoneByName('MAP_VIOLET')!)).toContain('obj_T22_breakrock')
  })

  it('un obstacle déjà franchi disparaît', () => {
    const kept = visibleRomObjects(ROUTE_30, occupantsOf(ROUTE_30), ['MAP_ROUTE_30#obj_R30_tree'])
    expect(kept.map(o => o.id)).not.toContain('obj_R30_tree')
  })
})

describe('le couloir ouest de la Route 30 est franchissable', () => {
  // Le bug tel que vu en jeu : joueur en (7,43), impossible de monter. La
  // rangée 40 n'a qu'une ouverture (x=8, le reste est un rebord à sens
  // unique), et les trois figurants de la scène scriptée occupaient
  // précisément cette colonne.
  const northernmostReachable = (solids: Set<string>) => {
    const ox = ROUTE_30.world_origin_x
    const oy = ROUTE_30.world_origin_y
    for (const e of occupantsOf(ROUTE_30)) solids.add(`${e.world_x},${e.world_z}`)
    const abilities = { surf: false, whirlpool: false, waterfall: false }
    const start = { x: ox + 7, z: oy + 43 }
    const seen = new Set([`${start.x},${start.z}`])
    const queue = [start]
    let best = Infinity
    while (queue.length) {
      const cur = queue.shift()!
      best = Math.min(best, cur.z - oy)
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const next = { x: cur.x + dx, z: cur.z + dz }
        const key = `${next.x},${next.z}`
        if (next.x - ox > 13) continue // on reste dans le couloir ouest
        if (seen.has(key) || solids.has(key)) continue
        if (!canTraverse(ROUTE_30, next.x, next.z, abilities)) continue
        seen.add(key)
        queue.push(next)
      }
    }
    return best
  }

  it('avec tous les objets ROM solides (l’ancien comportement), on est muré', () => {
    const solids = new Set<string>()
    for (const o of ROUTE_30.objects) {
      if (warpAt(ROUTE_30, o.x, o.z)) continue
      if (resolveNpcSprite(o.spriteId, o.eventFlag) === null) continue
      solids.add(`${o.x},${o.z}`)
    }
    expect(northernmostReachable(solids)).toBeGreaterThan(35)
  })

  it('avec le tri, le couloir remonte jusqu’en haut de la route', () => {
    const solids = new Set(visibleRomObjects(ROUTE_30, occupantsOf(ROUTE_30), []).map(o => `${o.x},${o.z}`))
    expect(northernmostReachable(solids)).toBeLessThan(10)
  })
})

describe('un personnage curaté sans sprite déclaré', () => {
  it('hérite de l’apparence de l’objet ROM qu’il remplace', () => {
    // Vu en jeu (2026-08-07) : dans la maison de M. Pokémon, la capture montrait
    // les figurants peints, et nos deux personnages — M. Pokémon et le Prof.
    // Chen, posés sur leurs objets ROM en (9,7) et (8,7) — n'étaient dessinés
    // nulle part. Ils portent le dialogue qui donne l'Œuf : invisibles, ils
    // restaient une tuile vide qui répond au bouton A.
    const house = getZoneByName('MAP_ROUTE_30_MR_POKEMON_HOUSE')!
    expect(inheritedSpriteId(house, 9, 7)).toBe('SPRITE_GSGENTLEMAN')
    expect(inheritedSpriteId(house, 8, 7)).toBe('SPRITE_OOKIDO')
  })

  it('n’hérite ni d’un arbre, ni d’une Poké Ball, ni d’une tuile vide', () => {
    // Le filet ne doit pas déguiser un personnage en décor.
    expect(inheritedSpriteId(ROUTE_30, 0, 0)).toBeUndefined()
    const tree = ROUTE_30.objects.find(o => o.id === 'obj_R30_tree')!
    expect(inheritedSpriteId(ROUTE_30, tree.x, tree.z)).toBeUndefined()
    const ball = ROUTE_30.objects.find(o => o.spriteId === 'SPRITE_MONSTARBALL')
    if (ball) expect(inheritedSpriteId(ROUTE_30, ball.x, ball.z)).toBeUndefined()
  })
})
