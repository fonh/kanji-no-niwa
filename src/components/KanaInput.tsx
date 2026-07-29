'use client'

// Champ de saisie kana partagé (issue 04) — le joueur tape en romaji, la
// conversion s'affiche en direct comme un IME (minuscules → hiragana,
// MAJUSCULES → katakana). Utilisé par la saisie du nom de l'ouverture et par
// le mode Saisie du combat (issue 07). Contrôlé : `value` porte la chaîne
// convertie (kana + éventuelle syllabe latine en suspens, ex. かn) ; la
// finalisation (finalizeKana) et la validation (isKanaText) restent à la
// charge du parent au moment de soumettre — logique testée hors DOM dans
// src/lib/kana-input.ts.

import { toKanaLive, kanaLength } from '@/lib/kana-input'

export interface KanaInputProps {
  value: string
  onChange: (next: string) => void
  /** Enter (le clavier virtuel mobile a sa touche 確定). */
  onSubmit?: () => void
  /** Borne en kana finalisés — la frappe qui dépasserait est ignorée,
   * jamais coupée au milieu d'une syllabe en cours de conversion. */
  maxKana?: number
  autoFocus?: boolean
  className?: string
  /** Libellé accessibilité (en japonais, comme tout le reste). */
  ariaLabel?: string
}

export default function KanaInput({
  value,
  onChange,
  onSubmit,
  maxKana,
  autoFocus,
  className,
  ariaLabel,
}: KanaInputProps) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const converted = toKanaLive(event.target.value)
    if (maxKana !== undefined && kanaLength(converted) > maxKana) return
    onChange(converted)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && onSubmit) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      autoFocus={autoFocus}
      className={className}
      aria-label={ariaLabel}
      // La conversion est la nôtre : pas d'IME système, pas de suggestion,
      // pas d'auto-capitalisation (une majuscule = katakana voulu).
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      placeholder=""
    />
  )
}
