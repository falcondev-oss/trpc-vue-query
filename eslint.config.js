// @ts-check
import _eslintConfig from '@louishaftmann/eslint-config'

/** @type {import('eslint').Linter.FlatConfig} */
const ignores = {
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
}

export default (async () => {
  const eslintConfig = await _eslintConfig({
    nuxt: false,
    tsconfigPath: [
      './tsconfig.json',
      './test/tsconfig.json',
      './docs/tsconfig.json',
      './examples/nuxt/tsconfig.json',
      './examples/nodejs/tsconfig.json',
      './examples/nodejs/tsconfig.app.json',
      './examples/nodejs/tsconfig.node.json',
    ],
  })

  return [...eslintConfig, ignores]
})()
