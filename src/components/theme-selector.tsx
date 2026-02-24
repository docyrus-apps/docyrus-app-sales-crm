import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useColorTheme } from '@/hooks/use-color-theme'
import { COLOR_THEMES } from '@/lib/themes'

export function ThemeSelector() {
  const { colorTheme, setColorTheme } = useColorTheme()

  return (
    <Select value={colorTheme} onValueChange={setColorTheme}>
      <SelectTrigger className="h-8 w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {COLOR_THEMES.map((theme) => (
          <SelectItem key={theme.id} value={theme.id}>
            {theme.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
