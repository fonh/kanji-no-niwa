'use server'

import { requireUserId } from '@/lib/auth'
import { sql } from '@/lib/db'
import { applyEffect, applyEffects, selectDialogueState } from '@/lib/condition-effect'
import {
  getCompanions,
  getDialogue,
  getEngineUnlockTextId,
  getLessonBlockedLines,
  getLessonsForZone,
  getMapNpcs,
  getQuestStepsIndex,
  type DialoguePageEntry,
} from '@/lib/content'
import { attachCompanionOptions } from '@/lib/dialogue-pages'
import { buildItemGetPages, newlyGrantedItems } from '@/lib/item-get'
import { collectibleTextFor } from '@/lib/collectibles'
import { visibleRomObjects } from '@/lib/rom-decor'
import { getNpcsForZone } from '@/lib/npcs'
import { getTrainersForZone } from '@/lib/trainers'
import { getDailySRSStatusForUser } from '@/lib/daily-srs'
import { resolveLessonInteraction } from '@/lib/lessons'
import {
  accessibleNpc,
  filterVisibleNpcs,
  filterVisibleTrainers,
  findAccessibleDialogueCarrier,
} from '@/lib/map-visibility'
import { getPlayerState, savePlayerState } from '@/lib/player-state'
import { gateBlocksEntry } from '@/lib/zone-gate'
import { blockingRoadblock, type RoadblockGuard, type RoadblockPage } from '@/lib/roadblocks'
import { canReachZone, isWithinZoneBounds } from '@/lib/zone-geometry'
import { getZoneByName } from '@/lib/zones'
import uiStrings from '@/data/ui-strings.json'
import itemLabels from '@/data/item-labels.json'

// Blob MapProgress legacy (tiroir dev + obstacles côté client) — reste sur
// users.map_progress tant que l'issue 10 (traversée + gates) n'a pas basculé
// les obstacles sur le modèle Condition/Effect.
//
// M4 (revue jalon 1) : les drapeaux de capacités (CS-Kanji, objets-clés) ne
// sont posés que par le tiroir dev — retiré du build de production côté
// MapClient. Filet serveur symétrique : en production, ces drapeaux gardent
// leur valeur STOCKÉE (le client ne peut pas s'octroyer 水/渦/滝 par appel
// direct) ; seuls visited/cleared restent déclarés client (dette obstacles
// notée à l'issue 10, à migrer sur Condition/Effect).
const CLIENT_LOCKED_PROGRESS_FLAGS = [
  'tobu',
  'mizu',
  'chikara',
  'kiru',
  'kudaku',
  'taki',
  'uzu',
  'arrosoir',
  'radio',
] as const

export async function saveMapProgress(progress: unknown) {
  const userId = await requireUserId()
  let blob = progress
  if (process.env.NODE_ENV === 'production' && progress && typeof progress === 'object') {
    const [row] = await sql`select map_progress from users where id = ${userId}`
    const stored = (row?.map_progress ?? {}) as Record<string, unknown>
    const sanitized: Record<string, unknown> = { ...(progress as Record<string, unknown>) }
    for (const flag of CLIENT_LOCKED_PROGRESS_FLAGS) {
      sanitized[flag] = stored[flag] ?? false
    }
    blob = sanitized
  }
  await sql`update users set map_progress = ${JSON.stringify(blob)} where id = ${userId}`
}

// ── Gate SRS quotidien (issue 10) ─────────────────────────────────────────────
// PRD § Boucle Quotidienne pt 5 — JAMAIS une Condition (finding 02-D4) : la
// règle pure vit dans src/lib/zone-gate.ts. Choix de robustesse documenté :
// le statut SRS n'est PAS poussé au client au chargement — le client appelle
// checkZoneEntry au moment précis du franchissement d'une zone extérieure
// jamais visitée (événement rare, qui déclenche déjà un fetch de zone), donc
// jamais un aller-retour par pas ; et saveMapPosition re-vérifie à l'écriture
// (filet anti-triche, seulement quand la sauvegarde ajouterait une nouvelle
// zone extérieure à visited_zones).

/** Le franchissement vers cette zone est-il permis maintenant ?
 *
 * Deux refus possibles, dans cet ordre :
 *
 *  - un VERROU DE PROGRESSION (content/map/roadblocks.json) : un personnage
 *    barre ce franchissement précis tant que ses conditions ne sont pas
 *    remplies. Le refus emporte de quoi jouer la scène côté client (garde,
 *    poste, réplique) — mais la décision est prise ici : un verrou évalué par
 *    le client se contourne. Il s'applique à CHAQUE tentative, zone déjà
 *    visitée ou non : revenir sur ses pas doit rester bloqué tant que la
 *    condition tient ;
 *  - le gate SRS quotidien, lui, ne concerne que les zones extérieures
 *    JAMAIS visitées.
 */
export async function checkZoneEntry(
  zoneName: string,
  tzOffsetMinutes: number,
  fromZoneName?: string
): Promise<
  | { allowed: true }
  | { allowed: false; jp: string }
  | { allowed: false; roadblock: BlockedCrossing }
> {
  const zone = getZoneByName(zoneName)
  if (!zone) return { allowed: true }
  const userId = await requireUserId()
  const state = await getPlayerState(userId)

  if (fromZoneName) {
    const ctx = { questSteps: getQuestStepsIndex(), now: new Date() }
    const blocked = blockingRoadblock(fromZoneName, zoneName, state, ctx)
    if (blocked) {
      return {
        allowed: false,
        roadblock: {
          roadblock_id: blocked.roadblock_id,
          guard: blocked.guard,
          name: blocked.guard.name.jp,
          pages: blocked.pages,
          npc_id: blocked.npc_id,
        },
      }
    }
  }

  if (!zone.is_outdoor) return { allowed: true }
  if (state.visited_zones.includes(zoneName)) return { allowed: true }
  const status = await getDailySRSStatusForUser(userId, tzOffsetMinutes)
  if (gateBlocksEntry(zone, state.visited_zones, status.sessionDone)) {
    return { allowed: false, jp: uiStrings.srs_gate_blocked.jp }
  }
  return { allowed: true }
}

/** Ce que le client doit savoir pour JOUER la scène de blocage — jamais pour
 * la décider. */
export interface BlockedCrossing {
  roadblock_id: string
  guard: RoadblockGuard
  name: string
  pages: RoadblockPage[]
  /** Quand il est présent, le client doit jouer le DIALOGUE de ce PNJ (via
   * interactWithNpc, qui applique ses effets) plutôt que les `pages` figées :
   * c'est ce qui permet au bloqueur de remettre l'objet qui lève son propre
   * verrou. */
  npc_id?: string
}

// Position : écrit user_map_state (les colonnes users.map_* restent en place
// mais ne sont plus alimentées — retrait dans une migration ultérieure).
// Trace aussi la première entrée effective dans la zone (visited_zones,
// PRD finding 03-B3 : débloquée ≠ visitée).
export async function saveMapPosition(
  zoneName: string,
  x: number,
  z: number,
  tzOffsetMinutes = 0
) {
  const userId = await requireUserId()
  const zone = getZoneByName(zoneName)
  const state = await getPlayerState(userId)

  // C1 (revue jalon 1) : refuser une zone non atteignable. Niveau de garantie
  // choisi : la cible doit être la zone courante, une zone extérieure
  // contiguë (continuum outdoor), ou une destination de warp/ascenseur de la
  // zone courante (canReachZone, géométrie réelle) — ET la position doit être
  // dans les bornes de la cible. Pas de re-simulation de la marche tuile à
  // tuile (la position client n'est pas fiable à ce grain) ; une zone
  // courante hors registre (état corrompu) reste fail-open pour ne jamais
  // soft-locker. En développement, le tiroir dev téléporte librement (M4 :
  // il n'existe pas dans le build de production).
  if (process.env.NODE_ENV !== 'development') {
    if (!zone) return
    const current = getZoneByName(state.current_zone)
    if (current && !canReachZone(current, zone)) return
    if (!isWithinZoneBounds(zone, x, z)) return
  }

  // Filet serveur du gate SRS : n'écrit jamais une PREMIÈRE visite de zone
  // extérieure quand la session du jour n'est pas ✓ (le client a déjà bloqué
  // le pas — ce chemin ne se prend que via un client contourné).
  if (zone?.is_outdoor) {
    if (!state.visited_zones.includes(zoneName)) {
      const status = await getDailySRSStatusForUser(userId, tzOffsetMinutes)
      if (gateBlocksEntry(zone, state.visited_zones, status.sessionDone)) return
    }
  }
  await sql`
    insert into user_map_state (user_id, current_zone, avatar_x, avatar_y, visited_zones)
    values (${userId}, ${zoneName}, ${x}, ${z}, array[${zoneName}])
    on conflict (user_id) do update set
      current_zone = excluded.current_zone,
      avatar_x = excluded.avatar_x,
      avatar_y = excluded.avatar_y,
      visited_zones = case
        when ${zoneName} = any(user_map_state.visited_zones) then user_map_state.visited_zones
        else array_append(user_map_state.visited_zones, ${zoneName})
      end,
      updated_at = now()
  `
}

export interface ReachedDialogue {
  name: string
  state: string
  pages: DialoguePageEntry[]
}

// Le cœur de la tranche verticale (issue 02) : sélectionne le dialogue_state
// actif via les state_rules évaluées contre le vrai état joueur, applique les
// Effect[] de l'état atteint (horodatage serveur), persiste si quelque chose
// a changé. Idempotent par construction : rejouer les effets d'un état déjà
// atteint retourne le même PlayerState (===), donc zéro écriture.
//
// C1 (revue jalon 1) : le ref est re-vérifié — seule une entité que la
// lecture aurait servie dans la zone courante du joueur (présence + zone,
// src/lib/map-visibility.ts) peut porter ce dialogue. L'appel direct
// reachDialogueState('npcs/route-30/mr_pokemon_route30') depuis Bourg Geon
// échoue désormais sans effet.
export async function reachDialogueState(dialogueRef: string): Promise<ReachedDialogue | null> {
  const userId = await requireUserId()
  const state = await getPlayerState(userId)
  const now = new Date()
  if (!findAccessibleDialogueCarrier(state, dialogueRef, now)) return null
  return applyDialogueState(userId, state, dialogueRef, now)
}

/** Corps commun de reachDialogueState / interactWithNpc — les appelants ont
 * DÉJÀ prouvé que l'entité porteuse est servie dans la zone courante. */
async function applyDialogueState(
  userId: string,
  state: Awaited<ReturnType<typeof getPlayerState>>,
  dialogueRef: string,
  now: Date
): Promise<ReachedDialogue | null> {
  const dialogue = getDialogue(dialogueRef)
  if (!dialogue) return null

  const ctx = { questSteps: getQuestStepsIndex(), now }

  const stateId = selectDialogueState(dialogue.state_rules, state, ctx)
  if (!stateId) return null
  const dialogueState = dialogue.dialogue_states[stateId]
  if (!dialogueState) return null

  // Scène « objet obtenu » (2026-08-06) : construite ICI, donc servie sur TOUS
  // les chemins d'interaction (parler, verrou qui délègue, PNJ-leçon dont on
  // lit d'abord la réplique). Écrire un `grant_item` suffit — voir
  // src/lib/item-get.ts. On compare les inventaires avant/après plutôt que de
  // lire les Effects : `grant_item` est idempotent, et reparler à Mr. Pokémon
  // ne doit pas rejouer la remise de l'œuf.
  let granted: string[] = []
  if (dialogueState.effects?.length) {
    const next = applyEffects(dialogueState.effects, state, ctx)
    if (next !== state) {
      granted = newlyGrantedItems(state.inventory, next.inventory)
      await savePlayerState(userId, next)
    }
  }

  return {
    name: typeof dialogue.name === 'string' ? dialogue.name : dialogue.name.jp,
    state: stateId,
    // Enrichissement issue 03 : les entrées companion_choice reçoivent le
    // roster de content/companions.json (le client ne lit jamais content/).
    // attachCompanionOptions retourne de nouvelles entrées — le cache module
    // du loader n'est pas muté.
    pages: [
      ...attachCompanionOptions(dialogueState.pages, getCompanions()),
      ...buildItemGetPages(granted, itemLabels),
    ],
  }
}

// Interaction PNJ (issue 05) : si le PNJ est un PNJ-leçon (référencé par
// npc_ref dans content/lessons/<zone>.json), la règle leçon-ou-blocage
// (src/lib/lessons.ts) décide de la résolution AVANT le dialogue :
//  - leçon en tête + déverrouillée → le client ouvre le Book Screen
//    (route /lesson/<zone>/<seq>) au lieu de la boîte de dialogue ;
//  - hors d'ordre → ligne de blocage en boîte de dialogue (banque partagée
//    content/dialogues/shared/lesson-blocked.json quand elle existera,
//    ligne système de ui-strings en attendant) ;
//  - sinon (tête verrouillée par ses unlock_conditions, ou zone finie) →
//    le dialogue_ref ordinaire, comme n'importe quel PNJ.
export type NpcInteraction =
  | { kind: 'lesson'; zone_id: string; sequence_index: number }
  /** `lesson` présent : le personnage a une leçon à donner, mais on sert
   * d'abord son dialogue — l'écran-livre s'ouvre à la fermeture de la boîte
   * (issue 13, « l'histoire d'abord, toujours »). */
  | {
      kind: 'dialogue'
      dialogue: ReachedDialogue
      lesson?: { zone_id: string; sequence_index: number }
    }
  | { kind: 'text'; text_id: string }

export async function interactWithNpc(npcId: string): Promise<NpcInteraction | null> {
  const userId = await requireUserId()
  const state = await getPlayerState(userId)
  const now = new Date()

  // C1 (revue jalon 1) : le PNJ/objet doit être servi au joueur dans sa zone
  // courante (le PC ne se débloque que depuis la chambre, le panneau depuis
  // la Route 29) et visible (unlock_conditions) — sinon « il n'existe pas
  // sur la tuile », rien n'est appliqué. Le dialogue_ref vient toujours du
  // REGISTRE, plus jamais du client.
  const served = accessibleNpc(state, npcId, now)
  if (!served) return null

  // Émission moteur des unlock_text (issue 08, engine-contract § 2) : les
  // entrées kind object/sign du registre (PC du joueur, panneau de Route 29)
  // n'ont AUCUN fichier dialogue — le moteur applique lui-même l'Effect
  // unlock_text (idempotent, lib 02 : no-op → même objet → zéro écriture)
  // puis le client ouvre la fenêtre de lecture.
  const engineTextId = getEngineUnlockTextId(npcId)
  if (engineTextId) {
    const next = applyEffect(
      { type: 'unlock_text', text_id: engineTextId },
      state,
      { questSteps: getQuestStepsIndex(), now }
    )
    if (next !== state) await savePlayerState(userId, next)
    return { kind: 'text', text_id: engineTextId }
  }
  const npc = getMapNpcs().find(n => n.npc_id === npcId)
  if (npc?.role === 'lesson') {
    const lessons = getLessonsForZone(npc.zone_id)
    const ctx = { questSteps: getQuestStepsIndex(), now }
    const resolution = resolveLessonInteraction(npc.npc_id, lessons, state, ctx)
    if (resolution.kind === 'lesson') {
      // L'HISTOIRE D'ABORD, TOUJOURS (issue 13, décision produit). Un
      // personnage qui a une leçon à donner ouvrait l'écran-livre SANS jamais
      // dire sa réplique : Mr. Pokémon lançait une leçon au lieu de parler de
      // l'œuf qu'on venait chercher de la part d'Elm. On sert donc son
      // dialogue, et la leçon suit à la fermeture de la boîte.
      const lesson = {
        zone_id: npc.zone_id,
        sequence_index: resolution.lesson.sequence_index,
      }
      if (served.dialogue_ref) {
        const dialogue = await applyDialogueState(userId, state, served.dialogue_ref, now)
        if (dialogue) return { kind: 'dialogue', dialogue, lesson }
      }
      return { kind: 'lesson', ...lesson }
    }
    if (resolution.kind === 'blocked') {
      const pool = getLessonBlockedLines('N5')
      const jp = pool.length
        ? pool[Math.floor(Math.random() * pool.length)]
        : uiStrings.lesson_blocked.jp
      const dialogue = npc.dialogue_ref ? getDialogue(npc.dialogue_ref) : null
      const name = dialogue
        ? typeof dialogue.name === 'string'
          ? dialogue.name
          : dialogue.name.jp
        : ''
      return { kind: 'dialogue', dialogue: { name, state: 'lesson_blocked', pages: [{ jp }] } }
    }
    // fallback_dialogue → dialogue ordinaire ci-dessous
  }
  if (!served.dialogue_ref) return null // entrée sans dialogue ni texte moteur : rien
  const dialogue = await applyDialogueState(userId, state, served.dialogue_ref, now)
  return dialogue ? { kind: 'dialogue', dialogue } : null
}

// Persistance du choix du compagnon (kind: companion_choice, labo d'Elm) via
// Effect.set_companion — écrit UNE fois, jamais re-choisi (PRD § Compagnon,
// idempotence portée par la lib issue 02). Seul un slot `confirmed` du roster
// est acceptable : tbd_2/tbd_3 sont affichés indisponibles côté client et
// re-refusés ici (ne jamais faire confiance au client).
export async function chooseCompanion(companionId: string): Promise<{ companion_id: string | null }> {
  const userId = await requireUserId()
  const state = await getPlayerState(userId)
  const entry = getCompanions().find(c => c.companion_id === companionId)
  if (!entry || entry.status !== 'confirmed') return { companion_id: state.companion_id }

  const next = applyEffect(
    { type: 'set_companion', companion_id: companionId },
    state,
    { questSteps: getQuestStepsIndex(), now: new Date() }
  )
  if (next !== state) await savePlayerState(userId, next)
  return { companion_id: next.companion_id }
}

/** Ramasser une Poké Ball posée sur la carte (2026-08-06).
 *
 * Elle contient un TEXTE, pas un objet : le débloquer le fait entrer au
 * どくしょノート du Sac, lisible tout de suite ou plus tard. Le client marque
 * ensuite la ball ramassée (même `cleared` que les obstacles franchis), donc
 * elle disparaît de la carte pour de bon.
 *
 * Même garde que partout ailleurs (C1) : la ball doit exister dans la zone
 * COURANTE du joueur, telle que le serveur la servirait — jamais sur la seule
 * parole du client. */
export async function collectFoundText(
  objectId: string
): Promise<{ text_id: string } | null> {
  const userId = await requireUserId()
  const state = await getPlayerState(userId)
  const textId = collectibleTextFor(objectId)
  if (!textId) return null

  const zone = getZoneByName(state.current_zone)
  if (!zone) return null
  const ctx = { questSteps: getQuestStepsIndex(), now: new Date() }
  const served = visibleRomObjects(
    zone,
    [
      ...filterVisibleNpcs(getNpcsForZone(zone, { state, ctx }), state),
      ...filterVisibleTrainers(getTrainersForZone(zone), state),
    ],
    []
  )
  if (!served.some(o => o.id === objectId)) return null

  const next = applyEffect({ type: 'unlock_text', text_id: textId }, state, ctx)
  if (next !== state) await savePlayerState(userId, next)
  return { text_id: textId }
}

// Events moteur-only (engine-contract.md § 1) : posés par une mécanique de
// jeu (scène, puzzle), jamais par un Effect de contenu. Aucun consommateur
// dans le jalon 1 — seule l'API existe. Idempotent.
export async function clearEvent(eventId: string) {
  const userId = await requireUserId()
  const state = await getPlayerState(userId)
  if (state.cleared_events.includes(eventId)) return
  await savePlayerState(userId, {
    ...state,
    cleared_events: [...state.cleared_events, eventId],
  })
}
