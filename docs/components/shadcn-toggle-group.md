---
title: Toggle Group
description: A set of two-state buttons that can be toggled on or off.
base: radix
component: true
links:
  doc: https://www.radix-ui.com/docs/primitives/components/toggle-group
  api: https://www.radix-ui.com/docs/primitives/components/toggle-group#api-reference
---

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Bold, Italic, Underline } from 'lucide-react'

export function ToggleGroupDemo() {
  return (
    <ToggleGroup variant="outline" type="multiple">
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <Bold />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <Italic />
      </ToggleGroupItem>
      <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
        <Underline />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>
<TabsContent value="cli">

```bash
pnpm dlx shadcn@latest add toggle-group
```

</TabsContent>

<TabsContent value="manual">

<Steps className="mb-0 pt-2">

<Step>Install the following dependencies:</Step>

```bash
pnpm add radix-ui
```

<Step>Copy and paste the following code into your project.</Step>

<ComponentSource
  name="toggle-group"
  title="components/ui/toggle-group.tsx"
  styleName="radix-nova"
/>

<Step>Update the import paths to match your project setup.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
```

```tsx
<ToggleGroup type="single">
  <ToggleGroupItem value="a">A</ToggleGroupItem>
  <ToggleGroupItem value="b">B</ToggleGroupItem>
  <ToggleGroupItem value="c">C</ToggleGroupItem>
</ToggleGroup>
```

## Examples

### Outline

Use `variant="outline"` for an outline style.

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export function ToggleGroupOutline() {
  return (
    <ToggleGroup variant="outline" type="single" defaultValue="all">
      <ToggleGroupItem value="all" aria-label="Toggle all">
        All
      </ToggleGroupItem>
      <ToggleGroupItem value="missed" aria-label="Toggle missed">
        Missed
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

### Size

Use the `size` prop to change the size of the toggle group.

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export function ToggleGroupSizes() {
  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup type="single" size="sm" defaultValue="top" variant="outline">
        <ToggleGroupItem value="top" aria-label="Toggle top">
          Top
        </ToggleGroupItem>
        <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
          Bottom
        </ToggleGroupItem>
        <ToggleGroupItem value="left" aria-label="Toggle left">
          Left
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Toggle right">
          Right
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" defaultValue="top" variant="outline">
        <ToggleGroupItem value="top" aria-label="Toggle top">
          Top
        </ToggleGroupItem>
        <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
          Bottom
        </ToggleGroupItem>
        <ToggleGroupItem value="left" aria-label="Toggle left">
          Left
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Toggle right">
          Right
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
```

### Spacing

Use `spacing` to add spacing between toggle group items.

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export function ToggleGroupSpacing() {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      defaultValue="top"
      variant="outline"
      spacing={2}
    >
      <ToggleGroupItem value="top" aria-label="Toggle top">
        Top
      </ToggleGroupItem>
      <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
        Bottom
      </ToggleGroupItem>
      <ToggleGroupItem value="left" aria-label="Toggle left">
        Left
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Toggle right">
        Right
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

### Vertical

Use `orientation="vertical"` for vertical toggle groups.

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react'

export function ToggleGroupVertical() {
  return (
    <ToggleGroup
      type="multiple"
      orientation="vertical"
      spacing={1}
      defaultValue={['bold', 'italic']}
    >
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <BoldIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <ItalicIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        <UnderlineIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

### Disabled

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Bold, Italic, Underline } from 'lucide-react'

export function ToggleGroupDisabled() {
  return (
    <ToggleGroup disabled type="multiple">
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <Bold />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <Italic />
      </ToggleGroupItem>
      <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
        <Underline />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](/docs/rtl).

```tsx
'use client'

import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/examples/radix/ui-rtl/toggle-group'

import {
  useTranslation,
  type Translations,
} from '@/components/language-selector'

const translations: Translations = {
  en: {
    dir: 'ltr',
    values: {
      list: 'List',
      grid: 'Grid',
      cards: 'Cards',
    },
  },
  ar: {
    dir: 'rtl',
    values: {
      list: 'قائمة',
      grid: 'شبكة',
      cards: 'بطاقات',
    },
  },
  he: {
    dir: 'rtl',
    values: {
      list: 'רשימה',
      grid: 'רשת',
      cards: 'כרטיסים',
    },
  },
}

export function ToggleGroupRtl() {
  const { dir, t } = useTranslation(translations, 'ar')

  return (
    <ToggleGroup variant="outline" type="single" defaultValue="list">
      <ToggleGroupItem value="list" aria-label={t.list}>
        {t.list}
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label={t.grid}>
        {t.grid}
      </ToggleGroupItem>
      <ToggleGroupItem value="cards" aria-label={t.cards}>
        {t.cards}
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

## API Reference

See the [Radix Toggle Group](https://www.radix-ui.com/docs/primitives/components/toggle-group#api-reference) documentation.
