import { Monitor, Moon, Sun } from 'lucide-react'

import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

const MODES = [{ value: 'light' as const, icon: Sun, label: 'Light' }, { value: 'dark' as const, icon: Moon, label: 'Dark' }, { value: 'system' as const, icon: Monitor, label: 'System' }]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="inline-flex items-center gap-0.5 rounded-md bg-muted p-0.5">
      {MODES.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={cn(
            'inline-flex items-center justify-center rounded-sm px-2 py-1 text-xs font-medium transition-colors',
            theme === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}>
          <Icon className="mr-1 size-3" />
          {label}
        </button>
      ))}
    </div>
  )
}
