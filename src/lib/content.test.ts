import { describe, it, expect } from 'vitest'
import {
  getDialogue,
  getQuest,
  getQuestStepsIndex,
  getMapNpcs,
  getMapTrainers,
  getMapObstacles,
  getLessonsForZone,
  getLessonZoneIds,
  getTextZoneIds,
  getTextsForZone,
  getGrammarForZone,
  getGrammarPoint,
  getGrammarSource,
  getGrammarSourceEntry,
  getLessonBlockedLines,
  getTextById,
  getEngineUnlockTextId,
  getZoneRegistryNames,
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
      { type: 'quest_step', quest_id: 'mystery_egg_errand', step: 'egg_received', negate: true },
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

describe('grammaire (issue 05)', () => {
  it('getGrammarForZone charge l’overlay réel de new-bark-town (5 points)', () => {
    const points = getGrammarForZone('new-bark-town')
    expect(points.map(p => p.grammar_id)).toEqual(['N5-001', 'N5-002', 'N5-003', 'N5-004', 'N5-005'])
  })

  it('getGrammarPoint retrouve un point avec ses exemples sélectionnés', () => {
    const point = getGrammarPoint('new-bark-town', 'N5-001')
    expect(point!.selected_examples).toHaveLength(2)
    expect(point!.selected_examples[0].point_answer).toBe('いちばん')
    expect(getGrammarPoint('new-bark-town', 'N5-999')).toBe(null)
    expect(getGrammarForZone('route-33')).toEqual([])
  })

  it('getGrammarSourceEntry fusionne avec la base Hanabira (title, en, audio)', () => {
    const point = getGrammarPoint('new-bark-town', 'N5-001')!
    const source = getGrammarSourceEntry(point)
    expect(source!.title).toContain('いちばん')
    expect(source!.short_explanation.length).toBeGreaterThan(0)
    const example = source!.examples[point.selected_examples[0].source_example_index]
    expect(example.en).toContain('sushi')
  })

  it('getGrammarSource refuse un palier inconnu', () => {
    expect(getGrammarSource('N9')).toBe(null)
    expect(getGrammarSource('../../etc')).toBe(null)
  })
})

describe('getLessonBlockedLines', () => {
  it('sert le pool du palier depuis le fichier partagé (écrit 2026-08-07)', () => {
    const lines = getLessonBlockedLines('N5')
    expect(lines.length).toBeGreaterThan(1)
    // Génériques par construction : une même ligne sert toutes les zones,
    // donc aucune ne peut nommer un personnage ou un lieu. Et pas de latin.
    for (const line of lines) expect(line).not.toMatch(/[A-Za-z]/)
    // Au moins une renvoie au Carnet — c'est le seul endroit qui nomme le
    // porteur de la prochaine leçon, et rien d'autre n'y renvoie.
    expect(lines.some(l => l.includes('メニュー'))).toBe(true)
  })

  it('un palier sans pool retombe sur [] (l’appelant sert la ligne système)', () => {
    expect(getLessonBlockedLines('N1')).toEqual([])
  })
})

describe('textes progressifs (issue 08)', () => {
  it('getTextById retrouve un texte par son text_id (≠ nom de fichier)', () => {
    const text = getTextById('lyra_mail_new_bark') // fichier : new-bark-town/lyra_mail.json
    expect(text!.zone_id).toBe('new-bark-town')
    expect(text!.found_object_ref).toBe('player_pc_new_bark')
    expect(text!.title.jp).toBe('コハルからの　メール')
    expect(text!.questions).toHaveLength(3)
    expect(text!.questions[0].options).toHaveLength(4)
    expect(typeof text!.questions[0].correct_index).toBe('number')
  })

  it('getTextById couvre le panneau de Route 29 et le grand texte d’Elm', () => {
    expect(getTextById('johto_entrance_sign_route29')!.found_object_ref).toBe(
      'sign_johto_entrance_route29'
    )
    expect(getTextById('elm_great_text_new_bark')!.npc_ref).toBe('prof_elm_lab')
    expect(getTextById('nope')).toBe(null)
  })

  it('cache : même objet au second appel', () => {
    expect(getTextById('lyra_mail_new_bark')).toBe(getTextById('lyra_mail_new_bark'))
  })

  it('getEngineUnlockTextId encode la table complète du contrat § 2 (5 entrées)', () => {
    // Seules les 2 premières ont leur zone dans le jalon 1 ; les 5 sont
    // encodées pour que l'ajout des zones suivantes ne demande rien ici.
    expect(getEngineUnlockTextId('player_pc_new_bark')).toBe('lyra_mail_new_bark')
    expect(getEngineUnlockTextId('sign_johto_entrance_route29')).toBe('johto_entrance_sign_route29')
    expect(getEngineUnlockTextId('forest_shrine_ilex')).toBe('forest_shrine_ilex')
    expect(getEngineUnlockTextId('son_in_law_letter_object_slowpoke_well')).toBe(
      'son_in_law_letter_slowpoke_well'
    )
    expect(getEngineUnlockTextId('inscription_sprout_tower')).toBe('ancient_inscription_sprout_tower')
    expect(getEngineUnlockTextId('prof_elm_lab')).toBe(null)
  })

  it('chaque text_id de la table moteur correspond à un vrai fichier de contenu', () => {
    for (const ref of [
      'player_pc_new_bark',
      'sign_johto_entrance_route29',
      'forest_shrine_ilex',
      'son_in_law_letter_object_slowpoke_well',
      'inscription_sprout_tower',
    ]) {
      const textId = getEngineUnlockTextId(ref)!
      expect(getTextById(textId), textId).not.toBe(null)
    }
  })
})

describe('loaders du menu START (issue 09)', () => {
  it('getLessonZoneIds liste les zones à leçons (slugs des fichiers)', () => {
    const ids = getLessonZoneIds()
    expect(ids).toContain('new-bark-town')
    expect(ids).toContain('route-29')
    expect(ids).toContain('cherrygrove-city')
    expect(ids).toContain('route-30')
  })

  it('getTextZoneIds liste les zones à textes (dossiers de content/texts)', () => {
    const ids = getTextZoneIds()
    expect(ids).toContain('new-bark-town')
    expect(ids).toContain('route-29')
    expect(ids).not.toContain('cherrygrove-city') // aucun texte écrit là
  })

  it('getTextsForZone retourne les textes d’une zone ; [] pour une zone sans texte', () => {
    const texts = getTextsForZone('new-bark-town')
    expect(texts.map(t => t.text_id).sort()).toEqual([
      'elm_great_text_new_bark',
      'lyra_mail_new_bark',
    ])
    expect(getTextsForZone('cherrygrove-city')).toEqual([])
    expect(getTextsForZone('../evil')).toEqual([])
  })

  it('getTextsForZone sert les MÊMES objets que getTextById (index partagé)', () => {
    const [first] = getTextsForZone('route-29')
    expect(first).toBe(getTextById(first.text_id))
  })
})

describe('getZoneRegistryNames (issue 10 — LA source des noms de zones jp)', () => {
  it('sert name {jp, en} par slug depuis content/zone-registry-names.json', () => {
    const names = getZoneRegistryNames()
    expect(names['new-bark-town']).toEqual({ jp: 'ワカバタウン', en: 'New Bark Town' })
    expect(names['route-29'].jp).toBe('29ばんどうろ')
    expect(names['cherrygrove-city'].jp).toBe('ヨシノシティ')
    expect(names['route-30'].jp).toBe('30ばんどうろ')
  })

  it('couvre les zones du jalon et au-delà (le registre contenu est complet)', () => {
    const names = getZoneRegistryNames()
    expect(Object.keys(names).length).toBeGreaterThan(50)
  })
})
