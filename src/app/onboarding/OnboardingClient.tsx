'use client'

// Onboarding nouveau compte (issue 04) : choix d'avatar puis nom en kana.
// Tout le texte affiché est japonais (PRD § Langue du Jeu) — seul le romaji
// tapé existe, le temps de sa conversion. Le serveur revalide tout
// (parseOnboarding) ; ici on ne fait que guider la saisie.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import KanaInput from '@/components/KanaInput'
import { finalizeKana, isKanaText } from '@/lib/kana-input'
import { AVATARS, avatarPortrait, MAX_NAME_KANA, type Avatar } from '@/lib/onboarding'
import uiStrings from '@/data/ui-strings.json'
import { completeOnboarding } from './actions'

const AVATAR_LABEL: Record<Avatar, string> = {
  ethan: uiStrings.avatar_boy.jp,
  lyra: uiStrings.avatar_girl.jp,
}

export default function OnboardingClient() {
  const router = useRouter()
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  const finalName = finalizeKana(name.trim())
  const nameValid = isKanaText(finalName) && finalName.length <= MAX_NAME_KANA

  async function submit() {
    if (!avatar || !nameValid || saving) return
    setSaving(true)
    setFailed(false)
    try {
      await completeOnboarding(avatar, finalName)
      router.push('/map')
    } catch {
      setFailed(true)
      setSaving(false)
    }
  }

  return (
    <main className="font-chrome min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-4">
      {avatar === null ? (
        <>
          <p className="text-xl mb-10">{uiStrings.avatar_prompt.jp}</p>
          <div className="flex gap-10">
            {AVATARS.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className="flex flex-col items-center gap-3 px-6 py-4 border-2 border-gray-600 rounded-lg hover:border-amber-300 focus:border-amber-300 outline-none bg-gray-900"
              >
                {/* Portrait HGSS 80×80 — pixels nets, pas de lissage */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarPortrait(a)}
                  alt={AVATAR_LABEL[a]}
                  width={80}
                  height={80}
                  style={{ imageRendering: 'pixelated' }}
                />
                <span>{AVATAR_LABEL[a]}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-xl mb-8">{uiStrings.name_prompt.jp}</p>
          <KanaInput
            value={name}
            onChange={setName}
            onSubmit={submit}
            maxKana={MAX_NAME_KANA}
            autoFocus
            ariaLabel={uiStrings.name_prompt.jp}
            className="font-reading text-2xl text-center tracking-widest bg-gray-900 border-2 border-gray-600 focus:border-amber-300 outline-none rounded-lg px-4 py-3 w-64 text-white"
          />
          {failed && <p className="mt-4 text-red-400 text-sm">{uiStrings.save_failed.jp}</p>}
          <div className="flex gap-6 mt-8">
            <button
              type="button"
              onClick={() => {
                setAvatar(null)
                setName('')
                setFailed(false)
              }}
              className="px-6 py-3 border-2 border-gray-600 rounded-lg hover:border-amber-300"
            >
              {uiStrings.back.jp}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!nameValid || saving}
              className="px-6 py-3 border-2 border-amber-300 rounded-lg bg-amber-300 text-gray-900 disabled:opacity-40 disabled:border-gray-600 disabled:bg-transparent disabled:text-white"
            >
              {uiStrings.confirm.jp}
            </button>
          </div>
        </>
      )}
    </main>
  )
}
