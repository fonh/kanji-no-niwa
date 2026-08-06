// Test d'intégration (issue 02) : déroule la quête mystery_egg_errand étape
// par étape, en mémoire, contre les VRAIS fichiers de contenu —
// content/dialogues/npcs/new-bark-town/*, content/map/npcs.json,
// content/quests/mystery_egg_errand.json (+ mr_pokemon_route30 pour l'étape
// egg_received, posée à Route 30 dans le vrai contenu).
import { describe, it, expect } from 'vitest'
import {
  applyEffects,
  defaultPlayerState,
  isUnlocked,
  selectDialogueState,
  type ApplyContext,
  type PlayerState,
} from './condition-effect'
import { getDialogue, getMapNpcs, getQuestStepsIndex, type DialogueFile } from './content'

const NOW = new Date('2026-07-29T12:00:00Z')
const ctx: ApplyContext = { questSteps: getQuestStepsIndex(), now: NOW }

/** Ce que fait la server action reachDialogueState, en mémoire : sélectionne
 * l'état via state_rules, applique ses Effect[], retourne le nouvel état. */
function talkTo(dialogue: DialogueFile, state: PlayerState): { state: PlayerState; reached: string } {
  const reached = selectDialogueState(dialogue.state_rules, state, ctx)
  expect(reached).not.toBe(null)
  const effects = dialogue.dialogue_states[reached!].effects ?? []
  return { state: applyEffects(effects, state, ctx), reached: reached! }
}

function visibleNpcIds(state: PlayerState): string[] {
  return getMapNpcs()
    .filter(n => n.zone_id === 'new-bark-town')
    .filter(n => isUnlocked(n.unlock_conditions, state, ctx))
    .map(n => n.npc_id)
}

describe('mystery_egg_errand — traversée complète sur les vrais fichiers', () => {
  const mom = getDialogue('npcs/new-bark-town/mom_new_bark')!
  const elm = getDialogue('npcs/new-bark-town/prof_elm_lab')!
  const mrPokemon = getDialogue('npcs/route-30/mr_pokemon_route30')!

  it('joue la quête de bout en bout, avec présence et idempotence', () => {
    let state = defaultPlayerState()

    // Avant tout : Silver espionne le labo, l'assistant est déjà dans le labo
    // (c'est lui qui accueille), le policier n'a encore aucune raison d'être là
    let visible = visibleNpcIds(state)
    expect(visible).toContain('silver_spying_new_bark')
    expect(visible).toContain('elm_assistant_new_bark')
    expect(visible).not.toContain('policeman_new_bark')

    // Mom avant la quête : intro, aucun effet
    const introTalk = talkTo(mom, state)
    expect(introTalk.reached).toBe('intro')
    expect(introTalk.state).toBe(state)

    // Elm : welcome → advance_quest(sent_by_elm)
    const elmTalk = talkTo(elm, state)
    expect(elmTalk.reached).toBe('welcome')
    state = elmTalk.state
    expect(state.quest_progress.mystery_egg_errand.current_step).toBe('sent_by_elm')

    // Silver reste posté devant le labo pendant toute la course : il ne
    // disparaît qu'au retour, une fois le vol commis (negate sur egg_received,
    // fidèle à scr_seq_0229_R30R0201.s:266)
    expect(visibleNpcIds(state)).toContain('silver_spying_new_bark')

    // Reparler à Elm : sent_off, aucun effet rejoué
    const elmRetalk = talkTo(elm, state)
    expect(elmRetalk.reached).toBe('sent_off')
    expect(elmRetalk.state).toBe(state)

    // Mom à la sortie : give_pokegear → grant_item(pokegear)
    const momGear = talkTo(mom, state)
    expect(momGear.reached).toBe('give_pokegear')
    state = momGear.state
    expect(state.inventory.pokegear).toBe(1)

    // Reparler à Mom : même état, grant_item unique inerte — même objet
    const momRetalk = talkTo(mom, state)
    expect(momRetalk.reached).toBe('give_pokegear')
    expect(momRetalk.state).toBe(state)

    // Route 30 — Mr. Pokémon : intro → mystery_egg + advance(egg_received)
    const eggTalk = talkTo(mrPokemon, state)
    expect(eggTalk.reached).toBe('intro')
    state = eggTalk.state
    expect(state.inventory.mystery_egg).toBe(1)
    expect(state.quest_progress.mystery_egg_errand.current_step).toBe('egg_received')

    // Re-visite chez Mr. Pokémon : after, rien ne se rejoue
    const eggRetalk = talkTo(mrPokemon, state)
    expect(eggRetalk.reached).toBe('after')
    expect(eggRetalk.state).toBe(state)

    // Retour à Bourg Geon : le policier enquête, Silver s'est volatilisé
    visible = visibleNpcIds(state)
    expect(visible).toContain('policeman_new_bark')
    expect(visible).toContain('elm_assistant_new_bark')
    expect(visible).not.toContain('silver_spying_new_bark')

    // Mom au retour : welcome_back (filet de sécurité pokegear inerte)
    const momBack = talkTo(mom, state)
    expect(momBack.reached).toBe('welcome_back')
    expect(momBack.state).toBe(state)

    // Elm : welcome_back → advance(egg_delivered), quête terminée
    const elmBack = talkTo(elm, state)
    expect(elmBack.reached).toBe('welcome_back')
    state = elmBack.state
    expect(state.quest_progress.mystery_egg_errand.current_step).toBe('egg_delivered')
    expect(state.completed_quests).toContain('mystery_egg_errand')

    // Reparler à Elm après la fin : egg_care, plus aucun effet
    const elmDone = talkTo(elm, state)
    expect(elmDone.reached).toBe('egg_care')
    expect(elmDone.state).toBe(state)
  })

  it('ordre inattendu : parler à Mom pendant sent_by_elm après un détour', () => {
    // Le joueur lance la mission, sort, revient, reparle à Mom plusieurs fois
    let state = talkTo(elm, defaultPlayerState()).state
    state = talkTo(mom, state).state
    state = talkTo(mom, state).state
    state = talkTo(mom, state).state
    expect(state.inventory).toEqual({ pokegear: 1 })
    expect(state.quest_progress.mystery_egg_errand.current_step).toBe('sent_by_elm')
  })
})
