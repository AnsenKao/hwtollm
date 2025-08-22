/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // 移除 TypeScript 特定規則，使用 Next.js 內建的規則
    'no-unused-vars': 'off', // 關閉基本規則
    'prefer-const': 'error',
  },
}
