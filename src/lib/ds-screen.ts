'use client'

// La taille de « l'écran de la console » — partagée par tout ce qui s'affiche
// dedans (2026-08-06).
//
// MapClient cadre le monde dans un rectangle 4:3 centré, à la façon d'une
// fenêtre d'émulateur : le reste de la fenêtre du navigateur reste noir. Le
// menu START, lui, s'ouvrait en `fixed inset-0` — donc sur TOUTE la fenêtre,
// sans rapport avec l'écran de jeu. Sur un moniteur large, ça donnait un
// panneau très haut et très étroit dont les deux tiers du bas étaient vides :
// six tuiles en haut, puis rien. Le menu occupe désormais exactement l'écran
// de la console, comme sur DS.

import { useEffect, useState } from 'react'

/** Écran bas de la DS : 256×192. On ne reproduit pas la résolution (les
 * captures de cartes sont à une autre échelle) mais bien le RATIO — c'est lui
 * qui donne le cadrage du jeu d'origine. */
export const DS_SCREEN_W = 256
export const DS_SCREEN_H = 192

export interface DsScreenSize {
  w: number
  h: number
}

/** Le plus grand rectangle 4:3 qui tient dans la fenêtre. */
export function fitDsScreen(windowW: number, windowH: number): DsScreenSize {
  const ratio = DS_SCREEN_W / DS_SCREEN_H
  const boxW = Math.min(windowW, windowH * ratio)
  return { w: Math.floor(boxW), h: Math.floor(boxW / ratio) }
}

/** Suit la taille de l'écran de jeu au redimensionnement.
 *
 * Valeur de départ volontairement fixe (et non lue depuis `window`) : le rendu
 * serveur ne connaît pas la fenêtre, et lire sa taille au premier rendu client
 * produirait un HTML différent — l'erreur d'hydratation déjà corrigée pour les
 * réglages et le bouton muet. On se resynchronise après montage. */
export function useDsScreenSize(): DsScreenSize {
  const [size, setSize] = useState<DsScreenSize>({ w: 375, h: 281 })
  useEffect(() => {
    const update = () => setSize(fitDsScreen(window.innerWidth, window.innerHeight))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}
