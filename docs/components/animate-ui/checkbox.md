# Checkbox

URL: /docs/components/radix/checkbox

---

title: Checkbox
description: A control that allows the user to toggle between checked and not checked.
author:
name: imskyleen
url: [https://github.com/imskyleen](https://github.com/imskyleen)

---

<ComponentPreview name="demo-components-radix-checkbox" />

## Installation

<ComponentInstallation name="components-radix-checkbox" />

## Usage

```tsx
import { useEffect, useState } from 'react'

import { Label } from '@/components/ui/label'
import {
  Checkbox,
  type CheckboxProps,
} from '@/components/animate-ui/components/radix/checkbox'

interface RadixCheckboxDemoProps {
  checked: boolean | 'indeterminate'
  variant: CheckboxProps['variant']
  size: CheckboxProps['size']
}

export const RadixCheckboxDemo = ({
  checked,
  variant,
  size,
}: RadixCheckboxDemoProps) => {
  const [isChecked, setIsChecked] = useState(checked ?? false)

  useEffect(() => {
    setIsChecked(checked)
  }, [checked])

  return (
    <Label className="flex items-center gap-x-3">
      <Checkbox
        checked={isChecked}
        onCheckedChange={setIsChecked}
        variant={variant}
        size={size}
      />
      Accept terms and conditions
    </Label>
  )
}
```

## API Reference

### Checkbox

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/checkbox#checkbox" text="Animate UI API Reference - Checkbox Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/checkbox#root" text="Radix UI API Reference - Checkbox.Root" />
</div>

<TypeTable
type={{
  variant: {
    description: 'The variant of the checkbox.',
    type: '"default" | "accent"',
    required: false,
  },
  size: {
    description: 'The size of the checkbox.',
    type: '"default" | "sm" | "lg"',
    required: false,
  },
  '...props': {
    description: 'The props of the checkbox.',
    type: 'HTMLMotionProps<"button">',
    required: false,
  },
}}
/>

<Callout type="info">
  The `asChild` prop is not supported in the `Checkbox` component as it is used
  for animation.
</Callout>

## Credits

- [Radix UI Checkbox](https://www.radix-ui.com/primitives/docs/components/checkbox)
- Credit to [shadcn/ui](https://ui.shadcn.com/docs/components/checkbox) for style inspiration.
