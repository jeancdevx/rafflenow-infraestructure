/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'mjs'],
  testMatch: ['**/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/worker-process/'],
  collectCoverageFrom: [
    'lambdas/**/handler.js',
    'lambdas/**/lib/**/*.js',
    '!**/node_modules/**',
    '!**/lib/powertools.js',
    '!**/lib/clients.js',
    '!**/worker-process/**'
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/worker-process/', '/.venv/'],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000
}
