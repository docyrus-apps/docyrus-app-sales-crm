# Dialog

URL: /docs/components/radix/dialog

---

title: Dialog
description: A window overlaid on either the primary window or another dialog window, rendering the content underneath inert.
author:
name: imskyleen
url: [https://github.com/imskyleen](https://github.com/imskyleen)

---

<ComponentPreview name="demo-components-radix-dialog" />

## Installation

<ComponentInstallation name="components-radix-dialog" />

## Usage

```tsx
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
  type DialogContentProps,
} from '@/components/animate-ui/components/radix/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface RadixDialogDemoProps {
  from: DialogContentProps['from']
  showCloseButton: boolean
}

export const RadixDialogDemo = ({
  from,
  showCloseButton,
}: RadixDialogDemoProps) => {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant="outline">Open Dialog</Button>
        </DialogTrigger>
        <DialogContent
          from={from}
          showCloseButton={showCloseButton}
          className="sm:max-w-[425px]"
        >
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Name</Label>
              <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="username-1">Username</Label>
              <Input id="username-1" name="username" defaultValue="@peduarte" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
```

## API Reference

### Dialog

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/dialog#dialog" text="Animate UI API Reference - Dialog Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/dialog#root" text="Radix UI API Reference - Dialog.Root" />
</div>

### DialogTrigger

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/dialog#dialogtrigger" text="Animate UI API Reference - Dialog Trigger Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/dialog#trigger" text="Radix UI API Reference - Dialog.Trigger" />
</div>

### DialogContent

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/dialog#dialogcontent" text="Animate UI API Reference - Dialog Content Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/dialog#content" text="Radix UI API Reference - Dialog.Content" />
</div>

<TypeTable
type={{
  showCloseButton: {
    description: 'Whether to show the close button.',
    type: 'boolean',
    required: false,
    default: 'true',
  },
  from: {
    description: 'The direction the dialog should flip from',
    type: "'top' | 'bottom' | 'left' | 'right'",
    required: false,
    default: 'top',
  },
  transition: {
    description: 'The transition of the dialog content',
    type: 'Transition',
    required: false,
    default: "{ type: 'spring', stiffness: 150, damping: 25 }",
  },
  '...props': {
    description: 'The props of the dialog content.',
    type: 'HTMLMotionProps<"div">',
    required: false,
  },
}}
/>

<Callout type="info">
  The `asChild` and `forceMount` properties are not supported in the
  `DialogContent` component, as it is used for animation.
</Callout>

### DialogClose

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/dialog#dialogclose" text="Animate UI API Reference - Dialog Close Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/dialog#close" text="Radix UI API Reference - Dialog.Close" />
</div>

### DialogHeader

<ExternalLink href="https://animate-ui.com/docs/primitives/radix/dialog#dialogheader" text="Animate UI API Reference - Dialog Header Primitive" />

<TypeTable
type={{
  '...props': {
    description: 'The props of the dialog header.',
    type: "React.ComponentProps<'div'>",
    required: false,
  },
}}
/>

### DialogTitle

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/dialog#dialogtitle" text="Animate UI API Reference - Dialog Title Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/dialog#title" text="Radix UI API Reference - Dialog.Title" />
</div>

### DialogDescription

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/dialog#dialogdescription" text="Animate UI API Reference - Dialog Description Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/dialog#description" text="Radix UI API Reference - Dialog.Description" />
</div>

### DialogFooter

<ExternalLink href="https://animate-ui.com/docs/primitives/radix/dialog#dialogfooter" text="Animate UI API Reference - Dialog Footer Primitive" />

<TypeTable
type={{
  '...props': {
    description: 'The props of the dialog footer.',
    type: "React.ComponentProps<'div'>",
    required: false,
  },
}}
/>

## Credits

- [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- Credit to [shadcn/ui](https://ui.shadcn.com/docs/components/dialog) for style inspiration.
