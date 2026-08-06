// Fidélité des interactions (issue 12) — jsdom, react-dom/client + act.
//
// Contrat PRD § Mouvement de l'avatar + CONTEXT.md « Talk » / « Sight Cone » :
// on interagit avec le contenu de la carte (PNJ, dresseurs, portes) comme dans
// le jeu d'origine — se placer à côté et appuyer sur A, ou entrer dans une
// ligne de vue. AUCUNE interaction au tap/clic sur les marqueurs de la carte
// (le contournement « dresseurs tapables » de l'issue 10 est supprimé). Les
// contrôles d'UI (D-pad, A/B), eux, restent évidemment tactiles.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import MapClient, { type Zone, type ZoneNpc, type ZoneTrainer } from './MapClient'
import { DEFAULT_PROGRESS } from '@/lib/obstacles'
import type { ZoneListEntry } from '@/lib/zones'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const interactWithNpcMock = vi.hoisted(() => vi.fn(async () => null))
const engageTrainerMock = vi.hoisted(() => vi.fn(async () => null))
const checkZoneEntryMock = vi.hoisted(() =>
  vi.fn(async () => ({ allowed: true }) as Record<string, unknown>)
)

vi.mock('./actions', () => ({
  saveMapProgress: vi.fn(async () => {}),
  saveMapPosition: vi.fn(async () => {}),
  reachDialogueState: vi.fn(async () => null),
  chooseCompanion: vi.fn(async () => ({ companion_id: null })),
  interactWithNpc: interactWithNpcMock,
  checkZoneEntry: checkZoneEntryMock,
}))
vi.mock('./battle-actions', () => ({
  engageTrainer: engageTrainerMock,
  winBattle: vi.fn(async () => null),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
// npc-sprites charge le manifeste de planches via require('@/data/…'), que le
// projet jsdom de vitest ne résout pas — sans objet ici (marqueurs génériques),
// sauf override ponctuel (mockReturnValueOnce) pour tester le cas résolu.
const resolveNpcSpriteMock = vi.hoisted(() =>
  vi.fn(() => null as { url: string; cols: number; rows?: number } | null)
)
// Mock PARTIEL : seule la résolution de sprite est simulée (elle dépend du
// dump d'assets). `spriteFrameOffset`/`SPRITE_ROW` restent les vrais — ce sont
// eux qui décident quelle frame de la planche s'affiche, donc les mocker
// reviendrait à tester le mock (issue 13, « tous les PNJ nous tournent le dos »
// est passé sous les radars exactement comme ça).
vi.mock('@/lib/npc-sprites', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/npc-sprites')>()),
  resolveNpcSprite: resolveNpcSpriteMock,
  PLAYER_SPRITE_URL: '/sprites/characters/protagonist_test_ow.png',
}))

// Zone synthétique 8×8 tout sol : le joueur en (3,3) fait face au sud (défaut),
// le PNJ est donc la tuile devant lui ; une porte inerte en (6,6).
const zone: Zone = {
  name: 'MAP_TEST_TOWN',
  map_id: 999,
  screenshot: '',
  screenshot_w: 128,
  screenshot_h: 128,
  tile_width: 8,
  tile_height: 8,
  scale_x: 16,
  scale_y: 16,
  origin_px: 0,
  origin_py: 0,
  world_origin_x: 0,
  world_origin_y: 0,
  objects: [],
  warps: [{ x: 6, z: 6, header: 'MAP_TEST_HOUSE', anchor: 0 }],
  terrain: '.'.repeat(64),
  ledges: [],
  elevator_floors: [],
  display_name: null,
  is_outdoor: false,
}

const npc: ZoneNpc = {
  npc_id: 'npc_test',
  zone_id: 'test-town',
  name: 'TestNpc',
  world_x: 3,
  world_z: 4,
  dialogue_ref: 'npcs/test-town/npc_test',
  trigger_type: 'talk',
}

const trainer: ZoneTrainer = {
  trainer_id: 'trainer_test',
  zone_id: 'test-town',
  name: 'TestTrainer',
  world_x: 5,
  world_z: 3,
  facing: 'south',
  sight_range: 0,
  role: 'battle',
  trigger_type: 'talk',
  dialogue_ref: 'trainers/test-town/trainer_test',
  defeated: false,
}

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  interactWithNpcMock.mockClear()
  engageTrainerMock.mockClear()
  checkZoneEntryMock.mockReset()
  checkZoneEntryMock.mockResolvedValue({ allowed: true })
  resolveNpcSpriteMock.mockReset()
  resolveNpcSpriteMock.mockReturnValue(null)
  vi.stubGlobal('fetch', vi.fn())
  // jsdom n'implémente pas la capture de pointeur utilisée par le D-pad.
  HTMLElement.prototype.setPointerCapture ??= () => {}
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

function render() {
  act(() => {
    root.render(
      <MapClient
        zone={zone}
        npcs={[npc]}
        trainers={[trainer]}
        initialPos={{ world_x: 3, world_z: 3 }}
        initialProgress={DEFAULT_PROGRESS}
        allZoneNames={[]}
      />
    )
  })
}

const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

describe('MapClient — fidélité des interactions (issue 12)', () => {
  it('un clic/tap sur un PNJ de la carte ne déclenche RIEN (marqueur inerte au pointeur)', () => {
    render()
    const marker = container.querySelector<HTMLElement>('[title="TestNpc"]')
    expect(marker).not.toBeNull()
    expect(marker!.style.pointerEvents).toBe('none')
    click(marker!)
    expect(interactWithNpcMock).not.toHaveBeenCalled()
  })

  it('un clic/tap sur un dresseur ne déclenche RIEN (ni Talk ni combat)', () => {
    render()
    const marker = container.querySelector<HTMLElement>('[title="TestTrainer"]')
    expect(marker).not.toBeNull()
    expect(marker!.style.pointerEvents).toBe('none')
    click(marker!)
    expect(engageTrainerMock).not.toHaveBeenCalled()
    expect(interactWithNpcMock).not.toHaveBeenCalled()
  })

  it('un clic/tap sur la carte (là où se trouve une porte) ne déclenche AUCUNE transition de zone', () => {
    // Issue 13 : plus de marqueur visuel de porte (carré coloré retiré sur
    // demande explicite) — seule la marche/A déclenche un warp, jamais un clic.
    render()
    // Zone de test sans capture → rendue en CollisionCanvas (voir fixture `zone`).
    const zoneCanvas = container.querySelector('canvas')
    expect(zoneCanvas).not.toBeNull()
    click(zoneCanvas!)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('A face à une entité adjacente reste LE geste d’interaction (bouton d’UI tactile)', () => {
    render()
    // Joueur en (3,3) face au sud, le PNJ en (3,4) : A → Talk.
    const buttonA = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent === 'A'
    )
    expect(buttonA).toBeDefined()
    click(buttonA!)
    // C1 : le client n'envoie plus que l'id — le dialogue_ref vient du registre serveur
    expect(interactWithNpcMock).toHaveBeenCalledWith('npc_test')
  })

  // M4 (revue jalon 1) : le tiroir dev (téléport toutes zones + octroi des
  // CS-Kanji) n'existe pas dans un build de production — ni le panneau, ni
  // le toggle du HUD.
  it('M4 — en production, taper le nom de zone n’ouvre JAMAIS le tiroir dev', () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      render()
      const hudToggle = Array.from(container.querySelectorAll('button')).find(b =>
        b.textContent?.includes('TEST TOWN')
      )
      expect(hudToggle).toBeDefined()
      click(hudToggle!)
      expect(container.textContent).not.toContain('砕')
      expect(container.textContent).not.toContain('dev')
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('M4 — hors production, le tiroir dev reste disponible (chips CS + badge dev)', () => {
    render()
    const hudToggle = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent?.includes('TEST TOWN')
    )
    click(hudToggle!)
    expect(container.textContent).toContain('砕')
    expect(container.textContent).toContain('dev')
  })

  it('le D-pad d’UI reste tactile : un appui fait avancer d’une case', () => {
    render()
    expect(container.textContent).toContain('3,3')
    const north = container.querySelector<HTMLButtonElement>('button[aria-label="north"]')
    expect(north).not.toBeNull()
    act(() => {
      north!.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    })
    act(() => {
      north!.dispatchEvent(new Event('pointerup', { bubbles: true }))
    })
    expect(container.textContent).toContain('3,2')
  })

  // Issue 13 (signalé « haut/bas ok, gauche/droite non ») — garde-fou : le
  // D-pad ouest doit avancer sur plusieurs pas espacés dans le temps, comme
  // nord. Diagnostiqué en profondeur (logique de pas, ArrowLeft clavier,
  // appuis répétés) sans reproduire de régression ; les deux sont
  // vérifiés symétriques ici pour couvrir une future régression.
  it('le D-pad ouest avance sur plusieurs pas espacés, comme nord', () => {
    vi.useFakeTimers()
    try {
      render()
      const west = container.querySelector<HTMLButtonElement>('button[aria-label="west"]')!
      for (let i = 0; i < 3; i++) {
        act(() => {
          west.dispatchEvent(new Event('pointerdown', { bubbles: true }))
        })
        act(() => {
          west.dispatchEvent(new Event('pointerup', { bubbles: true }))
        })
        act(() => {
          vi.advanceTimersByTime(200)
        })
      }
      expect(container.textContent).toContain('0,3')
    } finally {
      vi.useRealTimers()
    }
  })

  // Issue 13 (QA humaine 03/08) — bug C : les PNJ/dresseurs ne doivent plus
  // porter un badge coloré qui indique en permanence « je peux te parler » /
  // « je peux te combattre » — HGSS n'affiche aucune icône flottante sur une
  // entité au repos.
  it('C — le marqueur PNJ ne porte plus le badge « parlable » (pas de 💬, pas de fond émeraude)', () => {
    render()
    const marker = container.querySelector<HTMLElement>('[title="TestNpc"]')
    expect(marker).not.toBeNull()
    expect(marker!.textContent).not.toContain('💬')
    expect(marker!.innerHTML).not.toContain('emerald')
  })

  it('C — le marqueur dresseur non engagé ne porte plus le badge « combat » (pas de !, pas de fond rouge)', () => {
    render()
    const marker = container.querySelector<HTMLElement>('[title="TestTrainer"]')
    expect(marker).not.toBeNull()
    // Le « ! » d'alerte reste légitime PENDANT l'engagement (embuscade) —
    // seul le badge permanent au repos doit disparaître.
    expect(marker!.textContent?.trim()).not.toBe('!')
    expect(marker!.innerHTML).not.toContain('red-500')
  })

  // Issue 13 — bug B : un PNJ/objet de décor immobile ne doit pas boucler le
  // cycle de marche indéfiniment (même ralenti, ça reste une marche).
  it('B — un objet de décor résolu en sprite réel n’anime pas indéfiniment (pas de patrouille = pose fixe)', () => {
    resolveNpcSpriteMock.mockReturnValue({ url: '/sprites/overworld/test.png', cols: 8 })
    act(() => {
      root.render(
        <MapClient
          zone={{ ...zone, objects: [{ id: 'obj_static', spriteId: 'SPRITE_TEST', x: 2, z: 2, eventFlag: 'FLAG_NOTHING', facingDirection: 0, movement: 0, xRange: 0, yRange: 0 }] }}
          npcs={[npc]}
          trainers={[trainer]}
          initialPos={{ world_x: 3, world_z: 3 }}
          initialProgress={DEFAULT_PROGRESS}
          allZoneNames={[]}
        />
      )
    })
    const marker = container.querySelector<HTMLElement>('[title="obj_static"]')
    expect(marker).not.toBeNull()
    const sprite = marker!.querySelector('div')
    expect(sprite).not.toBeNull()
    expect(sprite!.className).not.toContain('ow-sprite-idle')
    expect(sprite!.className).not.toContain('ow-sprite-walk')
  })

  // Issue 13 (QA humaine 05/08) — signalé « pokeball dupliquée en 2×2 » sur
  // Route 29 : une planche source plus petite que SPRITE_FRAME_SIZE (ex.
  // monstarball.png, 16×16, plaquée dans une case 32×32) était tuilée par le
  // repli CSS par défaut de background-repeat, jamais désactivé explicitement
  // — même défaut sur les 4 planches de sprite du rendu (décor, PNJ curaté,
  // suivi, joueur).
  it('un sprite source plus petit que SPRITE_FRAME_SIZE ne se tuile pas (background-repeat: no-repeat)', () => {
    resolveNpcSpriteMock.mockReturnValue({ url: '/sprites/overworld/monstarball.png', cols: 1 })
    act(() => {
      root.render(
        <MapClient
          zone={{
            ...zone,
            objects: [
              {
                // Pas une SPRITE_MONSTARBALL : depuis 2026-08-06 une Poké Ball
                // n'est servie que si elle porte un texte à ramasser
                // (src/lib/collectibles.ts), et celle-ci est synthétique. Le
                // défaut testé — la planche 16×16 tuilée dans une case 32×32 —
                // ne dépend pas du sprite choisi.
                id: 'obj_small_sprite',
                spriteId: 'SPRITE_GSBOY1',
                x: 2,
                z: 2,
                eventFlag: 'FLAG_NOTHING',
                facingDirection: 0,
                movement: 0,
                xRange: 0,
                yRange: 0,
              },
            ],
          }}
          npcs={[npc]}
          trainers={[trainer]}
          initialPos={{ world_x: 3, world_z: 3 }}
          initialProgress={DEFAULT_PROGRESS}
          allZoneNames={[]}
        />
      )
    })
    const marker = container.querySelector<HTMLElement>('[title="obj_small_sprite"]')
    const sprite = marker!.querySelector('div')
    expect(sprite).not.toBeNull()
    expect(sprite!.style.backgroundRepeat).toBe('no-repeat')
  })

  // Issue 13 (QA humaine 03/08) — bug H : un objet de décor posé exactement
  // sur la tuile d'une porte bloquait la seule sortie de plusieurs intérieurs
  // (ex. Elm's Lab 1F : SPRITE_VAR_1 sur la tuile de sortie). Une porte doit
  // toujours rester franchissable, comme au niveau terrain (isWarpTile).
  it('H — un objet posé sur la tuile d’une porte ne bloque pas le passage', () => {
    // Reproduit le cas réel (Elm's Lab 1F, SPRITE_VAR_1) : l'objet résout
    // bien un sprite (donc "solide" au sens isTileOccupied) — sans ça le
    // test ne couvrirait pas la vraie condition du bug.
    resolveNpcSpriteMock.mockReturnValue({ url: '/sprites/overworld/test.png', cols: 8 })
    act(() => {
      root.render(
        <MapClient
          zone={{
            ...zone,
            objects: [{ id: 'obj_on_door', spriteId: 'SPRITE_TEST', x: 6, z: 6, eventFlag: 'FLAG_NOTHING', facingDirection: 0, movement: 0, xRange: 0, yRange: 0 }],
          }}
          npcs={[]}
          trainers={[]}
          initialPos={{ world_x: 6, world_z: 5 }}
          initialProgress={DEFAULT_PROGRESS}
          allZoneNames={[]}
        />
      )
    })
    expect(container.textContent).toContain('6,5')
    const south = container.querySelector<HTMLButtonElement>('button[aria-label="south"]')
    expect(south).not.toBeNull()
    act(() => {
      south!.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    })
    act(() => {
      south!.dispatchEvent(new Event('pointerup', { bubbles: true }))
    })
    expect(container.textContent).toContain('6,6')
  })

  // Issue 13 (QA humaine 03/08) — bug C (suite) : quand un PNJ curaté et un
  // objet de décor représentent le même personnage à une tuile d'écart (ex.
  // Elm's Lab : Pr. Elm en objet décor ET en PNJ curaté adjacent), le point
  // neutre du PNJ curaté double le sprite réel du décor — signalé par
  // l'utilisateur comme des PNJ qui « se chevauchent ». Le sprite réel du
  // décor suffit ; le point neutre ne doit pas se dessiner par-dessus.
  it('C (suite) — pas de point neutre PNJ quand un objet de décor voisin porte déjà le vrai sprite', () => {
    resolveNpcSpriteMock.mockReturnValue({ url: '/sprites/overworld/test.png', cols: 8 })
    act(() => {
      root.render(
        <MapClient
          zone={{
            ...zone,
            objects: [{ id: 'obj_decor_double', spriteId: 'SPRITE_TEST', x: npc.world_x + 1, z: npc.world_z, eventFlag: 'FLAG_NOTHING', facingDirection: 0, movement: 0, xRange: 0, yRange: 0 }],
          }}
          npcs={[npc]}
          trainers={[]}
          initialPos={{ world_x: 3, world_z: 3 }}
          initialProgress={DEFAULT_PROGRESS}
          allZoneNames={[]}
        />
      )
    })
    const marker = container.querySelector<HTMLElement>('[title="TestNpc"]')
    expect(marker).not.toBeNull()
    expect(marker!.querySelector('.bg-amber-400')).toBeNull()
  })

  // Issue 13 (QA humaine 03/08) — un PNJ « caché après tel événement »
  // (eventFlag FLAG_HIDE_*, jamais modélisé côté moteur — 715 occurrences
  // dans tout le jeu) posé exactement sur une porte reste visible en
  // permanence : Maman se tient sur la porte de sa propre maison à Bourg
  // Geon, doublon du PNJ curaté DEDANS. Un objet de décor ne doit jamais se
  // dessiner sur la tuile d'une porte, quel que soit son flag — matérialiser
  // un personnage encastré dans une porte est visuellement faux dans tous
  // les cas, et cette tuile est déjà toujours franchissable (bug H).
  it('un objet de décor posé sur la tuile d’une porte ne se dessine pas', () => {
    resolveNpcSpriteMock.mockReturnValue({ url: '/sprites/overworld/test.png', cols: 8 })
    act(() => {
      root.render(
        <MapClient
          zone={{
            ...zone,
            objects: [{ id: 'obj_on_door', spriteId: 'SPRITE_TEST', x: 6, z: 6, eventFlag: 'FLAG_HIDE_SOMETHING', facingDirection: 0, movement: 0, xRange: 0, yRange: 0 }],
          }}
          npcs={[]}
          trainers={[]}
          initialPos={{ world_x: 3, world_z: 3 }}
          initialProgress={DEFAULT_PROGRESS}
          allZoneNames={[]}
        />
      )
    })
    expect(container.querySelector('[title="obj_on_door"]')).toBeNull()
  })

  // Issue 13 (recherche PokemonHnS) — les rares planches vérifiées à 4
  // vraies directions (sprite.rows === 4) doivent faire tourner le PNJ vers
  // sa direction authorée (facingDirection), au lieu de rester figées sur
  // la rangée 0 comme le reste des planches ROM (une seule rangée fiable).
  it('un objet de décor à planche 4-directions (rows: 4) affiche la rangée de sa facingDirection', () => {
    resolveNpcSpriteMock.mockReturnValue({ url: '/sprites/hns/people/elm.png', cols: 8, rows: 4 })
    act(() => {
      root.render(
        <MapClient
          zone={{
            ...zone,
            // DIR_* ROM : 0=N,1=S,2=W,3=E (DIRECTION_BY_CODE) → SPRITE_ROW ouest=2.
            objects: [{ id: 'obj_facing_west', spriteId: 'SPRITE_DOCTOR', x: 5, z: 5, eventFlag: 'FLAG_NOTHING', facingDirection: 2, movement: 0, xRange: 0, yRange: 0 }],
          }}
          npcs={[]}
          trainers={[]}
          initialPos={{ world_x: 3, world_z: 3 }}
          initialProgress={DEFAULT_PROGRESS}
          allZoneNames={[]}
        />
      )
    })
    const marker = container.querySelector<HTMLElement>('[title="obj_facing_west"]')
    const sprite = marker!.querySelector('div') as HTMLElement
    expect(sprite.style.backgroundPosition).toBe('0px -64px') // rangée 2 × 32px
  })

  // Issue 13 (recherche PokemonHnS) — un PNJ curaté avec un `sprite_id`
  // vérifié (HNS_PEOPLE) affiche son vrai sprite, dans sa direction
  // (`facing`), au lieu du point neutre.
  it('un PNJ curaté avec sprite_id affiche son vrai sprite dans sa direction (facing)', () => {
    resolveNpcSpriteMock.mockReturnValue({ url: '/sprites/hns/people/silver.png', cols: 8, rows: 4 })
    act(() => {
      root.render(
        <MapClient
          zone={zone}
          npcs={[{ ...npc, sprite_id: 'SPRITE_HNS_SILVER', facing: 'west' }]}
          trainers={[]}
          initialPos={{ world_x: 3, world_z: 3 }}
          initialProgress={DEFAULT_PROGRESS}
          allZoneNames={[]}
        />
      )
    })
    const marker = container.querySelector<HTMLElement>('[title="TestNpc"]')
    expect(marker!.querySelector('.bg-amber-400')).toBeNull()
    const sprite = marker!.querySelector('div') as HTMLElement
    expect(sprite.style.backgroundImage).toContain('silver.png')
    expect(sprite.style.backgroundPosition).toBe('0px -64px') // ouest = rangée 2
  })

  // Issue 13 — régression du fix ci-dessus : un PNJ curaté à sprite_id ET un
  // objet de décor du même spriteId à une tuile d'écart affichaient tous les
  // deux leur sprite, dédoublant le personnage (ex. Pr. Elm à Bourg Geon).
  it('un objet de décor du même spriteId qu’un PNJ curaté adjacent ne se dessine pas (pas de doublon)', () => {
    resolveNpcSpriteMock.mockReturnValue({ url: '/sprites/hns/people/elm.png', cols: 8, rows: 4 })
    act(() => {
      root.render(
        <MapClient
          zone={{
            ...zone,
            objects: [{ id: 'obj_decor_elm', spriteId: 'SPRITE_DOCTOR', x: npc.world_x + 1, z: npc.world_z, eventFlag: 'FLAG_NOTHING', facingDirection: 1, movement: 0, xRange: 0, yRange: 0 }],
          }}
          npcs={[{ ...npc, sprite_id: 'SPRITE_DOCTOR' }]}
          trainers={[]}
          initialPos={{ world_x: 3, world_z: 3 }}
          initialProgress={DEFAULT_PROGRESS}
          allZoneNames={[]}
        />
      )
    })
    expect(container.querySelector('[title="obj_decor_elm"]')).toBeNull()
    expect(container.querySelector('[title="TestNpc"]')).not.toBeNull()
  })

  // Issue 13 (capture d'écran) — Silver doublé : l'objet de décor ROM
  // SPRITE_GSRIVEL (toujours affiché, jamais à moins d'une tuile de Silver
  // repositionné) et le PNJ curaté Silver (sprite_id SPRITE_HNS_SILVER)
  // représentent le même personnage — l'objet de décor doit disparaître
  // dans toute la zone, pas seulement à une tuile près.
  it('SPRITE_GSRIVEL (décor) ne se dessine plus quand Silver (PNJ curaté) est présent, même loin', () => {
    resolveNpcSpriteMock.mockReturnValue({ url: '/sprites/hns/people/silver.png', cols: 8, rows: 4 })
    act(() => {
      root.render(
        <MapClient
          zone={{
            ...zone,
            objects: [{ id: 'obj_gsrivel', spriteId: 'SPRITE_GSRIVEL', x: 0, z: 0, eventFlag: 'FLAG_HIDE_NEW_BARK_RIVAL', facingDirection: 1, movement: 0, xRange: 0, yRange: 0 }],
          }}
          npcs={[{ ...npc, sprite_id: 'SPRITE_HNS_SILVER', world_x: 6, world_z: 6 }]}
          trainers={[]}
          initialPos={{ world_x: 3, world_z: 3 }}
          initialProgress={DEFAULT_PROGRESS}
          allZoneNames={[]}
        />
      )
    })
    expect(container.querySelector('[title="obj_gsrivel"]')).toBeNull()
    expect(container.querySelector('[title="TestNpc"]')).not.toBeNull()
  })
})

// Issue 13 (QA humaine — transitions de zone) : recherche HGSS confirmée —
// les WARPS (portes, escaliers, ascenseurs) fondent au noir pendant le swap
// de zone ; le continuum route→route (aucune porte, cartes extérieures
// contiguës) ne fond JAMAIS dans le jeu d'origine et reste donc instantané
// ici. Timing piloté par de vrais timers (vi.useFakeTimers), comme le test
// D-pad ouest existant plus haut dans ce fichier.
describe('MapClient — fondu de warp (issue 13)', () => {
  it('reste invisible (opacity 0) au repos', () => {
    render()
    const overlay = container.querySelector<HTMLElement>('[data-testid="warp-fade"]')
    expect(overlay).not.toBeNull()
    expect(overlay!.style.opacity).toBe('0')
    expect(overlay!.style.pointerEvents).toBe('none')
  })

  it('un franchissement de porte (warp) fait apparaître le fondu PENDANT le swap, puis le referme une fois la nouvelle zone en place', async () => {
    vi.useFakeTimers()
    let resolveFetch: (value: unknown) => void = () => {}
    const fetchPromise = new Promise(resolve => {
      resolveFetch = resolve
    })
    vi.mocked(fetch).mockReturnValue(fetchPromise as unknown as ReturnType<typeof fetch>)
    try {
      act(() => {
        root.render(
          <MapClient
            zone={zone}
            npcs={[]}
            trainers={[]}
            // Une case au nord de la porte (6,6) : un pas au sud l'atteint.
            initialPos={{ world_x: 6, world_z: 5 }}
            initialProgress={DEFAULT_PROGRESS}
            allZoneNames={[]}
          />
        )
      })
      const overlay = () => container.querySelector<HTMLElement>('[data-testid="warp-fade"]')!
      expect(overlay().style.opacity).toBe('0')

      const south = container.querySelector<HTMLButtonElement>('button[aria-label="south"]')!
      act(() => {
        south.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      })
      act(() => {
        south.dispatchEvent(new Event('pointerup', { bubbles: true }))
      })
      // Le joueur occupe déjà (6,6) — le franchissement du warp, lui,
      // n'est vérifié qu'à l'issue du pas (STEP_MS).
      expect(container.textContent).toContain('6,6')
      act(() => {
        vi.advanceTimersByTime(170) // STEP_MS : détecte le warp, lance le fondu
      })
      expect(overlay().style.opacity).toBe('1')
      // La zone n'a pas encore changé : l'écran est déjà noir AVANT même que
      // le fetch de la nouvelle zone ne parte (fondu tenu WARP_FADE_MS avant
      // le swap, pour ne jamais laisser voir un pop/flash de la zone cible).
      expect(container.textContent).toContain('TEST TOWN')
      act(() => {
        vi.advanceTimersByTime(150) // WARP_FADE_MS : déclenche le fetch, tenu derrière le noir
      })
      expect(overlay().style.opacity).toBe('1')
      expect(container.textContent).toContain('TEST TOWN')

      resolveFetch({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          zone: { ...zone, name: 'MAP_TEST_HOUSE', warps: [] },
          npcs: [],
          trainers: [],
        }),
      })
      await act(async () => {
        await fetchPromise
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(container.textContent).toContain('TEST HOUSE')
      expect(overlay().style.opacity).toBe('0')
    } finally {
      vi.useRealTimers()
    }
  })

  it('un franchissement de route à route (pas de porte) ne déclenche AUCUN fondu, fidèle au jeu', async () => {
    const outdoorZone: Zone = {
      ...zone,
      name: 'MAP_TEST_ROUTE',
      is_outdoor: true,
      tile_width: 4,
      tile_height: 4,
      terrain: '.'.repeat(16),
      warps: [],
    }
    const nextZone: Zone = { ...outdoorZone, name: 'MAP_TEST_ROUTE_2', world_origin_x: 4 }
    const nextZoneEntry: ZoneListEntry = {
      name: 'MAP_TEST_ROUTE_2',
      is_outdoor: true,
      world_origin_x: 4,
      world_origin_y: 0,
      tile_width: 4,
      tile_height: 4,
      map_id: 998,
      display_name: null,
      jp_name: null,
      jp_label: 'ROUTE 2',
      banner_name: null,
      screenshot: '',
      screenshot_w: 64,
      screenshot_h: 64,
      beat_count: 0,
    }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ zone: nextZone, npcs: [], trainers: [] }),
    } as unknown as Response)

    act(() => {
      root.render(
        <MapClient
          zone={outdoorZone}
          npcs={[]}
          trainers={[]}
          initialPos={{ world_x: 3, world_z: 1 }}
          initialProgress={DEFAULT_PROGRESS}
          allZoneNames={[nextZoneEntry]}
        />
      )
    })
    const overlay = container.querySelector<HTMLElement>('[data-testid="warp-fade"]')!
    expect(overlay.style.opacity).toBe('0')

    const east = container.querySelector<HTMLButtonElement>('button[aria-label="east"]')!
    await act(async () => {
      east.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      east.dispatchEvent(new Event('pointerup', { bubbles: true }))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(container.textContent).toContain('4,1')
    expect(overlay.style.opacity).toBe('0')
  })
})

// Issue 13 (QA humaine) — un PNJ flottait dans le noir, au coin haut-droit
// hors de la carte de Bourg Geon : l'objet ROM `obj_T20_doctor` (le Pr. Elm)
// garé en (31,0), une tuile de mur. 93 objets du jeu sont ainsi rangés dans un
// mur ou hors grille — la ROM s'en sert d'emplacements de garage pour des
// figurants qu'un script fera apparaître ailleurs.
describe('MapClient — objets de décor garés hors carte (issue 13)', () => {
  it('un objet posé sur une tuile de mur ne se dessine pas', () => {
    resolveNpcSpriteMock.mockReturnValue({ url: '/sprites/overworld/gsbigman.png', cols: 8 })
    const walled: Zone = {
      ...zone,
      // Colonne 7 entièrement murée : l'objet y est « garé ».
      terrain: Array.from({ length: 64 }, (_, i) => (i % 8 === 7 ? '#' : '.')).join(''),
      objects: [
        {
          id: 'obj_parked',
          spriteId: 'SPRITE_GSBIGMAN',
          x: 7,
          z: 0,
          eventFlag: 'FLAG_NOTHING',
          facingDirection: 1,
          movement: 0,
          xRange: 0,
          yRange: 0,
        },
      ],
    }
    act(() => {
      root.render(
        <MapClient
          zone={walled}
          npcs={[]}
          trainers={[]}
          initialPos={{ world_x: 3, world_z: 3 }}
          initialProgress={DEFAULT_PROGRESS}
          allZoneNames={[]}
        />
      )
    })
    expect(container.querySelector('[title="obj_parked"]')).toBeNull()
  })

  it('le même objet sur une tuile praticable se dessine normalement', () => {
    resolveNpcSpriteMock.mockReturnValue({ url: '/sprites/overworld/gsbigman.png', cols: 8 })
    const ok: Zone = {
      ...zone,
      objects: [
        {
          id: 'obj_ok',
          spriteId: 'SPRITE_GSBIGMAN',
          x: 2,
          z: 0,
          eventFlag: 'FLAG_NOTHING',
          facingDirection: 1,
          movement: 0,
          xRange: 0,
          yRange: 0,
        },
      ],
    }
    act(() => {
      root.render(
        <MapClient
          zone={ok}
          npcs={[]}
          trainers={[]}
          initialPos={{ world_x: 3, world_z: 3 }}
          initialProgress={DEFAULT_PROGRESS}
          allZoneNames={[]}
        />
      )
    })
    expect(container.querySelector('[title="obj_ok"]')).not.toBeNull()
  })
})

// Issue 13 — « il faut qu'ils m'arrêtent comme dans le jeu » : un verrou de
// progression barre un franchissement précis, et un personnage vient le dire.
// La décision est SERVEUR (checkZoneEntry) ; le client ne fait que jouer la
// scène, donc c'est la réponse serveur qui est simulée ici.
describe('MapClient — verrou de progression (issue 13)', () => {
  const blocked = {
    allowed: false,
    roadblock: {
      roadblock_id: 'rb_test',
      guard: {
        sprite_id: 'SPRITE_GSBIGMAN',
        name: { jp: 'テスト', en: 'Test' },
        post: { tile_x: 1, tile_y: 1 },
        facing: 'south',
      },
      name: 'テスト',
      pages: [{ jp: 'とおれないよ。', en: "You can't pass." }],
    },
  }

  function renderOutdoor() {
    const outdoor: Zone = { ...zone, is_outdoor: true }
    act(() => {
      root.render(
        <MapClient
          zone={outdoor}
          npcs={[]}
          trainers={[]}
          initialPos={{ world_x: 0, world_z: 3 }}
          initialProgress={DEFAULT_PROGRESS}
          allZoneNames={[
            { name: 'MAP_TEST_TOWN', is_outdoor: true, world_origin_x: 0, world_origin_y: 0, tile_width: 8, tile_height: 8 },
            { name: 'MAP_NEXT', is_outdoor: true, world_origin_x: -8, world_origin_y: 0, tile_width: 8, tile_height: 8 },
          ] as unknown as ZoneListEntry[]}
        />
      )
    })
  }

  it('le garde n’apparaît pas tant que rien ne bloque', async () => {
    renderOutdoor()
    await act(async () => {})
    expect(container.querySelector('[data-testid="roadblock-guard"]')).toBeNull()
  })

  it('un franchissement refusé fait surgir le garde, qui finit par parler', async () => {
    resolveNpcSpriteMock.mockReturnValue({ url: '/sprites/overworld/gsbigman.png', cols: 8 })
    checkZoneEntryMock.mockResolvedValue(blocked)
    renderOutdoor()
    // Marcher vers l'ouest : le pas sort de la zone → franchissement refusé.
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }))
    })
    await act(async () => {})
    expect(container.querySelector('[data-testid="roadblock-guard"]')).not.toBeNull()
    // Le serveur a bien été consulté avec la zone de départ.
    expect(checkZoneEntryMock).toHaveBeenCalledWith('MAP_NEXT', expect.any(Number), 'MAP_TEST_TOWN')
  })
})

// Plaque de nom de lieu (2026-08-06) — trois défauts corrigés d'un coup :
// elle ne se jouait qu'après une transition (donc jamais après un
// rechargement), elle était posée en `fixed` donc à côté de l'écran de jeu, et
// son minuteur (1,9 s) coupait avant la fin de son animation (2,4 s).
describe('MapClient — plaque de nom de lieu', () => {
  const entry = (name: string, banner: string | null): ZoneListEntry =>
    ({
      name,
      is_outdoor: true,
      world_origin_x: 0,
      world_origin_y: 0,
      tile_width: 8,
      tile_height: 8,
      banner_name: banner,
    }) as unknown as ZoneListEntry

  function renderWith(zoneNames: ZoneListEntry[]) {
    act(() => {
      root.render(
        <MapClient
          zone={zone}
          npcs={[]}
          trainers={[]}
          initialPos={{ world_x: 3, world_z: 3 }}
          initialProgress={DEFAULT_PROGRESS}
          allZoneNames={zoneNames}
        />
      )
    })
  }

  it('s’affiche à l’arrivée sur la carte, sans attendre un changement de zone', () => {
    renderWith([entry('MAP_TEST_TOWN', 'ワカバタウン')])
    const plate = container.querySelector('[data-testid="zone-banner"]')
    expect(plate).not.toBeNull()
    expect(plate!.textContent).toBe('ワカバタウン')
  })

  it('vit DANS le cadre DS, collée au coin haut-gauche — pas dans la bordure noire', () => {
    renderWith([entry('MAP_TEST_TOWN', 'ワカバタウン')])
    const screen = container.querySelector('[data-testid="ds-screen"]')!
    const plate = container.querySelector('[data-testid="zone-banner"]')!
    expect(screen.contains(plate)).toBe(true)
    expect(plate.className).toContain('absolute')
    expect(plate.className).toContain('top-0')
    expect(plate.className).toContain('left-0')
  })

  it('une zone sans nom de section (bâtiment) n’en affiche aucune', () => {
    renderWith([entry('MAP_TEST_TOWN', null)])
    expect(container.querySelector('[data-testid="zone-banner"]')).toBeNull()
  })
})
