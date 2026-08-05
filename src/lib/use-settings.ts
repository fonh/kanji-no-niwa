'use client'

import { useSyncExternalStore } from 'react'
import {
  getSettingsSnapshot,
  getSettingsServerSnapshot,
  subscribeSettings,
  type GameSettings,
} from './settings'

/** Réglages joueur, resynchronisés à chaque changement.
 *
 * `useSyncExternalStore` et pas `useState(() => readSettings(...))` : le
 * serveur rend forcément les valeurs par défaut, alors le premier rendu client
 * doit lui aussi rendre les valeurs par défaut, sinon React signale une erreur
 * d'hydratation (déjà rencontrée sur le bouton muet, issue 13). */
export function useSettings(): GameSettings {
  return useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getSettingsServerSnapshot
  )
}
