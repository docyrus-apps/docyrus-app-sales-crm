# Files

URL: /docs/components/radix/files

---

title: Files
description: A component that allows you to display a list of files and folders.
author:
name: imskyleen
url: [https://github.com/imskyleen](https://github.com/imskyleen)

---

<ComponentPreview name="demo-components-radix-files" />

## Installation

<ComponentInstallation name="components-radix-files" />

## Usage

```tsx
'use client'

import React from 'react'
import {
  FileItem,
  FolderItem,
  FolderTrigger,
  FolderContent,
  Files,
  SubFiles,
} from '@/components/animate-ui/components/radix/files'
import { FileJsonIcon } from 'lucide-react'

export const RadixFilesDemo = () => {
  return (
    <div className="relative max-w-[500px] max-h-[350px] size-full rounded-2xl border bg-background overflow-auto">
      <Files className="w-full" defaultOpen={['app']}>
        <FolderItem value="app">
          <FolderTrigger
            gitStatus="modified"
            className="w-full flex items-center justify-between"
          >
            app
          </FolderTrigger>

          <FolderContent>
            <SubFiles defaultOpen={['(home)']}>
              <FolderItem value="(home)">
                <FolderTrigger gitStatus="untracked">(home)</FolderTrigger>

                <FolderContent>
                  <FileItem gitStatus="untracked">page.tsx</FileItem>
                  <FileItem gitStatus="untracked">layout.tsx</FileItem>
                </FolderContent>
              </FolderItem>

              <FileItem>layout.tsx</FileItem>
              <FileItem gitStatus="modified">page.tsx</FileItem>
              <FileItem>global.css</FileItem>
            </SubFiles>
          </FolderContent>
        </FolderItem>

        <FolderItem value="components">
          <FolderTrigger>components</FolderTrigger>

          <FolderContent>
            <SubFiles>
              <FileItem>button.tsx</FileItem>
              <FileItem>tabs.tsx</FileItem>
              <FileItem>dialog.tsx</FileItem>

              <FolderItem value="empty">
                <FolderTrigger>empty</FolderTrigger>
              </FolderItem>
            </SubFiles>
          </FolderContent>
        </FolderItem>

        <FileItem icon={FileJsonIcon}>package.json</FileItem>
      </Files>
    </div>
  )
}
```

## API Reference

### Files

<ExternalLink href="https://animate-ui.com/docs/primitives/radix/accordion#accordion" text="Animate UI API Reference - Radix UI Accordion" />

<TypeTable
type={{
  children: {
    description: 'The child folders and files.',
    type: 'React.ReactNode',
    required: true,
  },
  defaultOpen: {
    description: 'The child folders open by default.',
    type: 'string[]',
    required: false,
    default: '[]',
  },
  open: {
    description: 'The child folders open.',
    type: 'string[]',
    required: false,
  },
  onOpenChange: {
    description: 'The callback function when the child folders open changes.',
    type: '(open: string[]) => void',
    required: false,
  },
}}
/>

### FolderItem

<ExternalLink href="https://animate-ui.com/docs/primitives/radix/accordion#accordionitem" text="Animate UI API Reference - Radix UI AccordionItem" />

### FolderTrigger

<TypeTable
type={{
  gitStatus: {
    description: 'The git status of the folder.',
    type: '"untracked" | "modified" | "deleted"',
    required: false,
  },
  '...props': {
    description: 'The props of the folder trigger.',
    type: 'React.ComponentProps<"span">',
    required: false,
  },
}}
/>

### FolderContent

<ExternalLink href="https://animate-ui.com/docs/primitives/radix/accordion#accordioncontent" text="Animate UI API Reference - Radix UI AccordionContent" />

### FileItem

<TypeTable
type={{
  icon: {
    description: 'The icon of the file.',
    type: 'React.ElementType',
    required: false,
    default: 'FileIcon',
  },
  gitStatus: {
    description: 'The git status of the file.',
    type: '"untracked" | "modified" | "deleted"',
    required: false,
  },
  '...props': {
    description: 'The props of the file item.',
    type: 'React.ComponentProps<"span">',
    required: false,
  },
}}
/>

## Credits

- [Radix UI Accordion](https://www.radix-ui.com/primitives/docs/components/accordion)
