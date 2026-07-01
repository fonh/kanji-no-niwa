import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

interface StateRule {
  default?: boolean
  state: string
}

interface DialoguePage {
  jp: string
  en: string
}

interface DialogueFile {
  npc_id: string
  name: string
  state_rules: StateRule[]
  dialogue_states: Record<string, { pages: DialoguePage[] }>
}

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref')
  if (!ref || ref.includes('..')) {
    return NextResponse.json({ error: 'missing or invalid ref' }, { status: 400 })
  }

  const filePath = path.join(process.cwd(), 'content', 'dialogues', `${ref}.json`)

  let raw: string
  try {
    raw = await readFile(filePath, 'utf-8')
  } catch {
    return NextResponse.json({ error: 'dialogue not found' }, { status: 404 })
  }

  const dialogue = JSON.parse(raw) as DialogueFile
  const activeRule = dialogue.state_rules.find(r => r.default) ?? dialogue.state_rules[0]
  const state = activeRule ? dialogue.dialogue_states[activeRule.state] : undefined

  return NextResponse.json({
    name: dialogue.name,
    pages: state?.pages ?? [],
  })
}
