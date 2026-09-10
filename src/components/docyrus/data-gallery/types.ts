export type DataGalleryCardConfigSerializable = Record<string, unknown>

export interface DataGalleryDisplayConfig {
  variant?: string
  density?: string
  coverStyle?: string
  columnCount?: number
  [key: string]: unknown
}
