import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
        'src/infrastructure/database/migrations/**',
        'src/infrastructure/database/seeders/**',
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/dao/**',
        'src/**/*.dao.ts',
        'src/infrastructure/database/datasource.ts',
      ],
    },
  },
  plugins: [
    tsconfigPaths(),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
