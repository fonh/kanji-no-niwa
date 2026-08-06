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
import { useSettings } from '@/lib/use-settings'
import { resetPlayerData } from './reset-actions'
import {
  SETTING_VALUES,
  cycle,
  updateSettings,
  type GameSettings,
  type TextSpeed,
  type VolumeLevel,
} from '@/lib/settings'

export type StartMenuScreen = 'zukan' | 'lessons' | 'bag' | 'journal' | 'settings'

interface SlotDef {
  id: StartMenuScreen | 'profile'
  jp: string
  disabled: boolean
  /** Icône de la tuile (issue 13 — restyle START menu HGSS). Un vrai sprite
   * ROM n'existe que pour 図鑑 (poké ball, pokedex_030.png — /a/1/1/0) ; les
   * autres entrées de ce jeu (レッスン, バッグ...) n'ont pas d'équivalent
   * HGSS extrait (dossier `menus/` = chrome de l'écran Options + assets
   * hors-sujet, pas d'icônes de tuiles) — pictogramme emoji en repli,
   * cohérent avec le précédent déjà posé pour `.book-chrome` (PRD : « pas de
   * précédent HGSS », création assumée). */
  icon: { kind: 'sprite'; src: string } | { kind: 'emoji'; glyph: string }
}

const SLOTS: SlotDef[] = [
  {
    id: 'zukan',
    jp: uiStrings.menu_slot_zukan.jp,
    disabled: false,
    icon: { kind: 'sprite', src: '/sprites/ui/pokedex/pokedex_030.png' },
  },
  { id: 'lessons', jp: uiStrings.menu_slot_lessons.jp, disabled: false, icon: { kind: 'emoji', glyph: '📖' } },
  { id: 'bag', jp: uiStrings.menu_slot_bag.jp, disabled: false, icon: { kind: 'emoji', glyph: '🎒' } },
  { id: 'profile', jp: uiStrings.menu_slot_profile.jp, disabled: true, icon: { kind: 'emoji', glyph: '👤' } },
  { id: 'journal', jp: uiStrings.menu_slot_journal.jp, disabled: false, icon: { kind: 'emoji', glyph: '🧭' } },
  { id: 'settings', jp: uiStrings.menu_slot_settings.jp, disabled: false, icon: { kind: 'emoji', glyph: '⚙️' } },
]

/** Icône d'une tuile — sprite ROM pixelisé ou pictogramme emoji de repli. */
function SlotIcon({ icon, disabled }: { icon: SlotDef['icon']; disabled: boolean }) {
  if (icon.kind === 'sprite') {
    return (
      <img
        src={icon.src}
        alt=""
        width={16}
        height={16}
        draggable={false}
        className={`w-8 h-8 ${disabled ? 'opacity-40 grayscale' : ''}`}
        style={{ imageRendering: 'pixelated' }}
      />
    )
  }
  return (
    <span className={`text-3xl leading-none ${disabled ? 'opacity-40 grayscale' : ''}`} aria-hidden="true">
      {icon.glyph}
    </span>
  )
}

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
  // Comme dans la boîte de dialogue : le réglage de l'écran せってい donne
  // l'état de départ, X et Y restent basculables sur l'écran.
  const settings = useSettings()
  const [showEn, setShowEn] = useState(settings.showEnglish)
  const [showReadings, setShowReadings] = useState(settings.showReadings)
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


// ── Réglages ──────────────────────────────────────────────────────────────────

/** Une ligne de l'écran せってい : un libellé, une valeur, et de quoi passer
 * à la valeur suivante. Le jeu d'origine se règle entièrement à la manette —
 * gauche/droite sur la ligne sélectionnée — donc chaque ligne expose la même
 * opération dans les deux sens, et le clic la déclenche vers l'avant. */
interface SettingRow {
  key: keyof GameSettings
  label: string
  value: string
  step: (direction: 1 | -1) => void
  hint?: string
}

const SPEED_LABELS: Record<TextSpeed, string> = {
  slow: uiStrings.settings_speed_slow.jp,
  normal: uiStrings.settings_speed_normal.jp,
  fast: uiStrings.settings_speed_fast.jp,
  instant: uiStrings.settings_speed_instant.jp,
}

const VOLUME_LABELS: Record<VolumeLevel, string> = {
  0: uiStrings.settings_vol_0.jp,
  1: uiStrings.settings_vol_1.jp,
  2: uiStrings.settings_vol_2.jp,
  3: uiStrings.settings_vol_3.jp,
}

const onOff = (v: boolean) => (v ? uiStrings.settings_on.jp : uiStrings.settings_off.jp)

export function buildSettingRows(s: GameSettings): SettingRow[] {
  return [
    {
      key: 'textSpeed',
      label: uiStrings.settings_text_speed.jp,
      value: SPEED_LABELS[s.textSpeed],
      step: d => updateSettings({ textSpeed: cycle(SETTING_VALUES.textSpeed, s.textSpeed, d) }),
    },
    {
      key: 'textSound',
      label: uiStrings.settings_text_sound.jp,
      value: onOff(s.textSound),
      step: () => updateSettings({ textSound: !s.textSound }),
    },
    {
      key: 'bgmVolume',
      label: uiStrings.settings_bgm.jp,
      value: VOLUME_LABELS[s.bgmVolume],
      step: d => updateSettings({ bgmVolume: cycle(SETTING_VALUES.bgmVolume, s.bgmVolume, d) }),
    },
    {
      key: 'sfxVolume',
      label: uiStrings.settings_sfx.jp,
      value: VOLUME_LABELS[s.sfxVolume],
      step: d => updateSettings({ sfxVolume: cycle(SETTING_VALUES.sfxVolume, s.sfxVolume, d) }),
    },
    {
      key: 'showReadings',
      label: uiStrings.settings_readings.jp,
      value: onOff(s.showReadings),
      step: () => updateSettings({ showReadings: !s.showReadings }),
      hint: uiStrings.settings_readings_hint.jp,
    },
    {
      key: 'showEnglish',
      label: uiStrings.settings_english.jp,
      value: onOff(s.showEnglish),
      step: () => updateSettings({ showEnglish: !s.showEnglish }),
    },
  ]
}

function SettingsScreen({ cursor, onCursor }: { cursor: number; onCursor: (i: number) => void }) {
  const settings = useSettings()
  const rows = buildSettingRows(settings)
  // Effacement de la partie : jamais en un geste. Le bouton ouvre une
  // confirmation, et c'est elle qui efface — même principe que le jeu
  // d'origine pour l'effacement de sauvegarde.
  const [confirming, setConfirming] = useState(false)
  const [resetState, setResetState] = useState<'idle' | 'doing' | 'failed'>('idle')
  return (
    <MenuFrame title={uiStrings.settings_title.jp} testId="screen-settings">
      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <button
            key={row.key}
            data-testid={`setting-${row.key}`}
            data-selected={i === cursor ? 'true' : 'false'}
            onClick={() => {
              onCursor(i)
              row.step(1)
            }}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded border-2 text-left ${
              i === cursor
                ? 'bg-white/15 border-amber-300'
                : 'bg-white/5 border-white/15'
            }`}
          >
            <span className="text-white text-sm font-reading">{row.label}</span>
            <span className="flex items-center gap-2 text-amber-200 text-sm font-reading">
              <span className="text-white/30">◀</span>
              <span className="min-w-20 text-center">{row.value}</span>
              <span className="text-white/30">▶</span>
            </span>
          </button>
        ))}
      </div>
      {rows[cursor]?.hint && (
        <p className="mt-3 text-white/45 text-[11px] font-reading leading-relaxed">
          {rows[cursor].hint}
        </p>
      )}
      <p className="mt-3 text-white/30 text-[10px]">{uiStrings.settings_hint.jp}</p>

      <div className="mt-6 pt-3 border-t border-white/10">
        {!confirming ? (
          <button
            data-testid="reset-open"
            onClick={() => setConfirming(true)}
            className="px-3 py-1.5 rounded border-2 border-red-500/60 bg-red-500/10 text-red-200 text-xs font-reading"
          >
            {uiStrings.settings_reset.jp}
          </button>
        ) : (
          <div data-testid="reset-confirm" className="rounded border-2 border-red-500/60 bg-red-500/10 p-3">
            <p className="text-red-100 text-sm font-reading leading-relaxed">
              {uiStrings.settings_reset_confirm.jp}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                data-testid="reset-yes"
                disabled={resetState === 'doing'}
                onClick={async () => {
                  setResetState('doing')
                  try {
                    await resetPlayerData()
                    // Rechargement complet plutôt qu'un router.push : tout
                    // l'état client (progression, menu, audio) décrit une
                    // partie qui n'existe plus.
                    window.location.href = '/'
                  } catch {
                    setResetState('failed')
                  }
                }}
                className="px-3 py-1.5 rounded border-2 border-red-400 bg-red-600/70 text-white text-xs font-reading disabled:opacity-50"
              >
                {resetState === 'doing'
                  ? uiStrings.settings_reset_doing.jp
                  : uiStrings.settings_reset_yes.jp}
              </button>
              <button
                data-testid="reset-no"
                onClick={() => {
                  setConfirming(false)
                  setResetState('idle')
                }}
                className="px-3 py-1.5 rounded border-2 border-white/25 bg-white/10 text-white text-xs font-reading"
              >
                {uiStrings.settings_reset_no.jp}
              </button>
            </div>
            {resetState === 'failed' && (
              <p className="mt-2 text-red-200 text-xs font-reading">
                {uiStrings.settings_reset_failed.jp}
              </p>
            )}
          </div>
        )}
      </div>
    </MenuFrame>
  )
}

// ── Le menu ───────────────────────────────────────────────────────────────────

export default function StartMenu({ initialScreen = null }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(initialScreen !== null)
  const [screen, setScreen] = useState<StartMenuScreen | 'root'>(initialScreen ?? 'root')
  const [slotIndex, setSlotIndex] = useState(0)
  // Curseur de l'écran せってい : une ligne de réglage, indépendant du curseur
  // de tuiles de l'écran racine.
  const [settingCursor, setSettingCursor] = useState(0)
  const settings = useSettings()
  const [data, setData] = useState<StartMenuData | null>(null)

  const closeMenu = useCallback(() => {
    setOpen(false)
    setScreen('root')
    setSlotIndex(0)
    setSettingCursor(0)
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
          if (screen === 'settings') {
            const rows = buildSettingRows(settings)
            if (e.code === 'ArrowDown') setSettingCursor(i => Math.min(i + 1, rows.length - 1))
            else if (e.code === 'ArrowUp') setSettingCursor(i => Math.max(i - 1, 0))
            else rows[settingCursor]?.step(e.code === 'ArrowRight' ? 1 : -1)
            return
          }
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
          else if (screen === 'settings') buildSettingRows(settings)[settingCursor]?.step(1)
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
  }, [open, screen, slotIndex, settingCursor, settings, activateSlot, pressB, closeMenu])

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

      {/* A et B du menu (issue 13) : les boutons de la carte sont SOUS l'overlay
          du menu, donc inertes une fois celui-ci ouvert — B ne revenait jamais
          en arrière au doigt. Le menu porte donc les siens, au même endroit. */}
      {open && (
        <div
          className="fixed bottom-2 right-3 z-[96] flex gap-2 font-chrome"
          onClick={e => e.stopPropagation()}
        >
          <button
            data-testid="menu-button-b"
            onClick={pressB}
            className="w-12 h-12 rounded-full bg-white/15 active:bg-white/35 border border-white/30 text-white font-bold"
          >
            B
          </button>
          <button
            data-testid="menu-button-a"
            onClick={() => {
              if (screen === 'root') activateSlot(SLOTS[slotIndex])
            }}
            className="w-12 h-12 rounded-full bg-white/15 active:bg-white/35 border border-white/30 text-white font-bold"
          >
            A
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[85] bg-black/60 font-chrome flex items-center justify-center p-3 pb-8">
          <div
            className={
              screen === 'root'
                ? 'w-full max-w-2xl h-full max-h-[85vh] rounded-2xl border-4 border-emerald-950 overflow-hidden shadow-2xl'
                : 'w-full max-w-2xl h-full max-h-[85vh] bg-gray-900 border-2 border-white rounded-lg overflow-hidden'
            }
          >
            {screen === 'root' ? (
              // Écran racine — panneau vert tactile HGSS (issue 13) : pas
              // d'asset ROM pour ce chrome (dossier `menus/` extrait =
              // chrome de l'écran Options + assets hors-sujet, pas le menu
              // START vert) — reconstruit en CSS à partir de la capture de
              // référence (bandeau vert foncé « ⊗ MENU », tuiles vert clair
              // arrondies, icône + libellé jp sous chaque tuile).
              <div data-testid="menu-root" className="flex flex-col h-full bg-emerald-600">
                <div className="flex items-center gap-1.5 bg-emerald-800 px-3 py-2 border-b-2 border-emerald-950/40">
                  <span className="text-white text-base leading-none" aria-hidden="true">
                    ⊗
                  </span>
                  <span className="text-white font-bold text-sm tracking-widest">MENU</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-4 flex-1 content-start">
                  {SLOTS.map((slot, index) => (
                    <button
                      key={slot.id}
                      data-selected={index === slotIndex ? 'true' : 'false'}
                      aria-disabled={slot.disabled ? 'true' : 'false'}
                      onClick={() => activateSlot(slot)}
                      className="flex flex-col items-center gap-1 py-2"
                    >
                      <span
                        className={`w-16 h-16 flex items-center justify-center rounded-2xl border-2 ${
                          slot.disabled
                            ? 'bg-emerald-700/40 border-emerald-900/40'
                            : index === slotIndex
                              ? 'bg-emerald-700 border-amber-300 shadow-[inset_0_2px_0_rgba(255,255,255,0.25)]'
                              : 'bg-emerald-700 border-emerald-950/50 shadow-[inset_0_2px_0_rgba(255,255,255,0.2)]'
                        }`}
                      >
                        <SlotIcon icon={slot.icon} disabled={slot.disabled} />
                      </span>
                      <span className={`text-xs font-bold ${slot.disabled ? 'text-white/40' : 'text-white'}`}>
                        {slot.jp}
                      </span>
                      {slot.disabled && (
                        <span className="text-[9px] font-normal text-white/35 -mt-0.5">
                          {uiStrings.menu_slot_disabled.jp}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-auto border-t border-emerald-950/40 bg-emerald-700/60 px-3 py-1.5 text-[10px] text-white/70 flex gap-3">
                  <span>B・START　{uiStrings.menu_close.jp}</span>
                </div>
              </div>
            ) : screen === 'settings' ? (
              <SettingsScreen cursor={settingCursor} onCursor={setSettingCursor} />
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
