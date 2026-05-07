import { ChevronDown, Columns3, LayoutGrid, List } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/animate-ui/components/buttons/button'
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
  options?: Array<ViewType>
}

export function ViewSwitcher({
  value,
  onValueChange,
  options,
}: ViewSwitcherProps) {
  const visibleOptions =
    options && options.length > 0
      ? viewOptions.filter((option) => options.includes(option.value))
      : viewOptions

  const current =
    visibleOptions.find((option) => option.value === value) ?? visibleOptions[0]

  if (!current) return null

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
          {visibleOptions.map((option) => (
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
