# Tabs

URL: /docs/components/radix/tabs

---

title: Tabs
description: A set of layered sections of content—known as tab panels—that are displayed one at a time.
author:
name: imskyleen
url: [https://github.com/imskyleen](https://github.com/imskyleen)

---

<ComponentPreview name="demo-components-radix-tabs" />

## Installation

<ComponentInstallation name="components-radix-tabs" />

## Usage

```tsx
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function RadixTabsDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <Card className="shadow-none py-0">
          <TabsContents className="py-6">
            <TabsContent value="account" className="flex flex-col gap-6">
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Make changes to your account here. Click save when you&apos;re
                  done.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="tabs-demo-name">Name</Label>
                  <Input id="tabs-demo-name" defaultValue="Pedro Duarte" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save changes</Button>
              </CardFooter>
            </TabsContent>
            <TabsContent value="password" className="flex flex-col gap-6">
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password here. After saving, you&apos;ll be logged
                  out.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="tabs-demo-current">Current password</Label>
                  <Input id="tabs-demo-current" type="password" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="tabs-demo-new">New password</Label>
                  <Input id="tabs-demo-new" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save password</Button>
              </CardFooter>
            </TabsContent>
          </TabsContents>
        </Card>
      </Tabs>
    </div>
  )
}
```

## API Reference

### Tabs

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/tabs#tabs" text="Animate UI API Reference - Tabs Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/tabs#root" text="Radix UI API Reference - Tabs.Root" />
</div>

### TabsList

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/tabs#tabslist" text="Animate UI API Reference - TabsList Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/tabs#list" text="Radix UI API Reference - Tabs.List" />
</div>

### TabsTrigger

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/tabs#tabstrigger" text="Animate UI API Reference - TabsTrigger Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/tabs#trigger" text="Radix UI API Reference - Tabs.Trigger" />
</div>

### TabsContents

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/tabs#tabscontents" text="Animate UI API Reference - TabsContents Primitive" />

  <ExternalLink href="https://animate-ui.com/docs/primitives/effects/auto-height#autoheight" text="Animate UI API Reference - AutoHeight" />
</div>

<TypeTable
type={{
  mode: {
    description:
      'The mode of the TabsContents component. The auto-height mode (default) dynamically measures the content to adjust the height, resulting in smoother and more natural animations that integrate seamlessly with surrounding elements. The layout mode relies on Motion’s layout transitions, offering better performance, but the resizing may appear less fluid depending on the content.',
    type: '"auto-height" | "layout"',
    required: false,
    default: '"auto-height"',
  },
  transition: {
    description: 'The transition of the TabsContents component.',
    type: 'Transition',
    required: false,
    default: '{ type: "spring", stiffness: 200, damping: 25 }',
  },
}}
/>

### TabsContent

<div className="flex flex-col gap-2">
  <ExternalLink href="https://animate-ui.com/docs/primitives/radix/tabs#tabscontent" text="Animate UI API Reference - TabsContent Primitive" />

  <ExternalLink href="https://www.radix-ui.com/primitives/docs/components/tabs#content" text="Radix UI API Reference - Tabs.Content" />
</div>

<TypeTable
type={{
  transition: {
    description: 'The transition of the TabsContent component.',
    type: 'Transition',
    required: false,
    default: '{ duration: 0.5, ease: "easeInOut" }',
  },
  '...props': {
    description: 'The props of the TabsContent component.',
    type: 'HTMLMotionProps<"div">',
    required: false,
  },
}}
/>

## Credits

- [Radix UI Tabs](https://www.radix-ui.com/primitives/docs/components/tabs)
- Credit to [shadcn/ui](https://ui.shadcn.com/docs/components/tabs) for style inspiration.
