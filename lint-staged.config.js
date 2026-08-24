// @ts-check
// @ts-ignore
export const NO_COLOR = process.env.VSCODE_GIT_COMMAND ? ' --no-color' : ''

console.log('[lint-staged]')

/** @param {{ before?: (string | (() => string))[], after?: (string | (() => string))[] }} options */
export function lintstagedConfig({ before = [], after = [] } = {}) {
  return {
    '*': [
      ...before,
      'eslint --cache --cache-location node_modules/.cache/eslint/ --cache-strategy content --no-warn-ignored --fix',
      'prettier --cache --cache-strategy content --log-level warn --ignore-unknown --no-error-on-unmatched-pattern --write',
      ...after,
    ],
  }
}

export default lintstagedConfig({
  before: [() => `pnpm${NO_COLOR} type-check`],
})
