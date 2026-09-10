'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback } from 'react'

import { useDesignerContext } from '../../adaptive-card-designer-context'

/**
 * Returns an `update(key, value)` callback that dispatches `UPDATE_NODE` for
 * the node with the given id. When `value` is `undefined`, the existing key is
 * cleared (the reducer merges shallowly, so an explicit `undefined` removes
 * the prop from the next props bag once tree-to-card serializes it).
 */
export function useNodeUpdater(nodeId: string) {
  const { dispatch } = useDesignerContext()

  return useCallback(
    (key: string, value: unknown) => {
      dispatch({ type: 'UPDATE_NODE', id: nodeId, props: { [key]: value } })
    },
    [dispatch, nodeId],
  )
}
