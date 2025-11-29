import js from '@eslint/js'
import globals from 'globals'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'multi-line'],
      'no-throw-literal': 'error',
      'prefer-template': 'error',
      'no-nested-ternary': 'error',
      'max-depth': ['error', 4],
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }]
    }
  },
  {
    ignores: ['node_modules/', 'coverage/', '*.test.js']
  }
]
