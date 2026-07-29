// Onboarding nouveau compte (issue 04) : avatar → nom → spawn chambre.
// Un compte déjà onboardé ne repasse jamais par ici (redirigé vers la
// carte) ; un visiteur non connecté retourne à l'écran-titre.

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { isOnboarded } from '@/lib/onboarding'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user) redirect('/')

  const [row] = await sql`select trainer_name, avatar from users where id = ${session.user.id}`
  if (isOnboarded(row)) redirect('/map')

  return <OnboardingClient />
}
