'use client'

// @ts-nocheck
/* eslint-disable */
import { type ComponentType } from 'react'

import { type DesignerNode } from '../adaptive-card-designer-types'
import { ColumnEditor } from './elements/column-editor'
import { ColumnSetEditor } from './elements/column-set-editor'
import { ContainerEditor } from './elements/container-editor'
import { ImageEditor } from './elements/image-editor'
import { RootCardEditor } from './elements/root-card-editor'
import { TextBlockEditor } from './elements/text-block-editor'
import { GenericPropsEditor } from './generic-props-editor'

/*
 * Per-type property editors are routed by `node.type`. Types not listed here
 * fall back to `GenericPropsEditor`, a generic key-value form that lets users
 * still edit the raw props bag while richer editors are being filled in across
 * Phases 3a–3f.
 */
const EDITORS: Record<string, ComponentType<{ node: DesignerNode }>> = {
  __root: RootCardEditor,
  TextBlock: TextBlockEditor,
  Image: ImageEditor,
  Container: ContainerEditor,
  Column: ColumnEditor,
  ColumnSet: ColumnSetEditor,
}

export function PropertyEditorRouter({ node }: { node: DesignerNode }) {
  const Editor = EDITORS[node.type] ?? GenericPropsEditor

  return <Editor node={node} />
}

export function hasDedicatedEditor(type: string): boolean {
  return type in EDITORS
}
