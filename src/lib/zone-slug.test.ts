// Mapping MAP_* (registre de zones ROM) ↔ slug de contenu ("new-bark-town")
// — posé proprement à l'issue 09 (l'heuristique vivait locale dans npcs.ts,
// écart noté par l'issue 05).
import { describe, it, expect } from 'vitest'
import { visitedZoneSlugs, zoneSlugForMapName } from './zone-slug'

const SLUGS = ['new-bark-town', 'route-29', 'cherrygrove-city', 'route-30']

describe('zoneSlugForMapName', () => {
  it('match exact : MAP_ROUTE_29 → route-29', () => {
    expect(zoneSlugForMapName('MAP_ROUTE_29', SLUGS)).toBe('route-29')
  })

  it('match par préfixe : MAP_NEW_BARK → new-bark-town, MAP_CHERRYGROVE → cherrygrove-city', () => {
    expect(zoneSlugForMapName('MAP_NEW_BARK', SLUGS)).toBe('new-bark-town')
    expect(zoneSlugForMapName('MAP_CHERRYGROVE', SLUGS)).toBe('cherrygrove-city')
  })

  it('les intérieurs ne matchent pas (la zone extérieure porte le chapitre)', () => {
    expect(zoneSlugForMapName('MAP_NEW_BARK_ELMS_LAB_1F', SLUGS)).toBeUndefined()
    expect(zoneSlugForMapName('MAP_ROUTE_30_MR_POKEMON_HOUSE', SLUGS)).toBeUndefined()
  })

  it('zone inconnue → undefined', () => {
    expect(zoneSlugForMapName('MAP_GOLDENROD', SLUGS)).toBeUndefined()
  })
})

describe('visitedZoneSlugs', () => {
  it('ordre du voyage conservé, intérieurs filtrés, doublons dédupliqués', () => {
    expect(
      visitedZoneSlugs(
        [
          'MAP_NEW_BARK',
          'MAP_NEW_BARK_ELMS_LAB_1F',
          'MAP_ROUTE_29',
          'MAP_CHERRYGROVE',
          'MAP_ROUTE_30',
          'MAP_ROUTE_29', // retour — déjà comptée
        ],
        SLUGS
      )
    ).toEqual(['new-bark-town', 'route-29', 'cherrygrove-city', 'route-30'])
  })

  it('vide → vide', () => {
    expect(visitedZoneSlugs([], SLUGS)).toEqual([])
  })
})
