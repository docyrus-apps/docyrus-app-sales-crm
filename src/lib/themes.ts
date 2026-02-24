export interface ColorTheme {
  id: string
  name: string
}

export const COLOR_THEMES: Array<ColorTheme> = [
  { id: 'docyrus-default', name: 'Default' },
  { id: 'shadcn-default', name: 'Shadcn Default' },
  { id: 'astrovista', name: 'AstroVista' },
  { id: 'darkforge', name: 'Dark Forge' },
]

export const DEFAULT_COLOR_THEME = 'docyrus-default'
