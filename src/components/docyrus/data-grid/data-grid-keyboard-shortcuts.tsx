'use client'

import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'

import { SearchIcon, XIcon } from 'lucide-react'

import { useDirection } from '@/components/ui/direction'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Separator } from '@/components/ui/separator'

import { useUiTranslation } from '@/lib/use-ui-translation'

const SHORTCUT_KEY = '/'

interface ShortcutGroup {
  title: string
  shortcuts: Array<{
    keys: Array<string>
    description: string
  }>
}

interface DataGridKeyboardShortcutsProps {
  enableSearch?: boolean
  enableUndoRedo?: boolean
  enablePaste?: boolean
  enableRowAdd?: boolean
  enableRowsDelete?: boolean
}

export const DataGridKeyboardShortcuts = memo(
  DataGridKeyboardShortcutsImpl,
  (prev, next) => {
    return (
      prev.enableSearch === next.enableSearch &&
      prev.enableUndoRedo === next.enableUndoRedo &&
      prev.enablePaste === next.enablePaste &&
      prev.enableRowAdd === next.enableRowAdd &&
      prev.enableRowsDelete === next.enableRowsDelete
    )
  },
)

function DataGridKeyboardShortcutsImpl({
  enableSearch = false,
  enableUndoRedo = false,
  enablePaste = false,
  enableRowAdd = false,
  enableRowsDelete = false,
}: DataGridKeyboardShortcutsProps) {
  const { t } = useUiTranslation()
  const dir = useDirection()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isMac =
    typeof navigator !== 'undefined'
      ? /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
      : false

  const modKey = isMac ? '⌘' : 'Ctrl'

  const onOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setInput('')
    }
  }, [])

  const onOpenAutoFocus = useCallback((event: Event) => {
    event.preventDefault()
    inputRef.current?.focus()
  }, [])

  const onInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value)
  }, [])

  const shortcutGroups: Array<ShortcutGroup> = useMemo(
    () => [
      {
        title: t('ui.dataGrid.navigate', 'Navigate between cells'),
        shortcuts: [
          {
            keys: ['↑', '↓', '←', '→'],
            description: t('ui.dataGrid.navigate', 'Navigate between cells'),
          },
          {
            keys: ['Tab'],
            description: t('ui.dataGrid.moveToNextCell', 'Move to next cell'),
          },
          {
            keys: ['Shift', 'Tab'],
            description: t(
              'ui.dataGrid.moveToPreviousCell',
              'Move to previous cell',
            ),
          },
          {
            keys: ['Home'],
            description: t(
              'ui.dataGrid.moveToFirstColumn',
              'Move to first column',
            ),
          },
          {
            keys: ['End'],
            description: t(
              'ui.dataGrid.moveToLastColumn',
              'Move to last column',
            ),
          },
          {
            keys: [modKey, '↑'],
            description: t(
              'ui.dataGrid.moveToFirstRow',
              'Move to first row (same column)',
            ),
          },
          {
            keys: [modKey, '↓'],
            description: t(
              'ui.dataGrid.moveToLastRow',
              'Move to last row (same column)',
            ),
          },
          {
            keys: [modKey, '←'],
            description: t(
              'ui.dataGrid.moveToFirstColumnSameRow',
              'Move to first column (same row)',
            ),
          },
          {
            keys: [modKey, '→'],
            description: t(
              'ui.dataGrid.moveToLastColumnSameRow',
              'Move to last column (same row)',
            ),
          },
          {
            keys: [modKey, 'Home'],
            description: t('ui.dataGrid.moveToFirstCell', 'Move to first cell'),
          },
          {
            keys: [modKey, 'End'],
            description: t('ui.dataGrid.moveToLastCell', 'Move to last cell'),
          },
          {
            keys: ['PgUp'],
            description: t('ui.dataGrid.moveUpOnePage', 'Move up one page'),
          },
          {
            keys: ['PgDn'],
            description: t('ui.dataGrid.moveDownOnePage', 'Move down one page'),
          },
          {
            keys: ['⌥', '↑'],
            description: t('ui.dataGrid.scrollUpOnePage', 'Scroll up one page'),
          },
          {
            keys: ['⌥', '↓'],
            description: t(
              'ui.dataGrid.scrollDownOnePage',
              'Scroll down one page',
            ),
          },
          {
            keys: ['⌥', 'PgUp'],
            description: t(
              'ui.dataGrid.scrollLeftOnePage',
              'Scroll left one page of columns',
            ),
          },
          {
            keys: ['⌥', 'PgDn'],
            description: t(
              'ui.dataGrid.scrollRightOnePage',
              'Scroll right one page of columns',
            ),
          },
        ],
      },
      {
        title: t('ui.dataGrid.extendSelection', 'Extend selection'),
        shortcuts: [
          {
            keys: ['Shift', '↑↓←→'],
            description: t('ui.dataGrid.extendSelection', 'Extend selection'),
          },
          {
            keys: [modKey, 'Shift', '↑'],
            description: t('ui.dataGrid.selectToTop', 'Select to top of table'),
          },
          {
            keys: [modKey, 'Shift', '↓'],
            description: t(
              'ui.dataGrid.selectToBottom',
              'Select to bottom of table',
            ),
          },
          {
            keys: [modKey, 'Shift', '←'],
            description: t(
              'ui.dataGrid.selectToFirstColumn',
              'Select to first column',
            ),
          },
          {
            keys: [modKey, 'Shift', '→'],
            description: t(
              'ui.dataGrid.selectToLastColumn',
              'Select to last column',
            ),
          },
          {
            keys: [modKey, 'A'],
            description: t('ui.dataGrid.selectAllCells', 'Select all cells'),
          },
          {
            keys: [modKey, 'Click'],
            description: t(
              'ui.dataGrid.toggleCellSelection',
              'Toggle cell selection',
            ),
          },
          {
            keys: ['Shift', 'Click'],
            description: t('ui.dataGrid.selectRange', 'Select range'),
          },
          {
            keys: ['Esc'],
            description: t('ui.dataGrid.clearSelection', 'Clear selection'),
          },
        ],
      },
      {
        title: t('ui.dataGrid.startEditingCell', 'Start editing cell'),
        shortcuts: [
          {
            keys: ['Enter'],
            description: t(
              'ui.dataGrid.startEditingCell',
              'Start editing cell',
            ),
          },
          {
            keys: ['F2'],
            description: t(
              'ui.dataGrid.startEditingCell',
              'Start editing cell',
            ),
          },
          {
            keys: ['Double Click'],
            description: t(
              'ui.dataGrid.startEditingCell',
              'Start editing cell',
            ),
          },
          ...(enableRowAdd
            ? [
                {
                  keys: ['Shift', 'Enter'],
                  description: t(
                    'ui.dataGrid.insertRowBelow',
                    'Insert row below',
                  ),
                },
              ]
            : []),
          {
            keys: [modKey, 'C'],
            description: t('ui.dataGrid.copyCells', 'Copy selected cells'),
          },
          {
            keys: [modKey, 'X'],
            description: t('ui.dataGrid.cutCells', 'Cut selected cells'),
          },
          ...(enablePaste
            ? [
                {
                  keys: [modKey, 'V'],
                  description: t('ui.dataGrid.pasteCells', 'Paste cells'),
                },
              ]
            : []),
          {
            keys: ['Delete'],
            description: t('ui.dataGrid.clearCells', 'Clear selected cells'),
          },
          {
            keys: ['Backspace'],
            description: t('ui.dataGrid.clearCells', 'Clear selected cells'),
          },
          ...(enableRowsDelete
            ? [
                {
                  keys: [modKey, 'Backspace'],
                  description: t(
                    'ui.dataGrid.deleteSelectedRows',
                    'Delete selected rows',
                  ),
                },
                {
                  keys: [modKey, 'Delete'],
                  description: t(
                    'ui.dataGrid.deleteSelectedRows',
                    'Delete selected rows',
                  ),
                },
              ]
            : []),
          ...(enableUndoRedo
            ? [
                {
                  keys: [modKey, 'Z'],
                  description: t(
                    'ui.dataGrid.undoLastAction',
                    'Undo last action',
                  ),
                },
                {
                  keys: [modKey, 'Shift', 'Z'],
                  description: t(
                    'ui.dataGrid.redoLastAction',
                    'Redo last action',
                  ),
                },
              ]
            : []),
        ],
      },
      ...(enableSearch
        ? [
            {
              title: t('ui.common.search', 'Search'),
              shortcuts: [
                {
                  keys: [modKey, 'F'],
                  description: t('ui.dataGrid.openSearch', 'Open search'),
                },
                {
                  keys: ['Enter'],
                  description: t('ui.dataGrid.nextMatch', 'Next match'),
                },
                {
                  keys: ['Shift', 'Enter'],
                  description: t('ui.dataGrid.previousMatch', 'Previous match'),
                },
                {
                  keys: ['Esc'],
                  description: t('ui.dataGrid.closeSearch', 'Close search'),
                },
              ],
            },
          ]
        : []),
      {
        title: t('ui.dataGrid.filter', 'Filter'),
        shortcuts: [
          {
            keys: [modKey, 'Shift', 'F'],
            description: t(
              'ui.dataGrid.toggleFilterMenu',
              'Toggle the filter menu',
            ),
          },
          {
            keys: ['Backspace'],
            description: t(
              'ui.dataGrid.removeFilter',
              'Remove filter (when focused)',
            ),
          },
          {
            keys: ['Delete'],
            description: t(
              'ui.dataGrid.removeFilter',
              'Remove filter (when focused)',
            ),
          },
        ],
      },
      {
        title: t('ui.dataGrid.sort', 'Sort'),
        shortcuts: [
          {
            keys: [modKey, 'Shift', 'S'],
            description: t(
              'ui.dataGrid.toggleSortMenu',
              'Toggle the sort menu',
            ),
          },
          {
            keys: ['Backspace'],
            description: t(
              'ui.dataGrid.removeSortFocused',
              'Remove sort (when focused)',
            ),
          },
          {
            keys: ['Delete'],
            description: t(
              'ui.dataGrid.removeSortFocused',
              'Remove sort (when focused)',
            ),
          },
        ],
      },
      {
        title: t(
          'ui.dataGrid.showKeyboardShortcuts',
          'Show keyboard shortcuts',
        ),
        shortcuts: [
          {
            keys: [modKey, '/'],
            description: t(
              'ui.dataGrid.showKeyboardShortcuts',
              'Show keyboard shortcuts',
            ),
          },
        ],
      },
    ],
    [
      modKey,
      enableSearch,
      enableUndoRedo,
      enablePaste,
      enableRowAdd,
      enableRowsDelete,
      t,
    ],
  )

  const filteredGroups = useMemo(() => {
    if (!input.trim()) return shortcutGroups

    const query = input.toLowerCase()

    return shortcutGroups
      .map((group) => ({
        ...group,
        shortcuts: group.shortcuts.filter(
          (shortcut) =>
            shortcut.description.toLowerCase().includes(query) ||
            shortcut.keys.some((key) => key.toLowerCase().includes(query)),
        ),
      }))
      .filter((group) => group.shortcuts.length > 0)
  }, [shortcutGroups, input])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === SHORTCUT_KEY) {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={dir}
        className="max-w-2xl px-0"
        onOpenAutoFocus={onOpenAutoFocus}
        showCloseButton={false}
      >
        <DialogClose className="absolute inset-e-6 top-6" asChild>
          <Button variant="ghost" size="icon" className="size-6">
            <XIcon />
          </Button>
        </DialogClose>
        <DialogHeader className="px-6">
          <DialogTitle>
            {t('ui.dataGrid.keyboardShortcuts', 'Keyboard shortcuts')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t(
              'ui.dataGrid.keyboardShortcutsDesc',
              'Use these keyboard shortcuts to navigate and interact with the data grid more efficiently.',
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6">
          <div className="relative">
            <SearchIcon className="absolute inset-s-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={t(
                'ui.dataGrid.searchShortcuts',
                'Search shortcuts...',
              )}
              className="h-8 ps-8"
              value={input}
              onChange={onInputChange}
            />
          </div>
        </div>
        <Separator className="mx-auto data-[orientation=horizontal]:w-[calc(100%-(--spacing(12)))]" />
        <div className="h-[40vh] overflow-y-auto px-6">
          {filteredGroups.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <SearchIcon className="pointer-events-none size-6" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="font-medium text-lg tracking-tight">
                  {t('ui.dataGrid.noShortcutsFound', 'No shortcuts found')}
                </div>
                <p className="text-muted-foreground text-sm">
                  {t(
                    'ui.dataGrid.tryDifferentTerm',
                    'Try searching for a different term.',
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {filteredGroups.map((shortcutGroup) => (
                <div key={shortcutGroup.title} className="flex flex-col gap-2">
                  <h3 className="font-semibold text-foreground text-sm">
                    {shortcutGroup.title}
                  </h3>
                  <div className="divide-y divide-border rounded-md border">
                    {shortcutGroup.shortcuts.map((shortcut) => (
                      <ShortcutCard
                        key={shortcut.keys.join('-')}
                        keys={shortcut.keys}
                        description={shortcut.description}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ShortcutCard({
  keys,
  description,
}: ShortcutGroup['shortcuts'][number]) {
  return (
    <div className="flex items-center gap-4 px-3 py-2">
      <span className="flex-1 text-sm">{description}</span>
      <KbdGroup className="shrink-0">
        {keys.map((key, index) => (
          <Fragment key={key}>
            {index > 0 && (
              <span className="text-muted-foreground text-xs">+</span>
            )}
            <Kbd>{key}</Kbd>
          </Fragment>
        ))}
      </KbdGroup>
    </div>
  )
}
