// Émission moteur des unlock_text (issue 08, engine-contract § 2) — la
// couche DB est mockée (DATABASE_URL absent ici) : on vérifie que
// l'interaction avec l'objet PC / la tuile-panneau débloque le bon texte,
// l'IDEMPOTENCE (re-interaction = zéro écriture), et que les textes portés
// par un dialogue (elm_great_text) passent déjà par la lib 02.
//
// C1 (revue jalon 1) : les écritures re-vérifient désormais la PRÉSENCE —
// l'entité doit être servie dans la zone courante du joueur
// (user_map_state.current_zone, même règle de rattachement que la lecture)
// et visible (unlock_conditions). Les tests légitimes posent donc
// current_zone ; les tests adversariaux prouvent le refus sans écriture.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defaultPlayerState, type PlayerState } from '@/lib/condition-effect'

const requireUserIdMock = vi.hoisted(() => vi.fn(async () => 'user-1'))
vi.mock('@/lib/auth', () => ({ requireUserId: requireUserIdMock }))

const sqlMock = vi.hoisted(() => vi.fn(async () => []))
vi.mock('@/lib/db', () => ({ sql: sqlMock }))

const stateRef = vi.hoisted(() => ({ current: null as unknown as PlayerState }))
const savePlayerStateMock = vi.hoisted(() =>
  vi.fn(async (_userId: string, state: PlayerState) => {
    stateRef.current = state
  })
)
vi.mock('@/lib/player-state', () => ({
  getPlayerState: vi.fn(async () => stateRef.current),
  savePlayerState: savePlayerStateMock,
}))

// Gate SRS (issue 10) : le statut du jour est mocké — la règle pure vit dans
// src/lib/zone-gate.ts (testée à part), ici on vérifie le branchement.
const dailyStatusMock = vi.hoisted(() =>
  vi.fn(async () => ({ sessionDone: true, cardsPending: 0, reviewedToday: 0, path: null }))
)
vi.mock('@/lib/daily-srs', () => ({ getDailySRSStatusForUser: dailyStatusMock }))

import {
  checkZoneEntry,
  interactWithNpc,
  reachDialogueState,
  saveMapPosition,
  saveMapProgress,
} from './actions'
import { DEFAULT_PROGRESS } from '@/lib/obstacles'
import uiStrings from '@/data/ui-strings.json'

beforeEach(() => {
  stateRef.current = defaultPlayerState()
  savePlayerStateMock.mockClear()
  sqlMock.mockClear()
  dailyStatusMock.mockClear()
  dailyStatusMock.mockResolvedValue({ sessionDone: true, cardsPending: 0, reviewedToday: 0, path: null })
})

describe('interactWithNpc — unlock_text émis par le moteur (objet PC, panneau)', () => {
  it('ouvrir le PC du joueur (depuis la chambre) débloque ET ouvre lyra_mail', async () => {
    stateRef.current.current_zone = 'MAP_NEW_BARK_PLAYER_HOUSE_2F'
    const result = await interactWithNpc('player_pc_new_bark')
    expect(result).toEqual({ kind: 'text', text_id: 'lyra_mail_new_bark' })
    expect(savePlayerStateMock).toHaveBeenCalledTimes(1)
    const saved = savePlayerStateMock.mock.calls[0][1]
    expect(saved.unlocked_texts).toContain('lyra_mail_new_bark')
  })

  it('IDEMPOTENT : re-ouvrir le PC n\'écrit rien mais rouvre le texte', async () => {
    stateRef.current.current_zone = 'MAP_NEW_BARK_PLAYER_HOUSE_2F'
    await interactWithNpc('player_pc_new_bark')
    savePlayerStateMock.mockClear()
    const again = await interactWithNpc('player_pc_new_bark')
    expect(again).toEqual({ kind: 'text', text_id: 'lyra_mail_new_bark' })
    expect(savePlayerStateMock).not.toHaveBeenCalled()
  })

  it('le panneau de Route 29 (depuis Route 29) débloque johto_entrance_sign_route29', async () => {
    stateRef.current.current_zone = 'MAP_ROUTE_29'
    const result = await interactWithNpc('sign_johto_entrance_route29')
    expect(result).toEqual({ kind: 'text', text_id: 'johto_entrance_sign_route29' })
    expect(savePlayerStateMock.mock.calls[0][1].unlocked_texts).toContain(
      'johto_entrance_sign_route29'
    )
  })

  it('un PNJ hors table moteur suit le flux dialogue ordinaire (dialogue_ref du REGISTRE)', async () => {
    stateRef.current.current_zone = 'MAP_NEW_BARK_PLAYER_HOUSE_1F'
    const result = await interactWithNpc('mom_new_bark')
    expect(result?.kind).toBe('dialogue')
  })
})

describe('C1 — re-vérification serveur des écritures (zone courante + visibilité)', () => {
  it('LE contournement du rapport : reachDialogueState(mr_pokemon_route30) depuis Bourg Geon → null, AUCUNE écriture (pas d\'œuf, pas d\'avance de quête)', async () => {
    stateRef.current.current_zone = 'MAP_NEW_BARK' // jour 1, aucune leçon
    const result = await reachDialogueState('npcs/route-30/mr_pokemon_route30')
    expect(result).toBeNull()
    expect(savePlayerStateMock).not.toHaveBeenCalled()
  })

  it('le même appel depuis la maison de Mr. Pokémon (Route 30) sert le dialogue et applique ses Effects', async () => {
    // QA Route 30 (2026-08-03) : Mr. Pokémon vit DANS sa maison
    // (MAP_ROUTE_30_MR_POKEMON_HOUSE, map_zone explicite depuis le fix de
    // placement), plus sur la zone extérieure MAP_ROUTE_30 — voir
    // content/map/npcs.json.
    stateRef.current.current_zone = 'MAP_ROUTE_30_MR_POKEMON_HOUSE'
    const result = await reachDialogueState('npcs/route-30/mr_pokemon_route30')
    expect(result).not.toBeNull()
    expect(savePlayerStateMock).toHaveBeenCalled()
    const saved = savePlayerStateMock.mock.calls.at(-1)![1]
    expect(saved.inventory['mystery_egg']).toBe(1)
  })

  it('interactWithNpc(player_pc_new_bark) hors de la chambre (zone extérieure) → null, aucune écriture', async () => {
    stateRef.current.current_zone = 'MAP_NEW_BARK' // le PC vit au 2F de la maison
    const result = await interactWithNpc('player_pc_new_bark')
    expect(result).toBeNull()
    expect(savePlayerStateMock).not.toHaveBeenCalled()
  })

  it('entité masquée par ses unlock_conditions : l\'assistant d\'Elm avant egg_received → null', async () => {
    stateRef.current.current_zone = 'MAP_NEW_BARK_ELMS_LAB_1F' // bonne zone…
    const result = await interactWithNpc('elm_assistant_new_bark') // …mais invisible
    expect(result).toBeNull()
    expect(savePlayerStateMock).not.toHaveBeenCalled()
  })

  it('un dialogue_ref inconnu de toute entité de la zone courante → null', async () => {
    stateRef.current.current_zone = 'MAP_NEW_BARK'
    expect(await reachDialogueState('npcs/new-bark-town/mom_new_bark')).toBeNull() // Mom vit au 1F
    expect(savePlayerStateMock).not.toHaveBeenCalled()
  })
})

describe('elm_great_text — unlock_text porté par un dialogue (lib 02, vérification)', () => {
  it('atteindre great_text chez Elm (8 badges, depuis le labo) débloque elm_great_text_new_bark', async () => {
    const state = defaultPlayerState()
    state.current_zone = 'MAP_NEW_BARK_ELMS_LAB_1F'
    state.badges = Array.from({ length: 8 }, (_, i) => ({
      badge_id: `badge-${i}`,
      earned_at: '2026-07-30T00:00:00.000Z',
    }))
    stateRef.current = state

    const reached = await reachDialogueState('npcs/new-bark-town/prof_elm_lab')
    expect(reached!.state).toBe('great_text')
    expect(savePlayerStateMock).toHaveBeenCalledTimes(1)
    const saved = savePlayerStateMock.mock.calls[0][1]
    expect(saved.unlocked_texts).toContain('elm_great_text_new_bark')
    expect(saved.quest_progress.kimono_finale.current_step).toBe('great_text_received')

    // Reparler à Elm : l'état bascule sur after_great_text, aucun Effect
    // rejoué, zéro écriture.
    savePlayerStateMock.mockClear()
    const again = await reachDialogueState('npcs/new-bark-town/prof_elm_lab')
    expect(again!.state).toBe('after_great_text')
    expect(savePlayerStateMock).not.toHaveBeenCalled()
  })
})

describe('checkZoneEntry — gate SRS au franchissement (issue 10, jamais une Condition)', () => {
  const srsNotDone = () =>
    dailyStatusMock.mockResolvedValue({ sessionDone: false, cardsPending: 12, reviewedToday: 0, path: null })

  it('zone extérieure jamais visitée + SRS non fait → refus avec la ligne jp', async () => {
    srsNotDone()
    stateRef.current.visited_zones = ['MAP_NEW_BARK']
    const result = await checkZoneEntry('MAP_ROUTE_29', 60)
    expect(result).toEqual({ allowed: false, jp: uiStrings.srs_gate_blocked.jp })
    expect(dailyStatusMock).toHaveBeenCalledWith('user-1', 60)
  })

  it('zone déjà visitée → autorisé SANS lire le statut SRS (retour jamais gaté)', async () => {
    srsNotDone()
    stateRef.current.visited_zones = ['MAP_NEW_BARK', 'MAP_ROUTE_29']
    expect(await checkZoneEntry('MAP_ROUTE_29', 0)).toEqual({ allowed: true })
    expect(dailyStatusMock).not.toHaveBeenCalled()
  })

  it('intérieur/étage → autorisé sans lire le statut (jamais gaté, finding 03-D5)', async () => {
    srsNotDone()
    expect(await checkZoneEntry('MAP_NEW_BARK_ELMS_LAB_1F', 0)).toEqual({ allowed: true })
    expect(dailyStatusMock).not.toHaveBeenCalled()
  })

  it('SRS fait → autorisé', async () => {
    stateRef.current.visited_zones = []
    expect(await checkZoneEntry('MAP_ROUTE_29', 0)).toEqual({ allowed: true })
  })

  it('zone inconnue du registre → autorisé (ne bloque jamais le moteur)', async () => {
    srsNotDone()
    expect(await checkZoneEntry('MAP_NOPE', 0)).toEqual({ allowed: true })
  })
})

describe('saveMapPosition — filet serveur du gate à l’écriture', () => {
  it('refuse la première visite d’une zone extérieure quand le SRS n’est pas fait', async () => {
    dailyStatusMock.mockResolvedValue({ sessionDone: false, cardsPending: 12, reviewedToday: 0, path: null })
    stateRef.current.visited_zones = ['MAP_NEW_BARK']
    await saveMapPosition('MAP_ROUTE_29', 600, 400, 0)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('écrit normalement une zone déjà visitée, même SRS non fait (sans lire le statut)', async () => {
    dailyStatusMock.mockResolvedValue({ sessionDone: false, cardsPending: 12, reviewedToday: 0, path: null })
    stateRef.current.visited_zones = ['MAP_ROUTE_29']
    await saveMapPosition('MAP_ROUTE_29', 600, 400, 0)
    expect(sqlMock).toHaveBeenCalledTimes(1)
    expect(dailyStatusMock).not.toHaveBeenCalled()
  })

  it('écrit un intérieur jamais visité, même SRS non fait', async () => {
    dailyStatusMock.mockResolvedValue({ sessionDone: false, cardsPending: 12, reviewedToday: 0, path: null })
    stateRef.current.visited_zones = []
    await saveMapPosition('MAP_NEW_BARK_ELMS_LAB_1F', 4, 10, 0)
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })

  it('écrit la première visite quand le SRS est fait', async () => {
    stateRef.current.visited_zones = []
    await saveMapPosition('MAP_ROUTE_29', 600, 400, 0)
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })
})

describe('C1 — saveMapPosition ne téléporte plus (zone atteignable en un mouvement)', () => {
  // Niveau de garantie documenté (actions.ts) : zone courante, zone extérieure
  // CONTIGUË (continuum outdoor, ±1 tuile), ou zone atteignable par warp /
  // ascenseur depuis la zone courante — jamais l'adjacence de tuile.
  it('refuse un saut MAP_NEW_BARK → MAP_ROUTE_30 (ni contiguë, ni warp) : aucune écriture', async () => {
    stateRef.current.current_zone = 'MAP_NEW_BARK'
    await saveMapPosition('MAP_ROUTE_30', 550, 300, 0)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('accepte le pas hors du bord : MAP_NEW_BARK → MAP_ROUTE_29 (contiguës, position dans la cible)', async () => {
    stateRef.current.current_zone = 'MAP_NEW_BARK'
    await saveMapPosition('MAP_ROUTE_29', 671, 400, 0)
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })

  it('accepte un warp de la zone courante : MAP_NEW_BARK → labo d\'Elm (porte)', async () => {
    stateRef.current.current_zone = 'MAP_NEW_BARK'
    await saveMapPosition('MAP_NEW_BARK_ELMS_LAB_1F', 4, 10, 0)
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })

  it('refuse une position HORS des bornes de la zone cible', async () => {
    stateRef.current.current_zone = 'MAP_NEW_BARK'
    await saveMapPosition('MAP_ROUTE_29', 0, 0, 0) // Route 29 commence en (576,384)
    expect(sqlMock).not.toHaveBeenCalled()
  })

  it('refuse une zone inconnue du registre et la méta-zone MAP_EVERYWHERE', async () => {
    stateRef.current.current_zone = 'MAP_NEW_BARK'
    await saveMapPosition('MAP_NOPE', 10, 10, 0)
    await saveMapPosition('MAP_EVERYWHERE', 700, 400, 0)
    expect(sqlMock).not.toHaveBeenCalled()
  })
})

// M4 (revue jalon 1) : le tiroir dev qui posait les drapeaux CS est retiré du
// build de production (MapClient) — et le serveur n'accepte de toute façon
// plus ces drapeaux du client en production : aucun flux légitime du jalon ne
// les modifie (la vraie acquisition — arènes — sera serveur, Condition/Effect).
describe('M4 — saveMapProgress ne prend jamais les capacités du client en production', () => {
  const updateBlob = () => {
    const calls = sqlMock.mock.calls as unknown as [ArrayLike<string>, ...unknown[]][]
    const call = calls.find(c => Array.from(c[0]).join('?').includes('update users set map_progress'))
    expect(call).toBeDefined()
    return JSON.parse(call![1] as string) as Record<string, unknown>
  }

  it('en production : mizu/tobu/… reviennent à la valeur stockée (false), visited/cleared passent', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      await saveMapProgress({ ...DEFAULT_PROGRESS, mizu: true, tobu: true, visited: ['MAP_X'], cleared: ['a'] })
      const blob = updateBlob()
      expect(blob.mizu).toBe(false)
      expect(blob.tobu).toBe(false)
      expect(blob.visited).toEqual(['MAP_X'])
      expect(blob.cleared).toEqual(['a'])
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('hors production : le blob passe tel quel (tiroir dev utilisable en dev)', async () => {
    await saveMapProgress({ ...DEFAULT_PROGRESS, mizu: true, visited: ['MAP_X'] })
    expect(updateBlob().mizu).toBe(true)
  })
})
