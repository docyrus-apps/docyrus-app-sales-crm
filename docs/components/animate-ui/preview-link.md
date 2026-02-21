# Preview Link Card

URL: /docs/components/radix/preview-link-card

---

title: Preview Link Card
description: Displays a preview image of a link when hovered.
author:
name: imskyleen
url: [https://github.com/imskyleen](https://github.com/imskyleen)
releaseDate: 2025-11-17

---

<ComponentPreview name="demo-components-radix-preview-link-card" />

## Installation

<ComponentInstallation name="components-radix-preview-link-card" />

## Usage

```tsx
import {
  PreviewLinkCard,
  PreviewLinkCardTrigger,
  PreviewLinkCardContent,
  PreviewLinkCardImage,
} from '@/components/animate-ui/components/radix/preview-link-card'

interface RadixPreviewLinkCardDemoProps {
  side?: 'top' | 'bottom' | 'left' | 'right'
  sideOffset?: number
  align?: 'start' | 'center' | 'end'
  alignOffset?: number
  followCursor?: boolean | 'x' | 'y'
  href: string
}

export const RadixPreviewLinkCardDemo = ({
  side,
  sideOffset,
  align,
  alignOffset,
  followCursor,
  href,
}: RadixPreviewLinkCardDemoProps) => {
  return (
    <p className="text-muted-foreground">
      Read the{' '}
      <PreviewLinkCard href={href} followCursor={followCursor}>
        <PreviewLinkCardTrigger
          target="_blank"
          className="underline text-foreground"
        >
          Animate UI Docs
        </PreviewLinkCardTrigger>

        <PreviewLinkCardContent
          side={side}
          sideOffset={sideOffset}
          align={align}
          alignOffset={alignOffset}
          target="_blank"
        >
          <PreviewLinkCardImage alt="Animate UI Docs" />
        </PreviewLinkCardContent>
      </PreviewLinkCard>{' '}
      — hover to preview, click to dive in.
    </p>
  )
}
```

## API Reference

### PreviewLinkCard

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/preview-link-card#previewlinkcard" text="Animate UI API Reference - PreviewLinkCard Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/hover-card#root" text="Radix UI API Reference - HoverCard.Root" />
</div>

### PreviewLinkCardTrigger

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/preview-link-card#previewlinkcardtrigger" text="Animate UI API Reference - PreviewLinkCardTrigger Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/hover-card#trigger" text="Radix UI API Reference - HoverCard.Trigger" />
</div>

### PreviewLinkCardContent

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/preview-link-card#previewlinkcardcontent" text="Animate UI API Reference - PreviewLinkCardContent Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/hover-card#content" text="Radix UI API Reference - HoverCard.Content" />
</div>

### PreviewLinkCardImage

<ExternalLink href="https://animate-ui.com/docs/primitives/radix/preview-link-card#previewlinkcardimage" text="Animate UI API Reference - PreviewLinkCardImage Primitive" />

## Credits

- [Radix UI Hover Card](https://www.radix-ui.com/primitives/docs/components/hover-card)
- Inspired by [Aceternity UI Link Preview](https://ui.aceternity.com/components/link-preview)
