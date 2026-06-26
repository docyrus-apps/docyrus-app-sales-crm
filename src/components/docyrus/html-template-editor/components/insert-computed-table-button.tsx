'use client';

// @ts-nocheck
/* eslint-disable */
import { useState } from 'react';

import { TableIcon } from 'lucide-react';
import { useEditorRef } from 'platejs/react';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';
import { Button } from '@/components/ui/button';

import { useHbsContext } from '../lib/hbs-context';
import {
  ADHOC_TABLE_SCHEMA_ID,
  COMPUTED_TABLE_KEY,
  type ComputedColumnConfig,
  type ComputedFooterConfig
} from '../types';

import { TableConfigurationDialog } from './table-configuration-dialog';

interface InsertComputedTableButtonProps {
  disabled?: boolean;
}

export function InsertComputedTableButton({ disabled }: InsertComputedTableButtonProps) {
  const editor = useEditorRef();
  const { data } = useHbsContext();
  const { t } = useUiTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const insertAdhocTable = (config: {
    dataPath: string;
    label?: string;
    columns: ComputedColumnConfig[];
    footer: ComputedFooterConfig[];
  }) => {
    setDialogOpen(false);
    editor.tf.focus();
    editor.tf.insertNodes(
      [
        {
          type: COMPUTED_TABLE_KEY,
          schemaId: ADHOC_TABLE_SCHEMA_ID,
          rows: [],
          dataPath: config.dataPath,
          label: config.label,
          columns: config.columns,
          footer: config.footer,
          children: [{ text: '' }]
        },
        { type: 'p', children: [{ text: '' }] }
      ],
      { select: true }
    );
  };

  const openDialog = () => {
    /*
     * Slate keeps an `IS_FOCUSED` weak-map that DOM `.blur()` alone
     * doesn't reset; combined with Plate's toolbar focus-retention this
     * means the slate-editor stays focused through our click handler.
     * When the Dialog then mounts and Radix flips `#root` to
     * `aria-hidden`, Chrome logs the a11y warning.
     *
     * Manual escape hatch: clear the editor selection (which slate-react
     * listens to and propagates as a blur on next commit), DOM-blur the
     * editor element, and defer the dialog open by a frame so the
     * selection-driven blur has time to flush before Radix takes over.
     */
    try {
      (editor as { deselect?: () => void }).deselect?.();
    } catch {
      /* swallow */
    }
    const slateEl = document.querySelector('[data-slate-editor="true"]') as HTMLElement | null;

    slateEl?.blur();
    (document.activeElement as HTMLElement | null)?.blur?.();
    requestAnimationFrame(() => setDialogOpen(true));
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={openDialog}
        className="h-7 gap-1.5 px-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/20">
        <TableIcon className="size-3.5" />
        {t('ui.htmlTemplateEditor.insertTable', 'Table')}
      </Button>

      <TableConfigurationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        data={data}
        onConfirm={insertAdhocTable} />
    </>
  );
}