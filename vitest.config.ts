import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // La ruta del workspace tiene espacios ("App UCO - Medicina").
    // Vitest forks/threads workers fallan con paths con espacios.
    pool: 'vmThreads',
  },
});
