'use client'

import {
  type ChangeEvent,
  type HTMLAttributes,
  useCallback,
  useRef,
  useState,
} from 'react'

import { cva, type VariantProps } from 'class-variance-authority'
import {
  ContrastIcon,
  CropIcon,
  DownloadIcon,
  DropletsIcon,
  PaletteIcon,
  RotateCcwIcon,
  SunIcon,
  UploadIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react'
import {
  CircleStencil,
  Cropper,
  type CropperRef,
  CropperPreview,
  type CropperPreviewRef,
  RectangleStencil,
} from 'react-advanced-cropper'
import 'react-advanced-cropper/dist/style.css'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { AdjustableCropperBackground } from './adjustable-cropper-background'
import { AdjustablePreviewBackground } from './adjustable-preview-background'
import {
  DEFAULT_ADJUSTMENTS,
  type Adjustments,
  type EditorMode,
  type StencilShape,
} from './types'

const ZOOM_STEP = 1.25

const imageEditorVariants = cva(
  'flex flex-col overflow-hidden rounded-lg border',
  {
    variants: {
      variant: {
        default: 'border-border bg-background',
        compact: 'border-border/50 bg-muted/30',
      },
      size: {
        sm: '[&_[data-slot=image-editor-cropper]]:h-[300px]',
        default: '[&_[data-slot=image-editor-cropper]]:h-[400px]',
        lg: '[&_[data-slot=image-editor-cropper]]:h-[500px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

const ADJUSTMENT_MODES: {
  value: EditorMode
  label: string
  icon: typeof CropIcon
}[] = [
  { value: 'crop', label: 'Crop', icon: CropIcon },
  { value: 'brightness', label: 'Brightness', icon: SunIcon },
  { value: 'saturation', label: 'Saturation', icon: DropletsIcon },
  { value: 'contrast', label: 'Contrast', icon: ContrastIcon },
  { value: 'hue', label: 'Hue', icon: PaletteIcon },
]

const STENCIL_MAP = {
  rectangle: RectangleStencil,
  circle: CircleStencil,
} as const

export interface ImageEditorProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof imageEditorVariants> {
  src?: string
  onSave?: (dataUrl: string) => void
  onUpload?: (file: File) => void
  disabled?: boolean
  stencilShape?: StencilShape
  aspectRatio?: number
  minCropWidth?: number
  minCropHeight?: number
  maxCropWidth?: number
  maxCropHeight?: number
}

function ImageEditor({
  src,
  variant,
  size,
  onSave,
  onUpload,
  disabled = false,
  stencilShape = 'rectangle',
  aspectRatio,
  minCropWidth,
  minCropHeight,
  maxCropWidth,
  maxCropHeight,
  className,
  ...props
}: ImageEditorProps) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(src)
  const [mode, setMode] = useState<EditorMode>('crop')
  const [adjustments, setAdjustments] =
    useState<Adjustments>(DEFAULT_ADJUSTMENTS)

  const cropperRef = useRef<CropperRef>(null)
  const previewRef = useRef<CropperPreviewRef>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cropperEnabled = mode === 'crop'
  const hasChanges = Object.values(adjustments).some(
    (val) => Math.floor(Math.abs(val) * 100) > 0,
  )

  const onChangeValue = useCallback(
    (value: number) => {
      if (mode !== 'crop') {
        setAdjustments((prev) => ({
          ...prev,
          [mode]: value,
        }))
      }
    },
    [mode],
  )

  const onReset = useCallback(() => {
    setMode('crop')
    setAdjustments(DEFAULT_ADJUSTMENTS)
  }, [])

  const handleUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { files } = event.target

      if (files && files[0]) {
        const objectUrl = URL.createObjectURL(files[0])

        onReset()
        setImageSrc(objectUrl)
        onUpload?.(files[0])
      }

      event.target.value = ''
    },
    [onReset, onUpload],
  )

  const handleSave = useCallback(() => {
    if (cropperRef.current) {
      const dataUrl = cropperRef.current.getCanvas()?.toDataURL()

      if (dataUrl) {
        onSave?.(dataUrl)
      }
    }
  }, [onSave])

  const onUpdate = useCallback((cropper: CropperRef) => {
    previewRef.current?.update(cropper)
  }, [])

  const handleModeChange = useCallback((value: string) => {
    if (value) {
      setMode(value as EditorMode)
    }
  }, [])

  const handleZoomIn = useCallback(() => {
    cropperRef.current?.zoomImage(ZOOM_STEP)
  }, [])

  const handleZoomOut = useCallback(() => {
    cropperRef.current?.zoomImage(1 / ZOOM_STEP)
  }, [])

  const stencilProps = {
    movable: cropperEnabled,
    resizable: cropperEnabled,
    lines: cropperEnabled,
    handlers: cropperEnabled,
    overlayClassName: cn(
      'transition-colors duration-500',
      !cropperEnabled && '[color:rgba(0,0,0,0.9)]',
    ),
    ...(aspectRatio !== undefined && { aspectRatio }),
    ...(stencilShape === 'circle' &&
      aspectRatio === undefined && { aspectRatio: 1 }),
  }

  return (
    <div
      className={cn(imageEditorVariants({ variant, size, className }))}
      {...props}
    >
      <div data-slot="image-editor-cropper" className="relative bg-neutral-950">
        <Cropper
          src={imageSrc}
          ref={cropperRef}
          className="!h-full"
          stencilComponent={STENCIL_MAP[stencilShape]}
          stencilProps={stencilProps}
          backgroundWrapperProps={{
            scaleImage: cropperEnabled,
            moveImage: cropperEnabled,
          }}
          backgroundComponent={AdjustableCropperBackground}
          backgroundProps={adjustments}
          onUpdate={onUpdate}
          {...(minCropWidth !== undefined && { minWidth: minCropWidth })}
          {...(minCropHeight !== undefined && { minHeight: minCropHeight })}
          {...(maxCropWidth !== undefined && { maxWidth: maxCropWidth })}
          {...(maxCropHeight !== undefined && { maxHeight: maxCropHeight })}
        />

        {mode !== 'crop' && (
          <div className="pointer-events-auto absolute bottom-5 left-1/2 w-full max-w-[380px] -translate-x-1/2 px-6">
            <div className="flex items-center gap-3">
              <span className="min-w-8 text-right text-xs font-medium text-white/60">
                {Math.round(adjustments[mode] * 100)}
              </span>
              <Slider
                min={-100}
                max={100}
                step={1}
                value={[Math.round(adjustments[mode] * 100)]}
                onValueChange={(val) => onChangeValue((val[0] ?? 0) / 100)}
                disabled={disabled}
              />
            </div>
          </div>
        )}

        <CropperPreview
          className={cn(
            'absolute left-5 top-5 size-12 overflow-hidden border border-white/20 bg-black',
            stencilShape === 'circle' ? 'rounded-full' : 'rounded-md',
          )}
          ref={previewRef}
          backgroundComponent={AdjustablePreviewBackground}
          backgroundProps={adjustments}
        />

        <div className="absolute bottom-5 right-5 flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
            onClick={handleZoomIn}
            disabled={disabled || !imageSrc}
          >
            <ZoomInIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
            onClick={handleZoomOut}
            disabled={disabled || !imageSrc}
          >
            <ZoomOutIcon className="size-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            'absolute right-5 top-5 bg-white/10 text-white hover:bg-white/20 hover:text-white',
            !hasChanges && 'pointer-events-none opacity-0',
            'transition-opacity duration-300',
          )}
          onClick={onReset}
          disabled={disabled}
        >
          <RotateCcwIcon className="size-4" />
        </Button>
      </div>

      <div className="flex h-16 items-center justify-between border-t border-border bg-muted/30 px-3">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <UploadIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Upload image</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />

        <TooltipProvider delayDuration={300}>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={handleModeChange}
          >
            {ADJUSTMENT_MODES.map(({ value, label, icon: Icon }) => (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value={value}
                    aria-label={label}
                    disabled={disabled}
                  >
                    <Icon className="size-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ))}
          </ToggleGroup>
        </TooltipProvider>

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={disabled || !imageSrc}
              >
                <DownloadIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save image</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

export { ImageEditor, imageEditorVariants }
