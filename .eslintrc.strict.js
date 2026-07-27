/**
 * Strict ESLint configuration for production
 */

module.exports = {
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // TypeScript strictness
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'error',
    
    // React
    'react-hooks/exhaustive-deps': 'error',
    'react/no-unescaped-entities': 'off',
    
    // Import ordering
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    
    // Console warnings (errors in production)
    'no-console': process.env.NODE_ENV === 'production' ? ['error', { allow: ['error'] }] : 'off',
    
    // General
    'eqeqeq': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
  },
  ignorePatterns: ['node_modules/', '.next/', 'convex/_generated/'],
};
