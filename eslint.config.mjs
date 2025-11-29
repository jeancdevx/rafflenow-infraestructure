import js from '@eslint/js'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    ignores: [
      '**/node_modules/**',
      '**/coverage/**',
      '**/venv/**',
      '**/layer/**',
      'frontend/**'
    ]
  },
  {
    files: ['app/lambdas/**/*.js'],
    ignores: [
      '**/node_modules/**',
      '**/venv/**',
      '**/layer/**',
      '**/__tests__/**'
    ],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'no-console': 'off',
      'no-undef': 'error',
      'no-redeclare': 'error',
      'no-constant-condition': 'warn',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all']
    }
  },
  {
    files: ['app/lambdas/**/__tests__/**/*.js'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'no-console': 'off'
    }
  },
  eslintConfigPrettier
])
