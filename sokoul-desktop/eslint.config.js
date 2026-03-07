import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.d.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      boundaries,
      'react-hooks': reactHooks,
    },
    settings: {
      'boundaries/elements': [
        { type: 'app',      pattern: ['src/app/*'] },
        { type: 'features', pattern: ['src/features/*/*'] },
        { type: 'shared',   pattern: ['src/shared/*'] },
        { type: 'stores',   pattern: ['src/stores/*'] },
        { type: 'styles',   pattern: ['src/styles/*'] },
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          { from: ['features'], allow: ['shared', 'app', 'stores', 'styles'] },
          { from: ['shared'],   allow: ['shared', 'stores'] },
          { from: ['app'],      allow: ['features', 'shared', 'stores', 'styles'] },
          { from: ['stores'],   allow: ['shared'] },
          { from: ['styles'],   allow: [] },
        ],
      }],
    },
  },
];
