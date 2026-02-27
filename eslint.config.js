//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: [
      'dom-selector-helper.js',
      'eslint.config.js',
      'prettier.config.js',
      'install-initial-components.js',
      'src/db/**/*',
      'src/collections/**/*',
      'src/components/admin-panel/**/*',
      'src/components/ui/**/*',
      'src/components/charts/**/*',
      'src/components/data-table/**/*',
      'src/components/docyrus/**/*',
      'src/components/animate-ui/**/*',
      'src/components/editor/**/*',
      'src/components/mode-toggle.tsx',
      'src/components/providers/**/*',
      'src/components/visually-hidden-input.tsx',
      'src/hooks/use-data-table.ts',
      'src/hooks/use-sidebar.ts',
      'src/hooks/use-store.ts',
      'src/hooks/use-as-ref.ts',
      'src/hooks/use-lazy-ref.ts',
      'src/hooks/use-isomorphic-layout-effect.ts',
      'src/lib/data-table.ts',
      'src/lib/format.ts',
      'src/lib/menu-list.ts',
      'src/lib/parsers.ts',
      'src/lib/compose-refs.ts',
      'src/types/data-table.ts',
      'src/config/data-table.ts',
    ],
  },
]
