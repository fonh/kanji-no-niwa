'use client'

// Boucle quotidienne sur la carte (issue 06) : appel du mentor au premier
// lancement du jour + icône Pokégear avec badge (✓ du jour / rappel), et
// l'entrée téléphone minimale (ポケギア → でんわ → Elm) pour relancer la
// session après un refus. Composant dédié monté par la page carte —
// MapClient n'est pas modifié (l'overlay avale les touches en phase capture
// pour que le D-pad clavier ne traverse pas).
//
// PRD § Boucle Quotidienne : premier lancement du jour → le mentor appelle
// (sprite, « tes révisions t'attendent ») → lancer ou refuser ; lancements
// suivants du même jour silencieux (rappel via Pokégear) ; aucune carte due
// → appel court, ✓ immédiat (le ✓ serveur est posé par checkDailyStatus).
// Le « premier lancement du jour » est un état d'affichage local à
// l'appareil (localStorage par jour local) ; le ✓, lui, vit côté serveur
// (daily_status).
//
// Aucun dialogue d'appel matinal d'Elm n'existe dans content/dialogues/
// (calls/ n'a que joey_route30) : les lignes viennent de ui-strings.json —
// contenu manquant noté à l'issue.

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkDailyStatus } from '@/app/study/actions'
import type { DailyStatusResult } from '@/lib/daily-srs'
import uiStrings from '@/data/ui-strings.json'

export const MENTOR_CALL_SEEN_KEY = 'mentor-call-seen-day'

const ELM_SPRITE_URL = '/sprites/characters/npc_prof_elm_ow.png'
const SPRITE_FRAME = 32

/** Jour calendaire local de l'appareil (l'affichage suit l'horloge du
 * téléphone ; les écritures, elles, sont horodatées serveur). */
function clientDayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

type View = null | 'call' | 'gear' | 'contacts'

export default function DailyLoop({ now = () => new Date() }: { now?: () => Date }) {
  const router = useRouter()
  const [status, setStatus] = useState<DailyStatusResult | null>(null)
  const [view, setView] = useState<View>(null)

  // Premier lancement du jour → l'appel ; ensuite silencieux. Le ✓ du chemin
  // « aucune carte due » est posé serveur par checkDailyStatus (idempotent).
  useEffect(() => {
    const tz = now().getTimezoneOffset()
    checkDailyStatus(tz)
      .then(result => {
        setStatus(result)
        const today = clientDayKey(now())
        if (window.localStorage.getItem(MENTOR_CALL_SEEN_KEY) !== today) {
          window.localStorage.setItem(MENTOR_CALL_SEEN_KEY, today)
          setView('call')
        }
      })
      .catch(err => console.error('Failed to check daily status', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pendant un overlay, aucune touche ne doit traverser vers MapClient
  // (D-pad clavier) — phase capture sur window, avant son écouteur bubble.
  useEffect(() => {
    if (view === null) return
    const swallow = (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.code === 'Escape') setView(null)
    }
    window.addEventListener('keydown', swallow, { capture: true })
    return () => window.removeEventListener('keydown', swallow, { capture: true })
  }, [view])

  const startSession = useCallback(() => {
    router.push(`/study?tz=${now().getTimezoneOffset()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const sessionDone = status?.sessionDone ?? false

  return (
    <>
      {/* Icône Pokégear + badge : ✓ du jour (acquis jusqu'à la bascule) ou
          rappel si la session n'est pas faite. z-76/78/79 : au-dessus des
          contrôles carte (70), SOUS l'overlay de combat (80) — l'appel du
          mentor ne recouvre jamais un combat engagé (écart noté issue 07,
          soldé ici). */}
      <div className="fixed top-3 right-3 z-[76] font-chrome" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setView(v => (v === null ? 'gear' : null))}
          className="relative bg-black/70 border border-white/30 rounded-lg px-3 py-2 text-white/90 text-xs font-bold"
        >
          📟 {uiStrings.pokegear.jp}
          {status && (
            <span
              data-testid="pokegear-badge"
              className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[11px] border ${
                sessionDone
                  ? 'bg-emerald-500 border-emerald-700 text-white'
                  : 'bg-red-500 border-red-700 text-white'
              }`}
            >
              {sessionDone ? '✓' : '！'}
            </span>
          )}
        </button>
      </div>

      {/* Menu Pokégear minimal → でんわ → le mentor (le Pokégear complet
          attendra) */}
      {(view === 'gear' || view === 'contacts') && (
        <div
          className="fixed inset-0 z-[78] flex items-center justify-center bg-black/50 font-chrome"
          onClick={() => setView(null)}
        >
          <div
            className="w-64 bg-gray-900 border-2 border-white rounded-lg p-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-white/60 text-xs mb-2">
              {view === 'gear' ? uiStrings.pokegear.jp : uiStrings.phone.jp}
            </div>
            {view === 'gear' ? (
              <button
                onClick={() => setView('contacts')}
                className="w-full text-left px-3 py-2.5 text-sm text-white/90 hover:bg-white/10 rounded"
              >
                {uiStrings.phone.jp}
              </button>
            ) : (
              <button
                onClick={() => setView('call')}
                className="w-full text-left px-3 py-2.5 text-sm text-white/90 hover:bg-white/10 rounded"
              >
                {uiStrings.mentor_name_elm.jp}
              </button>
            )}
            <button
              onClick={() => setView(null)}
              className="w-full text-left px-3 py-2 mt-1 text-xs text-white/50 hover:text-white/80"
            >
              {uiStrings.back.jp}
            </button>
          </div>
        </div>
      )}

      {/* L'appel du mentor — sprite d'Elm + invite (ou appel court si tout
          est en ordre) */}
      {view === 'call' && (
        <div className="fixed inset-0 z-[79] flex items-end justify-center bg-black/40 font-chrome pb-6 px-3">
          <div className="dialogue-frame w-full max-w-xl text-gray-900">
            <div className="flex items-center gap-3 p-2">
              <div
                data-testid="mentor-sprite"
                style={{
                  width: SPRITE_FRAME,
                  height: SPRITE_FRAME,
                  backgroundImage: `url(${ELM_SPRITE_URL})`,
                  backgroundPosition: '0 0',
                  backgroundRepeat: 'no-repeat',
                  imageRendering: 'pixelated',
                  transform: 'scale(1.6)',
                  transformOrigin: 'center',
                  flex: 'none',
                }}
              />
              <div className="min-w-0">
                <div className="text-xs font-bold opacity-70">{uiStrings.mentor_name_elm.jp}</div>
                <p className="font-reading text-base">
                  {sessionDone
                    ? uiStrings.mentor_call_all_clear.jp
                    : uiStrings.mentor_call_invite.jp}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-2 pt-0">
              {sessionDone ? (
                <button
                  onClick={() => setView(null)}
                  className="px-4 py-2 rounded bg-gray-800 text-white text-sm font-semibold"
                >
                  {uiStrings.mentor_call_ok.jp}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setView(null)}
                    className="px-4 py-2 rounded border border-gray-500 text-sm"
                  >
                    {uiStrings.mentor_call_later.jp}
                  </button>
                  <button
                    onClick={startSession}
                    className="px-4 py-2 rounded bg-red-700 text-white text-sm font-semibold"
                  >
                    {uiStrings.mentor_call_start.jp}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
