'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

import { Search, X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

import { tUi, type UiI18nLocale } from '@/lib/ui-i18n'

const searchInputVariants = cva(
  'flex items-center gap-2 rounded-md border bg-background shadow-xs transition-[color,box-shadow]',
  {
    variants: {
      variant: {
        default:
          'border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        outline:
          'border-border focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        ghost:
          'border-transparent shadow-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        default: 'h-9 px-2.5 text-sm',
        lg: 'h-11 px-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type SearchInputMode = 'debounce' | 'manual'

export interface SearchInputProps
  extends
    Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'>,
    VariantProps<typeof searchInputVariants> {
  /** Current search value (controlled). */
  value: string
  /** Called on every keystroke to update the controlled value. */
  onValueChange: (value: string) => void
  /** Called when a search should be performed (after debounce or on manual trigger). */
  onSearch: (value: string) => void
  /** Interaction mode — debounce auto-fires after delay, manual fires on Enter / icon click. */
  mode?: SearchInputMode
  /** Debounce delay in milliseconds (only used in debounce mode). */
  debounceMs?: number
  locale?: UiI18nLocale
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      variant,
      size,
      value,
      onValueChange,
      onSearch,
      placeholder,
      mode = 'debounce',
      debounceMs = 300,
      disabled = false,
      locale = 'en',
      ...props
    },
    ref,
  ) => {
    const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
    const internalRef = useRef<HTMLInputElement>(null)

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    useEffect(() => {
      return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current)
      }
    }, [])

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value

        onValueChange(next)

        if (mode === 'debounce') {
          if (debounceTimer.current) clearTimeout(debounceTimer.current)
          debounceTimer.current = setTimeout(() => {
            onSearch(next)
          }, debounceMs)
        }
      },
      [onValueChange, onSearch, mode, debounceMs],
    )

    const handleClear = useCallback(
      (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        onValueChange('')
        onSearch('')
        if (debounceTimer.current) clearTimeout(debounceTimer.current)
        internalRef.current?.focus()
      },
      [onValueChange, onSearch],
    )

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && mode === 'manual') {
          e.preventDefault()
          onSearch(value)
        }
      },
      [mode, onSearch, value],
    )

    const handleSearchClick = useCallback(
      (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        if (mode === 'manual') {
          onSearch(value)
        }
        internalRef.current?.focus()
      },
      [mode, onSearch, value],
    )

    return (
      <div
        className={cn(
          searchInputVariants({ variant, size }),
          disabled && 'pointer-events-none cursor-not-allowed opacity-50',
          className,
        )}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label={tUi(locale, 'search')}
          className={cn(
            'shrink-0 text-muted-foreground',
            mode === 'manual' &&
              !disabled &&
              'cursor-pointer hover:text-foreground',
          )}
          onClick={handleSearchClick}
          disabled={disabled}
        >
          <Search className="size-4" />
        </button>
        <input
          ref={setRefs}
          type="text"
          data-slot="input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? tUi(locale, 'searchPlaceholder')}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          {...props}
        />
        {value ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={tUi(locale, 'clearSearch')}
            className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
    )
  },
)

SearchInput.displayName = 'SearchInput'

export { SearchInput, searchInputVariants }
