import { useTheme } from '@docyrus/theme-provider'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export function ThemeSelector() {
  const { colorTheme, setColorTheme, availableThemes } = useTheme()

  return (
    <Select value={colorTheme} onValueChange={setColorTheme}>
      <SelectTrigger className="h-8 w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableThemes.map(theme => (
          <SelectItem key={theme.id} value={theme.id}>
            {theme.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
