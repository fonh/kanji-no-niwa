import path from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Alias `@/` aligné sur tsconfig.json (paths: "@/*" → "./src/*").
const alias = { '@': path.resolve(__dirname, 'src') }

// Deux projets (Vitest 4 : `environmentMatchGlobs` n'existe plus) :
// - .test.ts  → environnement node (logique pure, moteur)
// - .test.tsx → environnement jsdom + plugin React (composants)
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
        },
      },
    ],
  },
})
