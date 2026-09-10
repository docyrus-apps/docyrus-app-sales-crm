'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Brain } from 'lucide-react'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { type DocyrusAgentMemoryLevel } from './docyrus-agent-memory-candidate-row'
import {
  type DocyrusAgentMemoryFormState,
  DocyrusAgentMemoryForm,
  EMPTY_MEMORY_FORM,
} from './docyrus-agent-memory-form'
import { type DocyrusAgentMemory } from './docyrus-agent-memory-row'

export interface DocyrusAgentMemoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Memory being edited; pass `null` for "create new". */
  memory: DocyrusAgentMemory | null
  levels: ReadonlyArray<DocyrusAgentMemoryLevel>
  saving?: boolean
  onSubmit: (form: DocyrusAgentMemoryFormState) => void | Promise<void>
  /** Default form state for a fresh memory. */
  defaultValue?: DocyrusAgentMemoryFormState
  /** Replace the title node. Receives whether we're in edit mode. */
  title?: (editing: boolean) => ReactNode
  /** Replace the footer (Cancel / Save). */
  footer?: (helpers: DocyrusAgentMemoryFormDialogFooterHelpers) => ReactNode
  className?: string
}

export interface DocyrusAgentMemoryFormDialogFooterHelpers {
  saving: boolean
  canSubmit: boolean
  form: DocyrusAgentMemoryFormState
  cancel: () => void
  submit: () => void
}

/**
 * Create / edit dialog used by `DocyrusAgentMemoryManagerDialog`. Pass `memory={null}` for
 * the create flow, or a `DocyrusAgentMemory` to edit. The `onSubmit` callback receives the
 * full `DocyrusAgentMemoryFormState` — the dialog does not call any API itself.
 */
export const DocyrusAgentMemoryFormDialog = ({
  open,
  onOpenChange,
  memory,
  levels,
  saving = false,
  onSubmit,
  defaultValue = EMPTY_MEMORY_FORM,
  title,
  footer,
  className,
}: DocyrusAgentMemoryFormDialogProps) => {
  const { t } = useUiTranslation()
  const [form, setForm] = useState<DocyrusAgentMemoryFormState>(defaultValue)

  /*
   * Re-sync the form from props whenever the dialog opens or the edited memory
   * changes — done during render (React's "adjust state on prop change" idiom)
   * rather than in an effect, so it applies before paint without an extra pass.
   */
  const [prevOpen, setPrevOpen] = useState(open)
  const [prevMemory, setPrevMemory] = useState(memory)

  if (open !== prevOpen || memory !== prevMemory) {
    setPrevOpen(open)
    setPrevMemory(memory)

    if (open) {
      setForm(
        memory
          ? {
              title: memory.title,
              content: memory.content,
              memoryLevel: memory.memoryLevel ?? defaultValue.memoryLevel,
              importance: memory.importance ?? defaultValue.importance,
              alwaysInclude: memory.alwaysInclude ?? defaultValue.alwaysInclude,
            }
          : defaultValue,
      )
    }
  }

  const editing = !!memory
  const canSubmit = form.title.trim().length > 0

  const cancel = () => onOpenChange(false)
  const submit = () => {
    if (!canSubmit || saving) return
    void onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="size-4" />
            {title?.(editing) ??
              t(
                editing ? 'ui.agent.memories.edit' : 'ui.agent.memories.new',
                editing ? 'Edit memory' : 'New memory',
              )}
          </DialogTitle>
        </DialogHeader>

        <DocyrusAgentMemoryForm
          value={form}
          onChange={setForm}
          levels={levels}
          disabled={saving}
        />

        <DialogFooter>
          {footer?.({
            canSubmit,
            cancel,
            form,
            saving,
            submit,
          }) ?? (
            <>
              <Button variant="outline" disabled={saving} onClick={cancel}>
                {t('ui.agent.memories.cancel', 'Cancel')}
              </Button>
              <Button disabled={!canSubmit || saving} onClick={submit}>
                {saving
                  ? t('ui.agent.memories.saving', 'Saving…')
                  : t('ui.agent.memories.save', 'Save')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
