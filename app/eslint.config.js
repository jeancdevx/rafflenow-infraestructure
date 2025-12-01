import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import prettier from 'eslint-plugin-prettier'
import globals from 'globals'

export default [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      '**/node_modules/**',
      'lambdas/worker-process/**'
    ]
  },
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { prettier },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.jest }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
]
