'use client'

import { useCallback, useMemo, useState, type ComponentProps } from 'react'

import { type Table } from '@tanstack/react-table'

import {
  DataGridToolbar,
  captureViewSnapshot,
  getGeneratedViewId,
  type SavedDataGridView,
} from '@/components/docyrus/data-grid'
import { DataGridViewSelect } from '@/components/docyrus/data-grid-view-select'
import { SearchInput } from '@/components/docyrus/search-input'

interface DataGridStandardToolbarProps<TData> extends ComponentProps<'div'> {
  table: Table<TData>
  searchPlaceholder?: string
}

export function DataGridStandardToolbar<TData>({
  table,
  searchPlaceholder = 'Search...',
  className,
  ...props
}: DataGridStandardToolbarProps<TData>) {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [views, setViews] = useState<Array<SavedDataGridView>>(() => [
    {
      id: 'default-view',
      name: 'All',
      ...captureViewSnapshot(table),
    },
  ])
  const [activeViewId, setActiveViewId] = useState('default-view')

  const onSearch = useCallback(
    (value: string) => {
      const nextValue = value.trim()
      table.setGlobalFilter(nextValue.length > 0 ? nextValue : undefined)
    },
    [table],
  )

  const onViewChange = useCallback((view: SavedDataGridView) => {
    setActiveViewId(view.id)
  }, [])

  const onViewSave = useCallback((view: SavedDataGridView) => {
    setViews((prevViews) =>
      prevViews.map((item) => (item.id === view.id ? view : item)),
    )
  }, [])

  const onViewCreate = useCallback(
    (
      view: SavedDataGridView,
      position?: { afterViewId?: string; beforeViewId?: string },
    ) => {
      const nextView: SavedDataGridView = {
        ...view,
        id: view.id || getGeneratedViewId(),
      }

      setViews((prevViews) => {
        const existingIndex = prevViews.findIndex(
          (item) => item.id === nextView.id,
        )

        if (existingIndex >= 0) {
          const updated = [...prevViews]
          updated[existingIndex] = nextView

          return updated
        }

        if (!position) return [...prevViews, nextView]

        const afterIndex = position.afterViewId
          ? prevViews.findIndex((item) => item.id === position.afterViewId)
          : -1

        if (afterIndex >= 0) {
          return [
            ...prevViews.slice(0, afterIndex + 1),
            nextView,
            ...prevViews.slice(afterIndex + 1),
          ]
        }

        const beforeIndex = position.beforeViewId
          ? prevViews.findIndex((item) => item.id === position.beforeViewId)
          : -1

        if (beforeIndex >= 0) {
          return [
            ...prevViews.slice(0, beforeIndex),
            nextView,
            ...prevViews.slice(beforeIndex),
          ]
        }

        return [...prevViews, nextView]
      })
      setActiveViewId(nextView.id)
    },
    [],
  )

  const onViewDelete = useCallback(
    (viewId: string) => {
      setViews((prevViews) => {
        const remainingViews = prevViews.filter((view) => view.id !== viewId)

        if (remainingViews.length === 0) {
          const fallbackView: SavedDataGridView = {
            id: getGeneratedViewId(),
            name: 'All',
            ...captureViewSnapshot(table),
          }

          setActiveViewId(fallbackView.id)

          return [fallbackView]
        }

        if (activeViewId === viewId) {
          setActiveViewId(remainingViews[0].id)
        }

        return remainingViews
      })
    },
    [activeViewId, table],
  )

  const startContent = useMemo(
    () => (
      <>
        <DataGridViewSelect
          table={table}
          variant="horizontal-tabs"
          views={views}
          activeViewId={activeViewId}
          onViewChange={onViewChange}
          onViewSave={onViewSave}
          onViewDelete={onViewDelete}
          onViewCreate={onViewCreate}
          editable
        />
        <SearchInput
          value={searchKeyword}
          onValueChange={setSearchKeyword}
          onSearch={onSearch}
          placeholder={searchPlaceholder}
          size="sm"
          className="w-56 min-w-40"
        />
      </>
    ),
    [
      activeViewId,
      onSearch,
      onViewChange,
      onViewCreate,
      onViewDelete,
      onViewSave,
      searchKeyword,
      searchPlaceholder,
      table,
      views,
    ],
  )

  return (
    <DataGridToolbar
      table={table}
      enableView={false}
      enableDisplayMode
      enableGroup
      startContent={startContent}
      className={className}
      {...props}
    />
  )
}
