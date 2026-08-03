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

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const interactWithNpcMock = vi.hoisted(() => vi.fn(async () => null))
const engageTrainerMock = vi.hoisted(() => vi.fn(async () => null))

vi.mock('./actions', () => ({
  saveMapProgress: vi.fn(async () => {}),
  saveMapPosition: vi.fn(async () => {}),
  reachDialogueState: vi.fn(async () => null),
  chooseCompanion: vi.fn(async () => ({ companion_id: null })),
  interactWithNpc: interactWithNpcMock,
  checkZoneEntry: vi.fn(async () => ({ allowed: true })),
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
vi.mock('@/lib/npc-sprites', () => ({
  resolveNpcSprite: resolveNpcSpriteMock,
  PLAYER_SPRITE_URL: '/sprites/characters/protagonist_test_ow.png',
  SPRITE_FRAME_SIZE: 32,
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
