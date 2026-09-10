'use client'

// @ts-nocheck
/* eslint-disable */
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/**
 * Read-only preview of an embedded action / selectAction. Phase 3d will replace
 * this with a full action picker; for now it surfaces the JSON so users at
 * least see the bound action and can drop down into the JSON editor to tweak
 * it.
 */
export function SelectActionInfo({
  value,
  slot,
  helpText,
}: {
  value: unknown
  slot: string
  helpText?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">
        {slot}{' '}
        <span className="text-[10px] text-muted-foreground/70">
          (read-only)
        </span>
      </Label>
      <Textarea
        readOnly
        value={value === undefined ? '' : JSON.stringify(value, null, 2)}
        placeholder="None"
        className="min-h-[60px] resize-none font-mono text-[11px]"
      />
      {helpText ? (
        <p className="text-[10px] text-muted-foreground/80">{helpText}</p>
      ) : null}
    </div>
  )
}
