import { type ReactNode } from 'react'

import { type PatternStyle } from '@/lib/pattern-styles'

export type DialogContainer = 'modal' | 'sheet' | 'drawer'
export type DialogSide = 'left' | 'right' | 'top' | 'bottom'
export type DialogSize = 'sm' | 'default' | 'lg' | 'xl' | 'full'

export interface ToolbarMenuAction {
  label: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
  onClick?: () => void
}

export interface ToolbarMenuItem {
  label: string
  items: ToolbarMenuAction[]
}

export interface AwesomeDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode

  /** Container type: modal (centered), sheet (side panel), drawer (swipe-aware) */
  container?: DialogContainer
  /** Side for sheet/drawer containers */
  side?: DialogSide
  /** Size preset */
  size?: DialogSize

  /** Show pattern background */
  pattern?: boolean
  /** Pattern style variant */
  patternStyle?: PatternStyle

  /** Enable resize handles */
  resizable?: boolean
  /** Show fullscreen/maximize button in header */
  fullscreenable?: boolean
  /** Start in fullscreen mode */
  defaultFullscreen?: boolean
  /** Show minimize button in header (requires GlobalDialogProvider) */
  minimizable?: boolean

  /** Unique ID for global dialog tracking */
  dialogId?: string

  className?: string
}

export interface AwesomeDialogHeaderProps {
  children?: ReactNode
  className?: string
  /** Dialog title text */
  title?: string
  /** Optional description below the title */
  description?: string
  /** DocyrusIcon icon identifier */
  icon?: string
  /** DocyrusIcon library */
  iconLib?: string
  /** AvatarThumbnail configuration */
  avatar?: {
    name?: string
    color?: string
    icon?: string
    image?: string
  }
  /** Show close button */
  closable?: boolean
  /** Slot for action buttons before the close button */
  headerButtons?: ReactNode
  /** Custom close handler */
  onClose?: () => void
}

export interface AwesomeDialogFooterProps {
  children?: ReactNode
  className?: string
}

export interface AwesomeDialogBodyProps {
  children?: ReactNode
  className?: string
}

export interface AwesomeDialogToolbarProps {
  /** Menu items for the toolbar */
  menus?: ToolbarMenuItem[]
  /** Custom toolbar content */
  children?: ReactNode
  className?: string
}

export interface DialogState {
  dialogId: string
  minimized: boolean
  fullscreen: boolean
  zIndex: number
  title?: string
  icon?: string
}

export interface GlobalDialogContextValue {
  dialogs: Map<string, DialogState>
  register: (id: string, meta: { title?: string; icon?: string }) => void
  unregister: (id: string) => void
  minimize: (id: string) => void
  restore: (id: string) => void
  bringToFront: (id: string) => void
  toggleFullscreen: (id: string) => void
  getZIndex: (id: string) => number
  isMinimized: (id: string) => boolean
  isFullscreen: (id: string) => boolean
  minimizedDialogs: DialogState[]
}

export interface GlobalDialogProviderProps {
  children: ReactNode
  /** Persist dialog states to localStorage */
  persist?: boolean
  /** localStorage key prefix */
  storageKey?: string
}

export interface ContainerProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
  className?: string
  side?: DialogSide
  zIndex?: number
}

export const MODAL_SIZES: Record<
  DialogSize,
  { width: string; maxHeight: string }
> = {
  sm: { width: '400px', maxHeight: '70vh' },
  default: { width: '512px', maxHeight: '80vh' },
  lg: { width: '640px', maxHeight: '85vh' },
  xl: { width: '800px', maxHeight: '90vh' },
  full: { width: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 2rem)' },
}

export const SHEET_SIZES: Record<
  DialogSize,
  { horizontal: string; vertical: string; verticalWidth: string }
> = {
  sm: { horizontal: '320px', vertical: '30vh', verticalWidth: '400px' },
  default: { horizontal: '420px', vertical: '40vh', verticalWidth: '512px' },
  lg: { horizontal: '560px', vertical: '55vh', verticalWidth: '640px' },
  xl: { horizontal: '720px', vertical: '70vh', verticalWidth: '800px' },
  full: { horizontal: '100%', vertical: '100%', verticalWidth: '100%' },
}

export const RESIZE_CONSTRAINTS: Record<
  DialogSize,
  { min: number; max: number }
> = {
  sm: { min: 320, max: 600 },
  default: { min: 400, max: 800 },
  lg: { min: 500, max: 1000 },
  xl: { min: 600, max: 1200 },
  full: { min: 600, max: 9999 },
}
