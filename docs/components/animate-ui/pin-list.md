# Pin List

URL: /docs/components/community/pin-list

---

title: Pin List
description: A playful list for pinning and unpinning items, with smooth animated transitions as items move between groups.
author:
name: arhamkhnz
url: [https://github.com/arhamkhnz](https://github.com/arhamkhnz)

---

<ComponentPreview name="demo-components-community-pin-list" />

## Installation

<ComponentInstallation name="components-community-pin-list" />

## Usage

```tsx
'use client'

import * as React from 'react'
import { GitCommit, AlertTriangle, Box, KeyRound, Regex } from 'lucide-react'

import { PinList } from '@/components/animate-ui/components/community/pin-list'

const ITEMS = [
  {
    id: 1,
    name: 'Commit Zone',
    info: 'Code updates · Closes 9:00 PM',
    icon: GitCommit,
    pinned: true,
  },
  {
    id: 2,
    name: '404 Room',
    info: 'Fixing errors · Open 24 hours',
    icon: AlertTriangle,
    pinned: true,
  },
  {
    id: 3,
    name: 'NPM Stop',
    info: 'Install stuff · Closes 8:00 PM',
    icon: Box,
    pinned: false,
  },
  {
    id: 4,
    name: 'Token Lock',
    info: 'Login stuff · Open 24 hours',
    icon: KeyRound,
    pinned: false,
  },
  {
    id: 5,
    name: 'Regex Zone',
    info: 'Find words · Closes 9:00 PM',
    icon: Regex,
    pinned: false,
  },
]

export const PinListDemo = () => <PinList items={ITEMS} />
```

## API Reference

### PinList

<TypeTable
type={{
  items: {
    description:
      'Array of items to show in the list. Each item should have id, name, info, icon, and pinned.',
    type: 'PinListItem[]',
    required: true,
  },
  labels: {
    description:
      'Custom labels for the pinned and unpinned sections. Example: { pinned: "Favorites", unpinned: "All" }.',
    type: '{ pinned?: string; unpinned?: string; }',
    required: false,
    default: '{ pinned: "Pinned Items", unpinned: "All Items" }',
  },
  transition: {
    description:
      'Spring animation config for item transitions. Controls the movement physics. Example: { stiffness: 320, damping: 20, mass: 0.8, type: "spring" }',
    type: '{ stiffness?: number; damping?: number; mass?: number; type?: string; }',
    required: false,
    default: '{ stiffness: 320, damping: 20, mass: 0.8, type: "spring" }',
  },
  labelMotionProps: {
    description:
      'Motion props for the section labels. Allows customizing the label enter/exit animation. Example: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.22, ease: "easeInOut" } }',
    type: '{ initial?: object; animate?: object; exit?: object; transition?: object; }',
    required: false,
    default:
      '{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.22, ease: "easeInOut" } }',
  },
  className: {
    description: 'Class name for the outermost container.',
    type: 'string',
    required: false,
  },
  labelClassName: {
    description: 'Class name for the section labels.',
    type: 'string',
    required: false,
  },
  pinnedSectionClassName: {
    description: 'Class name for the pinned items group.',
    type: 'string',
    required: false,
  },
  unpinnedSectionClassName: {
    description: 'Class name for the unpinned items group.',
    type: 'string',
    required: false,
  },
  zIndexResetDelay: {
    description:
      'Delay (in ms) before resetting z-index after toggle, should match your animation duration if changed.',
    type: 'number',
    required: false,
    default: '500',
  },
}}
/>

## Credits

- Credits to [Nitish Khagwal](https://x.com/nitishkmrk) for [this X post](https://x.com/nitishkmrk/status/1933050634594660800) as inspiration
