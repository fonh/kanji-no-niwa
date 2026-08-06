import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// Config minimale (issue 01) : les presets Next tels quels, pas de règles custom.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // MapClient (visionneuse de cartes, antérieure à ce jalon) lit des refs
    // pendant le rendu de façon délibérée et commentée dans le fichier. Les
    // nouvelles règles « compiler » de react-hooks v7 (Next 16) la signalent ;
    // la refondre est hors périmètre de l'issue 01 → exclusion ciblée.
    files: ['src/app/map/MapClient.tsx'],
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'next-env.d.ts',
    // Données et artefacts non-code
    'ROM/**',
    'data/**',
    'content/**',
    'public/**',
    'scratch/**',
    '.scratch/**',
  ]),
])
