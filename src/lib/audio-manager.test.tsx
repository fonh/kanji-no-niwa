// Régression : la BGM ne se lançait jamais au premier chargement (signalé en
// jeu par l'utilisateur). Cause : l'élément <audio> était créé dans un
// useEffect du Provider, mais les useEffect (passifs) d'un enfant profond
// (MapClient) s'exécutent AVANT celui d'un Provider ancestral dans le même
// commit — setBgmLayer('zone', …) tournait donc contre un audioElRef encore
// null et abandonnait silencieusement, sans jamais être rappelé (rien ne
// redéclenche applyActiveLayer tant que zone.name ne change pas). Corrigé en
// déplaçant la création dans un useLayoutEffect (tous les layout effects de
// l'arbre s'exécutent avant tous les effects passifs, quel que soit l'ordre
// parent/enfant). Ce test reproduit exactement la forme du bug : un enfant
// qui pose une couche BGM dans un useEffect ordinaire, dès le premier rendu.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { AudioManagerProvider, useAudioManager, MuteToggleButton } from './audio-manager'
import { writeMutePreference } from './audio-tracks'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// Node ≥22 expose un localStorage expérimental désactivé (--localstorage-file
// absent) qui masque celui de jsdom : on installe un fake en mémoire (même
// filet que src/app/map/DailyLoop.test.tsx).
const lsStore = new Map<string, string>()
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => lsStore.get(k) ?? null,
    setItem: (k: string, v: string) => void lsStore.set(k, String(v)),
    removeItem: (k: string) => void lsStore.delete(k),
    clear: () => lsStore.clear(),
  },
})

let container: HTMLDivElement
let root: Root
let playSpy: ReturnType<typeof vi.fn<() => Promise<void>>>

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  // jsdom : HTMLMediaElement.play()/pause() ne sont pas implémentés.
  playSpy = vi.fn<() => Promise<void>>(() => Promise.resolve())
  window.HTMLMediaElement.prototype.play = playSpy
  window.HTMLMediaElement.prototype.pause = vi.fn()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function ZoneLikeChild({ url }: { url: string }) {
  const { setBgmLayer } = useAudioManager()
  useEffect(() => {
    setBgmLayer('zone', { url, loop: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])
  return null
}

describe('AudioManagerProvider — ordre de montage', () => {
  it("un enfant qui pose une couche BGM dans son propre useEffect au tout premier rendu déclenche bien play()", () => {
    act(() => {
      root.render(
        <AudioManagerProvider>
          <ZoneLikeChild url="/audio/bgm/new-bark-town.mp3" />
        </AudioManagerProvider>
      )
    })

    expect(playSpy).toHaveBeenCalledTimes(1)
  })
})

// Régression : « Hydration failed » signalé en jeu — aria-label="mute" côté
// serveur contre "unmute" côté client. Cause : le useState du muet lisait
// window.localStorage dans son initialiseur paresseux, exécuté DÈS le tout
// premier rendu (l'hydratation elle-même, pas seulement un effect ultérieur)
// — un joueur ayant déjà coupé le son lors d'une session précédente obtenait
// donc `true` au premier rendu CLIENT contre `false` côté SERVEUR (jamais
// accès à localStorage). Corrigé : `false` toujours au premier rendu (des
// deux côtés), resynchronisé depuis localStorage dans un effect qui ne
// tourne qu'après l'hydratation.
describe('AudioManagerProvider — préférence muet et hydratation', () => {
  it('une préférence muet déjà enregistrée finit par s’appliquer après montage (resynchronisation post-hydratation)', () => {
    writeMutePreference(window.localStorage, true)

    act(() => {
      root.render(
        <AudioManagerProvider>
          <MuteToggleButton />
        </AudioManagerProvider>
      )
    })

    // La vraie préférence (coupé) doit s'appliquer une fois montée — si un
    // futur changement supprime l'effect de resynchronisation et revient à
    // un lazy init direct dans useState, ce test reste vert (le mismatch
    // d'hydratation, lui, ne se voit que côté SSR réel) mais au moins la
    // régression fonctionnelle (préférence jamais respectée) serait captée.
    const button = container.querySelector('button')!
    expect(button.getAttribute('aria-label')).toBe('unmute')
  })
})
