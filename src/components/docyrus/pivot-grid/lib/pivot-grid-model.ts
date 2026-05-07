import {
  type PivotGridDimension,
  type PivotGridHeaderPathSegment,
  type PivotGridHeaderRow,
  type PivotGridLeafColumn,
  type PivotGridMeasure,
  type PivotGridPinPosition,
  type PivotGridRenderedCell,
  type PivotGridRenderedRow,
} from '../types'

interface PivotAxisValueNode<TData> {
  id: string
  axis: 'row' | 'column'
  depth: number
  value: unknown
  label: string
  pathKeys: Array<string>
  pathLabels: Array<string>
  pathNodeIds: Array<string>
  rawRowIndices: Array<number>
  rawRowIds: Array<string>
  children: Array<PivotAxisValueNode<TData>>
  childrenMap: Map<string, PivotAxisValueNode<TData>>
}

interface PivotAxisBuildResult<TData> {
  root: PivotAxisValueNode<TData>
  leafNodesByIndex: Array<PivotAxisValueNode<TData>>
  pathNodeIdsByIndex: Array<Array<string>>
  nodesById: Map<string, PivotAxisValueNode<TData>>
}

interface PivotAggregateMeta {
  id: string
  kind: 'leaf' | 'subtotal' | 'grand-total'
  ownerNodeId?: string
  pathLabels: Array<string>
  rawRowIndices: Array<number>
  rawRowIds: Array<string>
}

interface PivotAggregateCell {
  rawRowIndices: Array<number>
  rawRowIds: Array<string>
  sum: number
  count: number
  min: number | null
  max: number | null
}

export interface PivotGridStructure<TData> {
  data: Array<TData>
  rawRowIds: Array<string>
  rowDimensions: Array<PivotGridDimension<TData>>
  columnDimensions: Array<PivotGridDimension<TData>>
  measures: Array<PivotGridMeasure<TData>>
  rowTree: PivotAxisBuildResult<TData>
  columnTree: PivotAxisBuildResult<TData>
  rowLeafMetaByNodeId: Map<string, PivotAggregateMeta>
  rowSubtotalMetaByNodeId: Map<string, PivotAggregateMeta>
  rowGrandTotalMeta: PivotAggregateMeta
  columnLeafMetaByNodeId: Map<string, PivotAggregateMeta>
  columnSubtotalMetaByNodeId: Map<string, PivotAggregateMeta>
  columnGrandTotalMeta: PivotAggregateMeta
  allRowToggleIds: Array<string>
  allColumnToggleIds: Array<string>
  cellAccumulators: Map<string, PivotAggregateCell>
  headerDepth: number
}

export interface PivotGridViewModel<TData> {
  visibleRows: Array<PivotGridRenderedRow<TData>>
  visibleLeafColumns: Array<PivotGridLeafColumn<TData>>
}

const GRAND_TOTAL_LABEL = 'Grand Total'
const SUBTOTAL_LABEL = 'Subtotal'

function assertDimensionCount<TData>(
  dimensions: Array<PivotGridDimension<TData>>,
  axis: 'row' | 'column',
): void {
  if (dimensions.length < 1 || dimensions.length > 3) {
    throw new Error(`PivotGrid requires between 1 and 3 ${axis} dimensions.`)
  }
}

function serializePivotValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '__empty__'
  }

  if (value instanceof Date) {
    return `date:${value.toISOString()}`
  }

  switch (typeof value) {
    case 'string':
      return `string:${value}`

    case 'number':
      return `number:${value}`

    case 'boolean':
      return `boolean:${value}`

    case 'bigint':
      return `bigint:${value.toString()}`

    default:
      try {
        return `json:${JSON.stringify(value)}`
      } catch {
        return `fallback:${String(value)}`
      }
  }
}

function formatDimensionValue<TData>(
  dimension: PivotGridDimension<TData>,
  value: unknown,
): string {
  if (value === null || value === undefined || value === '') {
    return dimension.emptyLabel ?? 'Empty'
  }

  if (dimension.formatValue) {
    return dimension.formatValue(value)
  }

  if (value instanceof Date) {
    return value.toLocaleDateString()
  }

  return String(value)
}

function createRootNode<TData>(
  axis: 'row' | 'column',
): PivotAxisValueNode<TData> {
  return {
    id: `${axis}:root`,
    axis,
    depth: 0,
    value: null,
    label: '',
    pathKeys: [],
    pathLabels: [],
    pathNodeIds: [],
    rawRowIndices: [],
    rawRowIds: [],
    children: [],
    childrenMap: new Map(),
  }
}

function buildAxisTree<TData>(params: {
  axis: 'row' | 'column'
  data: Array<TData>
  dimensions: Array<PivotGridDimension<TData>>
  rawRowIds: Array<string>
}): PivotAxisBuildResult<TData> {
  const { axis, data, dimensions, rawRowIds } = params

  const root = createRootNode<TData>(axis)
  const leafNodesByIndex: Array<PivotAxisValueNode<TData>> = []
  const pathNodeIdsByIndex: Array<Array<string>> = []
  const nodesById = new Map<string, PivotAxisValueNode<TData>>([
    [root.id, root],
  ])

  data.forEach((row, rowIndex) => {
    const rawRowId = rawRowIds[rowIndex] ?? String(rowIndex)
    let current = root
    const nextPathNodeIds: Array<string> = []

    current.rawRowIndices.push(rowIndex)
    current.rawRowIds.push(rawRowId)

    dimensions.forEach((dimension, dimensionIndex) => {
      const rawValue = dimension.getValue(row)
      const serializedValue = serializePivotValue(rawValue)
      let child = current.childrenMap.get(serializedValue)

      if (!child) {
        const pathKeys = [
          ...current.pathKeys,
          `${dimension.id}:${serializedValue}`,
        ]
        const pathLabels = [
          ...current.pathLabels,
          formatDimensionValue(dimension, rawValue),
        ]
        const childId = `${axis}:${pathKeys.join('|')}`

        child = {
          id: childId,
          axis,
          depth: dimensionIndex + 1,
          value: rawValue,
          label: pathLabels[pathLabels.length - 1] ?? '',
          pathKeys,
          pathLabels,
          pathNodeIds: [...current.pathNodeIds, childId],
          rawRowIndices: [],
          rawRowIds: [],
          children: [],
          childrenMap: new Map(),
        }

        current.children.push(child)
        current.childrenMap.set(serializedValue, child)
        nodesById.set(childId, child)
      }

      child.rawRowIndices.push(rowIndex)
      child.rawRowIds.push(rawRowId)

      current = child
      nextPathNodeIds.push(child.id)
    })

    leafNodesByIndex[rowIndex] = current
    pathNodeIdsByIndex[rowIndex] = nextPathNodeIds
  })

  sortAxisNode(root, dimensions)

  return {
    root,
    leafNodesByIndex,
    pathNodeIdsByIndex,
    nodesById,
  }
}

function sortAxisNode<TData>(
  node: PivotAxisValueNode<TData>,
  dimensions: Array<PivotGridDimension<TData>>,
): void {
  const dimension = dimensions[node.depth]

  if (dimension) {
    node.children.sort((leftNode, rightNode) => {
      if (dimension.sort) {
        return dimension.sort(leftNode.value, rightNode.value)
      }

      return leftNode.label.localeCompare(rightNode.label, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    })
  }

  node.children.forEach((child) => sortAxisNode(child, dimensions))
}

function createLeafAggregateId(axis: 'row' | 'column', nodeId: string): string {
  return `${axis}:leaf:${nodeId}`
}

function createSubtotalAggregateId(
  axis: 'row' | 'column',
  nodeId: string,
): string {
  return `${axis}:subtotal:${nodeId}`
}

function createGrandTotalAggregateId(axis: 'row' | 'column'): string {
  return `${axis}:grand-total`
}

function collectAggregateMeta<TData>(params: {
  axis: 'row' | 'column'
  tree: PivotAxisBuildResult<TData>
  maxDepth: number
}): {
  leafMetaByNodeId: Map<string, PivotAggregateMeta>
  subtotalMetaByNodeId: Map<string, PivotAggregateMeta>
  grandTotalMeta: PivotAggregateMeta
  toggleIds: Array<string>
} {
  const { axis, tree, maxDepth } = params
  const leafMetaByNodeId = new Map<string, PivotAggregateMeta>()
  const subtotalMetaByNodeId = new Map<string, PivotAggregateMeta>()
  const toggleIds: Array<string> = []

  function walk(node: PivotAxisValueNode<TData>) {
    toggleIds.push(node.id)

    subtotalMetaByNodeId.set(node.id, {
      id: createSubtotalAggregateId(axis, node.id),
      kind: 'subtotal',
      ownerNodeId: node.id,
      pathLabels: [...node.pathLabels, SUBTOTAL_LABEL],
      rawRowIndices: [...node.rawRowIndices],
      rawRowIds: [...node.rawRowIds],
    })

    if (node.depth === maxDepth) {
      leafMetaByNodeId.set(node.id, {
        id: createLeafAggregateId(axis, node.id),
        kind: 'leaf',
        ownerNodeId: node.id,
        pathLabels: [...node.pathLabels],
        rawRowIndices: [...node.rawRowIndices],
        rawRowIds: [...node.rawRowIds],
      })
    }

    node.children.forEach(walk)
  }

  tree.root.children.forEach(walk)

  return {
    leafMetaByNodeId,
    subtotalMetaByNodeId,
    grandTotalMeta: {
      id: createGrandTotalAggregateId(axis),
      kind: 'grand-total',
      pathLabels: [GRAND_TOTAL_LABEL],
      rawRowIndices: [...tree.root.rawRowIndices],
      rawRowIds: [...tree.root.rawRowIds],
    },
    toggleIds,
  }
}

function getMeasureNumericValue<TData>(
  measure: PivotGridMeasure<TData>,
  row: TData,
): number | null {
  if (measure.aggregate === 'count') {
    return 1
  }

  const rawValue = measure.getValue?.(row)

  if (
    rawValue === null ||
    rawValue === undefined ||
    (typeof rawValue === 'string' && rawValue === '')
  ) {
    return null
  }

  if (typeof rawValue === 'number') {
    return Number.isFinite(rawValue) ? rawValue : null
  }

  const numericValue = Number(rawValue)

  return Number.isFinite(numericValue) ? numericValue : null
}

function getAccumulatorKey(rowId: string, columnId: string): string {
  return `${rowId}__${columnId}`
}

function getOrCreateCellAccumulator(
  map: Map<string, PivotAggregateCell>,
  rowId: string,
  columnId: string,
): PivotAggregateCell {
  const key = getAccumulatorKey(rowId, columnId)
  let accumulator = map.get(key)

  if (!accumulator) {
    accumulator = {
      rawRowIndices: [],
      rawRowIds: [],
      sum: 0,
      count: 0,
      min: null,
      max: null,
    }
    map.set(key, accumulator)
  }

  return accumulator
}

function updateAccumulator(
  accumulator: PivotAggregateCell,
  aggregate: PivotGridMeasure<unknown>['aggregate'],
  rawRowIndex: number,
  rawRowId: string,
  numericValue: number | null,
): void {
  accumulator.rawRowIndices.push(rawRowIndex)
  accumulator.rawRowIds.push(rawRowId)

  if (aggregate === 'count') {
    accumulator.count += 1

    return
  }

  if (numericValue === null) {
    return
  }

  accumulator.sum += numericValue
  accumulator.count += 1
  accumulator.min =
    accumulator.min === null
      ? numericValue
      : Math.min(accumulator.min, numericValue)
  accumulator.max =
    accumulator.max === null
      ? numericValue
      : Math.max(accumulator.max, numericValue)
}

function measureAccumulatorValue<TData>(
  measure: PivotGridMeasure<TData>,
  accumulator: PivotAggregateCell | undefined,
): number {
  if (!accumulator) return 0

  switch (measure.aggregate) {
    case 'count':
      return accumulator.count

    case 'avg':
      return accumulator.count > 0 ? accumulator.sum / accumulator.count : 0

    case 'min':
      return accumulator.min ?? 0

    case 'max':
      return accumulator.max ?? 0

    default:
      return accumulator.sum
  }
}

function formatMeasureValue<TData>(
  measure: PivotGridMeasure<TData>,
  value: number,
): string {
  if (measure.formatValue) {
    return measure.formatValue(value)
  }

  if (measure.aggregate === 'count') {
    return new Intl.NumberFormat().format(value)
  }

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value)
}

export function buildPivotGridStructure<TData>(params: {
  data: Array<TData>
  rowDimensions: Array<PivotGridDimension<TData>>
  columnDimensions: Array<PivotGridDimension<TData>>
  measures: Array<PivotGridMeasure<TData>>
  getRowId?: (row: TData, index: number) => string
}): PivotGridStructure<TData> {
  const { data, rowDimensions, columnDimensions, measures, getRowId } = params

  assertDimensionCount(rowDimensions, 'row')
  assertDimensionCount(columnDimensions, 'column')

  if (measures.length === 0) {
    throw new Error('PivotGrid requires at least one measure.')
  }

  const rawRowIds = data.map(
    (row, index) => getRowId?.(row, index) ?? String(index),
  )
  const rowTree = buildAxisTree({
    axis: 'row',
    data,
    dimensions: rowDimensions,
    rawRowIds,
  })
  const columnTree = buildAxisTree({
    axis: 'column',
    data,
    dimensions: columnDimensions,
    rawRowIds,
  })

  const rowMeta = collectAggregateMeta({
    axis: 'row',
    tree: rowTree,
    maxDepth: rowDimensions.length,
  })
  const columnMeta = collectAggregateMeta({
    axis: 'column',
    tree: columnTree,
    maxDepth: columnDimensions.length,
  })
  const cellAccumulators = new Map<string, PivotAggregateCell>()

  data.forEach((row, rowIndex) => {
    const rawRowId = rawRowIds[rowIndex] ?? String(rowIndex)
    const rowLeafNode = rowTree.leafNodesByIndex[rowIndex]
    const columnLeafNode = columnTree.leafNodesByIndex[rowIndex]

    if (!rowLeafNode || !columnLeafNode) {
      return
    }

    const rowAggregateIds = [
      createLeafAggregateId('row', rowLeafNode.id),
      ...(rowTree.pathNodeIdsByIndex[rowIndex] ?? []).map((nodeId) =>
        createSubtotalAggregateId('row', nodeId),
      ),
      createGrandTotalAggregateId('row'),
    ]
    const columnAggregateBases = [
      {
        id: createLeafAggregateId('column', columnLeafNode.id),
        kind: 'leaf' as const,
        ownerNodeId: columnLeafNode.id,
      },
      ...(columnTree.pathNodeIdsByIndex[rowIndex] ?? []).map((nodeId) => ({
        id: createSubtotalAggregateId('column', nodeId),
        kind: 'subtotal' as const,
        ownerNodeId: nodeId,
      })),
      {
        id: createGrandTotalAggregateId('column'),
        kind: 'grand-total' as const,
        ownerNodeId: undefined,
      },
    ]

    measures.forEach((measure) => {
      const measureValue = getMeasureNumericValue(measure, row)

      columnAggregateBases.forEach((columnAggregate) => {
        const columnId = `${columnAggregate.id}__${measure.id}`

        rowAggregateIds.forEach((rowAggregateId) => {
          const accumulator = getOrCreateCellAccumulator(
            cellAccumulators,
            rowAggregateId,
            columnId,
          )

          updateAccumulator(
            accumulator,
            measure.aggregate,
            rowIndex,
            rawRowId,
            measureValue,
          )
        })
      })
    })
  })

  return {
    data,
    rawRowIds,
    rowDimensions,
    columnDimensions,
    measures,
    rowTree,
    columnTree,
    rowLeafMetaByNodeId: rowMeta.leafMetaByNodeId,
    rowSubtotalMetaByNodeId: rowMeta.subtotalMetaByNodeId,
    rowGrandTotalMeta: rowMeta.grandTotalMeta,
    columnLeafMetaByNodeId: columnMeta.leafMetaByNodeId,
    columnSubtotalMetaByNodeId: columnMeta.subtotalMetaByNodeId,
    columnGrandTotalMeta: columnMeta.grandTotalMeta,
    allRowToggleIds: rowMeta.toggleIds,
    allColumnToggleIds: columnMeta.toggleIds,
    cellAccumulators,
    headerDepth: columnDimensions.length + (measures.length > 1 ? 1 : 0),
  }
}

function createRowHeaderCells<TData>(params: {
  maxDepth: number
  kind: PivotGridRenderedRow<TData>['kind']
  node?: PivotAxisValueNode<TData>
  labelOverride?: string
  canToggle?: boolean
  isExpanded?: boolean
  rawRowCount: number
}): PivotGridRenderedRow<TData>['headerCells'] {
  const {
    maxDepth,
    kind,
    node,
    labelOverride,
    canToggle = false,
    isExpanded = false,
    rawRowCount,
  } = params

  return Array.from({ length: maxDepth }, (_, index) => {
    if (!node) {
      return {
        key: `grand-total:${index}`,
        label: index === 0 ? GRAND_TOTAL_LABEL : '',
        kind: index === 0 ? kind : 'blank',
        depth: 0,
        isCurrentDepth: index === 0,
        canToggle: false,
        isExpanded: false,
        rawRowCount,
      }
    }

    if (index < node.depth - 1) {
      return {
        key: `${node.id}:ancestor:${index}`,
        label: node.pathLabels[index] ?? '',
        kind: 'blank',
        depth: index + 1,
        isCurrentDepth: false,
        canToggle: false,
        isExpanded: false,
        rawRowCount,
      }
    }

    if (index === node.depth - 1) {
      return {
        key: `${node.id}:${kind}:${index}`,
        label: labelOverride ?? node.label,
        kind,
        depth: node.depth,
        isCurrentDepth: true,
        canToggle,
        isExpanded,
        groupNodeId: canToggle ? node.id : undefined,
        rawRowCount,
        title: labelOverride ?? node.label,
      }
    }

    return {
      key: `${node.id}:blank:${index}`,
      label: '',
      kind: 'blank',
      depth: index + 1,
      isCurrentDepth: false,
      canToggle: false,
      isExpanded: false,
      rawRowCount,
    }
  })
}

function buildVisibleRows<TData>(
  structure: PivotGridStructure<TData>,
  expandedRowIds: Record<string, boolean>,
): Array<PivotGridRenderedRow<TData>> {
  const visibleRows: Array<PivotGridRenderedRow<TData>> = []
  const maxDepth = structure.rowDimensions.length

  function walk(node: PivotAxisValueNode<TData>) {
    const isExpanded = expandedRowIds[node.id] !== false
    const canToggle = node.children.length > 0

    if (node.depth < maxDepth) {
      visibleRows.push({
        id: `row:group:${node.id}`,
        kind: 'group',
        depth: node.depth,
        pathLabels: [...node.pathLabels],
        headerCells: createRowHeaderCells({
          maxDepth,
          kind: 'group',
          node,
          canToggle,
          isExpanded,
          rawRowCount: node.rawRowIndices.length,
        }),
        rawRowIndices: [...node.rawRowIndices],
        rawRowIds: [...node.rawRowIds],
        rawRowCount: node.rawRowIndices.length,
        cellMap: new Map(),
      })

      if (isExpanded) {
        node.children.forEach(walk)
      }

      visibleRows.push({
        id: createSubtotalAggregateId('row', node.id),
        kind: 'subtotal',
        depth: node.depth,
        pathLabels: [...node.pathLabels, SUBTOTAL_LABEL],
        headerCells: createRowHeaderCells({
          maxDepth,
          kind: 'subtotal',
          node,
          labelOverride: `${node.label} ${SUBTOTAL_LABEL}`,
          rawRowCount: node.rawRowIndices.length,
        }),
        rawRowIndices: [...node.rawRowIndices],
        rawRowIds: [...node.rawRowIds],
        rawRowCount: node.rawRowIndices.length,
        cellMap: new Map(),
      })

      return
    }

    visibleRows.push({
      id: createLeafAggregateId('row', node.id),
      kind: 'leaf',
      depth: node.depth,
      pathLabels: [...node.pathLabels],
      headerCells: createRowHeaderCells({
        maxDepth,
        kind: 'leaf',
        node,
        rawRowCount: node.rawRowIndices.length,
      }),
      rawRowIndices: [...node.rawRowIndices],
      rawRowIds: [...node.rawRowIds],
      rawRowCount: node.rawRowIndices.length,
      cellMap: new Map(),
    })

    visibleRows.push({
      id: createSubtotalAggregateId('row', node.id),
      kind: 'subtotal',
      depth: node.depth,
      pathLabels: [...node.pathLabels, SUBTOTAL_LABEL],
      headerCells: createRowHeaderCells({
        maxDepth,
        kind: 'subtotal',
        node,
        labelOverride: `${node.label} ${SUBTOTAL_LABEL}`,
        rawRowCount: node.rawRowIndices.length,
      }),
      rawRowIndices: [...node.rawRowIndices],
      rawRowIds: [...node.rawRowIds],
      rawRowCount: node.rawRowIndices.length,
      cellMap: new Map(),
    })
  }

  structure.rowTree.root.children.forEach(walk)

  visibleRows.push({
    id: structure.rowGrandTotalMeta.id,
    kind: 'grand-total',
    depth: 0,
    pathLabels: [GRAND_TOTAL_LABEL],
    headerCells: createRowHeaderCells({
      maxDepth,
      kind: 'grand-total',
      rawRowCount: structure.rowGrandTotalMeta.rawRowIndices.length,
    }),
    rawRowIndices: [...structure.rowGrandTotalMeta.rawRowIndices],
    rawRowIds: [...structure.rowGrandTotalMeta.rawRowIds],
    rawRowCount: structure.rowGrandTotalMeta.rawRowIndices.length,
    cellMap: new Map(),
  })

  return visibleRows
}

function createPathSegments<TData>(params: {
  structure: PivotGridStructure<TData>
  node?: PivotAxisValueNode<TData>
  kind: PivotGridLeafColumn<TData>['kind']
  expandedColumnIds: Record<string, boolean>
}): Array<PivotGridHeaderPathSegment | null> {
  const { structure, node, kind, expandedColumnIds } = params
  const segments: Array<PivotGridHeaderPathSegment | null> = Array.from(
    {
      length: structure.columnDimensions.length,
    },
    () => null,
  )

  if (!node) {
    segments[0] = {
      key: 'column:grand-total',
      label: GRAND_TOTAL_LABEL,
    }

    return segments
  }

  if (kind === 'leaf') {
    node.pathLabels.forEach((label, index) => {
      const currentNodeId = node.pathNodeIds[index]
      const currentNode = currentNodeId
        ? structure.columnTree.nodesById.get(currentNodeId)
        : undefined

      segments[index] = {
        key: `${node.id}:${index}`,
        label,
        groupNodeId: currentNodeId,
        canCollapse: Boolean(currentNode && currentNode.children.length > 0),
        isExpanded: currentNodeId
          ? expandedColumnIds[currentNodeId] !== false
          : false,
      }
    })

    return segments
  }

  if (node.depth === structure.columnDimensions.length) {
    node.pathLabels.slice(0, -1).forEach((label, index) => {
      const currentNodeId = node.pathNodeIds[index]
      const currentNode = currentNodeId
        ? structure.columnTree.nodesById.get(currentNodeId)
        : undefined

      segments[index] = {
        key: `${node.id}:${index}`,
        label,
        groupNodeId: currentNodeId,
        canCollapse: Boolean(currentNode && currentNode.children.length > 0),
        isExpanded: currentNodeId
          ? expandedColumnIds[currentNodeId] !== false
          : false,
      }
    })
    segments[structure.columnDimensions.length - 1] = {
      key: `${node.id}:subtotal:last`,
      label: `${node.label} ${SUBTOTAL_LABEL}`,
    }

    return segments
  }

  node.pathLabels.forEach((label, index) => {
    const currentNodeId = node.pathNodeIds[index]
    const currentNode = currentNodeId
      ? structure.columnTree.nodesById.get(currentNodeId)
      : undefined

    segments[index] = {
      key: `${node.id}:${index}`,
      label,
      groupNodeId: currentNodeId,
      canCollapse: Boolean(currentNode && currentNode.children.length > 0),
      isExpanded: currentNodeId
        ? expandedColumnIds[currentNodeId] !== false
        : false,
    }
  })
  segments[node.depth] = {
    key: `${node.id}:subtotal:${node.depth}`,
    label: SUBTOTAL_LABEL,
  }

  return segments
}

function createLeafColumnsForMeasureSet<TData>(params: {
  structure: PivotGridStructure<TData>
  node?: PivotAxisValueNode<TData>
  kind: PivotGridLeafColumn<TData>['kind']
  expandedColumnIds: Record<string, boolean>
}): Array<PivotGridLeafColumn<TData>> {
  const { structure, node, kind, expandedColumnIds } = params
  const baseSegments = createPathSegments({
    structure,
    node,
    kind,
    expandedColumnIds,
  })
  const baseHeaderPath = baseSegments.map((segment) => segment?.label ?? '')
  const pathLabels = node
    ? kind === 'leaf'
      ? [...node.pathLabels]
      : [...node.pathLabels, SUBTOTAL_LABEL]
    : [GRAND_TOTAL_LABEL]

  return structure.measures.map((measure) => {
    const baseId = node
      ? kind === 'leaf'
        ? createLeafAggregateId('column', node.id)
        : createSubtotalAggregateId('column', node.id)
      : createGrandTotalAggregateId('column')
    const id = `${baseId}__${measure.id}`

    return {
      id,
      ownerNodeId: node?.id,
      measure,
      kind,
      headerPath:
        structure.measures.length > 1
          ? [...baseHeaderPath, measure.label]
          : baseHeaderPath,
      headerPathSegments:
        structure.measures.length > 1
          ? [
              ...baseSegments,
              {
                key: `${id}:measure`,
                label: measure.label,
              },
            ]
          : baseSegments,
      pathLabels,
    }
  })
}

function buildVisibleLeafColumns<TData>(
  structure: PivotGridStructure<TData>,
  expandedColumnIds: Record<string, boolean>,
): Array<PivotGridLeafColumn<TData>> {
  const visibleLeafColumns: Array<PivotGridLeafColumn<TData>> = []
  const maxDepth = structure.columnDimensions.length

  function walk(node: PivotAxisValueNode<TData>) {
    const isExpanded = expandedColumnIds[node.id] !== false

    if (node.depth < maxDepth) {
      if (isExpanded) {
        node.children.forEach(walk)
      }

      visibleLeafColumns.push(
        ...createLeafColumnsForMeasureSet({
          structure,
          node,
          kind: 'subtotal',
          expandedColumnIds,
        }),
      )

      return
    }

    visibleLeafColumns.push(
      ...createLeafColumnsForMeasureSet({
        structure,
        node,
        kind: 'leaf',
        expandedColumnIds,
      }),
    )
    visibleLeafColumns.push(
      ...createLeafColumnsForMeasureSet({
        structure,
        node,
        kind: 'subtotal',
        expandedColumnIds,
      }),
    )
  }

  structure.columnTree.root.children.forEach(walk)
  visibleLeafColumns.push(
    ...createLeafColumnsForMeasureSet({
      structure,
      kind: 'grand-total',
      expandedColumnIds,
    }),
  )

  return visibleLeafColumns
}

function buildRenderedCell<TData>(params: {
  row: PivotGridRenderedRow<TData>
  column: PivotGridLeafColumn<TData>
  structure: PivotGridStructure<TData>
}): PivotGridRenderedCell<TData> {
  const { row, column, structure } = params
  const accumulator = structure.cellAccumulators.get(
    getAccumulatorKey(row.id, column.id),
  )
  const value = measureAccumulatorValue(column.measure, accumulator)

  return {
    id: getAccumulatorKey(row.id, column.id),
    rowId: row.id,
    columnId: column.id,
    measureId: column.measure.id,
    value,
    formattedValue: formatMeasureValue(column.measure, value),
    rowPath: [...row.pathLabels],
    columnPath: [...column.pathLabels],
    rawRowCount: accumulator?.rawRowIds.length ?? 0,
    rawRowIndices: [...(accumulator?.rawRowIndices ?? [])],
    rawRowIds: [...(accumulator?.rawRowIds ?? [])],
    kind: column.kind,
    isSubtotal: row.kind === 'subtotal' || column.kind === 'subtotal',
    isTotal: row.kind === 'grand-total' || column.kind === 'grand-total',
    isGrandTotal: row.kind === 'grand-total' && column.kind === 'grand-total',
  }
}

function attachCellsToRows<TData>(params: {
  rows: Array<PivotGridRenderedRow<TData>>
  columns: Array<PivotGridLeafColumn<TData>>
  structure: PivotGridStructure<TData>
}): Array<PivotGridRenderedRow<TData>> {
  const { rows, columns, structure } = params

  return rows.map((row) => {
    if (row.kind === 'group') {
      return row
    }

    const cellMap = new Map<string, PivotGridRenderedCell<TData>>()

    columns.forEach((column) => {
      const cell = buildRenderedCell({
        row,
        column,
        structure,
      })

      cellMap.set(column.id, cell)
    })

    return {
      ...row,
      cellMap,
    }
  })
}

export function buildPivotGridView<TData>(params: {
  structure: PivotGridStructure<TData>
  expandedRowIds: Record<string, boolean>
  expandedColumnIds: Record<string, boolean>
}): PivotGridViewModel<TData> {
  const { structure, expandedRowIds, expandedColumnIds } = params
  const visibleLeafColumns = buildVisibleLeafColumns(
    structure,
    expandedColumnIds,
  )
  const visibleRows = attachCellsToRows({
    rows: buildVisibleRows(structure, expandedRowIds),
    columns: visibleLeafColumns,
    structure,
  })

  return {
    visibleRows,
    visibleLeafColumns,
  }
}

export function buildPivotGridHeaderRows<TData>(params: {
  columnsById: Map<string, PivotGridLeafColumn<TData>>
  orderedColumnIds: Array<string>
  pinPositionByColumnId: Map<string, PivotGridPinPosition>
  headerDepth: number
}): Array<PivotGridHeaderRow> {
  const { columnsById, orderedColumnIds, pinPositionByColumnId, headerDepth } =
    params
  const rows: Array<PivotGridHeaderRow> = []

  for (let level = 0; level < headerDepth; level += 1) {
    const nextCells: PivotGridHeaderRow['cells'] = []
    let currentCell: PivotGridHeaderRow['cells'][number] | null = null
    let currentKey = ''

    orderedColumnIds.forEach((columnId) => {
      const column = columnsById.get(columnId)
      const segment = column?.headerPathSegments[level] ?? null
      const label = segment?.label ?? ''
      const pinPosition = pinPositionByColumnId.get(columnId) ?? false
      const nextKey = `${segment?.key ?? `${columnId}:blank:${level}`}:${pinPosition}`

      if (
        currentCell &&
        currentKey === nextKey &&
        currentCell.label === label
      ) {
        currentCell.colSpan += 1
        currentCell.columnIds.push(columnId)

        return
      }

      currentCell = {
        key: nextKey,
        label,
        level,
        columnIds: [columnId],
        colSpan: 1,
        pinPosition,
        groupNodeId: segment?.groupNodeId,
        canCollapse: segment?.canCollapse ?? false,
        isExpanded: segment?.isExpanded ?? false,
      }
      currentKey = nextKey
      nextCells.push(currentCell)
    })

    rows.push({
      id: `pivot-header-${level}`,
      level,
      cells: nextCells,
    })
  }

  return rows
}
