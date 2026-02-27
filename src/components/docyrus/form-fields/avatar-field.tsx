'use client'

import { useRef, useState } from 'react'

import {
  type AvatarFieldValue,
  normalizeAvatarValue,
  resolveAvatarFieldMapping,
} from '@/lib/avatar-utils'
import { AvatarSelect } from '@/components/docyrus/avatar-select'
import { AvatarThumbnail } from '@/components/docyrus/avatar-thumbnail'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { type DocyrusFormFieldProps } from './types'

export function AvatarField({
  field: fieldConfig,
  form,
  disabled,
  className,
}: DocyrusFormFieldProps) {
  const mapping = resolveAvatarFieldMapping(fieldConfig.avatarMapping)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<AvatarFieldValue | null>(null)
  const snapshotRef = useRef<{
    icon: unknown
    color: unknown
    image: unknown
  } | null>(null)

  return (
    <form.Field
      name={mapping.iconField}
      children={(iconField: any) => (
        <form.Field
          name={mapping.colorField}
          children={(colorField: any) => (
            <form.Field
              name={mapping.imageField}
              children={(imageField: any) => {
                const isReadOnly = disabled || fieldConfig.readOnly === true
                const mergedErrors = [
                  ...iconField.state.meta.errors,
                  ...colorField.state.meta.errors,
                  ...imageField.state.meta.errors,
                ].filter(Boolean)
                const isTouched =
                  iconField.state.meta.isTouched ||
                  colorField.state.meta.isTouched ||
                  imageField.state.meta.isTouched
                const isInvalid = isTouched && mergedErrors.length > 0
                const avatarValue = normalizeAvatarValue({
                  color: colorField.state.value,
                  icon: iconField.state.value,
                  image: imageField.state.value,
                })
                const displayValue = open && draft ? draft : avatarValue

                function handleOpenChange(nextOpen: boolean) {
                  if (nextOpen) {
                    snapshotRef.current = {
                      icon: iconField.state.value,
                      color: colorField.state.value,
                      image: imageField.state.value,
                    }
                    setDraft(avatarValue)
                  }

                  setOpen(nextOpen)
                }

                function handleOk() {
                  if (draft) {
                    iconField.handleChange(draft.icon)
                    colorField.handleChange(draft.color)
                    imageField.handleChange(draft.image)
                  }

                  setOpen(false)
                }

                function handleCancel() {
                  if (snapshotRef.current) {
                    iconField.handleChange(snapshotRef.current.icon)
                    colorField.handleChange(snapshotRef.current.color)
                    imageField.handleChange(snapshotRef.current.image)
                  }

                  setOpen(false)
                }

                return (
                  <Field data-invalid={isInvalid} className={className}>
                    <FieldLabel htmlFor={iconField.name}>
                      {fieldConfig.name}
                    </FieldLabel>
                    <Popover open={open} onOpenChange={handleOpenChange}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="rounded-md transition-transform hover:scale-105 disabled:pointer-events-none disabled:opacity-50"
                          disabled={isReadOnly}
                          aria-label="Change avatar"
                        >
                          <AvatarThumbnail
                            size={8}
                            icon={displayValue.icon}
                            color={displayValue.color}
                            image={displayValue.image}
                          />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="w-[460px] max-w-[calc(100vw-1.5rem)]"
                      >
                        <AvatarSelect
                          iconField={mapping.iconField}
                          colorField={mapping.colorField}
                          imageField={mapping.imageField}
                          value={draft}
                          disabled={isReadOnly}
                          onChange={(nextValue) => {
                            setDraft(nextValue)
                          }}
                        />
                        <div className="flex items-center justify-end gap-2 border-t pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleOk}>
                            Ok
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    {isInvalid ? <FieldError errors={mergedErrors} /> : null}
                  </Field>
                )
              }}
            />
          )}
        />
      )}
    />
  )
}
