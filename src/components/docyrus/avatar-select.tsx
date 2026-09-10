'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { SparklesIcon, UploadIcon } from 'lucide-react'

import {
  type AvatarFieldMapping,
  type AvatarFieldValue,
  type AvatarImageValue,
  TAILWIND_AVATAR_COLORS,
  buildAvatarPayload,
  isEmojiIcon,
  normalizeAvatarValue,
  resolveAvatarFieldMapping,
  resolveColorCssValue,
} from '@/lib/docyrus/avatar-utils'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  allIcons,
  featuredHugeIcons,
  featuredIcons,
  hugeIcons,
} from '@/lib/docyrus/icon-libraries'

import { ImageEditor } from '@/components/docyrus/image-editor'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { AvatarThumbnail } from '@/components/docyrus/avatar-thumbnail'
const avatarSelectVariants = cva('', {
  variants: {
    editorDisplay: {
      inline: 'space-y-3',
      popover: 'inline-flex',
    },
  },
  defaultVariants: {
    editorDisplay: 'inline',
  },
})
const EMOJI_OPTIONS = [
  '\u{1F680}',
  '\u{1F525}',
  '\u26A1',
  '\u{1F3AF}',
  '\u{1F4CC}',
  '\u{1F4C1}',
  '\u{1F9E0}',
  '\u{1F6E0}\uFE0F',
  '\u{1F4CA}',
  '\u2705',
  '\u{1F5C2}\uFE0F',
  '\u2728',
  '\u{1F3A8}',
  '\u{1F4C8}',
  '\u{1F9E9}',
  '\u{1F9ED}',
]

type AvatarMode = 'icon' | 'emoji' | 'image' | 'ai'
type IconLibrary = 'fontawesome' | 'hugeicons'
const DEFAULT_TAILWIND_COLOR = 'indigo-500'

function getIconLibrary(value: string | null | undefined): IconLibrary {
  if (value?.startsWith('huge ')) return 'hugeicons'

  return 'fontawesome'
}

function deriveMode(value: AvatarFieldValue): AvatarMode {
  if (value.image?.signed_url) return 'image'
  if (value.icon) return isEmojiIcon(value.icon) ? 'emoji' : 'icon'

  return 'icon'
}

export interface AvatarSelectProps
  extends AvatarFieldMapping, VariantProps<typeof avatarSelectVariants> {
  value?: Partial<AvatarFieldValue> | null
  size?: number
  disabled?: boolean
  className?: string
  uploadImage?: (file: File) => Promise<AvatarImageValue>
  onChange?: (value: AvatarFieldValue, payload: Record<string, unknown>) => void
  onCommit?: (value: AvatarFieldValue, payload: Record<string, unknown>) => void
}

interface CropState {
  name: string
  url: string
}

export function AvatarSelect({
  value,
  size = 8,
  editorDisplay = 'inline',
  iconField,
  colorField,
  imageField,
  disabled,
  className,
  uploadImage,
  onChange,
  onCommit,
}: AvatarSelectProps) {
  const { t } = useUiTranslation()
  const resolvedFields = useMemo(
    () => resolveAvatarFieldMapping({ colorField, iconField, imageField }),
    [colorField, iconField, imageField],
  )

  const normalizedValue = useMemo(() => normalizeAvatarValue(value), [value])
  const [internalValue, setInternalValue] = useState(normalizedValue)
  const [mode, setMode] = useState<AvatarMode>(() =>
    deriveMode(normalizedValue),
  )
  const [iconSearch, setIconSearch] = useState('')
  const [iconLibrary, setIconLibrary] = useState<IconLibrary>(() =>
    getIconLibrary(normalizedValue.icon),
  )
  const [cropState, setCropState] = useState<CropState | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    queueMicrotask(() => {
      setInternalValue(normalizedValue)
      setMode((prevMode) =>
        prevMode === 'ai' ? prevMode : deriveMode(normalizedValue),
      )
      setIconLibrary(getIconLibrary(normalizedValue.icon))
    })
  }, [normalizedValue])

  const emit = useCallback(
    (nextValue: AvatarFieldValue) => {
      setInternalValue(nextValue)
      const payload = buildAvatarPayload(nextValue, resolvedFields)

      onChange?.(nextValue, payload)
      onCommit?.(nextValue, payload)
    },
    [onChange, onCommit, resolvedFields],
  )

  const handleModeChange = useCallback((nextMode: string) => {
    if (
      nextMode === 'icon' ||
      nextMode === 'emoji' ||
      nextMode === 'image' ||
      nextMode === 'ai'
    ) {
      setMode(nextMode)
    }
  }, [])

  const handleIconSelect = useCallback(
    (icon: string) => {
      const nextValue: AvatarFieldValue = {
        color: internalValue.color || DEFAULT_TAILWIND_COLOR,
        icon,
        image: null,
      }

      emit(nextValue)
    },
    [emit, internalValue.color],
  )

  const handleColorSelect = useCallback(
    (color: string) => {
      const nextValue: AvatarFieldValue = {
        color,
        icon:
          internalValue.icon ||
          (iconLibrary === 'hugeicons'
            ? featuredHugeIcons[0]
            : featuredIcons[0]) ||
          'fal star',
        image: null,
      }

      emit(nextValue)
    },
    [emit, iconLibrary, internalValue.icon],
  )

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      const nextValue: AvatarFieldValue = {
        icon: emoji,
        color: null,
        image: null,
      }

      emit(nextValue)
    },
    [emit],
  )

  const handleOpenFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const clearCropState = useCallback(() => {
    setCropState((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url)
      }

      return null
    })
  }, [])

  const handleImageFileSelected = useCallback((file: File | null) => {
    if (!file) return

    const objectUrl = URL.createObjectURL(file)

    setCropState({
      name: file.name,
      url: objectUrl,
    })
  }, [])

  const handleApplyCrop = useCallback(
    async (dataUrl: string) => {
      setIsUploadingImage(true)

      try {
        const res = await fetch(dataUrl)
        const blob = await res.blob()
        const name = cropState?.name ?? 'avatar'
        const baseName = name.replace(/\.[^.]+$/, '')
        const croppedFile = new File([blob], `${baseName}-cropped.png`, {
          type: blob.type,
        })

        const imageValue = uploadImage
          ? await uploadImage(croppedFile)
          : ({
              file_name: croppedFile.name,
              signed_url: URL.createObjectURL(croppedFile),
            } as AvatarImageValue)

        const nextValue: AvatarFieldValue = {
          color: null,
          icon: null,
          image: imageValue,
        }

        emit(nextValue)
        clearCropState()
      } finally {
        setIsUploadingImage(false)
      }
    },
    [clearCropState, cropState?.name, emit, uploadImage],
  )

  const isDisabled = disabled || isUploadingImage

  const sourceIcons = iconLibrary === 'hugeicons' ? hugeIcons : allIcons
  const featuredSource =
    iconLibrary === 'hugeicons' ? featuredHugeIcons : featuredIcons

  const visibleIcons = useMemo(() => {
    const query = iconSearch.trim().toLowerCase()

    if (!query) return featuredSource

    return sourceIcons
      .filter((iconItem) => iconItem.toLowerCase().includes(query))
      .slice(0, 120)
  }, [featuredSource, iconSearch, sourceIcons])

  const selectedIconColor = resolveColorCssValue(
    internalValue.color || DEFAULT_TAILWIND_COLOR,
  )

  const editorContent = (
    <Tabs value={mode} onValueChange={handleModeChange}>
      <TabsList className="w-full">
        <TabsTrigger value="icon" disabled={isDisabled}>
          Icon + Color
        </TabsTrigger>
        <TabsTrigger value="emoji" disabled={isDisabled}>
          Emoji
        </TabsTrigger>
        <TabsTrigger value="image" disabled={isDisabled}>
          Image
        </TabsTrigger>
        <TabsTrigger value="ai" disabled={isDisabled}>
          AI
        </TabsTrigger>
      </TabsList>

      <TabsContent value="icon" className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={iconLibrary === 'fontawesome' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIconLibrary('fontawesome')}
            disabled={isDisabled}
          >
            Font Awesome
          </Button>

          <Button
            type="button"
            variant={iconLibrary === 'hugeicons' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIconLibrary('hugeicons')}
            disabled={isDisabled}
          >
            Huge Icons
          </Button>
        </div>

        <Input
          value={iconSearch}
          onChange={(event) => setIconSearch(event.target.value)}
          placeholder={t('ui.common.searchIconPlaceholder', 'Search icon...')}
          disabled={isDisabled}
        />

        <div className="grid grid-cols-[1fr_132px] gap-3">
          <div className="space-y-2">
            <div className="grid grid-cols-6 gap-1">
              {visibleIcons.map((iconOption) => {
                const isSelected = internalValue.icon === iconOption

                return (
                  <button
                    key={iconOption}
                    type="button"
                    title={iconOption}
                    className={cn(
                      'flex h-10 w-full items-center justify-center rounded-md transition-transform',
                      isSelected ? 'scale-110' : 'hover:scale-110',
                    )}
                    onClick={() => handleIconSelect(iconOption)}
                    disabled={isDisabled}
                  >
                    <span
                      style={{ color: selectedIconColor }}
                      className={cn(
                        'inline-flex items-center justify-center',
                        isSelected ? 'opacity-100' : 'opacity-70',
                      )}
                    >
                      <DocyrusIcon icon={iconOption} className="size-7" />
                    </span>
                  </button>
                )
              })}
            </div>

            {visibleIcons.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t('ui.common.noIconsFound', 'No icons found.')}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t('ui.common.color', 'Color')}
            </p>

            <div className="max-h-63 overflow-y-auto pr-1">
              <div className="grid grid-cols-4 gap-1.5">
                {TAILWIND_AVATAR_COLORS.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    aria-label={`Pick color ${colorOption}`}
                    className={cn(
                      'relative size-6 rounded-sm transition-transform hover:scale-110',
                      internalValue.color === colorOption && 'scale-110',
                    )}
                    style={{
                      backgroundColor: resolveColorCssValue(colorOption),
                    }}
                    onClick={() => handleColorSelect(colorOption)}
                    disabled={isDisabled}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="emoji" className="space-y-3">
        <div className="grid grid-cols-8 gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={cn(
                'rounded-md border p-2 text-lg transition-colors hover:bg-accent',
                internalValue.icon === emoji && 'border-primary bg-accent',
              )}
              onClick={() => handleEmojiSelect(emoji)}
              disabled={isDisabled}
            >
              {emoji}
            </button>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="image" className="space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleOpenFilePicker}
          disabled={isDisabled}
        >
          <UploadIcon className="size-4" />
          Upload and Crop
        </Button>

        <p className="text-xs text-muted-foreground">
          Upload any image and crop to a 1:1 square thumbnail.
        </p>
      </TabsContent>

      <TabsContent value="ai" className="space-y-3">
        <Button type="button" variant="outline" disabled>
          <SparklesIcon className="size-4" />
          Generate with AI (Coming soon)
        </Button>

        <p className="text-xs text-muted-foreground">
          AI generation UI is ready for this iteration, backend generation is
          intentionally deferred.
        </p>
      </TabsContent>
    </Tabs>
  )

  return (
    <div className={cn(avatarSelectVariants({ editorDisplay }), className)}>
      {editorDisplay === 'popover' ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="rounded-md transition-transform hover:scale-105"
              disabled={isDisabled}
              aria-label={t('ui.common.changeAvatar', 'Change avatar')}
            >
              <AvatarThumbnail
                size={Math.max(4, size)}
                icon={internalValue.icon}
                color={internalValue.color}
                image={internalValue.image}
              />
            </button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="w-115 max-w-[calc(100vw-1.5rem)]"
          >
            {editorContent}
          </PopoverContent>
        </Popover>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <AvatarThumbnail
              size={Math.max(4, size)}
              icon={internalValue.icon}
              color={internalValue.color}
              image={internalValue.image}
            />

            <div className="text-xs text-muted-foreground">
              Square avatar
              <br />
              Minimum size 4 equals 16x16 px.
            </div>
          </div>

          {editorContent}
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(event) => {
          const selected = event.target.files?.[0] ?? null

          handleImageFileSelected(selected)
          event.target.value = ''
        }}
        disabled={isDisabled}
      />

      <Dialog
        open={cropState !== null}
        onOpenChange={(open) => {
          if (!open) clearCropState()
        }}
      >
        <DialogContent className="overflow-hidden p-0 sm:max-w-2xl">
          {cropState ? (
            <ImageEditor
              src={cropState.url}
              stencilShape="rectangle"
              aspectRatio={1}
              size="sm"
              onSave={(dataUrl) => {
                void handleApplyCrop(dataUrl)
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
