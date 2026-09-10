'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode, useCallback, useState } from 'react'

import { cn } from '@/lib/utils'

import {
  type AdaptiveCardDesignerProps,
  type IAdaptiveCardAiAssistantRenderContext,
} from './adaptive-card-designer-types'
import {
  DesignerProvider,
  useDesignerContext,
} from './adaptive-card-designer-context'
import { DesignerDndProvider } from './dnd/designer-dnd'
import { DesignerLayout } from './layout/designer-layout'
import { CanvasPanel } from './panels/canvas-panel'
import { PayloadEditorPanel } from './panels/payload-editor-panel'
import { PropertiesPanel } from './panels/properties-panel'
import { SampleDataPanel } from './panels/sample-data-panel'
import { StructurePanel } from './panels/structure-panel'
import { ToolboxPanel } from './panels/toolbox-panel'
import { DesignerToolbar } from './toolbar/designer-toolbar'

function AiAssistantSlot({
  width,
  open,
  onClose,
  render,
}: {
  width: number
  open: boolean
  onClose: () => void
  render: (ctx: IAdaptiveCardAiAssistantRenderContext) => ReactNode
}) {
  const { payload, state } = useDesignerContext()

  return (
    <>
      {render({
        open,
        width,
        onClose,
        payload,
        sampleData: state.sampleData,
      })}
    </>
  )
}

/**
 * Visual designer for Microsoft Adaptive Cards 1.5 / 1.6 payloads, backed by
 * the in-repo `<AdaptiveCard>` renderer.
 *
 * Three-pane layout (toolbox · canvas · structure / properties) plus paired
 * JSON editors at the bottom for direct payload and sample-data editing.
 *
 * Phase 1: skeleton with click-to-insert toolbox, structure tree selection,
 * raw-prop editing, live canvas, payload + sample-data JSON sync, undo / redo,
 * theme + width controls. Drag-and-drop, type-specific property editors,
 * validation, and preview-mode polish land in later phases.
 */
export function AdaptiveCardDesigner({
  payload,
  defaultPayload,
  sampleData,
  defaultSampleData,
  onChange,
  hostConfig,
  customElements,
  defaultPreview,
  defaultTheme,
  defaultWidth,
  hideToolbarButtons,
  extraToolboxItems,
  height,
  className,
  readOnly,
  aiAssistantOpen,
  onAiAssistantOpenChange,
  renderAiAssistant,
}: AdaptiveCardDesignerProps = {}) {
  const [aiOpenInternal, setAiOpenInternal] = useState(false)
  const isAiOpenControlled = aiAssistantOpen !== undefined
  const aiOpen = isAiOpenControlled ? aiAssistantOpen : aiOpenInternal
  const setAiOpen = useCallback(
    (next: boolean) => {
      if (!isAiOpenControlled) setAiOpenInternal(next)
      onAiAssistantOpenChange?.(next)
    },
    [isAiOpenControlled, onAiAssistantOpenChange],
  )
  const handleAiToggle = useCallback(
    () => setAiOpen(!aiOpen),
    [aiOpen, setAiOpen],
  )
  const handleAiClose = useCallback(() => setAiOpen(false), [setAiOpen])

  const [toolboxOpen, setToolboxOpen] = useState(true)
  const handleToolboxToggle = useCallback(
    () => setToolboxOpen((prev) => !prev),
    [],
  )

  const showAiAssistantButton = typeof renderAiAssistant === 'function'
  const aiAssistantSlot = renderAiAssistant ? (
    <AiAssistantSlot
      width={320}
      open={aiOpen}
      onClose={handleAiClose}
      render={renderAiAssistant}
    />
  ) : null

  return (
    <DesignerProvider
      payload={payload}
      defaultPayload={defaultPayload}
      sampleData={sampleData}
      defaultSampleData={defaultSampleData}
      defaultPreview={defaultPreview}
      defaultTheme={defaultTheme}
      defaultWidth={defaultWidth}
      readOnly={readOnly}
      onChange={onChange}
    >
      <DesignerDndProvider extraToolboxItems={extraToolboxItems}>
        <DesignerLayout
          height={height}
          className={cn(className)}
          toolbar={
            <DesignerToolbar
              hideButtons={hideToolbarButtons}
              showAiAssistantButton={showAiAssistantButton}
              aiOpen={aiOpen}
              onAiToggle={handleAiToggle}
              toolboxOpen={toolboxOpen}
              onToolboxToggle={handleToolboxToggle}
            />
          }
          toolbox={<ToolboxPanel extraItems={extraToolboxItems} />}
          toolboxOpen={toolboxOpen}
          canvas={
            <CanvasPanel
              hostConfig={hostConfig}
              customElements={customElements}
            />
          }
          structure={<StructurePanel />}
          properties={<PropertiesPanel />}
          payloadEditor={<PayloadEditorPanel />}
          dataEditor={<SampleDataPanel />}
          aiAssistantSlot={aiAssistantSlot}
        />
      </DesignerDndProvider>
    </DesignerProvider>
  )
}

export type { AdaptiveCardDesignerProps }
