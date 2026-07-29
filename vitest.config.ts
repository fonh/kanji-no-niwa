import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Deux projets (Vitest 4 : `environmentMatchGlobs` n'existe plus) :
// - .test.ts  → environnement node (logique pure, moteur)
// - .test.tsx → environnement jsdom + plugin React (composants)
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
        },
      },
    ],
  },
})
