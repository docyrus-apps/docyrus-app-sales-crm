'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { type UiI18nLocale } from '@/lib/ui-i18n'

import { type MegaSelectCategory, type MegaSelectItem } from './types'

export interface MegaSelectContextValue<T = unknown> {
  items: MegaSelectItem<T>[]
  filteredItems: MegaSelectItem<T>[]
  categories: MegaSelectCategory[]
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  activeCategory: string | null
  setActiveCategory: (categoryId: string | null) => void
  detailItem: MegaSelectItem<T> | null
  setDetailItem: (item: MegaSelectItem<T> | null) => void
  disabled: boolean
  loading: boolean
  forceOpenDetail: boolean
  restrictedValue: string | undefined
  defaultColor: string | undefined
  defaultIcon: string | undefined
  locale: UiI18nLocale
  searchable: boolean
  onChoose?: (value: string, item: MegaSelectItem<T>) => void
  onSelectionChange?: (
    value: string | null,
    item: MegaSelectItem<T> | null,
  ) => void
  onClose?: () => void
}

const MegaSelectContext = createContext<MegaSelectContextValue | null>(null)

export function useMegaSelect<T = unknown>() {
  const ctx = useContext(MegaSelectContext) as MegaSelectContextValue<T> | null

  if (!ctx) throw new Error('useMegaSelect must be used within <MegaSelect>')

  return ctx
}

export interface MegaSelectProviderProps<T = unknown> {
  children: ReactNode
  items: MegaSelectItem<T>[]
  categories?: MegaSelectCategory[]
  value?: string | null
  defaultValue?: string
  disabled?: boolean
  loading?: boolean
  forceOpenDetail?: boolean
  restrictedValue?: string
  defaultColor?: string
  defaultIcon?: string
  locale?: UiI18nLocale
  searchable?: boolean
  onChoose?: (value: string, item: MegaSelectItem<T>) => void
  onSelectionChange?: (
    value: string | null,
    item: MegaSelectItem<T> | null,
  ) => void
  onClose?: () => void
}

export function MegaSelectProvider<T = unknown>({
  children,
  items,
  categories = [],
  value,
  defaultValue,
  disabled = false,
  loading = false,
  forceOpenDetail = false,
  restrictedValue,
  defaultColor,
  defaultIcon,
  locale = 'en',
  searchable = true,
  onChoose,
  onSelectionChange,
  onClose,
}: MegaSelectProviderProps<T>) {
  const isControlled = value !== undefined
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    defaultValue ?? null,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<MegaSelectItem<T> | null>(null)

  const selectedId = isControlled ? (value ?? null) : internalSelectedId

  const setSelectedId = useCallback(
    (id: string | null) => {
      if (!isControlled) setInternalSelectedId(id)
      const item = id ? (items.find((i) => i.id === id) ?? null) : null

      onSelectionChange?.(id, item)
    },
    [isControlled, items, onSelectionChange],
  )

  const filteredItems = useMemo(() => {
    let result = items

    if (activeCategory) {
      result = result.filter((item) => item.categoryId === activeCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()

      result = result.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          (item.description?.toLowerCase().includes(q) ?? false),
      )
    }

    return result
  }, [items, activeCategory, searchQuery])

  const ctx = useMemo<MegaSelectContextValue<T>>(
    () => ({
      items,
      filteredItems,
      categories,
      selectedId,
      setSelectedId,
      searchQuery,
      setSearchQuery,
      activeCategory,
      setActiveCategory,
      detailItem,
      setDetailItem,
      disabled,
      loading,
      forceOpenDetail,
      restrictedValue,
      defaultColor,
      defaultIcon,
      locale,
      searchable,
      onChoose,
      onSelectionChange,
      onClose,
    }),
    [
      items,
      filteredItems,
      categories,
      selectedId,
      setSelectedId,
      searchQuery,
      activeCategory,
      detailItem,
      disabled,
      loading,
      forceOpenDetail,
      restrictedValue,
      defaultColor,
      defaultIcon,
      locale,
      searchable,
      onChoose,
      onSelectionChange,
      onClose,
    ],
  )

  return (
    <MegaSelectContext value={ctx as MegaSelectContextValue}>
      {children}
    </MegaSelectContext>
  )
}
