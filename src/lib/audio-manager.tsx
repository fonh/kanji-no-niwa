'use client'

// Provider React de la musique/SFX (issue audio jalon 1) — monté une seule
// fois à la racine (src/app/layout.tsx) pour que la BGM survive la
// navigation client (StudyClient/BookScreen sont des routes différentes de
// MapClient ; un Provider par page recréerait l'élément <audio> et
// couperait le son à chaque changement d'écran).
//
// Modèle de couches (pas une simple pile) : deux clés fixes, 'battle' prend
// toujours le pas sur 'zone' quand les deux sont posées — MapClient reste
// monté PENDANT un combat (BattleScreen est un overlay dans son arbre), donc
// poser/retirer la couche 'battle' au montage/démontage de BattleScreen
// restaure automatiquement la musique de zone en dessous, sans que
// MapClient n'ait besoin de rien savoir du combat. StudyClient/BookScreen
// sont des pages à part (pas de MapClient monté en même temps) : elles
// utilisent la même clé 'zone' que la carte, aucun conflit possible.
//
// Politique autoplay navigateur (standard) : play() avant tout geste
// utilisateur est rejeté (promesse rejetée, jamais une exception synchrone)
// — on retente au premier pointerdown/keydown global.
//
// Best-effort partout, comme BookScreen.playAudio() : un fichier manquant ou
// un lecteur indisponible (jsdom des tests, navigateur qui refuse) ne doit
// jamais faire planter l'app, seulement rester silencieux.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from 'react'
import { readMutePreference, writeMutePreference } from './audio-tracks'
import { VOLUME_GAIN } from './settings'
import { useSettings } from './use-settings'

// Store externe minimal pour la préférence muet (bug hydratation corrigé
// ici — voir le commentaire détaillé sur son usage plus bas) : un seul
// abonné possible en pratique (le Provider est monté une seule fois à la
// racine), mais useSyncExternalStore exige la forme subscribe/getSnapshot
// même pour un store à un seul lecteur.
type MuteListener = () => void
let muteListeners: MuteListener[] = []
function subscribeMute(listener: MuteListener): () => void {
  muteListeners = [...muteListeners, listener]
  return () => {
    muteListeners = muteListeners.filter(l => l !== listener)
  }
}
function notifyMuteListeners(): void {
  muteListeners.forEach(l => l())
}
function getMutedSnapshot(): boolean {
  return readMutePreference(window.localStorage)
}
function getMutedServerSnapshot(): boolean {
  return false
}

export type BgmLayerKey = 'zone' | 'battle'

export interface BgmTrack {
  url: string
  loop?: boolean
}

interface AudioManagerValue {
  muted: boolean
  toggleMute: () => void
  /** Pose ou retire (track: null) la piste d'une couche. La couche 'battle'
   * gagne toujours sur 'zone' tant qu'elle est posée. */
  setBgmLayer: (key: BgmLayerKey, track: BgmTrack | null) => void
  /** SFX ponctuel (menu confirm, jingle victoire...) — jamais bloquant. */
  playSfx: (url: string) => void
}

const noop = () => {}

// Valeur par défaut = no-op : les composants qui appellent useAudioManager()
// sans Provider monté (tests unitaires de MapClient/BattleScreen/etc, qui ne
// montent que le composant testé) ne créent jamais de véritable <audio> ni
// ne plantent — comportement volontaire, pas un oubli.
const AudioManagerContext = createContext<AudioManagerValue>({
  muted: false,
  toggleMute: noop,
  setBgmLayer: noop,
  playSfx: noop,
})

export function useAudioManager(): AudioManagerValue {
  return useContext(AudioManagerContext)
}

const LAYER_PRIORITY: BgmLayerKey[] = ['battle', 'zone']

export function AudioManagerProvider({ children }: { children: React.ReactNode }) {
  // useSyncExternalStore, pas useState (bug réel corrigé ici — hydration
  // mismatch signalé en jeu, aria-label="mute" côté serveur contre
  // "unmute" côté client) : un lazy useState init qui lit
  // window.localStorage tournait DÈS le premier rendu CLIENT (l'hydratation
  // elle-même) — un joueur ayant déjà coupé le son lors d'une session
  // précédente obtenait `muted=true` au premier rendu client contre `false`
  // côté serveur (jamais accès à localStorage), React détectait le mismatch
  // et regénérait l'arbre. useSyncExternalStore gère ce cas nativement :
  // React utilise `getMutedServerSnapshot` (toujours `false`) pour le tout
  // premier rendu client aussi (accord garanti avec le HTML serveur), puis
  // re-rend avec la vraie valeur juste après. Évite aussi le correctif
  // « setState dans un effect » (interdit par le lint react-hooks de ce
  // projet, cascading renders) : toggleMute écrit directement dans
  // localStorage puis notifie les abonnés, pas de setState.
  const muted = useSyncExternalStore(subscribeMute, getMutedSnapshot, getMutedServerSnapshot)
  // Volumes de l'écran せってい. Le bouton muet reste au-dessus : c'est la
  // coupure d'urgence (« je suis dans le train »), pas un réglage.
  const settings = useSettings()
  const bgmGain = VOLUME_GAIN[settings.bgmVolume]
  const sfxGain = VOLUME_GAIN[settings.sfxVolume]
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const layersRef = useRef<Partial<Record<BgmLayerKey, BgmTrack | null>>>({})
  const activeUrlRef = useRef<string | null>(null)
  const pendingPlayRef = useRef(false)

  // useLayoutEffect, PAS useEffect (bug réel corrigé ici) : les effects
  // passifs (useEffect) de TOUT l'arbre s'exécutent après les effects de
  // layout de TOUT l'arbre dans un même commit — alors que deux useEffect
  // s'exécutent enfant-avant-parent. Au premier chargement de /map, l'effect
  // (useEffect) de MapClient (setBgmLayer sur zone.name) tournait donc AVANT
  // celui-ci, trouvait audioElRef.current === null, et applyActiveLayer()
  // abandonnait silencieusement (`if (!el) return`) sans jamais être rappelé
  // ensuite : aucune musique tant que le joueur ne changeait pas de zone.
  // useLayoutEffect garantit que l'élément existe avant que le premier
  // useEffect d'un enfant (MapClient, StudyClient, BookScreen...) ne tourne,
  // quel que soit l'ordre de montage.
  useLayoutEffect(() => {
    if (audioElRef.current !== null) return
    const el = new Audio()
    el.preload = 'auto'
    audioElRef.current = el
  }, [])

  useEffect(() => {
    const el = audioElRef.current
    if (!el) return

    const retry = () => {
      if (!pendingPlayRef.current) return
      el.play()
        .then(() => {
          pendingPlayRef.current = false
        })
        .catch(() => {
          /* toujours pas de geste exploitable — on retentera au prochain */
        })
    }
    window.addEventListener('pointerdown', retry)
    window.addEventListener('keydown', retry)
    return () => {
      window.removeEventListener('pointerdown', retry)
      window.removeEventListener('keydown', retry)
      el.pause()
    }
  }, [])

  useEffect(() => {
    const el = audioElRef.current
    if (!el) return
    el.muted = muted
    el.volume = bgmGain
  }, [muted, bgmGain])

  // Le volume est lu par une ref dans applyActiveLayer : le rebrancher en
  // dépendance recréerait le callback à chaque changement de volume, donc
  // relancerait la piste en cours. Écriture dans un effect, pas pendant le
  // rendu (react-hooks/refs) — l'effect de volume plus haut applique de toute
  // façon la nouvelle valeur à la piste déjà en cours.
  const bgmGainRef = useRef(bgmGain)
  useEffect(() => {
    bgmGainRef.current = bgmGain
  }, [bgmGain])

  const applyActiveLayer = useCallback(() => {
    const el = audioElRef.current
    if (!el) return
    const layers = layersRef.current
    const active = LAYER_PRIORITY.map(k => layers[k]).find((t): t is BgmTrack => !!t) ?? null

    if (!active) {
      activeUrlRef.current = null
      pendingPlayRef.current = false
      el.pause()
      return
    }
    if (active.url === activeUrlRef.current) return // déjà la piste active

    activeUrlRef.current = active.url
    try {
      el.src = active.url
      el.volume = bgmGainRef.current
      el.loop = active.loop ?? true
      pendingPlayRef.current = true
      el.play()
        .then(() => {
          pendingPlayRef.current = false
        })
        .catch(() => {
          /* bloqué par la politique autoplay : retry au prochain geste */
        })
    } catch {
      /* lecteur indisponible (jsdom, navigateur exotique) : silence */
    }
  }, [])

  const setBgmLayer = useCallback(
    (key: BgmLayerKey, track: BgmTrack | null) => {
      layersRef.current = { ...layersRef.current, [key]: track }
      applyActiveLayer()
    },
    [applyActiveLayer]
  )

  const toggleMute = useCallback(() => {
    writeMutePreference(window.localStorage, !getMutedSnapshot())
    notifyMuteListeners()
  }, [])

  const playSfx = useCallback(
    (url: string) => {
      if (muted || sfxGain === 0) return
      try {
        const el = new Audio(url)
        el.volume = sfxGain
        void el.play()?.catch(() => {})
      } catch {
        /* best-effort, même filet que BookScreen.playAudio */
      }
    },
    [muted, sfxGain]
  )

  return (
    <AudioManagerContext.Provider value={{ muted, toggleMute, setBgmLayer, playSfx }}>
      {children}
    </AudioManagerContext.Provider>
  )
}

/** Bouton muet/son unique (PRD scope MVP : pas de mixer, pas de sliders) —
 * même langage visuel que les clusters X/Y/B de MapClient/BookScreen. */
export function MuteToggleButton({ className = '' }: { className?: string }) {
  const { muted, toggleMute } = useAudioManager()
  return (
    <button
      aria-label={muted ? 'unmute' : 'mute'}
      onClick={e => {
        e.stopPropagation()
        toggleMute()
      }}
      className={`w-9 h-9 rounded-full border text-xs font-bold ${
        muted
          ? 'bg-white/10 border-white/25 text-white/50'
          : 'bg-amber-400/90 border-amber-600 text-black'
      } ${className}`}
    >
      {muted ? '🔇' : '♪'}
    </button>
  )
}
