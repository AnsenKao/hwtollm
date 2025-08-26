const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      '*.config.js',
      'coverage/**',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      'no-unused-vars': 'off', // 關閉基本規則
      'prefer-const': 'error',
    },
  },
];
