# Hover Card

URL: /docs/components/radix/hover-card

---

title: Hover Card
description: For sighted users to preview content available behind a link.
author:
name: imskyleen
url: [https://github.com/imskyleen](https://github.com/imskyleen)

---

<ComponentPreview name="demo-components-radix-hover-card" />

## Installation

<ComponentInstallation name="components-radix-hover-card" />

## Usage

```tsx
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/animate-ui/components/radix/hover-card'

interface RadixHoverCardDemoProps {
  side?: 'top' | 'bottom' | 'left' | 'right'
  sideOffset?: number
  align?: 'start' | 'center' | 'end'
  alignOffset?: number
  followCursor?: boolean | 'x' | 'y'
}

export const RadixHoverCardDemo = ({
  side,
  sideOffset,
  align,
  alignOffset,
  followCursor,
}: RadixHoverCardDemoProps) => {
  return (
    <HoverCard followCursor={followCursor}>
      <HoverCardTrigger asChild>
        <a
          className="size-12 border rounded-full overflow-hidden"
          href="https://twitter.com/animate_ui"
          target="_blank"
          rel="noreferrer noopener"
        >
          <img
            src="https://pbs.twimg.com/profile_images/1950218390741618688/72447Y7e_400x400.jpg"
            alt="Animate UI"
          />
        </a>
      </HoverCardTrigger>

      <HoverCardContent
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className="w-80"
      >
        <div className="flex flex-col gap-4">
          <img
            className="size-16 rounded-full overflow-hidden border"
            src="https://pbs.twimg.com/profile_images/1950218390741618688/72447Y7e_400x400.jpg"
            alt="Animate UI"
          />
          <div className="flex flex-col gap-4">
            <div>
              <div className="font-bold">Animate UI</div>
              <div className="text-sm text-muted-foreground">@animate_ui</div>
            </div>
            <div className="text-sm text-muted-foreground">
              A fully animated, open-source component distribution built with
              React, TypeScript, Tailwind CSS, and Motion.
            </div>
            <div className="flex gap-4">
              <div className="flex gap-1 text-sm items-center">
                <div className="font-bold">0</div>{' '}
                <div className="text-muted-foreground">Following</div>
              </div>
              <div className="flex gap-1 text-sm items-center">
                <div className="font-bold">2,900</div>{' '}
                <div className="text-muted-foreground">Followers</div>
              </div>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
```

## API Reference

### HoverCard

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/hover-card#hovercard" text="Animate UI API Reference - HoverCard Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/hover-card#root" text="Radix UI API Reference - HoverCard.Root" />
</div>

### HoverCardTrigger

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/hover-card#hovercardtrigger" text="Animate UI API Reference - HoverCard Trigger Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/hover-card#trigger" text="Radix UI API Reference - HoverCard.Trigger" />
</div>

### HoverCardContent

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/hover-card#hovercardcontent" text="Animate UI API Reference - HoverCard Content Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/hover-card#content" text="Radix UI API Reference - HoverCard.Content" />
</div>

<TypeTable
type={{
  transition: {
    description: 'The transition of the hover card content.',
    type: 'Transition',
    required: false,
    default: "{ type: 'spring', stiffness: 300, damping: 25 }",
  },
  '...props': {
    description: 'The props of the hover card content.',
    type: 'HTMLMotionProps<"div">',
    required: false,
  },
}}
/>

<Callout type="info">
  The `asChild` and `forceMount` props are not supported in the
  `HoverCardContent` component as it is used for animation.
</Callout>

## Credits

- [Radix UI Hover Card](https://www.radix-ui.com/primitives/docs/components/hover-card)
- Credit to [shadcn/ui](https://ui.shadcn.com/docs/components/hover-card) for style inspiration.
