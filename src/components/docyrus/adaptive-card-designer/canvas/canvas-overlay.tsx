'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import { useDroppable } from '@dnd-kit/core'

import { cn } from '@/lib/utils'

import { useDesignerContext } from '../adaptive-card-designer-context'
import { slotDropId, useDesignerDnd } from '../dnd/designer-dnd'
import { canAccept } from '../dnd/drop-rules'
import { findLocation, findNode } from '../lib/node-traversal'
import { type CanvasNodeRect } from './use-canvas-rects'

interface CanvasOverlayProps {
  rects: CanvasNodeRect[]
}

interface DropZoneRect {
  key: string
  parentId: string
  parentType: string
  slot: string
  index: number
  top: number
  left: number
  width: number
  height: number
}

/**
 * Absolute-positioned overlay drawn on top of the rendered AdaptiveCard.
 * Renders a selection ring on the currently selected node and a set of
 * drop zones inserted between consecutive rendered children of every
 * parent / slot pair the user has rendered.
 *
 * The overlay layer is pointer-events transparent; only the selection ring
 * and the drop zones capture pointer events.
 */
export function CanvasOverlay({ rects }: CanvasOverlayProps) {
  const { state, selectedNode } = useDesignerContext()
  const { activeDrag } = useDesignerDnd()

  const selectedRect = useMemo(() => {
    if (!selectedNode) return null
    if (selectedNode.type === '__root') return null

    return (
      rects.find((r) => r.designerId === selectedNode.__designerId)?.rect ??
      null
    )
  }, [rects, selectedNode])

  const dropZones = useMemo<DropZoneRect[]>(() => {
    if (!activeDrag) return []

    const groups = new Map<
      string,
      {
        parentId: string
        parentType: string
        slot: string
        rects: CanvasNodeRect[]
      }
    >()

    for (const nodeRect of rects) {
      const loc = findLocation(state.root, nodeRect.designerId)

      if (!loc) continue

      const key = `${loc.parent.__designerId}::${loc.slot}`
      const group = groups.get(key)

      if (group) {
        group.rects.push(nodeRect)
      } else {
        groups.set(key, {
          parentId: loc.parent.__designerId,
          parentType: loc.parent.type,
          slot: loc.slot,
          rects: [nodeRect],
        })
      }
    }

    const zones: DropZoneRect[] = []

    for (const group of groups.values()) {
      const parent = findNode(state.root, group.parentId)

      if (!parent) continue

      const slotChildren = parent.slots[group.slot] ?? []
      const orderedRects: CanvasNodeRect[] = []

      for (const child of slotChildren) {
        const found = group.rects.find(
          (r) => r.designerId === child.__designerId,
        )

        if (found) orderedRects.push(found)
      }

      if (orderedRects.length === 0) continue

      const firstRect = orderedRects[0]?.rect

      if (!firstRect) continue

      /*
       * Compute the hit zone for each insertion slot. Hit areas extend up to
       * `BLEED` pixels into the neighboring elements so a sloppy drop near
       * the seam still latches on, instead of forcing the user to hit a
       * razor-thin gap between rendered children. The visible insertion line
       * (rendered inside `DropZoneOverlay`) stays centered on the actual seam.
       */
      const BLEED = 14
      const MIN_HIT_HEIGHT = 18

      for (let i = 0; i <= orderedRects.length; i += 1) {
        const before = i > 0 ? orderedRects[i - 1]?.rect : null
        const after = i < orderedRects.length ? orderedRects[i]?.rect : null

        let seam: number
        let left: number
        let width: number

        if (before && after) {
          seam = (before.top + before.height + after.top) / 2
          left = Math.min(before.left, after.left)
          width =
            Math.max(before.left + before.width, after.left + after.width) -
            left
        } else if (before) {
          seam = before.top + before.height
          ;({ left, width } = before)
        } else if (after) {
          seam = after.top
          ;({ left, width } = after)
        } else {
          continue
        }

        const upBleed = before ? Math.min(BLEED, before.height / 2) : BLEED
        const downBleed = after ? Math.min(BLEED, after.height / 2) : BLEED
        const height = Math.max(MIN_HIT_HEIGHT, upBleed + downBleed)
        const top = seam - height / 2

        zones.push({
          key: `${group.parentId}::${group.slot}::${i}`,
          parentId: group.parentId,
          parentType: group.parentType,
          slot: group.slot,
          index: i,
          top,
          left,
          width,
          height,
        })
      }
    }

    return zones
  }, [rects, state.root, activeDrag])

  return (
    <div className="pointer-events-none absolute inset-0">
      {selectedRect ? (
        <div
          className="pointer-events-none absolute rounded-sm ring-2 ring-primary"
          style={{
            top: selectedRect.top - 2,
            left: selectedRect.left - 2,
            width: selectedRect.width + 4,
            height: selectedRect.height + 4,
          }}
        />
      ) : null}

      {dropZones.map((zone) => (
        <DropZoneOverlay key={zone.key} zone={zone} />
      ))}
    </div>
  )
}

function DropZoneOverlay({ zone }: { zone: DropZoneRect }) {
  const { activeDrag } = useDesignerDnd()
  const childType =
    activeDrag?.source === 'toolbox'
      ? activeDrag.item.type
      : activeDrag?.source === 'node'
        ? activeDrag.node.type
        : null
  const accepts = childType
    ? canAccept(zone.parentType, zone.slot, childType)
    : false

  const { setNodeRef, isOver } = useDroppable({
    id: slotDropId(zone.parentId, zone.slot, zone.index),
    disabled: !accepts,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'pointer-events-auto absolute flex items-center',
        !accepts && 'pointer-events-none opacity-0',
      )}
      style={{
        top: zone.top,
        left: zone.left,
        width: zone.width,
        height: zone.height,
      }}
    >
      <div
        className={cn(
          'w-full rounded transition-all duration-75',
          accepts ? 'h-0.5 bg-primary/50' : 'h-px',
          isOver && 'h-[3px] bg-primary shadow-[0_0_0_4px] shadow-primary/30',
        )}
      />
    </div>
  )
}
