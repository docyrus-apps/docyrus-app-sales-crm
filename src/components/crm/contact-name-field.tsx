import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ContactNameFieldProps {
  name?: string
  onSave: (name: string) => void | Promise<void>
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') }
}

/**
 * Edits a single `name` field as two inputs (First / Last name) and writes the
 * joined value back to `name`.
 */
export function ContactNameField({ name, onSave }: ContactNameFieldProps) {
  const { t } = useTranslation()
  const initial = splitName(name ?? '')

  const [open, setOpen] = useState(false)
  const [first, setFirst] = useState(initial.first)
  const [last, setLast] = useState(initial.last)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const full = [first.trim(), last.trim()].filter(Boolean).join(' ')

    setSaving(true)
    try {
      await onSave(full)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          const reset = splitName(name ?? '')

          setFirst(reset.first)
          setLast(reset.last)
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full truncate rounded-md px-1 py-0.5 text-left text-[13px] transition-colors hover:bg-muted/50"
        >
          {name?.trim() ? (
            name
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-2 p-2">
        <Input
          value={first}
          onChange={(event) => setFirst(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void handleSave()
            }
          }}
          placeholder={t('contacts.firstName', { defaultValue: 'First name' })}
          className="h-8 text-[13px]"
          autoFocus
        />
        <Input
          value={last}
          onChange={(event) => setLast(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void handleSave()
            }
          }}
          placeholder={t('contacts.lastName', { defaultValue: 'Last name' })}
          className="h-8 text-[13px]"
        />
        <div className="flex justify-end gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={() => setOpen(false)}
          >
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 gap-1.5"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {t('common.save', { defaultValue: 'Save' })}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
