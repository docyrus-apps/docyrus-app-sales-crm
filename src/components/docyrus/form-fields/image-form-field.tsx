'use client'

// @ts-nocheck
/* eslint-disable */
import {
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  CropIcon,
  ImageIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UploadCloudIcon,
} from 'lucide-react'

import { ImageEditor } from '@/components/docyrus/image-editor'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError } from '@/components/ui/field'
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableOverlay,
} from '@/components/ui/sortable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps, type StoredFileValue } from './types'

/* Types */

export type ImageValue = StoredFileValue

export interface ImageFormFieldProps extends DocyrusFormFieldProps {
  /** Enable gallery mode (multiple images in a grid) */
  gallery?: boolean
  /** Maximum number of images in gallery mode */
  maxImages?: number
  /** Enable image cropping after selection */
  cropper?: boolean
  /** Fixed aspect ratio for the cropper */
  cropAspectRatio?: number
  /** Crop stencil shape */
  stencilShape?: 'rectangle' | 'circle'
  /** Thumbnail width (CSS value or number in px) */
  thumbWidth?: string | number
  /** Thumbnail height (CSS value or number in px) */
  thumbHeight?: string | number
  /** Callback when user selects/crops an image. Consumer handles upload, returns the stored value. */
  onImageUpload?: (file: File) => Promise<ImageValue | null>
  /** Callback when an image is deleted */
  onImageDelete?: (image: ImageValue) => Promise<void>
  /** Library images shown in the picker's Library tab */
  existingImages?: ImageValue[]
}

/* Helpers */

function resolveDimension(
  value: string | number | undefined,
): string | undefined {
  if (value == null) return undefined

  return typeof value === 'number' ? `${value}px` : value
}

async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()

  return new File([blob], fileName, { type: blob.type })
}

function getPreviewUrl(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value instanceof File) return URL.createObjectURL(value)
  if (typeof value === 'object' && 'signed_url' in (value as any)) {
    return (value as ImageValue).signed_url ?? null
  }

  return null
}

function getFileName(value: unknown): string | null {
  if (!value) return null
  if (value instanceof File) return value.name
  if (typeof value === 'object' && 'file_name' in (value as any)) {
    return (value as ImageValue).file_name ?? null
  }

  return null
}

/* UploadDropZone */

function UploadDropZone({
  onFileSelected,
}: {
  onFileSelected: (file: File) => void
}) {
  const { t } = useUiTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]

      if (file && file.type.startsWith('image/')) {
        onFileSelected(file)
      }
    },
    [onFileSelected],
  )

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
      )}
    >
      <UploadCloudIcon className="size-10 text-muted-foreground/50" />
      <div className="text-center">
        <p className="text-sm font-medium">
          {t('ui.formField.imageDragDropText', 'Drag & drop an image here')}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('ui.formField.imageBrowseText', 'or click below to browse')}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        {t('ui.formField.imageBrowseButton', 'Browse files')}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]

          if (file) onFileSelected(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

/* LibraryGrid */

function LibraryGrid({
  images,
  onSelect,
  isCircle,
}: {
  images: ImageValue[]
  onSelect: (image: ImageValue) => void
  isCircle: boolean
}) {
  return (
    <div className="grid max-h-75 grid-cols-3 gap-2 overflow-y-auto">
      {images.map((img) => (
        <button
          key={img.signed_url}
          type="button"
          onClick={() => onSelect(img)}
          className={cn(
            'aspect-square overflow-hidden border transition-all hover:ring-2 hover:ring-primary',
            isCircle ? 'rounded-full' : 'rounded-md',
          )}
        >
          <img
            src={img.signed_url}
            alt={img.file_name}
            className="size-full object-cover"
          />
        </button>
      ))}
    </div>
  )
}

/* ImagePickerDialog */

function ImagePickerDialog({
  open,
  onOpenChange,
  existingImages,
  onFileSelected,
  onLibrarySelect,
  isCircle,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingImages?: ImageValue[]
  onFileSelected: (file: File) => void
  onLibrarySelect: (image: ImageValue) => void
  isCircle: boolean
}) {
  const { t } = useUiTranslation()
  const hasLibrary = existingImages && existingImages.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t('ui.formField.imageSelectTitle', 'Select Image')}
          </DialogTitle>
        </DialogHeader>
        {hasLibrary ? (
          <Tabs defaultValue="upload">
            <TabsList>
              <TabsTrigger value="upload">
                {t('ui.formField.imageUploadTab', 'Upload')}
              </TabsTrigger>
              <TabsTrigger value="library">
                {t('ui.formField.imageLibraryTab', 'Library')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-4">
              <UploadDropZone onFileSelected={onFileSelected} />
            </TabsContent>
            <TabsContent value="library" className="mt-4">
              <LibraryGrid
                images={existingImages}
                onSelect={onLibrarySelect}
                isCircle={isCircle}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="pt-2">
            <UploadDropZone onFileSelected={onFileSelected} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ImageCropperDialog */

function ImageCropperDialog({
  open,
  onOpenChange,
  src,
  stencilShape,
  aspectRatio,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  src: string | null
  stencilShape: 'rectangle' | 'circle'
  aspectRatio?: number
  onSave: (dataUrl: string) => void
}) {
  if (!src) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-2xl">
        <ImageEditor
          src={src}
          stencilShape={stencilShape}
          aspectRatio={aspectRatio}
          size="default"
          onSave={(dataUrl) => {
            onSave(dataUrl)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

/* Thumbnail */

function Thumbnail({
  src,
  alt,
  isCircle,
  style,
  className,
  children,
}: {
  src: string
  alt: string
  isCircle: boolean
  style?: CSSProperties
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden border bg-muted',
        isCircle ? 'rounded-full' : 'rounded-md',
        className,
      )}
      style={style}
    >
      <img src={src} alt={alt} className="size-full object-cover" />
      {children}
    </div>
  )
}

function ThumbnailOverlay({
  actions,
  isCircle,
}: {
  actions: { icon: typeof CropIcon; label: string; onClick: () => void }[]
  isCircle: boolean
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100',
        isCircle ? 'rounded-full' : 'rounded-md',
      )}
    >
      {actions.map(({ icon: Icon, label, onClick }) => (
        <Button
          key={label}
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-white hover:bg-white/20 hover:text-white"
          title={label}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClick}
        >
          <Icon className="size-3.5" />
        </Button>
      ))}
    </div>
  )
}

/* SingleImageDisplay */

function SingleImageDisplay({
  previewUrl,
  fileName,
  isDisabled,
  isCircle,
  uploading,
  thumbStyle,
  hasCropper,
  onChangeClick,
  onCropClick,
  onDeleteClick,
}: {
  previewUrl: string | null
  fileName: string | null
  isDisabled: boolean
  isCircle: boolean
  uploading: boolean
  thumbStyle: CSSProperties
  hasCropper: boolean
  onChangeClick: () => void
  onCropClick: () => void
  onDeleteClick: () => void
}) {
  const { t } = useUiTranslation()

  if (uploading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center border bg-muted',
          isCircle ? 'rounded-full' : 'rounded-md',
        )}
        style={thumbStyle}
      >
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!previewUrl) {
    return (
      <button
        type="button"
        onClick={onChangeClick}
        disabled={isDisabled}
        className={cn(
          'flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-colors',
          'text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground',
          'disabled:pointer-events-none disabled:opacity-50',
          isCircle ? 'rounded-full' : 'rounded-md',
        )}
        style={thumbStyle}
      >
        <ImageIcon className="size-6" />
        <span className="text-xs">
          {t('ui.formField.imageUploadText', 'Upload image')}
        </span>
      </button>
    )
  }

  const actions: {
    icon: typeof CropIcon
    label: string
    onClick: () => void
  }[] = []

  if (!isDisabled) {
    actions.push({ icon: PencilIcon, label: 'Change', onClick: onChangeClick })
    if (hasCropper) {
      actions.push({ icon: CropIcon, label: 'Crop', onClick: onCropClick })
    }
    actions.push({ icon: Trash2Icon, label: 'Delete', onClick: onDeleteClick })
  }

  return (
    <Thumbnail
      src={previewUrl}
      alt={fileName ?? 'Image'}
      isCircle={isCircle}
      style={thumbStyle}
    >
      {actions.length > 0 && (
        <ThumbnailOverlay actions={actions} isCircle={isCircle} />
      )}
    </Thumbnail>
  )
}

/* GalleryDisplay */

function GalleryDisplay({
  images,
  isDisabled,
  isCircle,
  uploading,
  thumbStyle,
  hasCropper,
  canAdd,
  onAddClick,
  onChangeClick,
  onCropClick,
  onDeleteClick,
  onReorder,
}: {
  images: (ImageValue | File)[]
  isDisabled: boolean
  isCircle: boolean
  uploading: boolean
  thumbStyle: CSSProperties
  hasCropper: boolean
  canAdd: boolean
  onAddClick: () => void
  onChangeClick: (index: number) => void
  onCropClick: (index: number) => void
  onDeleteClick: (index: number) => void
  onReorder: (reordered: (ImageValue | File)[]) => void
}) {
  const wrappedItems = useMemo(
    () =>
      images.map((img, i) => ({
        _original: img,
        _sortId: `${getFileName(img) ?? i}-${i}`,
        _previewUrl: getPreviewUrl(img),
      })),
    [images],
  )

  return (
    <div className="flex flex-wrap gap-2">
      {images.length > 0 && (
        <Sortable
          value={wrappedItems}
          getItemValue={(item) => (item as any)._sortId}
          onValueChange={(reordered) => {
            onReorder(reordered.map((item: any) => item._original))
          }}
          orientation="mixed"
        >
          <SortableContent className="flex flex-wrap gap-2">
            {wrappedItems.map((item, index) => {
              const actions: {
                icon: typeof CropIcon
                label: string
                onClick: () => void
              }[] = []

              if (!isDisabled) {
                actions.push({
                  icon: PencilIcon,
                  label: 'Change',
                  onClick: () => onChangeClick(index),
                })
                if (hasCropper) {
                  actions.push({
                    icon: CropIcon,
                    label: 'Crop',
                    onClick: () => onCropClick(index),
                  })
                }
                actions.push({
                  icon: Trash2Icon,
                  label: 'Delete',
                  onClick: () => onDeleteClick(index),
                })
              }

              return (
                <SortableItem
                  key={item._sortId}
                  value={item._sortId}
                  asHandle
                  disabled={isDisabled}
                >
                  <Thumbnail
                    src={item._previewUrl ?? ''}
                    alt={getFileName(item._original) ?? 'Image'}
                    isCircle={isCircle}
                    style={thumbStyle}
                  >
                    {actions.length > 0 && (
                      <ThumbnailOverlay actions={actions} isCircle={isCircle} />
                    )}
                  </Thumbnail>
                </SortableItem>
              )
            })}
          </SortableContent>
          <SortableOverlay />
        </Sortable>
      )}

      {canAdd && !isDisabled && (
        <button
          type="button"
          onClick={onAddClick}
          disabled={uploading}
          className={cn(
            'flex items-center justify-center border-2 border-dashed transition-colors',
            'text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground',
            'disabled:pointer-events-none disabled:opacity-50',
            isCircle ? 'rounded-full' : 'rounded-md',
          )}
          style={thumbStyle}
        >
          {uploading ? (
            <Loader2Icon className="size-5 animate-spin" />
          ) : (
            <PlusIcon className="size-5" />
          )}
        </button>
      )}
    </div>
  )
}

/* ImageFormField */

export function ImageFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  gallery = false,
  maxImages,
  cropper = false,
  cropAspectRatio,
  stencilShape = 'rectangle',
  thumbWidth,
  thumbHeight,
  onImageUpload,
  onImageDelete,
  existingImages,
}: ImageFormFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(
    null,
  )
  const [pendingFileName, setPendingFileName] = useState<string>('image.png')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)

  const simpleFileInputRef = useRef<HTMLInputElement>(null)
  const fieldRef = useRef<any>(null)

  const isDisabled = disabled || fieldConfig.readOnly === true
  const isCircle = stencilShape === 'circle'
  const useDialog = !!(existingImages?.length || cropper)

  const thumbStyle: CSSProperties = {
    width: resolveDimension(thumbWidth) ?? (gallery ? '6rem' : '8rem'),
    height: resolveDimension(thumbHeight) ?? '6rem',
  }

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(pendingPreviewUrl)
      }
    }
  }, [pendingPreviewUrl])

  const getGalleryImages = useCallback((): (ImageValue | File)[] => {
    const val = fieldRef.current?.state?.value

    if (Array.isArray(val)) return val
    if (val instanceof File) return [val]
    if (val && typeof val === 'object' && 'signed_url' in val)
      return [val as ImageValue]

    return []
  }, [])

  const processUpload = useCallback(
    async (file: File) => {
      const field = fieldRef.current

      if (!field) return

      setUploading(true)
      try {
        if (onImageUpload) {
          const result = await onImageUpload(file)

          if (result) {
            if (gallery) {
              const current = getGalleryImages()

              if (editingIndex !== null) {
                const updated = [...current]

                updated[editingIndex] = result
                field.handleChange(updated)
              } else {
                field.handleChange([...current, result])
              }
            } else {
              field.handleChange(result)
            }
          }
        } else {
          if (gallery) {
            const current = getGalleryImages()

            field.handleChange([...current, file])
          } else {
            field.handleChange(file)
          }
        }
      } finally {
        setUploading(false)
        setEditingIndex(null)
        setPendingPreviewUrl((prev) => {
          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)

          return null
        })
      }
    },
    [onImageUpload, gallery, editingIndex, getGalleryImages],
  )

  const handleFileSelectedFromPicker = useCallback(
    (file: File) => {
      setPickerOpen(false)

      if (cropper) {
        const url = URL.createObjectURL(file)

        setPendingPreviewUrl(url)
        setPendingFileName(file.name)
        setCropperOpen(true)
      } else {
        processUpload(file)
      }
    },
    [cropper, processUpload],
  )

  const handleLibrarySelect = useCallback(
    (image: ImageValue) => {
      setPickerOpen(false)

      if (cropper) {
        setPendingPreviewUrl(image.signed_url)
        setPendingFileName(image.file_name)
        setCropperOpen(true)
      } else {
        const field = fieldRef.current

        if (!field) return

        if (gallery) {
          const current = getGalleryImages()

          if (editingIndex !== null) {
            const updated = [...current]

            updated[editingIndex] = image
            field.handleChange(updated)
          } else {
            field.handleChange([...current, image])
          }
        } else {
          field.handleChange(image)
        }
        setEditingIndex(null)
      }
    },
    [cropper, gallery, editingIndex, getGalleryImages],
  )

  const handleCropSave = useCallback(
    async (dataUrl: string) => {
      const file = await dataUrlToFile(
        dataUrl,
        `${pendingFileName.replace(/\.[^.]+$/, '')}-cropped.png`,
      )

      processUpload(file)
    },
    [pendingFileName, processUpload],
  )

  const handleSimpleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]

      if (file) {
        if (cropper) {
          const url = URL.createObjectURL(file)

          setPendingPreviewUrl(url)
          setPendingFileName(file.name)
          setCropperOpen(true)
        } else {
          processUpload(file)
        }
      }
      e.target.value = ''
    },
    [cropper, processUpload],
  )

  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => {
        fieldRef.current = field

        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid

        let singleValue: ImageValue | File | string | null = null
        let galleryImages: (ImageValue | File)[] = []

        if (gallery) {
          if (Array.isArray(field.state.value)) {
            galleryImages = field.state.value
          } else if (
            field.state.value &&
            typeof field.state.value === 'object'
          ) {
            galleryImages = [field.state.value as ImageValue | File]
          }
        } else {
          if (Array.isArray(field.state.value)) {
            singleValue = field.state.value[0] ?? null
          } else {
            singleValue = field.state.value ?? null
          }
        }

        const previewUrl = gallery ? null : getPreviewUrl(singleValue)
        const fileName = gallery ? null : getFileName(singleValue)
        const canAdd = !maxImages || galleryImages.length < maxImages

        const openPicker = (index?: number) => {
          setEditingIndex(index ?? null)
          if (useDialog) {
            setPickerOpen(true)
          } else {
            simpleFileInputRef.current?.click()
          }
        }

        const handleCropExisting = (index?: number) => {
          const src =
            index !== undefined
              ? getPreviewUrl(galleryImages[index])
              : getPreviewUrl(singleValue)

          if (src) {
            setEditingIndex(index ?? null)
            setPendingPreviewUrl(src)
            setPendingFileName(
              (index !== undefined
                ? getFileName(galleryImages[index])
                : getFileName(singleValue)) ?? 'image.png',
            )
            setCropperOpen(true)
          }
        }

        const handleDelete = async (index?: number) => {
          if (gallery && index !== undefined) {
            const img = galleryImages[index]

            if (img && !(img instanceof File) && onImageDelete)
              await onImageDelete(img)
            field.handleChange(galleryImages.filter((_, i) => i !== index))
          } else {
            const val = singleValue

            if (
              val &&
              typeof val === 'object' &&
              !(val instanceof File) &&
              onImageDelete
            ) {
              await onImageDelete(val as ImageValue)
            }
            field.handleChange(null)
          }
        }

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel htmlFor={field.name} required={required}>
              {fieldConfig.name}
            </FormFieldLabel>

            {gallery ? (
              <GalleryDisplay
                images={galleryImages}
                isDisabled={isDisabled}
                isCircle={isCircle}
                uploading={uploading}
                thumbStyle={thumbStyle}
                hasCropper={cropper}
                canAdd={canAdd}
                onAddClick={() => openPicker()}
                onChangeClick={(i) => openPicker(i)}
                onCropClick={(i) => handleCropExisting(i)}
                onDeleteClick={(i) => handleDelete(i)}
                onReorder={(reordered) => {
                  field.handleChange(reordered)
                }}
              />
            ) : (
              <SingleImageDisplay
                previewUrl={previewUrl}
                fileName={fileName}
                isDisabled={isDisabled}
                isCircle={isCircle}
                uploading={uploading}
                thumbStyle={thumbStyle}
                hasCropper={cropper}
                onChangeClick={() => openPicker()}
                onCropClick={() => handleCropExisting()}
                onDeleteClick={() => handleDelete()}
              />
            )}

            {/* Simple file input for non-dialog mode */}
            <input
              ref={simpleFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSimpleFileSelect}
            />

            {/* Picker dialog */}
            <ImagePickerDialog
              open={pickerOpen}
              onOpenChange={setPickerOpen}
              existingImages={existingImages}
              onFileSelected={handleFileSelectedFromPicker}
              onLibrarySelect={handleLibrarySelect}
              isCircle={isCircle}
            />

            {/* Cropper dialog */}
            {cropper && (
              <ImageCropperDialog
                open={cropperOpen}
                onOpenChange={setCropperOpen}
                src={pendingPreviewUrl}
                stencilShape={stencilShape}
                aspectRatio={cropAspectRatio}
                onSave={handleCropSave}
              />
            )}

            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}
