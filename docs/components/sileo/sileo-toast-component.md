Title: Getting Started

URL Source: https://sileo.aaryan.design/docs

## Markdown Content:

## description: A tiny, beautiful, physics-based toast component for React. Gooey SVG morphing, spring animations, and zero dependencies.

# Getting Started

Sileo is a tiny, opinionated toast component for React. It uses gooey SVG morphing and spring physics to create buttery smooth notifications — beautiful by default, no configuration required.

## Installation

```
npm install sileo

```

## Quick Setup

Add the `Toaster` component to your app's root layout, then call `sileo` from anywhere.

```
import { sileo, Toaster } from "sileo";

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <YourApp />
    </>
  );
}

```

## Fire a Toast

PreviewCode

SuccessErrorWarningInfo

## Action Toast

Toasts can include a button for user interaction.

PreviewCode

Try it

## Promise Toast

Chain loading, success, and error states from a single promise.

PreviewCode

Try it

The promise method returns the original promise, so you can chain further.

## Positions

Sileo supports six positions. Set it on the `Toaster` as a default, or override per-toast.

```
<Toaster position="top-right" />

sileo.success({
  title: "Saved",
  position: "bottom-center",
});

```

Available positions: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`.

Title: sileo

URL Source: https://sileo.aaryan.design/docs/api

## Markdown Content:

## description: A tiny, beautiful, physics-based toast component for React. Gooey SVG morphing, spring animations, and zero dependencies.

# sileo

The global toast controller. Import it anywhere to fire toasts.

```
import { sileo } from "sileo";

```

## Methods

| Method                       | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| sileo.success(options)       | Green success toast                                    |
| sileo.error(options)         | Red error toast                                        |
| sileo.warning(options)       | Amber warning toast                                    |
| sileo.info(options)          | Blue info toast                                        |
| sileo.action(options)        | Toast with an action button                            |
| sileo.show(options)          | Generic toast (defaults to success state)              |
| sileo.promise(promise, opts) | Loading → success/error flow                           |
| sileo.dismiss(id)            | Dismiss a specific toast by id                         |
| sileo.clear(position?)       | Clear all toasts, or only those at a specific position |

All shortcut methods return the toast `id` as a string. `promise` returns the original promise. `dismiss` and `clear` return void.

---

## `SileoOptions`

Passed to every `sileo.*()` method.

| Prop        | Type                | Default         | Description                             |
| ----------- | ------------------- | --------------- | --------------------------------------- |
| title       | string              | —               | Toast heading                           |
| description | ReactNode \| string | —               | Body content, supports JSX              |
| position    | SileoPosition       | Toaster default | Override position for this toast        |
| duration    | number \| null      | 6000            | Auto-dismiss ms. null = sticky          |
| icon        | ReactNode \| null   | State icon      | Custom icon in the badge                |
| fill        | string              | "#FFFFFF"       | SVG fill color for the toast background |
| styles      | SileoStyles         | —               | Class overrides for sub-elements        |
| roundness   | number              | 16              | Border radius in pixels                 |
| autopilot   | boolean \| object   | true            | Auto expand/collapse timing             |
| button      | SileoButton         | —               | Action button config                    |

---

## `SileoButton`

```
interface SileoButton {
  title: string;
  onClick: () => void;
}

```

---

## `SileoStyles`

Override classes for individual toast sub-elements.

```
interface SileoStyles {
  title?: string;
  description?: string;
  badge?: string;
  button?: string;
}

```

```
sileo.success({
  title: "Custom styled",
  fill: "black",
  styles: {
    title: "text-white!",
    description: "text-white/75!",
    badge: "bg-white/20!",
    button: "bg-white/10!",
  },
});

```

---

## `SileoPromiseOptions`

Passed as the second argument to `sileo.promise()`.

```
interface SileoPromiseOptions<T = unknown> {
  loading: Pick<SileoOptions, "title" | "icon">;
  success: SileoOptions | ((data: T) => SileoOptions);
  error: SileoOptions | ((err: unknown) => SileoOptions);
  action?: SileoOptions | ((data: T) => SileoOptions);
  position?: SileoPosition;
}

```

The `success` and `error` fields can be static options or callbacks that receive the resolved/rejected value. The optional `action` field, when provided, replaces the success toast with an action state instead.

```
sileo.promise(createUser(data), {
  loading: { title: "Creating account..." },
  success: (user) => ({
    title: `Welcome, ${user.name}!`,
  }),
  error: (err) => ({
    title: "Signup failed",
    description: err.message,
  }),
});

```

Title: Toaster

URL Source: https://sileo.aaryan.design/docs/api/toaster

## Markdown Content:

## description: A tiny, beautiful, physics-based toast component for React. Gooey SVG morphing, spring animations, and zero dependencies.

# Toaster

The viewport component that renders toasts. Add it once to your layout.

```
import { Toaster } from "sileo";

```

| Prop     | Type                  | Default     | Description                             |                              |
| -------- | --------------------- | ----------- | --------------------------------------- | ---------------------------- |
| children | ReactNode             | —           | App content to render alongside toasts  |                              |
| position | SileoPosition         | "top-right" | Default position for all toasts         |                              |
| offset   | number \| string      | object      | —                                       | Distance from viewport edges |
| options  | Partial<SileoOptions> | —           | Default options merged into every toast |                              |

## Offset

The `offset` prop accepts a number, string, or per-side config.

```
<Toaster offset={20} />

<Toaster offset={{ top: 20, right: 16 }} />

```

## Default Options

Set global defaults that apply to every toast.

```
<Toaster
  options={{
    fill: "#171717",
    styles: { description: "text-white/75!" },
  }}
/>

```

---

## `SileoPosition`

```
type SileoPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

```

Title: Styling

URL Source: https://sileo.aaryan.design/docs/styling

## Markdown Content:

## description: A tiny, beautiful, physics-based toast component for React. Gooey SVG morphing, spring animations, and zero dependencies.

# Styling

Sileo is designed to look great out of the box. When you need to customize, there are a few escape hatches.

## Fill Color

The `fill` prop sets the SVG background color of the toast. The default is `"#FFFFFF"`. Set it to a dark color like `"#171717"` or `"black"` to create a dark toast — just make sure to pair it with light text via `styles`.

PreviewCode

Dark accentFull dark

## Style Overrides

The `styles` prop lets you override classes on individual sub-elements. Use Tailwind's `!` modifier to ensure specificity.

PreviewCode

Try it

### Available Keys

| Key         | Element                   | Selector                   |
| ----------- | ------------------------- | -------------------------- |
| title       | The heading text          | \[data-sileo-title\]       |
| description | The body/description area | \[data-sileo-description\] |
| badge       | The icon badge circle     | \[data-sileo-badge\]       |
| button      | The action button         | \[data-sileo-button\]      |

## Custom Icons

Pass any React node as the `icon` prop to replace the default state icon.

PreviewCode

Try it

## Custom Description

The `description` prop accepts JSX, so you can build rich toast content.

PreviewCode

Try it

You can use any layout — stack multiple elements, add icons, or use your own components.

PreviewCode

Rich content

## Roundness

Control the border radius with the `roundness` prop (default `16`). Set it lower for sharper corners or higher for a rounder pill shape.

PreviewCode

Sharp (8)Round (16)

> **Performance note:** Higher `roundness` values increase the SVG blur radius used for the gooey morph effect, which is more expensive to render. The recommended value is `16` for a good balance between aesthetics and performance.

## Autopilot

By default, toasts auto-expand after a short delay and collapse before dismissing. Control this with the `autopilot` prop.

- `autopilot: false` — disables auto expand/collapse entirely (hover to expand)
- `autopilot: { expand: ms, collapse: ms }` — custom timing for each phase

PreviewCode

DisabledCustom timing

## Dismissing Toasts

Use `sileo.dismiss(id)` to remove a specific toast, or `sileo.clear()` to remove all. You can also clear only toasts at a specific position.

PreviewCode

Fire toastDismiss itClear all

## Global Defaults

Use the `Toaster`'s `options` prop to set defaults for every toast. This is useful for applying a consistent dark theme across your app.

```
<Toaster
  position="top-right"
  options={{
    fill: "#171717",
    roundness: 16,
    styles: {
      title: "text-white!",
      description: "text-white/75!",
      badge: "bg-white/10!",
      button: "bg-white/10! hover:bg-white/15!",
    },
  }}
/>

```

## CSS Variables

Sileo exposes CSS custom properties you can override globally to change state colors, dimensions, or animation timing.

```
:root {
  /* State colors (oklch) */
  --sileo-state-success: oklch(0.723 0.219 142.136);
  --sileo-state-loading: oklch(0.556 0 0);
  --sileo-state-error: oklch(0.637 0.237 25.331);
  --sileo-state-warning: oklch(0.795 0.184 86.047);
  --sileo-state-info: oklch(0.685 0.169 237.323);
  --sileo-state-action: oklch(0.623 0.214 259.815);

  /* Dimensions */
  --sileo-width: 350px;
  --sileo-height: 40px;

  /* Animation */
  --sileo-duration: 600ms;
}

```

For example, to make all success toasts use a custom brand color:

```
:root {
  --sileo-state-success: oklch(0.7 0.2 200);
}

```
