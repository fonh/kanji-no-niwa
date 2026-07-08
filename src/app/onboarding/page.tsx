'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveTrainerName } from './actions'

export default function OnboardingPage() {
  const router = useRouter()
  const [trainerName, setTrainerName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = trainerName.trim()
    if (!name) return

    setSaving(true)
    setError('')

    try {
      await saveTrainerName(name)
      router.push('/onboarding/mentor-intro')
    } catch {
      setError('Could not save trainer name. Try again.')
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
      <h2 className="text-2xl font-bold mb-2">Choose your trainer name</h2>
      <p className="text-gray-400 mb-8 text-sm">Prof. Elm will address you by this name.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
        <input
          type="text"
          value={trainerName}
          onChange={e => setTrainerName(e.target.value)}
          placeholder="Your name"
          maxLength={20}
          className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={!trainerName.trim() || saving}
          className="px-8 py-3 rounded-full bg-amber-400 text-gray-900 font-semibold disabled:opacity-40 hover:bg-amber-300 transition-colors"
        >
          {saving ? 'Saving…' : 'Begin'}
        </button>
      </form>
    </main>
  )
}
