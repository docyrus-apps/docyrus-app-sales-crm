'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import { type DesignerNode } from '../adaptive-card-designer-types'
import { PropSection } from './shared/prop-section'
import { useNodeUpdater } from './shared/use-node-updater'

/**
 * Generic raw-props editor used as the fallback for element types that don't
 * yet have a dedicated editor. Strings / numbers / booleans render as inline
 * fields; complex values (objects / arrays) show a read-only JSON preview.
 */
export function GenericPropsEditor({ node }: { node: DesignerNode }) {
  const update = useNodeUpdater(node.__designerId)
  const entries = useMemo(() => Object.entries(node.props), [node.props])

  return (
    <PropSection title="Properties">
      {entries.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No properties set.</p>
      ) : null}

      {entries.map(([key, value]) => {
        if (typeof value === 'boolean') {
          return (
            <div key={key} className="flex items-center justify-between gap-2">
              <Label className="text-[11px] text-muted-foreground">{key}</Label>
              <Switch
                checked={value}
                onCheckedChange={(next) => update(key, next)}
              />
            </div>
          )
        }

        if (typeof value === 'number') {
          return (
            <div key={key} className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{key}</Label>
              <Input
                type="number"
                value={value}
                onChange={(event) => {
                  const next =
                    event.target.value === ''
                      ? undefined
                      : Number(event.target.value)

                  update(key, next)
                }}
                className="h-7 text-xs"
              />
            </div>
          )
        }

        if (typeof value === 'string') {
          return (
            <div key={key} className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{key}</Label>
              {value.length > 60 || value.includes('\n') ? (
                <Textarea
                  value={value}
                  onChange={(event) => update(key, event.target.value)}
                  className="min-h-[60px] text-xs"
                />
              ) : (
                <Input
                  value={value}
                  onChange={(event) => update(key, event.target.value)}
                  className="h-7 text-xs"
                />
              )}
            </div>
          )
        }

        return (
          <div key={key} className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">
              {key}{' '}
              <span className="text-[10px] text-muted-foreground/70">
                (edit via JSON panel)
              </span>
            </Label>
            <Textarea
              value={JSON.stringify(value, null, 2)}
              readOnly
              className="min-h-[60px] font-mono text-[11px]"
            />
          </div>
        )
      })}
    </PropSection>
  )
}
