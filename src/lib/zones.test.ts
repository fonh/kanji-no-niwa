// Issue 10 — noms de zones jp servis avec le registre (bandeau + HUD) et
// repli CollisionCanvas forcé pour les intérieurs dont le screenshot est une
// réutilisation erronée (art extérieur/autre pièce — liste curatée, à
// remplacer par de vrais assets à la passe assets).
import { describe, it, expect } from 'vitest'
import { getZoneByName, getZoneNames } from './zones'

const byName = new Map(getZoneNames().map(z => [z.name, z]))

describe('getZoneNames — libellés jp (PRD § Noms de lieux : jamais le français)', () => {
  it('zone extérieure : jp_name = nom VO du registre contenu', () => {
    expect(byName.get('MAP_NEW_BARK')!.jp_name).toBe('ワカバタウン')
    expect(byName.get('MAP_ROUTE_29')!.jp_name).toBe('29ばんどうろ')
    expect(byName.get('MAP_CHERRYGROVE')!.jp_name).toBe('ヨシノシティ')
    expect(byName.get('MAP_ROUTE_30')!.jp_name).toBe('30ばんどうろ')
  })

  it('intérieur : pas de nom propre (jp_name null) mais un jp_label hérité de la ville', () => {
    const lab = byName.get('MAP_NEW_BARK_ELMS_LAB_1F')!
    expect(lab.jp_name).toBeNull()
    expect(lab.jp_label).toBe('ワカバタウン')
    expect(byName.get('MAP_ROUTE_30_MR_POKEMON_HOUSE')!.jp_label).toBe('30ばんどうろ')
  })

  it('zone sans rattachement contenu : jp_label = repli latin lisible (dev)', () => {
    const everywhere = byName.get('MAP_EVERYWHERE')!
    expect(everywhere.jp_name).toBeNull()
    expect(everywhere.jp_label).toBe('EVERYWHERE')
  })
})

// La plaque de nom de lieu affiche la SECTION de carte, pas la carte, et n'est
// jamais affichée dans un bâtiment (décompilé, src/field/draw_map_name.c :
// `if (areaIcon == 0 || MapHeader_IsInBuilding(...)) return;`). Un donjon
// n'est pas un bâtiment : ses étages l'affichent tous, sous le même nom.
describe('banner_name — ce qui mérite une plaque de nom de lieu', () => {
  it('les zones extérieures portent leur propre nom', () => {
    expect(byName.get('MAP_NEW_BARK')!.banner_name).toBe('ワカバタウン')
    expect(byName.get('MAP_VIOLET')!.banner_name).toBe('キキョウシティ')
  })

  it('un bâtiment de ville n’en a pas — maison, Mart, Centre, arène', () => {
    for (const name of [
      'MAP_NEW_BARK_ELMS_LAB_1F',
      'MAP_NEW_BARK_PLAYER_HOUSE_2F',
      'MAP_CHERRYGROVE_POKEMART',
      'MAP_VIOLET_GYM',
      'MAP_ROUTE_31_VIOLET_GATEHOUSE',
    ]) {
      expect(byName.get(name)!.banner_name, name).toBeNull()
    }
  })

  it('un donjon en a un, le même à tous les étages', () => {
    // Le cas qui manquait : "sprout-tower-1f" n'est pas un slug de contenu,
    // donc jp_name était null et la Tour Grospignon n'annonçait jamais son nom
    // — alors qu'elle est sur le chemin de la première arène.
    for (const name of ['MAP_SPROUT_TOWER_1F', 'MAP_SPROUT_TOWER_2F', 'MAP_SPROUT_TOWER_3F']) {
      expect(byName.get(name)!.banner_name, name).toBe('マダツボミのとう')
    }
    expect(byName.get('MAP_BURNED_TOWER_1F')!.banner_name).toBe('やけたとう')
    expect(byName.get('MAP_DARK_CAVE_ROUTE_31_SIDE')!.banner_name).toBe('くらやみのほらあな')
  })
})

describe('captures d’intérieur : c’était l’alignement, pas l’image (issue 13)', () => {
  it('les 15 intérieurs autrefois servis sans capture ont retrouvé leur décor', () => {
    // Ils étaient blacklistés à la main au motif que « l'art recyclé ment sur
    // les murs ». En réalité la grille de collision était mal posée sur
    // l'image (ADR-0006) ; une fois l'alignement mesuré, ces captures se
    // calent proprement et il n'y a plus de raison de les écarter.
    for (const name of [
      'MAP_NEW_BARK_PLAYER_HOUSE_1F',
      'MAP_NEW_BARK_PLAYER_HOUSE_2F',
      'MAP_NEW_BARK_RIVAL_HOUSE_1F',
      'MAP_NEW_BARK_RIVAL_HOUSE_2F',
      'MAP_NEW_BARK_SOUTHWEST_HOUSE',
      'MAP_NEW_BARK_ELMS_LAB_2F',
      'MAP_CHERRYGROVE_POKECENTER_1F',
      'MAP_CHERRYGROVE_POKECENTER_B1F',
      'MAP_CHERRYGROVE_POKEMART',
      'MAP_CHERRYGROVE_GUIDE_GENT_HOUSE',
      'MAP_CHERRYGROVE_SOUTHWEST_HOUSE',
      'MAP_CHERRYGROVE_SOUTHEAST_HOUSE',
      'MAP_ROUTE_29_ROUTE_46_GATEHOUSE',
      'MAP_ROUTE_30_APRICORN_HOUSE',
      'MAP_ROUTE_30_MR_POKEMON_HOUSE',
    ]) {
      expect(getZoneByName(name)!.screenshot, name).not.toBe('')
      expect(byName.get(name)!.screenshot, name).not.toBe('')
    }
  })
})
