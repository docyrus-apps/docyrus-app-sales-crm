//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: [
      'dom-selector-helper.js',
      'eslint.config.js',
      'prettier.config.js',
    ],
  },
]
