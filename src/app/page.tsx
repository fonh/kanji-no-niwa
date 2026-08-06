// Écran-titre (issue 04) — affiché à CHAQUE lancement, même compte avancé
// (PRD § Séquence d'ouverture). Logo texte 漢字の庭 stylisé (pas d'asset
// logo) ; connecté → « presse START » vers la carte (position sauvée) ou
// l'onboarding (nouveau compte) ; non connecté → bouton de connexion Google
// à la place de l'invite (seul « Google », nom de marque, reste en latin).

import { auth, signIn } from '@/lib/auth'
import { sql } from '@/lib/db'
import { isOnboarded, startDestination } from '@/lib/onboarding'
import uiStrings from '@/data/ui-strings.json'
import StartPrompt from './StartPrompt'

export default async function TitlePage() {
  const session = await auth()

  let destination: string | null = null
  if (session?.user) {
    const [row] = await sql`select trainer_name, avatar from users where id = ${session.user.id}`
    destination = startDestination(isOnboarded(row))
  }

  return (
    <main className="font-chrome min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white overflow-hidden">
      <h1
        className="text-6xl sm:text-7xl tracking-widest text-amber-300 select-none"
        style={{ textShadow: '4px 4px 0 #7c2d12, 8px 8px 0 rgba(0,0,0,0.6)' }}
      >
        漢字の庭
      </h1>
      {destination ? (
        <StartPrompt destination={destination} />
      ) : (
        <form
          className="mt-16"
          action={async () => {
            'use server'
            await signIn('google')
          }}
        >
          <button
            type="submit"
            className="px-8 py-3 border-2 border-gray-500 rounded-lg bg-gray-900 hover:border-amber-300 text-lg"
          >
            {uiStrings.sign_in_google.jp}
          </button>
        </form>
      )}
    </main>
  )
}
