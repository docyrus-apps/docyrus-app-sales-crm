# Toggle Group

URL: /docs/components/radix/toggle-group

---

title: Toggle Group
description: A set of two-state buttons that can be toggled on or off.
author:
name: imskyleen
url: [https://github.com/imskyleen](https://github.com/imskyleen)

---

<ComponentPreview name="demo-components-radix-toggle-group" />

## Installation

<ComponentInstallation name="components-radix-toggle-group" />

## Usage

```tsx
import {
  ToggleGroup,
  ToggleGroupItem,
  type ToggleGroupProps,
} from '@/components/animate-ui/components/radix/toggle-group'
import { Bold, Italic, Underline } from 'lucide-react'

interface RadixToggleGroupDemoProps {
  type: 'single' | 'multiple'
  variant: ToggleGroupProps['variant']
  size: ToggleGroupProps['size']
}

export function RadixToggleGroupDemo({
  type,
  variant,
  size,
}: RadixToggleGroupDemoProps) {
  return (
    <ToggleGroup type={type} variant={variant} size={size}>
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

## API Reference

### ToggleGroup

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/toggle-group#toggle-group" text="Animate UI API Reference - ToggleGroup Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/toggle-group#root" text="Radix UI API Reference - ToggleGroup.Root" />
</div>

<TypeTable
type={{
  variant: {
    description: 'The variant of the ToggleGroup component.',
    type: '"default" | "outline"',
    required: false,
  },
  size: {
    description: 'The size of the ToggleGroup component.',
    type: '"default" | "sm" | "lg" | "icon"',
    required: false,
  },
  '...props': {
    description: 'The props of the ToggleGroup component.',
    type: 'HTMLMotionProps<"button">',
    required: false,
  },
}}
/>

### ToggleGroupItem

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/toggle-group#toggle-group-item" text="Animate UI API Reference - ToggleGroupItem Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/toggle-group#item" text="Radix UI API Reference - ToggleGroup.Item" />
</div>

<TypeTable
type={{
  variant: {
    description: 'The variant of the ToggleGroupItem component.',
    type: '"default" | "outline"',
    required: false,
  },
  size: {
    description: 'The size of the ToggleGroupItem component.',
    type: '"default" | "sm" | "lg" | "icon"',
    required: false,
  },
  '...props': {
    description: 'The props of the ToggleGroupItem component.',
    type: 'HTMLMotionProps<"button">',
    required: false,
  },
}}
/>

<Callout type="info">
  The `asChild` property is not supported in the `ToggleGroupItem` component, as
  it is used for animation.
</Callout>

## Credits

- [Radix UI Toggle Group](https://www.radix-ui.com/primitives/docs/components/toggle-group)
- Credit to [shadcn/ui](https://ui.shadcn.com/docs/components/toggle-group) for style inspiration.
