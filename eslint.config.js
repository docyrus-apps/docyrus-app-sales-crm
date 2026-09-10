//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import { baseConfig, reactConfig } from '@docyrus/rules/eslint'

const docyrusBaseConfig = baseConfig.map((config) => {
  if (!config.plugins) {
    return config
  }

  const {
    '@stylistic': _stylistic,
    '@typescript-eslint': _typescriptEslint,
    ...plugins
  } = config.plugins

  return {
    ...config,
    plugins,
  }
})

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
      'src/lib/approval-status.tsx',
      'src/lib/avatar-utils.tsx',
      'src/lib/icon-libraries.tsx',
      'src/lib/menu-list.ts',
      'src/lib/parsers.ts',
      'src/lib/pattern-styles.tsx',
      'src/lib/tailwind-colors.tsx',
      'src/lib/compose-refs.ts',
      'src/types/data-table.ts',
      'src/config/data-table.ts',
    ],
  },
  ...docyrusBaseConfig,
  ...reactConfig,
  {
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/require-await': 'off',
      '@eslint-react/no-array-index-key': 'off',
      '@eslint-react/component-hook-factories': 'off',
      '@eslint-react/exhaustive-deps': 'off',
      '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect': 'off',
      '@eslint-react/naming-convention/use-state': 'off',
      '@eslint-react/naming-convention-ref-name': 'off',
      '@eslint-react/no-context-provider': 'off',
      '@eslint-react/no-unnecessary-use-prefix': 'off',
      '@eslint-react/no-use-context': 'off',
      '@eslint-react/purity': 'off',
      '@eslint-react/set-state-in-effect': 'off',
      '@eslint-react/static-components': 'off',
      '@eslint-react/unsupported-syntax': 'off',
      '@eslint-react/use-memo': 'off',
      '@eslint-react/use-state': 'off',
      '@stylistic/comma-spacing': 'off',
      '@stylistic/indent': 'off',
      '@stylistic/jsx-pascal-case': 'off',
      '@stylistic/max-len': 'off',
      '@stylistic/multiline-ternary': 'off',
      '@stylistic/no-multi-spaces': 'off',
      '@stylistic/no-multiple-empty-lines': 'off',
      '@stylistic/no-trailing-spaces': 'off',
      '@stylistic/object-curly-newline': 'off',
      '@stylistic/object-curly-spacing': 'off',
      '@stylistic/operator-linebreak': 'off',
      '@stylistic/semi': 'off',
      'import-x/consistent-type-specifier-style': 'off',
      'import-x/no-duplicates': 'off',
      'import-x/order': 'off',
      'import/consistent-type-specifier-style': 'off',
      'import/no-duplicates': 'off',
      'import/order': 'off',
      'no-console': 'off',
      'no-duplicate-imports': 'off',
      'no-fallthrough': 'off',
      'no-irregular-whitespace': 'off',
      'no-restricted-syntax': 'off',
      'no-shadow': 'off',
      'no-useless-escape': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': 'off',
      'sort-imports': 'off',
      'unused-imports/no-unused-imports': 'off',
      'unused-imports/no-unused-vars': 'off',
    },
  },
]
