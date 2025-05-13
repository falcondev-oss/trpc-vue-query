// @ts-check
import eslintConfig from '@louishaftmann/eslint-config'

export default eslintConfig({
  nuxt: false,
  tsconfigPath: './tsconfig.json',
})
  .append({
    rules: {
      'no-console': 'off',
    },
  })
  .append({
    ignores: [
      '.prettierrc.cjs',
      '.lintstagedrc.mjs',
      'node_modules/',
      'dist/',
      '.nuxt/',
      '.output/',
      '.temp/',
      'pnpm-lock.yaml',
      'README.md/*.ts',
      'docs/',
    ],
  })
