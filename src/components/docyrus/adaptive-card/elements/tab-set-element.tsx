'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { type AdaptiveCardTabSet } from '../adaptive-card-types'

import { ElementList } from '../element-node'
import { renderLucideIcon } from './icon-element'

const SIZE_TRIGGER: Record<'small' | 'medium' | 'large', string> = {
  small: 'text-xs px-2 py-1',
  medium: 'text-sm px-3 py-1.5',
  large: 'text-base px-4 py-2',
}

export function TabSetElement({ element }: { element: AdaptiveCardTabSet }) {
  const tabs = element.tabs ?? []

  if (tabs.length === 0) return null

  const size = element.size ?? 'medium'
  const triggerClass = SIZE_TRIGGER[size]

  const firstKey = tabs[0]?.id ?? `tab-0`

  return (
    <Tabs defaultValue={firstKey} className="w-full">
      <TabsList>
        {tabs.map((tab, idx) => {
          const value = tab.id ?? `tab-${idx}`

          return (
            <TabsTrigger key={value} value={value} className={cn(triggerClass)}>
              {tab.icon ? renderLucideIcon(tab.icon, 'mr-1 size-4') : null}
              {tab.title ?? `Tab ${idx + 1}`}
            </TabsTrigger>
          )
        })}
      </TabsList>
      {tabs.map((tab, idx) => {
        const value = tab.id ?? `tab-${idx}`

        return (
          <TabsContent key={value} value={value} className="pt-3">
            <ElementList items={tab.items} />
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
