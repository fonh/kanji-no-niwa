export type TrainerRank = {
  level: number
  character: string
  rank: string
  minStudied: number
  maxStudied: number
}

const RANK_TABLE: TrainerRank[] = [
  { level: 1,  character: 'Gamin',          rank: 'NPC',                   minStudied: 0,    maxStudied: 49   },
  { level: 2,  character: 'Fillette',        rank: 'NPC',                   minStudied: 50,   maxStudied: 99   },
  { level: 3,  character: 'Attrapeur',       rank: 'Beginner Trainer',      minStudied: 100,  maxStudied: 149  },
  { level: 4,  character: 'Randonneur',      rank: 'Beginner Trainer',      minStudied: 150,  maxStudied: 199  },
  { level: 5,  character: 'Pêcheur',         rank: 'Beginner Trainer',      minStudied: 200,  maxStudied: 249  },
  { level: 6,  character: 'Campeur',         rank: 'Intermediate Trainer',  minStudied: 250,  maxStudied: 299  },
  { level: 7,  character: 'Marin',           rank: 'Intermediate Trainer',  minStudied: 300,  maxStudied: 369  },
  { level: 8,  character: 'Jongleur',        rank: 'Intermediate Trainer',  minStudied: 370,  maxStudied: 449  },
  { level: 9,  character: 'Sage',            rank: 'Advanced Trainer',      minStudied: 450,  maxStudied: 549  },
  { level: 10, character: 'Silver (Rival)',  rank: 'Rival',                 minStudied: 550,  maxStudied: 649  },
  { level: 11, character: 'Falkner',         rank: '師範 — Flying',         minStudied: 650,  maxStudied: 749  },
  { level: 12, character: 'Bugsy',           rank: '師範 — Bug',            minStudied: 750,  maxStudied: 849  },
  { level: 13, character: 'Whitney',         rank: '師範 — Normal',         minStudied: 850,  maxStudied: 949  },
  { level: 14, character: 'Morty',           rank: '師範 — Ghost',          minStudied: 950,  maxStudied: 1049 },
  { level: 15, character: 'Chuck',           rank: '師範 — Fighting',       minStudied: 1050, maxStudied: 1149 },
  { level: 16, character: 'Jasmine',         rank: '師範 — Steel',          minStudied: 1150, maxStudied: 1249 },
  { level: 17, character: 'Pryce',           rank: '師範 — Ice',            minStudied: 1250, maxStudied: 1349 },
  { level: 18, character: 'Clair',           rank: '師範 — Dragon',         minStudied: 1350, maxStudied: 1499 },
  { level: 19, character: 'Will',            rank: 'Elite Four — Psychic',  minStudied: 1500, maxStudied: 1649 },
  { level: 20, character: 'Koga',            rank: 'Elite Four — Poison',   minStudied: 1650, maxStudied: 1799 },
  { level: 21, character: 'Bruno',           rank: 'Elite Four — Fighting', minStudied: 1800, maxStudied: 1899 },
  { level: 22, character: 'Karen',           rank: 'Elite Four — Dark',     minStudied: 1900, maxStudied: 1999 },
  { level: 23, character: 'Lance',           rank: 'Champion of Johto',     minStudied: 2000, maxStudied: 2099 },
  { level: 24, character: 'Professor Elm',   rank: 'Pokémon Master',        minStudied: 2100, maxStudied: 2135 },
  { level: 25, character: 'Red',             rank: 'Legend',                minStudied: 2136, maxStudied: 2136 },
]

export function getTrainerRank(studiedCount: number): TrainerRank {
  for (let i = RANK_TABLE.length - 1; i >= 0; i--) {
    if (studiedCount >= RANK_TABLE[i].minStudied) {
      return RANK_TABLE[i]
    }
  }
  return RANK_TABLE[0]
}

export type KanjiInfo = {
  id: string
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | null
}

const JLPT_ORDER: Record<string, number> = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 }

export function getAvailableKanji(
  studiedSet: string[],
  allKanji: KanjiInfo[],
  componentGraph: Record<string, string[]>
): string[] {
  const studied = new Set(studiedSet)
  const available = allKanji.filter(k => {
    if (studied.has(k.id)) return false
    const components = componentGraph[k.id] ?? []
    return components.every(c => studied.has(c))
  })
  return available.sort((a, b) => {
    const pa = a.jlptLevel !== null ? (JLPT_ORDER[a.jlptLevel] ?? 5) : 6
    const pb = b.jlptLevel !== null ? (JLPT_ORDER[b.jlptLevel] ?? 5) : 6
    return pa - pb
  }).map(k => k.id)
}

export type Lesson = {
  id: string
  title: string
  bodyMarkdown: string
  johtoZone: string
  kanjiIds: string[]
  quizQuestions: unknown[]
}

export function getLessonQueue(
  availableKanji: string[],
  completedLessons: string[],
  allLessons: Lesson[],
  queuedKanji: string[]
): Lesson[] {
  const available = new Set(availableKanji)
  const queued = new Set(queuedKanji)
  const eligible = allLessons.filter(
    lesson =>
      !completedLessons.includes(lesson.id) &&
      lesson.kanjiIds.every(k => available.has(k))
  )
  const hasQueued = (lesson: Lesson) => lesson.kanjiIds.some(k => queued.has(k))
  return [...eligible.filter(hasQueued), ...eligible.filter(l => !hasQueued(l))]
}
