'use client'

// @ts-nocheck
/* eslint-disable */
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'

import { ChevronDown, ChevronUp, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAsRef } from '@/hooks/use-as-ref'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { type SearchState } from './types'
import { useDebouncedCallback } from './hooks/use-debounced-callback'

type DataGridSearchProps = SearchState

export const DataGridSearch = memo(DataGridSearchImpl, (prev, next) => {
  if (prev.searchOpen !== next.searchOpen) return false

  if (!next.searchOpen) return true

  if (
    prev.searchQuery !== next.searchQuery ||
    prev.matchIndex !== next.matchIndex
  ) {
    return false
  }

  if (prev.searchMatches.length !== next.searchMatches.length) return false

  for (let i = 0; i < prev.searchMatches.length; i++) {
    const prevMatch = prev.searchMatches[i]
    const nextMatch = next.searchMatches[i]

    if (!prevMatch || !nextMatch) return false

    if (
      prevMatch.rowIndex !== nextMatch.rowIndex ||
      prevMatch.columnId !== nextMatch.columnId
    ) {
      return false
    }
  }

  return true
})

function DataGridSearchImpl({
  searchMatches,
  matchIndex,
  searchOpen,
  onSearchOpenChange,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onNavigateToNextMatch,
  onNavigateToPrevMatch,
}: DataGridSearchProps) {
  const { t } = useUiTranslation()
  const propsRef = useAsRef({
    onSearchOpenChange,
    onSearchQueryChange,
    onSearch,
    onNavigateToNextMatch,
    onNavigateToPrevMatch,
  })

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [searchOpen])

  useEffect(() => {
    if (!searchOpen) return

    function onEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        propsRef.current.onSearchOpenChange(false)
      }
    }

    document.addEventListener('keydown', onEscape)

    return () => document.removeEventListener('keydown', onEscape)
  }, [searchOpen, propsRef])

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      event.stopPropagation()

      if (event.key === 'Enter') {
        event.preventDefault()
        if (event.shiftKey) {
          propsRef.current.onNavigateToPrevMatch()
        } else {
          propsRef.current.onNavigateToNextMatch()
        }
      }
    },
    [propsRef],
  )

  const debouncedSearch = useDebouncedCallback((query: string) => {
    propsRef.current.onSearch(query)
  }, 150)

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target

      propsRef.current.onSearchQueryChange(value)
      debouncedSearch(value)
    },
    [propsRef, debouncedSearch],
  )

  const onTriggerPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const { target } = event

      if (!(target instanceof HTMLElement)) return
      if (target.hasPointerCapture(event.pointerId)) {
        target.releasePointerCapture(event.pointerId)
      }

      /*
       * Only prevent default if we're not clicking on the input
       * This allows text selection in the input while still preventing focus stealing elsewhere
       */
      if (
        event.button === 0 &&
        event.ctrlKey === false &&
        event.pointerType === 'mouse' &&
        !(event.target instanceof HTMLInputElement)
      ) {
        event.preventDefault()
      }
    },
    [],
  )

  const onPrevMatchPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => onTriggerPointerDown(event),
    [onTriggerPointerDown],
  )

  const onNextMatchPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => onTriggerPointerDown(event),
    [onTriggerPointerDown],
  )

  const onClose = useCallback(() => {
    propsRef.current.onSearchOpenChange(false)
  }, [propsRef])

  const onPrevMatch = useCallback(() => {
    propsRef.current.onNavigateToPrevMatch()
  }, [propsRef])

  const onNextMatch = useCallback(() => {
    propsRef.current.onNavigateToNextMatch()
  }, [propsRef])

  if (!searchOpen) return null

  return (
    <div
      role="search"
      data-slot="grid-search"
      className="fade-in-0 slide-in-from-top-2 absolute inset-e-4 top-4 z-50 flex animate-in flex-col gap-2 rounded-lg border bg-background p-2 shadow-lg"
    >
      <div className="flex items-center gap-2">
        <Input
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={t('ui.dataGrid.findInTable', 'Find in table...')}
          className="h-8 w-64"
          ref={inputRef}
          value={searchQuery}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <div className="flex items-center gap-1">
          <Button
            aria-label={t('ui.dataGrid.previousMatch', 'Previous match')}
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onPrevMatch}
            onPointerDown={onPrevMatchPointerDown}
            disabled={searchMatches.length === 0}
          >
            <ChevronUp />
          </Button>
          <Button
            aria-label={t('ui.dataGrid.nextMatch', 'Next match')}
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onNextMatch}
            onPointerDown={onNextMatchPointerDown}
            disabled={searchMatches.length === 0}
          >
            <ChevronDown />
          </Button>
          <Button
            aria-label={t('ui.dataGrid.closeSearch', 'Close search')}
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-1 whitespace-nowrap text-muted-foreground text-xs">
        {searchMatches.length > 0 ? (
          <span>
            {t(
              'ui.dataGrid.searchMatches',
              'Showing first {max} matches. Refine search to narrow results.',
            )
              .replace('{current}', String(matchIndex + 1))
              .replace('{total}', String(searchMatches.length))}
          </span>
        ) : searchQuery ? (
          <span>{t('ui.dataGrid.noResults', 'No results')}</span>
        ) : (
          <span>{t('ui.dataGrid.enterText', 'Enter text...')}</span>
        )}
      </div>
    </div>
  )
}
