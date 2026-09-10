'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { type ToolboxItemDef } from '../json-schema-designer-types'
import { useDesignerContext } from '../json-schema-designer-context'
import { canAcceptChild, findParent } from '../lib/schema-node'
import { TOOLBOX_CATEGORIES, TOOLBOX_ITEMS } from '../lib/toolbox-items'
import { ToolboxItem } from './toolbox-item'

/** Left pane: a categorised palette of schema types. */
export function SchemaToolbox() {
  const { t } = useUiTranslation()
  const { state, selectedNode, readOnly, dispatch } = useDesignerContext()

  const grouped = useMemo(
    () =>
      TOOLBOX_CATEGORIES.map((category) => ({
        category,
        items: TOOLBOX_ITEMS.filter((item) => item.category === category),
      })),
    [],
  )

  /** Resolve the drop target for a click-to-add and dispatch the insert. */
  const addFromClick = (item: ToolboxItemDef) => {
    if (readOnly) return

    if (selectedNode && canAcceptChild(selectedNode)) {
      dispatch({
        type: 'ADD_NODE',
        payload: { parentId: selectedNode.id, template: item.template },
      })

      return
    }

    if (selectedNode && selectedNode.id !== state.root.id) {
      const parent = findParent(state.root, selectedNode.id)

      if (parent && canAcceptChild(parent)) {
        const index = parent.children.findIndex(
          (child) => child.id === selectedNode.id,
        )

        dispatch({
          type: 'ADD_NODE',
          payload: {
            parentId: parent.id,
            template: item.template,
            index: index + 1,
          },
        })

        return
      }
    }

    if (canAcceptChild(state.root)) {
      dispatch({
        type: 'ADD_NODE',
        payload: { parentId: state.root.id, template: item.template },
      })
    }
  }

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('ui.jsonSchemaDesigner.toolbox', 'Toolbox')}
        </h2>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 p-2">
          {grouped.map((group) => (
            <div key={group.category} className="space-y-1">
              <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.category}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <ToolboxItem
                    key={item.id}
                    item={item}
                    onAdd={addFromClick}
                    disabled={readOnly}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-border px-3 py-2">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          {t(
            'ui.jsonSchemaDesigner.toolboxHint',
            'Drag a type onto the tree, or click to add it to the selected node.',
          )}
        </p>
      </div>
    </div>
  )
}
