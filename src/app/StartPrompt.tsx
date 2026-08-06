'use client'

// « Presse START » de l'écran-titre (issue 04) — à chaque lancement, même
// compte avancé (PRD § Séquence d'ouverture). Sur téléphone : tap n'importe
// où ; au clavier : Enter. La destination (carte ou onboarding) est décidée
// côté serveur (startDestination) et passée en prop.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import uiStrings from '@/data/ui-strings.json'

export default function StartPrompt({ destination }: { destination: string }) {
  const router = useRouter()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Enter') router.push(destination)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [router, destination])

  return (
    <button
      type="button"
      onClick={() => router.push(destination)}
      // La zone de tap couvre tout l'écran (l'écran-titre entier est le
      // bouton) ; le libellé clignote comme sur DS.
      className="fixed inset-0 flex items-end justify-center pb-16 outline-none"
      aria-label={uiStrings.title_press_start.jp}
    >
      <span className="title-blink text-lg">{uiStrings.title_press_start.jp}</span>
    </button>
  )
}
