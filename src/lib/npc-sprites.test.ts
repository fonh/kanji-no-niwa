import { describe, it, expect } from 'vitest'
import { resolveNpcSprite, spriteFrameOffset, SPRITE_FRAME_SIZE } from './npc-sprites'

// Issue 13 (QA humaine, 3ᵉ signalement Route 29) : un blob noir uni flottait
// près de la petite clairière boisée. Identifié par recalage image (position
// exacte) comme `obj_R29_bonguri` (SPRITE_BONGURI) — un objet de décor
// « buisson à baies » posé sur 31 zones dans tout le jeu (pas que Route 29),
// pas un PNJ curaté. Cause : `public/sprites/overworld/bonguri.png` (et ses 7
// variantes couleur bonguri_b/bk/g/p/r/w/y, inutilisées par aucun objet) sont
// UNIES NOIR (0,0,0) sur 100% des pixels non transparents, vérifié
// pixel-par-pixel (PIL getcolors) — contrairement à `bonmi_r`/`bonmi_y` (les
// icônes d'item ramassé, mêmes baies) qui ont bien des couleurs distinctes.
// C'est un défaut de la planche source (palette perdue à l'extraction ROM),
// pas un bug de rendu MapClient (pas de CSS/offset en cause, `resolveNpcSprite`
// résolvait déjà `bonguri.png` correctement, l'image elle-même est cassée).
// Aucun script d'extraction committé ne reproduit ce pipeline pour re-tenter
// une extraction propre dans le temps disponible — repli sur un sprite déjà
// vérifié correct de la même famille « décor végétal » (`tree`, un buisson/
// jeune arbre correctement coloré, déjà utilisé ailleurs sur Route 29 via
// SPRITE_TREE) plutôt que de laisser un blob noir non identifiable in-game.
describe('resolveNpcSprite — SPRITE_BONGURI (issue 13, blob noir)', () => {
  it('ne résout jamais vers la planche bonguri cassée (unie noire)', () => {
    const resolved = resolveNpcSprite('SPRITE_BONGURI')
    expect(resolved).not.toBeNull()
    expect(resolved!.url).not.toMatch(/bonguri/)
  })

  it('retombe sur un sprite végétal déjà vérifié correct (tree)', () => {
    const resolved = resolveNpcSprite('SPRITE_BONGURI')
    expect(resolved!.url).toBe('/sprites/overworld/tree.png')
  })
})

// Issue 13 (QA humaine) — « tous les PNJ sont tournés vers le haut, ils nous
// tournent le dos ». Le moteur affichait toujours la frame (0,0), sur la foi
// d'un commentaire qui la disait « face au sud (idle) ». Elle ne l'est pas :
// sur toutes les planches ROM vérifiées, c'est le DOS du personnage. Les 4
// directions existent bel et bien, à des index de frame décodés hors ligne
// (scripts/build/tag-overworld-sprite-directions.py, `dirs`).
describe('spriteFrameOffset — orientation des planches overworld', () => {
  const F = SPRITE_FRAME_SIZE

  it('planche ROM 16 frames : le sud n’est PAS la frame (0,0)', () => {
    const sprite = resolveNpcSprite('SPRITE_GSBIGMAN')!
    expect(sprite.dirs).toBeDefined()
    expect(spriteFrameOffset(sprite, 'north')).toEqual({ x: 0, y: 0 })
    expect(spriteFrameOffset(sprite, 'west')).toEqual({ x: -1 * F, y: 0 })
    expect(spriteFrameOffset(sprite, 'east')).toEqual({ x: -5 * F, y: 0 })
    // frame 11 sur une planche 8 colonnes = colonne 3, rangée 1
    expect(spriteFrameOffset(sprite, 'south')).toEqual({ x: -3 * F, y: -1 * F })
  })

  it('les quatre directions donnent quatre frames distinctes', () => {
    const sprite = resolveNpcSprite('SPRITE_GSBIGMAN')!
    const seen = (['south', 'north', 'west', 'east'] as const).map(d => {
      const o = spriteFrameOffset(sprite, d)
      return `${o.x},${o.y}`
    })
    expect(new Set(seen).size).toBe(4)
  })

  it('planche convertie 4 rangées (HNS) : une rangée par direction, colonne 0', () => {
    const elm = resolveNpcSprite('SPRITE_DOCTOR')!
    expect(elm.rows).toBe(4)
    expect(spriteFrameOffset(elm, 'south')).toEqual({ x: 0, y: 0 })
    expect(spriteFrameOffset(elm, 'north')).toEqual({ x: 0, y: -F })
  })

  it('planche à disposition inconnue : frame 0 plutôt qu’une frame inventée', () => {
    const unknown = { url: '/x.png', cols: 3 }
    expect(spriteFrameOffset(unknown, 'south')).toEqual({ x: 0, y: 0 })
    expect(spriteFrameOffset(unknown, 'east')).toEqual({ x: 0, y: 0 })
  })
})
