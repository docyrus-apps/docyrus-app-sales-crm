#!/usr/bin/env node

/**
 * Installs initial UI components for the project.
 *
 * Usage:
 *   node install-initial-components.js          # Install all components
 *   node install-initial-components.js --dry-run # Preview commands without executing
 */

import { execFileSync } from 'node:child_process'

const DRY_RUN = process.argv.includes('--dry-run')

// ── Animate UI components (shadcn registry) ─────────────────────────────────
const animateUiComponents = [
  '@animate-ui/components-radix-alert-dialog',
  '@animate-ui/components-animate-avatar-group',
  '@animate-ui/components-radix-dialog',
  '@animate-ui/components-radix-popover',
  '@animate-ui/components-radix-sidebar',
  '@animate-ui/components-radix-tabs',
  '@animate-ui/components-radix-switch',
  '@animate-ui/components-radix-toggle',
  '@animate-ui/components-radix-toggle-group',
  '@animate-ui/components-radix-tooltip',
]

// ── Docyrus UI components (@docyrus/cli registry) ───────────────────────────
// All components except Cropper and Data Source Query Builder
const docyrusUiComponents = [
  '@docyrus/ui-avatar-select',
  '@docyrus/ui-avatar-thumbnail',
  '@docyrus/ui-awesome-card',
  '@docyrus/ui-awesome-dialog',
  '@docyrus/ui-calendar',
  '@docyrus/ui-comments-panel',
  '@docyrus/ui-confirmation-button',
  '@docyrus/ui-data-grid',
  '@docyrus/ui-data-table-filter',
  '@docyrus/ui-date-time-picker',
  '@docyrus/ui-day-picker',
  '@docyrus/ui-delete-confirm-dialog',
  '@docyrus/ui-docyrus-icon',
  '@docyrus/ui-duration-select',
  '@docyrus/ui-editable-record-detail',
  '@docyrus/ui-editable-value',
  '@docyrus/ui-file-attachment-panel',
  '@docyrus/ui-form-fields',
  '@docyrus/ui-gantt',
  '@docyrus/ui-image-editor',
  '@docyrus/ui-kanban',
  '@docyrus/ui-map',
  '@docyrus/ui-morph-popover',
  '@docyrus/ui-notification-stack',
  '@docyrus/ui-notifications-panel',
  '@docyrus/ui-place-autocomplete',
  '@docyrus/ui-query-builder',
  '@docyrus/ui-radio-group',
  '@docyrus/ui-record-activity-panel',
  '@docyrus/ui-record-delete-confirm-dialog',
  '@docyrus/ui-search-input',
  '@docyrus/ui-stepper',
  '@docyrus/ui-tree-view',
  '@docyrus/ui-value-renderers',
]

// ── npm packages ────────────────────────────────────────────────────────────
const npmPackages = ['sileo']

function run(command, args) {
  const display = [command, ...args].join(' ')
  console.log(`\n> ${display}`)
  if (!DRY_RUN) {
    execFileSync(command, args, { stdio: 'inherit' })
  }
}

function main() {
  if (DRY_RUN) {
    console.log('=== DRY RUN — no commands will be executed ===\n')
  }

  // 1. Install npm packages
  console.log('── Installing npm packages ──')
  run('pnpm', ['add', ...npmPackages])

  // 2. Install Animate UI components
  console.log('\n── Installing Animate UI components ──')
  for (const component of animateUiComponents) {
    run('pnpm', ['dlx', 'shadcn@latest', 'add', component, '--overwrite'])
  }

  // 3. Install Docyrus UI components
  console.log('\n── Installing Docyrus UI components ──')
  for (const component of docyrusUiComponents) {
    run('pnpm', ['dlx', '@docyrus/cli', 'add', component, '--overwrite'])
  }

  console.log('\n✓ All components installed successfully.')
}

main()
