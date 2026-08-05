import { describe, it, expect } from 'vitest'
import { resolveNpcSprite } from './npc-sprites'

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
    expect(resolved).toEqual({ url: '/sprites/overworld/tree.png', cols: 1 })
  })
})
