import * as globals from 'globals/index.js';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginVitest from 'eslint-plugin-vitest';
import eslintPluginImport from 'eslint-plugin-import';

export default tseslint.config(
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['eslint.config.js', 'dist/**', 'node_modules/**'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser, // Assuming some browser-compatible code might exist, or for general utility
      },
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: eslintPluginImport,
      vitest: eslintPluginVitest,
    },
    rules: {
      // General ESLint rules
      'no-unused-vars': 'off', // Handled by @typescript-eslint/no-unused-vars
      'no-constant-condition': 'warn',

      // TypeScript ESLint rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-empty-interface': 'off',

      // Import plugin rules
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            {
              pattern: '@config/**',
              group: 'internal',
            },
            {
              pattern: '@domain/**',
              group: 'internal',
            },
            {
              pattern: '@application/**',
              group: 'internal',
            },
            {
              pattern: '@infrastructure/**',
              group: 'internal',
            },
            {
              pattern: '@tests/**',
              group: 'internal',
            },
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-unresolved': 'off', // Handled by TypeScript

      // Vitest plugin rules (if applicable)
      'vitest/consistent-test-filename': 'warn',
      'vitest/no-alias-methods': 'error',
      'vitest/no-focused-tests': 'warn',
      'vitest/prefer-to-be': 'error',
      'vitest/prefer-to-have-length': 'error',
      'vitest/valid-expect': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeCheck,
  }
);
