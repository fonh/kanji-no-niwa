'use client'

// Menu START (issue 09) — overlay monté par la page carte, MapClient intact
// (même patron que DailyLoop : le bouton START/SELECT vit ICI, centre bas,
// discret — PRD § Interface ; l'overlay avale les touches en phase capture
// pour que le D-pad clavier de MapClient ne traverse pas).
//
// Navigation (PRD § Navigation des surfaces) :
//  - START ouvre ; re-appui START = fermeture DIRECTE, où qu'on soit ;
//  - B (Escape/Backspace) = retour d'UN niveau (écran → racine → fermé) ;
//  - D-pad + A naviguent la grille de slots ; SELECT est inerte avant la
//    remise du Pokégear (le Pokégear complet est hors jalon — l'icône de
//    l'issue 06 en haut à droite reste telle quelle) ;
//  - menu OUVERT, la touche M vaut START (fermeture directe — commodité
//    dev). L'ouverture est tactile uniquement : aucun écouteur global menu
//    fermé, donc rien ne peut s'ouvrir pendant un combat au clavier non
//    plus (PRD « en combat, rien ne s'ouvre » ; l'overlay de combat z-80
//    couvre déjà le bouton, qui vit à z-75).
//
// 6 slots, labels japonais HGSS VO (PRD § Menu Principal) ; プロフィール et
// せってい présents mais grisés (hors jalon). Les 4 écrans (図鑑・レッスン・
// バッグ・ぼうけんノート) partagent le MÊME composant de cadre (MenuFrame).
// Les données arrivent entièrement résolues du serveur (getStartMenuData) —
// le client ne lit jamais content/.

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import JpText from '@/components/JpText'
import uiStrings from '@/data/ui-strings.json'
import { getStartMenuData, type StartMenuData } from './actions'

export type StartMenuScreen = 'zukan' | 'lessons' | 'bag' | 'journal'

interface SlotDef {
  id: StartMenuScreen | 'profile' | 'settings'
  jp: string
  disabled: boolean
}

const SLOTS: SlotDef[] = [
  { id: 'zukan', jp: uiStrings.menu_slot_zukan.jp, disabled: false },
  { id: 'lessons', jp: uiStrings.menu_slot_lessons.jp, disabled: false },
  { id: 'bag', jp: uiStrings.menu_slot_bag.jp, disabled: false },
  { id: 'profile', jp: uiStrings.menu_slot_profile.jp, disabled: true },
  { id: 'journal', jp: uiStrings.menu_slot_journal.jp, disabled: false },
  { id: 'settings', jp: uiStrings.menu_slot_settings.jp, disabled: true },
]

interface Props {
  /** Écran à ouvrir directement au montage (retour de fiche : /map?menu=zukan). */
  initialScreen?: StartMenuScreen | null
}

// ── Cadre commun des écrans du menu ───────────────────────────────────────────
// LE composant de cadre partagé : titre jp, contenu scrollable, rappels de
// navigation (B = retour, START = fermeture) identiques sur tous les écrans.

function MenuFrame({
  title,
  testId,
  actions,
  children,
}: {
  title: string
  testId: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div data-testid={testId} className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between border-b border-white/20 px-3 py-2">
        <div className="text-white font-bold text-sm">{title}</div>
        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">{children}</div>
      <div className="border-t border-white/15 px-3 py-1.5 text-[10px] text-white/40 flex gap-3">
        <span>B　{uiStrings.back.jp}</span>
        <span>START　{uiStrings.menu_close.jp}</span>
      </div>
    </div>
  )
}

// ── Écrans ────────────────────────────────────────────────────────────────────

const JLPT_FILTERS = ['all', 'N5', 'N4', 'N3', 'N2', 'N1'] as const
type JlptFilter = (typeof JLPT_FILTERS)[number]

function KanjidexScreen({ data, onOpenKanji }: { data: StartMenuData; onOpenKanji: (id: string) => void }) {
  const [filter, setFilter] = useState<JlptFilter>('all')
  const { kanji, status } = data.kanjidex
  const visible = filter === 'all' ? kanji : kanji.filter(k => k.jlpt_level === filter)
  const counts = {
    unseen: kanji.filter(k => !status[k.id]).length,
    studied: kanji.filter(k => status[k.id] === 'studied').length,
    mastered: kanji.filter(k => status[k.id] === 'mastered').length,
  }
  return (
    <MenuFrame title={uiStrings.menu_slot_zukan.jp} testId="screen-zukan">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {JLPT_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-0.5 rounded-full text-xs border ${
              filter === f
                ? 'bg-amber-400 border-amber-500 text-gray-900 font-semibold'
                : 'bg-white/10 border-white/20 text-white/60'
            }`}
          >
            {f === 'all' ? uiStrings.menu_kanjidex_filter_all.jp : f}
          </button>
        ))}
      </div>
      <div className="text-[10px] text-white/50 mb-2 flex gap-3">
        <span>{uiStrings.menu_kanjidex_unseen.jp}　{counts.unseen}</span>
        <span>{uiStrings.menu_kanjidex_studied.jp}　{counts.studied}</span>
        <span>{uiStrings.menu_kanjidex_mastered.jp}　{counts.mastered}</span>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(2.4rem, 1fr))' }}>
        {visible.map(k => {
          const s = status[k.id]
          return (
            <button
              key={k.id}
              data-testid={`kanjidex-tile-${k.id}`}
              onClick={() => onOpenKanji(k.id)}
              className={`relative aspect-square flex items-center justify-center text-base rounded ${
                s === 'mastered'
                  ? 'bg-amber-300 text-amber-950'
                  : s === 'studied'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-gray-700 text-gray-400'
              }`}
            >
              {k.character}
              {/* Repère non-coloré en plus de la teinte dorée (accessibilité
                  daltonienne, PRD § Kanjidex) */}
              {s === 'mastered' && (
                <span className="absolute top-0 right-0.5 text-[8px] leading-none">★</span>
              )}
            </button>
          )
        })}
      </div>
    </MenuFrame>
  )
}

function LessonBookScreen({ data, onReread }: { data: StartMenuData; onReread: (zone: string, seq: number) => void }) {
  return (
    <MenuFrame title={uiStrings.menu_slot_lessons.jp} testId="screen-lessons">
      {data.lessonBook.map(chapter => (
        <div key={chapter.zone_id} className="mb-3">
          <div className="flex items-baseline justify-between border-b border-white/15 pb-1 mb-1.5">
            <div className="text-white/90 font-semibold text-sm">{chapter.zone_jp}</div>
            <div className="text-white/50 text-xs">
              {chapter.completed}/{chapter.total}
            </div>
          </div>
          {chapter.lines.map(line => {
            const key = `lesson-line-${chapter.zone_id}-${line.sequence_index}`
            if (line.status === 'completed') {
              return (
                <div key={key} data-testid={key} className="mb-1">
                  <button
                    onClick={() => onReread(chapter.zone_id, line.sequence_index)}
                    className="w-full text-left px-2 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white/90 text-sm flex items-center gap-2"
                  >
                    <span className="text-emerald-300">✓</span>
                    <span className="font-reading">{line.kanji_ids?.join('　')}</span>
                    <span className="ml-auto text-[10px] text-white/50">
                      {uiStrings.menu_lesson_reread.jp}
                    </span>
                  </button>
                </div>
              )
            }
            if (line.status === 'next') {
              // Qui-et-où seulement — jamais le contenu (pas de pré-teaching)
              return (
                <div
                  key={key}
                  data-testid={key}
                  className="mb-1 px-2 py-1.5 rounded border border-amber-300/40 text-sm text-amber-100/90"
                >
                  <span className="text-[10px] mr-2 text-amber-300">{uiStrings.menu_lesson_next.jp}</span>
                  {line.npc_jp}
                </div>
              )
            }
            if (line.status === 'locked') {
              // Le trou connu comblé : le PNJ est affiché, avec la MENTION
              // claire qu'il n'est pas encore prêt (≠ « prochaine leçon »)
              return (
                <div
                  key={key}
                  data-testid={key}
                  className="mb-1 px-2 py-1.5 rounded bg-white/5 text-sm text-white/45"
                >
                  <span className="mr-1.5">🔒</span>
                  {line.npc_jp}
                  <div className="text-[11px] text-white/40 mt-0.5">
                    {uiStrings.menu_lesson_locked.jp}
                  </div>
                </div>
              )
            }
            return (
              <div key={key} data-testid={key} className="mb-1 px-2 py-1.5 text-sm text-white/30">
                {uiStrings.menu_lesson_masked.jp}
              </div>
            )
          })}
        </div>
      ))}
    </MenuFrame>
  )
}

function QuestJournalScreen({ data }: { data: StartMenuData }) {
  const [showEn, setShowEn] = useState(false)
  const [showReadings, setShowReadings] = useState(false)
  return (
    <MenuFrame
      title={uiStrings.menu_slot_journal.jp}
      testId="screen-journal"
      actions={
        <>
          {/* Même pattern X/Y que la boîte de dialogue : jp d'office,
              X = traduction en, Y = lectures */}
          <button
            onClick={() => setShowEn(v => !v)}
            className={`w-7 h-7 rounded-full border text-xs font-bold ${
              showEn ? 'bg-white/30 border-white/50 text-white' : 'bg-white/10 border-white/25 text-white/70'
            }`}
          >
            X
          </button>
          <button
            onClick={() => setShowReadings(v => !v)}
            className={`w-7 h-7 rounded-full border text-xs font-bold ${
              showReadings ? 'bg-white/30 border-white/50 text-white' : 'bg-white/10 border-white/25 text-white/70'
            }`}
          >
            Y
          </button>
        </>
      }
    >
      {data.questJournal.length === 0 && (
        <div className="text-white/50 text-sm py-4 text-center">{uiStrings.menu_journal_empty.jp}</div>
      )}
      {data.questJournal.map(quest => (
        <div key={quest.quest_id} className="mb-3 px-2 py-2 rounded bg-white/5">
          <div className="text-white font-semibold text-sm">
            <JpText jp={quest.name.jp} showReadings={showReadings} className="font-reading" />
          </div>
          {showEn && <div className="text-white/50 text-xs italic">{quest.name.en}</div>}
          <div className="text-white/80 text-sm mt-1">
            <JpText jp={quest.step.jp} showReadings={showReadings} className="font-reading" />
          </div>
          {showEn && <div className="text-white/50 text-xs italic">{quest.step.en}</div>}
          {quest.target_zone_jp && (
            <div className="text-amber-200/80 text-xs mt-1">
              ◎ {uiStrings.menu_journal_target.jp}：{quest.target_zone_jp}
            </div>
          )}
        </div>
      ))}
    </MenuFrame>
  )
}

function BagScreen({ data, onOpenText }: { data: StartMenuData; onOpenText: (textId: string) => void }) {
  const [tab, setTab] = useState<'items' | 'reading'>('items')
  return (
    <MenuFrame
      title={uiStrings.menu_slot_bag.jp}
      testId="screen-bag"
      actions={
        <>
          <button
            onClick={() => setTab('items')}
            className={`px-2 py-1 rounded text-xs ${
              tab === 'items' ? 'bg-white/25 text-white' : 'bg-white/5 text-white/60'
            }`}
          >
            {uiStrings.menu_bag_tab_items.jp}
          </button>
          <button
            onClick={() => setTab('reading')}
            className={`px-2 py-1 rounded text-xs ${
              tab === 'reading' ? 'bg-white/25 text-white' : 'bg-white/5 text-white/60'
            }`}
          >
            {uiStrings.menu_bag_tab_reading.jp}
          </button>
        </>
      }
    >
      {tab === 'items' ? (
        <>
          {data.bag.length === 0 && (
            <div className="text-white/50 text-sm py-4 text-center">{uiStrings.menu_bag_empty.jp}</div>
          )}
          {data.bag.map(category => (
            <div key={category.id} className="mb-3">
              <div className="text-amber-200/80 text-xs font-semibold border-b border-white/15 pb-1 mb-1">
                {category.jp}
              </div>
              {category.items.map(item => (
                <div key={item.item_id} className="flex items-baseline px-2 py-1 text-sm text-white/90">
                  <span>{item.jp}</span>
                  {item.quantity > 1 && <span className="ml-auto text-white/50 text-xs">×{item.quantity}</span>}
                </div>
              ))}
            </div>
          ))}
        </>
      ) : (
        <>
          {data.readingJournal.map(text => {
            const key = `text-line-${text.text_id}`
            if (text.status === 'undiscovered') {
              const holderLabel =
                text.holder_kind === 'npc'
                  ? uiStrings.menu_reading_holder_npc.jp
                  : text.holder_kind === 'object'
                    ? uiStrings.menu_reading_holder_place.jp
                    : uiStrings.menu_reading_holder_unknown.jp
              return (
                <div key={key} data-testid={key} className="mb-1 px-2 py-1.5 rounded bg-white/5 text-sm text-white/35">
                  {text.title.jp}
                  <div className="text-[11px] text-white/30 mt-0.5">
                    {holderLabel}：{text.holder_jp ?? uiStrings.menu_reading_holder_unknown.jp}
                  </div>
                </div>
              )
            }
            const gold = text.status === 'gold'
            return (
              <div key={key} data-testid={key} className="mb-1">
                <button
                  onClick={() => onOpenText(text.text_id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 ${
                    gold
                      ? 'bg-amber-300/20 text-amber-200 hover:bg-amber-300/30'
                      : 'bg-white/10 text-white/90 hover:bg-white/20'
                  }`}
                >
                  <span className="font-reading">{text.title.jp}</span>
                  {/* ★ = même repère non-coloré que les tuiles dorées */}
                  {gold && <span>★</span>}
                  {text.status === 'in_progress' && (
                    <span className="ml-auto text-[10px] text-white/50">
                      {uiStrings.menu_reading_in_progress.jp}
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </>
      )}
    </MenuFrame>
  )
}

// ── Le menu ───────────────────────────────────────────────────────────────────

export default function StartMenu({ initialScreen = null }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(initialScreen !== null)
  const [screen, setScreen] = useState<StartMenuScreen | 'root'>(initialScreen ?? 'root')
  const [slotIndex, setSlotIndex] = useState(0)
  const [data, setData] = useState<StartMenuData | null>(null)

  const closeMenu = useCallback(() => {
    setOpen(false)
    setScreen('root')
    setSlotIndex(0)
  }, [])

  const toggleMenu = useCallback(() => {
    if (open) closeMenu()
    else setOpen(true)
  }, [open, closeMenu])

  // Données fraîches à chaque ouverture (la progression a pu changer)
  useEffect(() => {
    if (!open) return
    getStartMenuData()
      .then(setData)
      .catch(err => console.error('Failed to load start menu data', err))
  }, [open])

  const activateSlot = useCallback((slot: SlotDef) => {
    if (slot.disabled) return
    setScreen(slot.id as StartMenuScreen)
  }, [])

  const pressB = useCallback(() => {
    if (screen !== 'root') setScreen('root')
    else closeMenu()
  }, [screen, closeMenu])

  // Menu ouvert : capture clavier — rien ne traverse vers MapClient, et le
  // D-pad/A/B/START naviguent le menu.
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      e.stopPropagation()
      switch (e.code) {
        case 'ArrowRight':
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'ArrowDown': {
          e.preventDefault()
          if (screen !== 'root') return
          setSlotIndex(index => {
            if (e.code === 'ArrowRight') return index % 2 === 0 ? index + 1 : index
            if (e.code === 'ArrowLeft') return index % 2 === 1 ? index - 1 : index
            if (e.code === 'ArrowDown') return index + 2 < SLOTS.length ? index + 2 : index
            return index - 2 >= 0 ? index - 2 : index
          })
          break
        }
        case 'Space':
        case 'Enter':
          e.preventDefault()
          if (screen === 'root') activateSlot(SLOTS[slotIndex])
          break
        case 'Escape':
        case 'Backspace':
          pressB()
          break
        case 'KeyM':
          closeMenu()
          break
      }
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [open, screen, slotIndex, activateSlot, pressB, closeMenu])

  const openKanji = useCallback(
    (id: string) => router.push(`/kanji/${encodeURIComponent(id)}`),
    [router]
  )
  const openText = useCallback((textId: string) => router.push(`/text/${textId}`), [router])
  const rereadLesson = useCallback(
    (zone: string, seq: number) => router.push(`/lesson/${zone}/${seq}`),
    [router]
  )

  return (
    <>
      {/* START + SELECT — centre bas, petits, discrets (PRD § Interface).
          z-[75] : au-dessus des contrôles de MapClient (70), SOUS l'overlay
          de combat (80) — en combat, rien ne s'ouvre. Ouvert : le bouton
          passe au-dessus du menu pour que le re-appui ferme. */}
      <div
        className={`fixed bottom-2 left-1/2 -translate-x-1/2 ${open ? 'z-[96]' : 'z-[75]'} flex gap-2 font-chrome`}
        onClick={e => e.stopPropagation()}
      >
        <button
          data-testid="start-button"
          onClick={toggleMenu}
          className="px-2.5 py-0.5 rounded-full bg-white/10 active:bg-white/30 border border-white/25 text-white/60 text-[9px] font-bold tracking-wider"
        >
          START
        </button>
        <button
          data-testid="select-button"
          aria-disabled="true"
          className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-white/25 text-[9px] font-bold tracking-wider cursor-default"
        >
          SELECT
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[85] bg-black/60 font-chrome flex items-center justify-center p-3 pb-8">
          <div className="w-full max-w-2xl h-full max-h-[85vh] bg-gray-900 border-2 border-white rounded-lg overflow-hidden">
            {screen === 'root' ? (
              <div data-testid="menu-root" className="flex flex-col h-full">
                <div className="grid grid-cols-2 gap-2 p-3">
                  {SLOTS.map((slot, index) => (
                    <button
                      key={slot.id}
                      data-selected={index === slotIndex ? 'true' : 'false'}
                      aria-disabled={slot.disabled ? 'true' : 'false'}
                      onClick={() => activateSlot(slot)}
                      className={`px-3 py-3 rounded border text-left text-sm font-bold ${
                        slot.disabled
                          ? 'bg-white/5 border-white/10 text-white/25'
                          : index === slotIndex
                            ? 'bg-amber-400/20 border-amber-300 text-white'
                            : 'bg-white/10 border-white/20 text-white/85'
                      }`}
                    >
                      {slot.jp}
                      {slot.disabled && (
                        <span className="block text-[9px] font-normal mt-0.5">
                          {uiStrings.menu_slot_disabled.jp}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-auto border-t border-white/15 px-3 py-1.5 text-[10px] text-white/40 flex gap-3">
                  <span>B・START　{uiStrings.menu_close.jp}</span>
                </div>
              </div>
            ) : data === null ? (
              <div className="h-full flex items-center justify-center text-white/50">・・・</div>
            ) : screen === 'zukan' ? (
              <KanjidexScreen data={data} onOpenKanji={openKanji} />
            ) : screen === 'lessons' ? (
              <LessonBookScreen data={data} onReread={rereadLesson} />
            ) : screen === 'journal' ? (
              <QuestJournalScreen data={data} />
            ) : (
              <BagScreen data={data} onOpenText={openText} />
            )}
          </div>
        </div>
      )}
    </>
  )
}
