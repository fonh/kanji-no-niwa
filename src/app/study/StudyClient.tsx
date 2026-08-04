'use client'

// Session SRS quotidienne (issue 06) — refonte du prototype.
//
// Esthétique Centre Pokémon (habillage simple : chaleur crème, accents
// rouges, identité DS existante). Carte affichée → Révéler → 4 notes FSRS
// (Encore/Difficile/Bien/Facile) ; le kanji en grand en `.font-reading`,
// facette sens vs lecture distinguées (badge + réponse). La notation est
// re-calculée serveur (actions.ts) — le client n'envoie que (carte, note,
// fuseau).
//
// Préface Carte Mot (engine-contract § 8) : la toute première review d'un
// mot affiche d'abord sa Carte Mot, 1 tap, une seule fois — dérivée de
// l'absence de review pour ce mot (serveur) et des notes de la session en
// cours (client). Inactif au jalon 1 (aucune carte word), prévu et testé.
//
// Aucun français visible joueur (chaînes système : ui-strings.json) ;
// l'anglais des meanings/mnémoniques est pédagogique.

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { rateCard, checkDailyStatus, continueSession, type SrsRating } from './actions'
import type { DailyStatusResult } from '@/lib/daily-srs'
import uiStrings from '@/data/ui-strings.json'
import { useAudioManager } from '@/lib/audio-manager'
import { CONTEXT_TRACKS } from '@/lib/audio-tracks'

export interface SessionKanjiData {
  keyword: string | null
  meanings: string[]
  on_readings: string[]
  kun_readings: string[]
  mnemonic: string | null
}

export interface SessionWordData {
  word: string
  reading: string
  meanings: string[]
}

export interface SessionCard {
  id: string
  item_type: 'kanji' | 'word'
  item_id: string
  facet: 'sens' | 'lecture'
  kanji: SessionKanjiData | null
  word: SessionWordData | null
  /** Aucune review serveur pour ce mot → Carte Mot d'abord (contrat § 8). */
  needs_preface: boolean
}

interface Props {
  cards: SessionCard[]
  /** Cartes déjà notées ce jour local (reprise de session, plafond). */
  reviewedToday: number
}

const RATINGS: { label: string; rating: SrsRating; style: string }[] = [
  { label: uiStrings.srs_rate_again.jp, rating: 1, style: 'bg-red-700 active:bg-red-600' },
  { label: uiStrings.srs_rate_hard.jp, rating: 2, style: 'bg-orange-600 active:bg-orange-500' },
  { label: uiStrings.srs_rate_good.jp, rating: 3, style: 'bg-emerald-700 active:bg-emerald-600' },
  { label: uiStrings.srs_rate_easy.jp, rating: 4, style: 'bg-sky-700 active:bg-sky-600' },
]

/** Lecture kun affichée : ひと.つ → ひと（つ）, tirets d'okurigana retirés. */
function formatKun(kun: string): string {
  const cleaned = kun.replace(/-/g, '')
  const dot = cleaned.indexOf('.')
  return dot === -1 ? cleaned : `${cleaned.slice(0, dot)}（${cleaned.slice(dot + 1)}）`
}

export default function StudyClient({ cards, reviewedToday }: Props) {
  const router = useRouter()
  // M3 (revue jalon 1) : la file vit en state — elle peut être RECHARGÉE en
  // cours de session (continueSession) quand une carte もういちど redevient
  // due le jour même. La fin de session n'est plus « file locale épuisée »
  // mais « le statut serveur dit sessionDone » (retourné par chaque rateCard).
  const [queue, setQueue] = useState(cards)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [ratedCount, setRatedCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [serverStatus, setServerStatus] = useState<DailyStatusResult | null>(null)
  // Mots notés pendant CETTE session : leur 2e facette ne re-préface pas
  const [ratedItems, setRatedItems] = useState<Set<string>>(new Set())
  const [prefaceDismissed, setPrefaceDismissed] = useState(false)

  const current = index < queue.length ? queue[index] : null

  // File vide au chargement : le ✓ « aucune carte due » se pose côté
  // serveur même en arrivant ici directement (l'appel du mentor le fait
  // déjà depuis la carte — filet idempotent).
  useEffect(() => {
    if (cards.length === 0) {
      checkDailyStatus(new Date().getTimezoneOffset())
        .then(setServerStatus)
        .catch(() => {})
    }
  }, [cards.length])

  // Thème Centre Pokémon (PRD § Audio, contexte "Session SRS") — posé sur la
  // même couche 'zone' que la carte : StudyClient est une route à part
  // (MapClient n'est pas monté en même temps), aucun conflit de couche.
  const { setBgmLayer } = useAudioManager()
  useEffect(() => {
    setBgmLayer('zone', { url: CONTEXT_TRACKS.pokemonCenter, loop: true })
    return () => setBgmLayer('zone', null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRate = useCallback(
    async (rating: SrsRating) => {
      if (!current || saving) return
      setSaving(true)
      try {
        const status = await rateCard(current.id, rating, new Date().getTimezoneOffset())
        setServerStatus(status)
        setRatedItems(prev => new Set(prev).add(current.item_id))
        setRatedCount(c => c + 1)
        setRevealed(false)
        setPrefaceDismissed(false)
        setIndex(i => i + 1)
      } catch (err) {
        console.error('Failed to rate card', err)
      } finally {
        setSaving(false)
      }
    },
    [current, saving]
  )

  // M3 : recharge la file du jour (cartes redevenues dues — Encore) et repart
  // du début de la nouvelle file. Le statut retourné fait foi : s'il dit
  // sessionDone (✓ posé entre-temps), l'écran de fin s'affiche directement.
  const handleContinue = useCallback(async () => {
    if (saving) return
    setSaving(true)
    try {
      const { cards: fresh, status } = await continueSession(new Date().getTimezoneOffset())
      setServerStatus(status)
      setQueue(fresh)
      setIndex(0)
      setRevealed(false)
      setPrefaceDismissed(false)
    } catch (err) {
      console.error('Failed to reload session queue', err)
    } finally {
      setSaving(false)
    }
  }, [saving])

  // ── Fin de file locale ─────────────────────────────────────────────────────
  if (!current) {
    // Le serveur dit « pas fini » (cartes redevenues dues pendant la session,
    // ex. もういちど) : proposer de continuer — jamais un faux « おわり ».
    if (serverStatus !== null && !serverStatus.sessionDone) {
      return (
        <main className="center-chrome min-h-screen flex flex-col items-center justify-center px-4 font-chrome">
          <div className="center-panel w-full max-w-md p-6 text-center">
            <div className="center-accent text-5xl mb-4">！</div>
            <p className="font-reading text-lg mb-6">{uiStrings.srs_more_due.jp}</p>
            <button
              onClick={handleContinue}
              disabled={saving}
              className="center-accent-bg px-6 py-3 rounded-lg text-white font-semibold w-full disabled:opacity-60"
            >
              {uiStrings.srs_continue.jp}
            </button>
          </div>
        </main>
      )
    }

    // ✓ : file du jour vide (ou plafond) — confirmé par le statut serveur
    // quand il existe ; l'arrivée directe sur une file vide passe par le
    // checkDailyStatus ci-dessus (filet idempotent, même règle).
    const anyReviewed = reviewedToday + ratedCount > 0
    return (
      <main className="center-chrome min-h-screen flex flex-col items-center justify-center px-4 font-chrome">
        <div className="center-panel w-full max-w-md p-6 text-center">
          <div className="center-accent text-5xl mb-4">✓</div>
          <p className="font-reading text-lg mb-6">
            {anyReviewed ? uiStrings.srs_session_done.jp : uiStrings.srs_no_cards.jp}
          </p>
          <button
            onClick={() => router.push('/map')}
            className="center-accent-bg px-6 py-3 rounded-lg text-white font-semibold"
          >
            {uiStrings.back_to_map.jp}
          </button>
        </div>
      </main>
    )
  }

  // ── Préface Carte Mot ──────────────────────────────────────────────────────
  const showPreface =
    current.item_type === 'word' &&
    current.needs_preface &&
    !ratedItems.has(current.item_id) &&
    !prefaceDismissed

  if (showPreface && current.word) {
    return (
      <main className="center-chrome min-h-screen flex flex-col items-center justify-center px-4 font-chrome">
        <div className="center-panel w-full max-w-md p-6 text-center">
          <p className="center-accent text-sm mb-4">{uiStrings.srs_word_preface.jp}</p>
          <div className="font-reading text-6xl mb-3">{current.word.word}</div>
          <div className="font-reading center-accent text-xl mb-2">{current.word.reading}</div>
          <p className="text-sm mb-6">{current.word.meanings.join(', ')}</p>
          <button
            onClick={() => setPrefaceDismissed(true)}
            className="center-accent-bg px-6 py-3 rounded-lg text-white font-semibold w-full"
          >
            {uiStrings.srs_word_preface_continue.jp}
          </button>
        </div>
      </main>
    )
  }

  // ── Carte courante ─────────────────────────────────────────────────────────
  const facetLabel =
    current.facet === 'sens' ? uiStrings.srs_facet_sens.jp : uiStrings.srs_facet_lecture.jp
  const prompt =
    current.facet === 'sens' ? uiStrings.srs_prompt_sens.jp : uiStrings.srs_prompt_lecture.jp
  const character = current.item_type === 'kanji' ? current.item_id : (current.word?.word ?? '')

  return (
    <main className="center-chrome min-h-screen flex flex-col font-chrome">
      {/* Barre Centre Pokémon : progression du jour */}
      <div className="center-accent-bg text-white px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-bold">＋</span>
        <div className="flex-1 mx-3 h-2 rounded bg-white/30 overflow-hidden">
          <div
            className="h-2 bg-white/90 transition-all duration-300"
            style={{ width: `${Math.round((index / queue.length) * 100)}%` }}
          />
        </div>
        <span className="text-xs font-mono">
          {index}/{queue.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="center-panel w-full max-w-md p-6 text-center">
          <span
            className={`inline-block text-xs px-2 py-0.5 rounded-full border mb-4 ${
              current.facet === 'sens'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50'
                : 'border-red-700 center-accent bg-red-50'
            }`}
          >
            {facetLabel}
          </span>
          <div data-testid="srs-character" className="font-reading text-8xl leading-tight mb-4">
            {character}
          </div>
          <p className="font-reading text-base mb-4">{prompt}</p>

          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="w-full py-3 rounded-lg border-2 border-current center-accent font-semibold"
            >
              {uiStrings.srs_reveal.jp}
            </button>
          ) : (
            <>
              <div data-testid="srs-answer" className="mb-4">
                {current.item_type === 'kanji' && current.kanji ? (
                  current.facet === 'sens' ? (
                    <>
                      <p className="text-2xl font-bold mb-1">
                        {current.kanji.keyword ?? current.kanji.meanings[0] ?? ''}
                      </p>
                      <p className="text-sm opacity-70">{current.kanji.meanings.join(', ')}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-reading center-accent text-2xl mb-1">
                        {current.kanji.on_readings.join('・')}
                      </p>
                      <p className="font-reading text-lg">
                        {current.kanji.kun_readings.map(formatKun).join('・')}
                      </p>
                    </>
                  )
                ) : current.word ? (
                  current.facet === 'sens' ? (
                    <p className="text-2xl font-bold">{current.word.meanings.join(', ')}</p>
                  ) : (
                    <p className="font-reading center-accent text-2xl">{current.word.reading}</p>
                  )
                ) : null}
              </div>
              {current.item_type === 'kanji' && current.kanji?.mnemonic && (
                <p className="text-xs opacity-60 mb-4">{current.kanji.mnemonic}</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {RATINGS.map(({ label, rating, style }) => (
                  <button
                    key={rating}
                    onClick={() => handleRate(rating)}
                    disabled={saving}
                    className={`py-3 rounded-lg text-white font-semibold ${style} disabled:opacity-60`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
