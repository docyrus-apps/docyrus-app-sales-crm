'use client'

// @ts-nocheck
/* eslint-disable */
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { MousePointerClick } from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { useDesignerContext } from '../json-schema-designer-context'
import { useDesignerDnd } from './designer-dnd'
import { SchemaTreeNode } from './schema-tree-node'

/** Center pane (Tree tab): the editable, drag-and-drop schema tree. */
export function SchemaTreeView() {
  const { t } = useUiTranslation()
  const { state } = useDesignerContext()
  const { rendered, indentWidth } = useDesignerDnd()

  const ids = rendered.map((item) => item.id)
  const isEmpty = state.root.children.length === 0

  return (
    <ScrollArea className="h-full bg-muted/30">
      <div className="min-w-fit p-2">
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-0.5">
            {rendered.map((flat) => (
              <SchemaTreeNode key={flat.id} flat={flat} />
            ))}
          </div>
        </SortableContext>

        {isEmpty && (
          <div
            className="mt-1 flex flex-col items-center gap-1.5 rounded-md border border-dashed border-border bg-background/60 px-4 py-8 text-center"
            style={{ marginLeft: indentWidth + 6 }}
          >
            <MousePointerClick className="size-5 text-muted-foreground/60" />
            <p className="text-xs font-medium text-foreground">
              {t('ui.jsonSchemaDesigner.emptyTitle', 'No properties yet')}
            </p>
            <p className="max-w-56 text-[11px] text-muted-foreground">
              {t(
                'ui.jsonSchemaDesigner.emptyHint',
                'Drag a type from the toolbox onto the root, or click a type to add it.',
              )}
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
