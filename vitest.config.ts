import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc'; // For faster compilation if needed

export default defineConfig({
  test: {
    globals: true, // Use global APIs like describe, it, expect
    root: './', // Look for tests in the root directory
    include: [
      '**/*.spec.ts',
      '**/*.test.ts',
      'test/**/*.spec.ts',
      'test/**/*.test.ts',
    ], // Test file patterns
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      exclude: [
        // Exclude files from coverage
        'node_modules/**',
        'dist/**',
        '**/*.module.ts',
        '**/*.config.ts',
        '**/main.ts',
        '**/prisma/**',
        '**/*.entity.ts',
        '**/*.dto.ts',
        '**/*.input.ts',
        '**/*.args.ts',
      ],
    },
    alias: {
      '@src': './src',
      '@app': './src/app',
      '@domain': './src/domain',
      '@infra': './src/infra',
      '@config': './src/config',
      '@test': './test',
    },
  },
  plugins: [
    // Optional: Use SWC for faster test execution
    // Make sure to install unplugin-swc and @swc/core
    swc.vite(),
  ],
});
