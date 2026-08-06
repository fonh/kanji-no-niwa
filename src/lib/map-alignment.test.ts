// Issue 13 (QA humaine, « les arbres et les obstacles sont mal gérés en
// général »). Le placement de la grille de collision sur le screenshot était
// déduit des dimensions de l'image (`scale = px / nb_tuiles`, origine
// implicite en 0,0). Faux deux fois : les cartes HGSS sont des rendus à
// caméra oblique (une tuile fait ~16 px de large pour ~12 px de haut) et
// leurs captures sont recadrées à la main avec une marge de décor hors carte.
// La grille dérivait donc de plusieurs tuiles — jusqu'à ~20 verticalement sur
// Route 29 — et tout ce que la QA a remonté (arbres traversables, murs
// invisibles, passages fermés, PNJ dans la canopée) n'était que ce décalage
// vu à des endroits différents.
//
// Ces tests verrouillent l'invariant : l'alignement est une donnée MESURÉE
// (scripts/build/fit-map-alignment.py → scripts/sources/map-alignment.json),
// jamais recalculée depuis la taille de l'image.
import { describe, it, expect } from 'vitest'
import { getAllZones, getZoneByName } from './zones'
import { worldToPixel } from './zone-geometry'

const withShot = getAllZones().filter(z => z.screenshot)

describe('worldToPixel', () => {
  it('part de origin_p*, pas du coin de l’image', () => {
    const zone = getZoneByName('MAP_ROUTE_29')!
    const corner = worldToPixel(zone, zone.world_origin_x, zone.world_origin_y)
    expect(corner.x).toBe(zone.origin_px)
    expect(corner.y).toBe(zone.origin_py)
  })

  it('avance d’un pas de tuile par tuile, sur chaque axe indépendamment', () => {
    const zone = getZoneByName('MAP_ROUTE_29')!
    const a = worldToPixel(zone, zone.world_origin_x + 3, zone.world_origin_y + 7)
    expect(a.x).toBeCloseTo(zone.origin_px + 3 * zone.scale_x)
    expect(a.y).toBeCloseTo(zone.origin_py + 7 * zone.scale_y)
  })
})

describe('alignement des zones jouables du jalon 1', () => {
  // Le pas mesuré doit rester celui de la caméra HGSS. Si une régénération du
  // registre le fait repartir vers `screenshot_h / tile_height` (17.44 sur
  // Route 29), c'est que le recalage a été court-circuité.
  it.each(['MAP_NEW_BARK', 'MAP_ROUTE_29', 'MAP_CHERRYGROVE', 'MAP_ROUTE_30'])(
    '%s : pas ≈ 16×12 px/tuile, pas la taille de l’image divisée par la grille',
    name => {
      const z = getZoneByName(name)!
      expect(z.screenshot, 'la zone doit être servie avec sa capture').not.toBe('')
      expect(z.scale_x).toBeGreaterThan(15.5)
      expect(z.scale_x).toBeLessThan(16.5)
      expect(z.scale_y).toBeGreaterThan(11.5)
      expect(z.scale_y).toBeLessThan(12.75)
      // Le raccourci vertical de la caméra : une tuile est nettement moins
      // haute que large. Deux échelles égales = alignement inventé.
      expect(z.scale_y).toBeLessThan(z.scale_x)
    }
  )

  it('Route 29 : la grille ROM est servie telle quelle, sans mur ajouté à la main', () => {
    // Trois passes de correction avaient muré ~300 tuiles pour faire coller
    // la collision à ce que l'image *semblait* montrer. L'un de ces patches a
    // enfermé un joueur dans une poche de 7 tuiles. La donnée ROM était juste
    // depuis le début : c'est son placement à l'écran qui était faux.
    const z = getZoneByName('MAP_ROUTE_29')!
    // (76,24) et (73,24) : les tuiles au cœur des patches successifs, toutes
    // praticables dans la ROM.
    for (const [x, zz] of [[76, 24], [73, 24], [74, 24], [50, 26]]) {
      const idx = zz * z.tile_width + x
      expect(z.terrain[idx], `tuile locale ${x},${zz}`).not.toBe('#')
    }
  })
})

describe('invariants de recalage (toutes zones servies avec une capture)', () => {
  it('la capture couvre bien la zone qu’elle illustre', () => {
    // Une capture peut n'être qu'un cadrage partiel de la carte (tours,
    // grottes) : le joueur marche alors hors de l'image, dans le noir, sans
    // rien pour le prévenir. Au-delà d'un cadrage un peu court (une capture
    // qui montre 2/3 de la carte reste préférable à une grille nue), la zone
    // doit basculer sur le rendu CollisionCanvas — c'est la garde
    // MIN_COVERAGE de build-zone-registry.py, à garder en phase avec elle.
    const partial = withShot.filter(z => {
      const x0 = z.origin_px
      const y0 = z.origin_py
      const x1 = x0 + z.scale_x * z.tile_width
      const y1 = y0 + z.scale_y * z.tile_height
      const area = (x1 - x0) * (y1 - y0)
      const ox = Math.max(0, Math.min(x1, z.screenshot_w) - Math.max(x0, 0))
      const oy = Math.max(0, Math.min(y1, z.screenshot_h) - Math.max(y0, 0))
      return area > 0 && (ox * oy) / area < 0.6
    })
    expect(partial.map(z => z.name)).toEqual([])
  })

  it('aucune zone ne se retrouve avec une échelle absurde', () => {
    const bad = withShot.filter(z => z.scale_x <= 0 || z.scale_y <= 0)
    expect(bad.map(z => z.name)).toEqual([])
  })
})
