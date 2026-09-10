'use client'

// @ts-nocheck
/* eslint-disable */
import { SlidersHorizontal, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { useDesignerContext } from '../adaptive-card-designer-context'
import { PanelShell } from '../layout/panel-shell'
import { PropertyEditorRouter } from '../property-editors/property-editor-router'

export function PropertiesPanel() {
  const { state, selectedNode, dispatch } = useDesignerContext()
  const { readOnly } = state

  return (
    <PanelShell
      title={
        <>
          <SlidersHorizontal className="size-3 shrink-0" />
          Element Properties
        </>
      }
      rightSlot={
        !readOnly && selectedNode && selectedNode.type !== '__root' ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-destructive"
            title="Delete element"
            onClick={() =>
              dispatch({ type: 'REMOVE_NODE', id: selectedNode.__designerId })
            }
          >
            <Trash2 className="size-3" />
          </Button>
        ) : null
      }
    >
      {selectedNode ? (
        <div>
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground">
              {selectedNode.type === '__root'
                ? 'AdaptiveCard'
                : selectedNode.type}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {Object.values(selectedNode.slots).reduce(
                (sum, s) => sum + s.length,
                0,
              )}{' '}
              children
            </span>
          </div>
          {/*
           * `fieldset disabled` is the simplest way to disable every input,
           * select, switch, and button rendered by the per-type property
           * editors without threading a `readOnly` prop through each one.
           */}
          <fieldset disabled={readOnly} className="contents">
            <PropertyEditorRouter node={selectedNode} />
          </fieldset>
        </div>
      ) : (
        <p className="px-3 py-3 text-xs text-muted-foreground">
          Select an element on the canvas or in the structure tree to edit its
          properties.
        </p>
      )}
    </PanelShell>
  )
}
