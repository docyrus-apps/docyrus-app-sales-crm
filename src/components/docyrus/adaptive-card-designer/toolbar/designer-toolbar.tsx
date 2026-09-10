'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useState } from 'react'

import {
  Check,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  FilePlus,
  Maximize2,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Redo2,
  Sun,
  Undo2,
} from 'lucide-react'

import { CodyAgentToggle } from '@/components/docyrus/editor-agent'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { useDesignerContext } from '../adaptive-card-designer-context'
import {
  type DesignerTheme,
  type DesignerWidth,
  type ToolbarButtonKey,
} from '../adaptive-card-designer-types'

interface DesignerToolbarProps {
  hideButtons?: ToolbarButtonKey[]
  showAiAssistantButton?: boolean
  aiOpen?: boolean
  onAiToggle?: () => void
  toolboxOpen?: boolean
  onToolboxToggle?: () => void
}

interface ThemeOption {
  value: DesignerTheme
  label: string
  icon: typeof Sun
}

const DEFAULT_THEME_OPTION: ThemeOption = {
  value: 'auto',
  label: 'System theme',
  icon: Monitor,
}
const THEME_OPTIONS: ThemeOption[] = [
  DEFAULT_THEME_OPTION,
  { value: 'light', label: 'Light theme', icon: Sun },
  { value: 'dark', label: 'Dark theme', icon: Moon },
]

interface WidthOption {
  value: DesignerWidth
  label: string
}

const DEFAULT_WIDTH_OPTION: WidthOption = {
  value: 'standard',
  label: 'Standard (320px)',
}
const WIDTH_OPTIONS: WidthOption[] = [
  DEFAULT_WIDTH_OPTION,
  { value: 'wide', label: 'Wide (480px)' },
  { value: 'full', label: 'Full width' },
]

export function DesignerToolbar({
  hideButtons = [],
  showAiAssistantButton = false,
  aiOpen = false,
  onAiToggle,
  toolboxOpen = true,
  onToolboxToggle,
}: DesignerToolbarProps) {
  const { state, dispatch, canUndo, canRedo, payload } = useDesignerContext()
  const hidden = new Set(hideButtons)
  const [copied, setCopied] = useState(false)

  const currentTheme =
    THEME_OPTIONS.find((o) => o.value === state.theme) ?? DEFAULT_THEME_OPTION
  const currentWidth =
    WIDTH_OPTIONS.find((o) => o.value === state.width) ?? DEFAULT_WIDTH_OPTION
  const ThemeIcon = currentTheme.icon

  const handleCopy = useCallback(() => {
    void navigator.clipboard
      ?.writeText(JSON.stringify(payload, null, 2))
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      })
  }, [payload])

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full w-full items-center gap-1.5 px-2">
        {showAiAssistantButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <CodyAgentToggle
                active={aiOpen}
                aria-label="AI Assistant"
                onClick={onAiToggle}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">AI Assistant</TooltipContent>
          </Tooltip>
        )}
        {onToolboxToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={toolboxOpen ? 'secondary' : 'ghost'}
                size="icon"
                className="size-7 shrink-0"
                aria-pressed={toolboxOpen}
                aria-expanded={toolboxOpen}
                aria-label={toolboxOpen ? 'Close toolbox' : 'Open toolbox'}
                onClick={onToolboxToggle}
              >
                {toolboxOpen ? (
                  <PanelLeftClose className="size-3.5" />
                ) : (
                  <PanelLeftOpen className="size-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {toolboxOpen ? 'Close toolbox' : 'Open toolbox'}
            </TooltipContent>
          </Tooltip>
        )}
        {(showAiAssistantButton || onToolboxToggle) && (
          <span className="mx-1 h-5 w-px bg-border" />
        )}
        <span className="px-1 text-xs font-semibold text-foreground">
          Adaptive Card Designer
        </span>

        <span className="mx-1 h-5 w-px bg-border" />

        {!hidden.has('new') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={state.readOnly}
                onClick={() => dispatch({ type: 'RESET' })}
              >
                <FilePlus className="size-3.5" />
                New
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start a blank card</TooltipContent>
          </Tooltip>
        )}

        {!hidden.has('theme') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
              >
                <ThemeIcon className="size-3.5" />
                {currentTheme.label}
                <ChevronDown className="size-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={value}
                  onSelect={() => dispatch({ type: 'SET_THEME', theme: value })}
                >
                  <Icon className="size-3.5" />
                  <span className="text-xs">{label}</span>
                  {state.theme === value ? (
                    <Check className="ml-auto size-3.5" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {!hidden.has('width') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
              >
                <Maximize2 className="size-3.5" />
                {currentWidth.label}
                <ChevronDown className="size-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {WIDTH_OPTIONS.map(({ value, label }) => (
                <DropdownMenuItem
                  key={value}
                  onSelect={() => dispatch({ type: 'SET_WIDTH', width: value })}
                >
                  <span className="text-xs">{label}</span>
                  {state.width === value ? (
                    <Check className="ml-auto size-3.5" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <span className="mx-1 h-5 w-px bg-border" />

        {!hidden.has('undo') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={state.readOnly || !canUndo}
                onClick={() => dispatch({ type: 'UNDO' })}
              >
                <Undo2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
        )}

        {!hidden.has('redo') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={state.readOnly || !canRedo}
                onClick={() => dispatch({ type: 'REDO' })}
              >
                <Redo2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>
        )}

        <span className="ml-auto" />

        {!hidden.has('copy') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? 'Copied' : 'Copy payload'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy current payload to clipboard</TooltipContent>
          </Tooltip>
        )}

        {!hidden.has('preview') && (
          <Button
            variant={state.preview ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-7 gap-1 px-2 text-xs',
              state.preview && 'bg-primary text-primary-foreground',
            )}
            onClick={() => dispatch({ type: 'TOGGLE_PREVIEW' })}
          >
            {state.preview ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
            {state.preview ? 'Exit preview' : 'Preview'}
          </Button>
        )}
      </div>
    </TooltipProvider>
  )
}
