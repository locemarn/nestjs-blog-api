import { defineConfig } from 'vitest/config';
// import swc from 'unplugin-swc'; // For faster compilation if needed

export default defineConfig({
  test: {
    globals: true, // Use global APIs like describe, it, expect
    root: './', // Look for tests in the root directory
    include: ['**/*.spec.ts', '**/*.test.ts'], // Test file patterns
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
        '**/*.entity.ts', // Often skip basic entities unless they have logic
        '**/*.dto.ts', // Usually skip basic DTOs
        '**/*.input.ts',
        '**/*.args.ts',
        // Add other patterns as needed
      ],
    },
    alias: {
      // Optional: Setup path aliases like in tsconfig.json
      '@src': './src',
      '@app': './src/app',
      '@domain': './src/domain',
      '@infra': './src/infra',
      '@config': './src/config',
      // Add other aliases
    },
  },
  plugins: [
    // Optional: Use SWC for faster test execution
    // Make sure to install unplugin-swc and @swc/core
    // swc.vite(),
  ],
});
