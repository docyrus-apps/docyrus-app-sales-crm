# Radio Group

URL: /docs/components/radix/radio-group

---

title: Radio Group
description: A set of checkable buttons—known as radio buttons—where no more than one of the buttons can be checked at a time.
author:
name: imskyleen
url: [https://github.com/imskyleen](https://github.com/imskyleen)

---

<ComponentPreview name="demo-components-radix-radio-group" />

## Installation

<ComponentInstallation name="components-radix-radio-group" />

## Usage

```tsx
import * as React from 'react'

import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/animate-ui/components/radix/radio-group'
import { Label } from '@/components/ui/label'

export const RadixRadioGroupDemo = () => {
  return (
    <RadioGroup defaultValue="default">
      <Label className="flex items-center gap-x-3">
        <RadioGroupItem value="default" />
        Default
      </Label>
      <Label className="flex items-center gap-x-3">
        <RadioGroupItem value="comfortable" />
        Comfortable
      </Label>
      <Label className="flex items-center gap-x-3">
        <RadioGroupItem value="compact" />
        Compact
      </Label>
    </RadioGroup>
  )
}
```

## API Reference

### RadioGroup

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/radio-group#radiogroup" text="Animate UI API Reference - RadioGroup Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/radio-group#root" text="Radix UI API Reference - RadioGroup.Root" />
</div>

### RadioGroupItem

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/radio-group#radiogroupitem" text="Animate UI API Reference - RadioGroupItem Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/radio-group#item" text="Radix UI API Reference - RadioGroup.Item" />
</div>

<TypeTable
type={{
  '...props': {
    description: 'The props of the radio group item.',
    type: 'HTMLMotionProps<"button">',
    required: false,
  },
}}
/>

<Callout type="info">
  The `asChild` property is not supported in the `RadioGroupItem` component, as
  it is used for animation.
</Callout>

## Credits

- [Radix UI Radio Group](https://www.radix-ui.com/primitives/docs/components/radio-group)
- Credit to [shadcn/ui](https://ui.shadcn.com/docs/components/radio-group) for style inspiration.
