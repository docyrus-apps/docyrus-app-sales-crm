# Radial Menu

URL: /docs/components/community/radial-menu

---

title: Radial Menu
description: A circular context menu built with Base UI, displaying actions in a clean radial layout with full keyboard support and smooth interaction.
author:
name: arhamkhnz
url: [https://github.com/arhamkhnz](https://github.com/arhamkhnz)
releaseDate: 2025-11-18

---

<ComponentPreview name="demo-components-community-radial-menu" />

## Installation

<ComponentInstallation name="components-community-radial-menu" />

## Usage

```tsx
'use client'

import * as React from 'react'
import { RadialMenu } from '@/components/animate-ui/components/community/radial-menu'
import { Copy, Scissors, ClipboardPaste, Trash2, Star, Pin } from 'lucide-react'

const MENU_ITEMS = [
  { id: 1, label: 'Copy', icon: Copy },
  { id: 2, label: 'Cut', icon: Scissors },
  { id: 3, label: 'Paste', icon: ClipboardPaste },
  { id: 4, label: 'Favorite', icon: Star },
  { id: 5, label: 'Pin', icon: Pin },
  { id: 6, label: 'Delete', icon: Trash2 },
]

export const RadialMenuDemo = () => (
  <RadialMenu
    menuItems={MENU_ITEMS}
    onSelect={(item) => {
      console.log(item)
      // run your action here
    }}
  >
    <div className="size-80 flex justify-center items-center border-2 border-dashed rounded-lg">
      Right click to open the radial menu
    </div>
  </RadialMenu>
)
```

## API Reference

### RadialMenu

<TypeTable
type={{
  children: {
    description:
      'Custom trigger element for opening the radial menu. Falls back to a default block when not provided.',
    type: 'React.ReactNode',
    required: false,
  },
  menuItems: {
    description:
      'Array of items to render as radial actions. Each item contains id, label, and icon.',
    type: 'MenuItem[]',
    required: true,
  },
  size: {
    description: 'Overall diameter of the radial menu in pixels.',
    type: 'number',
    required: false,
    default: '240',
  },
  iconSize: {
    description: 'Pixel size of the icon rendered inside each wedge.',
    type: 'number',
    required: false,
    default: '18',
  },
  bandWidth: {
    description:
      'Thickness of the main wedge band. Defines how wide each action wedge appears.',
    type: 'number',
    required: false,
    default: '50',
  },
  innerGap: {
    description:
      'Spacing between the inner hollow circle and the start of the wedge band.',
    type: 'number',
    required: false,
    default: '8',
  },
  outerGap: {
    description:
      'Spacing between the wedge band and the outer decorative ring.',
    type: 'number',
    required: false,
    default: '8',
  },
  outerRingWidth: {
    description:
      'Thickness of the outer decorative ring wrapping the entire menu.',
    type: 'number',
    required: false,
    default: '12',
  },
  onSelect: {
    description:
      'Callback fired when a user selects a menu item via click, wedge activation, or keyboard.',
    type: '(item: MenuItem) => void',
    required: false,
  },
}}
/>

## Credits

- Credits to [Jay](https://x.com/RankJay1) for [this X post](https://x.com/rankjay1/status/1987858513759199626) as inspiration
