// @ts-check
import eslintConfig from '@falcondev-oss/configs/eslint'

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
      'node_modules/',
      'dist/',
      '.nuxt/',
      '.output/',
      '.temp/',
      'pnpm-lock.yaml',
      'README.md/*.ts',
    ],
  })
