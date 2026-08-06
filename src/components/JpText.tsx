'use client'

// Rendu du japonais avec lectures inline (ADR-0002) — le composant partagé
// par tout ce qui affiche du jp à lecture masquable : boîte de dialogue
// (issue 03), écran-livre (05), combat (07), textes progressifs (08).
//
// Les lectures sont TOUJOURS masquées par défaut ; `showReadings` (bouton Y)
// les révèle pour le texte entier. La structure <ruby> est rendue dans les
// deux cas (le <rt> est vidé, pas retiré) pour que la hauteur de ligne ne
// saute pas au toggle. Taille des furigana : ≥ 10px (globals.css, .jp-inline).

import { useMemo } from 'react'
import { parseInlineReadings, sliceSegments } from '@/lib/inline-reading'

interface Props {
  jp: string
  /** Bouton Y — révèle les lectures du texte entier. */
  showReadings: boolean
  /** Machine à écrire : nombre de caractères visibles (bases). Omis = tout. */
  visibleChars?: number
  className?: string
}

export default function JpText({ jp, showReadings, visibleChars, className }: Props) {
  const segments = useMemo(() => parseInlineReadings(jp), [jp])
  const shown = visibleChars === undefined ? segments : sliceSegments(segments, visibleChars)
  return (
    <span lang="ja" className={className ? `jp-inline ${className}` : 'jp-inline'}>
      {shown.map((seg, i) =>
        seg.reading !== undefined ? (
          <ruby key={i}>
            {seg.base}
            <rt>{showReadings ? seg.reading : ''}</rt>
          </ruby>
        ) : (
          <span key={i}>{seg.base}</span>
        )
      )}
    </span>
  )
}
