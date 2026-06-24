'use client'

// @ts-nocheck
/* eslint-disable */
import { Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { type SchemaNode } from '../json-schema-designer-types'
import { useDesignerContext } from '../json-schema-designer-context'

interface EnumValuesEditorProps {
  node: SchemaNode
}

/** Edit the `enum` keyword — a fixed list of allowed values for a node. */
export function EnumValuesEditor({ node }: EnumValuesEditorProps) {
  const { t } = useUiTranslation()
  const { updateNode, readOnly } = useDesignerContext()

  const values = node.enumValues ?? []
  const isNumeric = node.type === 'number' || node.type === 'integer'

  const commit = (next: unknown[]) => {
    updateNode(node.id, { enumValues: next.length > 0 ? next : undefined })
  }

  const updateAt = (index: number, raw: string) => {
    const next = [...values]

    next[index] = isNumeric && raw !== '' ? Number(raw) : raw
    commit(next)
  }

  const removeAt = (index: number) => {
    commit(values.filter((_, i) => i !== index))
  }

  const addValue = () => {
    commit([...values, isNumeric ? 0 : `option_${values.length + 1}`])
  }

  return (
    <div className="space-y-1.5">
      {values.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          {t(
            'ui.jsonSchemaDesigner.enumEmpty',
            'No allowed values — accepts any value.',
          )}
        </p>
      )}

      {values.map((value, index) => (
        // eslint-disable-next-line @eslint-react/no-array-index-key
        <div key={`enum-${index}`} className="flex items-center gap-1">
          <Input
            type={isNumeric ? 'number' : 'text'}
            value={value === undefined || value === null ? '' : String(value)}
            onChange={(event) => updateAt(index, event.target.value)}
            disabled={readOnly}
            className="h-8 text-xs"
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => removeAt(index)}
            disabled={readOnly}
            aria-label={t('ui.jsonSchemaDesigner.removeValue', 'Remove value')}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        className="h-7 w-full gap-1 text-xs"
        onClick={addValue}
        disabled={readOnly}
      >
        <Plus className="size-3.5" />
        {t('ui.jsonSchemaDesigner.addValue', 'Add value')}
      </Button>
    </div>
  )
}
