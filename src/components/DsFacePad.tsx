'use client'

// La manette de l'émulateur — croix directionnelle et losange A/B/X/Y.
//
// Extraite de MapClient le 2026-08-06 : le menu START dessinait SES propres
// boutons, deux ronds A/B d'un autre diamètre, d'une autre couleur, posés
// ailleurs, pendant que X et Y y devenaient de petites pastilles dans l'en-tête
// de chaque écran. Trois jeux de boutons pour une seule console. Un même geste
// doit trouver le même bouton au même endroit, quel que soit l'écran : c'est
// tout l'intérêt d'un habillage de console.
//
// Disposition DS : X en haut, Y à gauche, A à droite, B en bas.

import type { ReactNode } from 'react'

export interface FaceButtonSpec {
  /** 'x' | 'y' | 'a' | 'b' — décide de la place dans le losange. */
  area: 'x' | 'y' | 'a' | 'b'
  label: string
  onPress?: () => void
  /** Bouton présent mais sans effet ici : estompé, jamais retiré (sa place
   * doit rester la même d'un écran à l'autre). */
  dimmed?: boolean
  /** Actif ET dans un état « allumé » (X quand la traduction est affichée). */
  lit?: boolean
}

function faceButton({ area, label, onPress, dimmed, lit }: FaceButtonSpec): ReactNode {
  return (
    <button
      key={area}
      data-testid={`button-${area}`}
      aria-label={label}
      style={{ gridArea: area, touchAction: 'none' }}
      onClick={onPress}
      className={`w-12 h-12 rounded-full border backdrop-blur-[2px] font-bold ${
        lit
          ? 'bg-amber-400/90 border-amber-200 text-black'
          : dimmed
            ? 'bg-black/45 border-white/35 text-white/60'
            : 'bg-black/45 active:bg-white/25 border-white/60 text-white'
      }`}
    >
      {label}
    </button>
  )
}

/** Le losange A/B/X/Y, à sa place fixe en bas à droite. */
export default function DsFacePad({
  buttons,
  className = 'fixed bottom-6 right-4 z-[70]',
}: {
  buttons: FaceButtonSpec[]
  className?: string
}) {
  return (
    <div className={className} onClick={e => e.stopPropagation()}>
      <div
        style={{
          display: 'grid',
          gridTemplateAreas: `". x ." "y . a" ". b ."`,
          gap: 2,
        }}
      >
        {buttons.map(faceButton)}
      </div>
    </div>
  )
}
