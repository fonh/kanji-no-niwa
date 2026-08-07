// Deux bugs d'affichage vus en jeu (issue 13, QA humaine du 2026-08-07), tous
// deux invisibles aux tests jusqu'ici parce qu'ils ne se jugeaient qu'à l'œil.
import { describe, it, expect } from 'vitest'
import {
  cameraOffset,
  depthZ,
  mapZoom,
  DEPTH_Z_BASE,
  DEPTH_Z_CEILING,
  MAX_ZOOM,
} from './map-camera'
import { getZoneByName } from './zones'

describe('ordre de dessin des personnages', () => {
  it('celui qui est plus bas à l’écran passe devant', () => {
    // Le compagnon dessiné sur la tête du joueur : il le suivait par le nord,
    // donc DERRIÈRE lui, et son z-index fixe (9) le mettait quand même devant.
    const joueur = depthZ(300, 256)
    const compagnonAuNord = depthZ(299, 256)
    expect(compagnonAuNord).toBeLessThan(joueur)
    expect(depthZ(301, 256)).toBeGreaterThan(joueur)
  })

  it('le joueur gagne les égalités sur sa propre rangée', () => {
    expect(depthZ(300, 256) + 1).toBeGreaterThan(depthZ(300, 256))
    // …sans pour autant passer devant la rangée suivante.
    expect(depthZ(300, 256) + 1).toBeLessThan(depthZ(301, 256))
  })

  it('aucune carte ne peut atteindre le plafond réservé à l’interface', () => {
    // Si une carte y arrivait, un personnage se dessinerait par-dessus la boîte
    // de dialogue.
    for (const name of ['MAP_ROUTE_30', 'MAP_ROUTE_31', 'MAP_VIOLET']) {
      const zone = getZoneByName(name)!
      const derniere = depthZ(zone.world_origin_y + zone.tile_height, zone.world_origin_y)
      expect(derniere, name).toBeLessThan(DEPTH_Z_CEILING)
      expect(derniere, name).toBeGreaterThanOrEqual(DEPTH_Z_BASE)
    }
  })
})

describe('grossissement', () => {
  it('une petite pièce remplit le cadre au lieu de flotter dans du noir', () => {
    // La maison du Père Kéa, vue en jeu : la pièce tenait dans la moitié de
    // l'écran, entourée d'un large cadre noir, parce que le plafond de 4×
    // s'appliquait aussi aux intérieurs plus petits que le cadre.
    const zoom = mapZoom(800, 600, 193, 130, 11.3982) // maison du Père Kéa
    expect(zoom).toBeGreaterThan(MAX_ZOOM)
    expect(193 * zoom).toBeGreaterThanOrEqual(800)
    expect(130 * zoom).toBeGreaterThanOrEqual(600)
  })

  it('une route garde le cadrage de la console, plafonné', () => {
    expect(mapZoom(800, 600, 563, 1196, 12.46)).toBe(MAX_ZOOM)
  })
})

describe('caméra bornée au décor', () => {
  const STAGE = 256

  it('au bord d’une carte, la caméra s’arrête au décor', () => {
    // Le bug : au bord ouest de la Route 30, une large bande noire entrait dans
    // le champ. La caméra centrait sur le joueur sans regarder où finit l'image.
    expect(cameraOffset(0, STAGE, 1000)).toBe(0)
    expect(cameraOffset(10, STAGE, 1000)).toBe(0)
    expect(cameraOffset(1000, STAGE, 1000)).toBe(STAGE - 1000)
  })

  it('au milieu, elle centre normalement sur le joueur', () => {
    expect(cameraOffset(500, STAGE, 1000)).toBe(STAGE / 2 - 500)
  })

  it('un décor plus petit que le cadre est centré, pas collé à un bord', () => {
    // Les petits intérieurs : il n'y a pas de bord à respecter, seulement une
    // pièce à poser au milieu.
    expect(cameraOffset(40, STAGE, 100)).toBe((STAGE - 100) / 2)
    expect(cameraOffset(90, STAGE, 100)).toBe((STAGE - 100) / 2)
  })
})
