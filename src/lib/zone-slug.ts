// Mapping MAP_* (registre de zones ROM) → slug de contenu ("new-bark-town")
// — pur, zéro I/O. Posé ici à l'issue 09 : l'heuristique vivait locale dans
// npcs.ts (écart noté par l'issue 05 : « pas de table de correspondance,
// heuristique locale ») ; elle est maintenant partagée entre le placement des
// PNJ (npcs.ts) et le menu START (chapitres du Carnet, Journal de lecture).
//
// Règle : MAP_NEW_BARK → "new-bark" → match exact OU slug qui commence par
// "new-bark-" ("new-bark-town"). Les zones intérieures (MAP_NEW_BARK_ELMS_
// LAB_1F → "new-bark-elms-lab-1f") ne matchent rien : la zone extérieure,
// toujours traversée avant, porte le rattachement.

export function normalizeMapName(mapName: string): string {
  return mapName.replace(/^MAP_/, '').toLowerCase().replace(/_/g, '-')
}

export function zoneSlugForMapName(
  mapName: string,
  knownSlugs: readonly string[]
): string | undefined {
  const normalized = normalizeMapName(mapName)
  return knownSlugs.find(slug => slug === normalized || slug.startsWith(`${normalized}-`))
}

/** Comme zoneSlugForMapName, mais un intérieur remonte à son rattachement
 * extérieur : MAP_NEW_BARK_ELMS_LAB_1F → "new-bark-elms-lab-1f" ne matche
 * rien, on retire les segments de queue jusqu'à "new-bark" → new-bark-town.
 * Pour le libellé jp du HUD et des écrans (issue 10) — le bâtiment appartient
 * à la ville, comme la localisation affichée des jeux d'origine. */
export function zoneSlugForMapNameOrParent(
  mapName: string,
  knownSlugs: readonly string[]
): string | undefined {
  const segments = normalizeMapName(mapName).split('-')
  for (let len = segments.length; len >= 1; len--) {
    const slug = zoneSlugForMapName(`MAP_${segments.slice(0, len).join('_').toUpperCase()}`, knownSlugs)
    if (slug) return slug
  }
  return undefined
}

/** Les slugs de zones visitées, dans l'ordre du voyage (visited_zones[] est
 * append-only : première entrée = première visite), sans doublon, intérieurs
 * filtrés. */
export function visitedZoneSlugs(
  visitedMapNames: readonly string[],
  knownSlugs: readonly string[]
): string[] {
  const slugs: string[] = []
  for (const mapName of visitedMapNames) {
    const slug = zoneSlugForMapName(mapName, knownSlugs)
    if (slug && !slugs.includes(slug)) slugs.push(slug)
  }
  return slugs
}
