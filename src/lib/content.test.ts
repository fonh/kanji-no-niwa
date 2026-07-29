import { describe, it, expect } from 'vitest'
import {
  getDialogue,
  getQuest,
  getQuestStepsIndex,
  getMapNpcs,
  getMapTrainers,
  getMapObstacles,
  getLessonsForZone,
} from './content'

describe('getDialogue', () => {
  it('loads a real dialogue file by dialogue_ref', () => {
    const dialogue = getDialogue('npcs/new-bark-town/mom_new_bark')
    expect(dialogue).not.toBe(null)
    expect(dialogue!.npc_id).toBe('mom_new_bark')
    expect(dialogue!.state_rules.at(-1)).toEqual({ default: true, state: 'intro' })
    expect(dialogue!.dialogue_states.give_pokegear.effects).toEqual([
      { type: 'grant_item', item_id: 'pokegear' },
    ])
  })

  it('caches parsed files (same object on second call)', () => {
    expect(getDialogue('npcs/new-bark-town/mom_new_bark')).toBe(
      getDialogue('npcs/new-bark-town/mom_new_bark')
    )
  })

  it('returns null for a missing or invalid ref', () => {
    expect(getDialogue('npcs/new-bark-town/nope')).toBe(null)
    expect(getDialogue('../secrets')).toBe(null)
    expect(getDialogue('npcs/../../etc/passwd')).toBe(null)
  })
})

describe('quests', () => {
  it('loads a quest with its ordered steps', () => {
    const quest = getQuest('mystery_egg_errand')
    expect(quest!.steps.map(s => s.step_id)).toEqual(['sent_by_elm', 'egg_received', 'egg_delivered'])
  })

  it('returns null for an unknown quest', () => {
    expect(getQuest('nope')).toBe(null)
  })

  it('getQuestStepsIndex indexes every quest file by quest_id', () => {
    const index = getQuestStepsIndex()
    expect(index.mystery_egg_errand).toEqual(['sent_by_elm', 'egg_received', 'egg_delivered'])
    expect(Object.keys(index).length).toBeGreaterThanOrEqual(16)
  })
})

describe('map registries', () => {
  it('getMapNpcs exposes unlock_conditions from content/map/npcs.json', () => {
    const npcs = getMapNpcs()
    const silver = npcs.find(n => n.npc_id === 'silver_spying_new_bark')
    expect(silver!.unlock_conditions).toEqual([
      { type: 'quest_step', quest_id: 'mystery_egg_errand', step: 'sent_by_elm', negate: true },
    ])
    const mom = npcs.find(n => n.npc_id === 'mom_new_bark')
    expect(mom!.unlock_conditions).toBeUndefined()
  })

  it('getMapTrainers loads content/map/trainers.json', () => {
    const trainers = getMapTrainers()
    expect(trainers.some(t => t.trainer_id === 'silver_apparition1_cherrygrove')).toBe(true)
  })

  it('getMapObstacles loads content/map/obstacles.json', () => {
    const obstacles = getMapObstacles()
    const sudowoodo = obstacles.find(o => o.obstacle_id === 'sudowoodo_route36')
    expect(sudowoodo!.unlock_conditions).toEqual([{ type: 'item_owned', item_id: 'squirtbottle' }])
  })
})

describe('getLessonsForZone', () => {
  it('loads the lesson list of a zone, ordered by sequence_index', () => {
    const lessons = getLessonsForZone('new-bark-town')
    expect(lessons.length).toBeGreaterThan(0)
    expect(lessons.map(l => l.sequence_index)).toEqual(
      [...lessons.map(l => l.sequence_index)].sort((a, b) => a - b)
    )
  })

  it('returns [] for a zone without lessons', () => {
    expect(getLessonsForZone('route-33')).toEqual([])
    expect(getLessonsForZone('../evil')).toEqual([])
  })
})
