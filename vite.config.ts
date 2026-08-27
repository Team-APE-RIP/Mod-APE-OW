import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.toml', '**/*.glb', '**/*.ogg', '**/*.ksplat'],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    include: ['.codex/tests/**/*.test.ts', '.codex/tests/**/*.test.tsx'],
    setupFiles: './.codex/tests/setup.ts',
    css: true,
  },
})
