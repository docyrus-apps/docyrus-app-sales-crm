export interface Adjustments {
  brightness: number
  saturation: number
  hue: number
  contrast: number
}

export type EditorMode =
  | 'crop'
  | 'brightness'
  | 'saturation'
  | 'contrast'
  | 'hue'

export type StencilShape = 'rectangle' | 'circle'

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  hue: 0,
  saturation: 0,
  contrast: 0,
}
