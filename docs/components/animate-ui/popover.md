# Popover

URL: /docs/components/radix/popover

---

title: Popover
description: Displays rich content in a portal, triggered by a button.
author:
name: imskyleen
url: [https://github.com/imskyleen](https://github.com/imskyleen)

---

<ComponentPreview name="demo-components-radix-popover" />

## Installation

<ComponentInstallation name="components-radix-popover" />

## Usage

```tsx
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/animate-ui/components/radix/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RadixPopoverDemoProps {
  side?: 'top' | 'bottom' | 'left' | 'right'
  sideOffset?: number
  align?: 'start' | 'center' | 'end'
  alignOffset?: number
}

export const RadixPopoverDemo = ({
  side,
  sideOffset,
  align,
  alignOffset,
}: RadixPopoverDemoProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className="w-80"
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Dimensions</h4>
            <p className="text-muted-foreground text-sm">
              Set the dimensions for the layer.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                defaultValue="100%"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">Max. width</Label>
              <Input
                id="maxWidth"
                defaultValue="300px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                defaultValue="25px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxHeight">Max. height</Label>
              <Input
                id="maxHeight"
                defaultValue="none"
                className="col-span-2 h-8"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

## API Reference

### Popover

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/popover#popover" text="Animate UI API Reference - Popover Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/popover#root" text="Radix UI API Reference - Popover.Root" />
</div>

### PopoverTrigger

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/popover#popovertrigger" text="Animate UI API Reference - Popover Trigger Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/popover#trigger" text="Radix UI API Reference - Popover.Trigger" />
</div>

### PopoverContent

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/popover#popovercontent" text="Animate UI API Reference - Popover Content Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/popover#content" text="Radix UI API Reference - Popover.Content" />
</div>

<TypeTable
type={{
  transition: {
    description: 'The transition of the popover content.',
    type: 'Transition',
    required: false,
    default: "{ type: 'spring', stiffness: 300, damping: 25 }",
  },
  '...props': {
    description: 'The props of the popover content.',
    type: 'HTMLMotionProps<"div">',
    required: false,
  },
}}
/>

<Callout type="info">
  The `forceMount` and `asChild` properties are not supported in the
  `PopoverContent` component, as it is used for animation.
</Callout>

### PopoverClose

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/popover#popoverclose" text="Animate UI API Reference - Popover Close Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/popover#close" text="Radix UI API Reference - Popover.Close" />
</div>

## Credits

- [Radix UI Popover](https://www.radix-ui.com/primitives/docs/components/popover)
- Credit to [shadcn/ui](https://ui.shadcn.com/docs/components/popover) for style inspiration.
