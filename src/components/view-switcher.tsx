import { ChevronDown, Columns3, LayoutGrid, List } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type ViewType = 'card' | 'list' | 'kanban'

interface ViewOption {
  value: ViewType
  label: string
  icon: LucideIcon
}

const viewOptions: Array<ViewOption> = [
  { value: 'card', label: 'Card', icon: LayoutGrid },
  { value: 'list', label: 'List', icon: List },
  { value: 'kanban', label: 'Board', icon: Columns3 },
]

interface ViewSwitcherProps {
  value: ViewType
  onValueChange: (value: ViewType) => void
}

export function ViewSwitcher({ value, onValueChange }: ViewSwitcherProps) {
  const current = viewOptions.find((o) => o.value === value) ?? viewOptions[0]!

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <current.icon className="h-4 w-4" />
          <span>{current.label} view</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onValueChange(v as ViewType)}
        >
          {viewOptions.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="gap-2"
            >
              <option.icon className="h-4 w-4" />
              {option.label} view
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
