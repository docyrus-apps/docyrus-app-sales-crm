# Introduction

URL: /docs

Docyrus UI is an open-source component library built on shadcn, supporting Radix UI and Base UI.

What is Docyrus UI? [#what-is-docyrus-ui]

Docyrus UI is a component distribution platform built with shadcn registry. It provides UI components, hooks, and utilities that you can install directly into your project.

Features [#features]

- **Multiple Primitives** â€” Components available in Radix UI and Base UI variants
- **shadcn Registry** â€” Install components via `shadcn` CLI
- **Hooks & Utilities** â€” Reusable hooks and utility functions
- **Tailwind CSS v4** â€” Built with the latest Tailwind CSS
- **TypeScript** â€” Full type safety
- **Dark Mode** â€” Built-in dark mode support

Quick Start [#quick-start]

Add the Docyrus registry to your `components.json`:

```json
{
  "registries": {
    "docyrus": {
      "url": "https://ui.docy.app/r"
    }
  }
}
```

Then install components:

```bash
pnpm dlx shadcn@latest add @docyrus/ui-button
```

---

# Avatar Select

URL: /docs/components/avatar-select

Avatar Select component with multiple variants and sizes.

<ComponentPreview registryName="@docyrus/ui-avatar-select">
  <AvatarSelectDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-avatar-select" />

<Dependencies items={[{ label: 'lucide-react', url: 'https://www.npmjs.com/package/lucide-react' }, { label: 'class-variance-authority', url: 'https://www.npmjs.com/package/class-variance-authority' } ]} />

Usage [#usage]

```tsx
import {
  AvatarSelect
} from "@docyrus/ui/components/avatar-select";

<AvatarSelect
  editorDisplay="inline"
  value={...}
  disabled
  uploadImage={() => {}}
  onChange={() => {}}
  onCommit={() => {}}
/>
```

EditorDisplay [#editordisplay]

| EditorDisplay | Description               |
| ------------- | ------------------------- |
| `inline`      | Inline â€” `space-y-3`    |
| `popover`     | Popover â€” `inline-flex` |

API Reference [#api-reference]

| Prop            | Type                                                                  | Default     |
| --------------- | --------------------------------------------------------------------- | ----------- |
| `editorDisplay` | `"inline"` \| `"popover"`                                             | `"default"` |
| `value`         | `Partial<AvatarFieldValue> \| null`                                   | â€”         |
| `disabled`      | `boolean`                                                             | â€”         |
| `uploadImage`   | `(file: File) => Promise<AvatarImageValue>`                           | â€”         |
| `onChange`      | `(value: AvatarFieldValue, payload: Record<string, unknown>) => void` | â€”         |
| `onCommit`      | `(value: AvatarFieldValue, payload: Record<string, unknown>) => void` | â€”         |
| `className`     | `string`                                                              | â€”         |

<Credits>
  <GithubInfo owner="shadcn-ui" repo="ui" />
</Credits>

---

# Avatar Thumbnail

URL: /docs/components/avatar-thumbnail

Avatar Thumbnail component with multiple variants and sizes.

<ComponentPreview registryName="@docyrus/ui-avatar-thumbnail">
  <AvatarThumbnailDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-avatar-thumbnail" />

<Dependencies items={[{ label: 'class-variance-authority', url: 'https://www.npmjs.com/package/class-variance-authority' } ]} />

Usage [#usage]

```tsx
import {
  AvatarThumbnail
} from "@docyrus/ui/components/avatar-thumbnail";

<AvatarThumbnail
  shape="rounded"
  icon={...}
  color={...}
  image={...}
/>
```

Shape [#shape]

| Shape     | Description               |
| --------- | ------------------------- |
| `rounded` | Rounded â€” `rounded-md`  |
| `circle`  | Circle â€” `rounded-full` |
| `square`  | Square â€” `rounded-none` |

API Reference [#api-reference]

| Prop        | Type                                                          | Default     |
| ----------- | ------------------------------------------------------------- | ----------- |
| `shape`     | `"rounded"` \| `"circle"` \| `"square"`                       | `"default"` |
| `icon`      | `string \| null`                                              | â€”         |
| `color`     | `string \| null`                                              | â€”         |
| `image`     | `{ signed_url?: string \| null; file_name?: string } \| null` | â€”         |
| `className` | `string`                                                      | â€”         |

---

# Awesome Card

URL: /docs/components/awesome-card

A card with a hatched-stripe header and an inset content area, perfect for displaying stats and metrics.

<ComponentPreview registryName="@docyrus/ui-awesome-card">
  <AwesomeCardDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-awesome-card" />

Usage [#usage]

```tsx
import {
  AwesomeCard,
  AwesomeCardHeader,
  AwesomeCardTitle,
  AwesomeCardIcon,
  AwesomeCardBody,
  AwesomeCardValue,
  AwesomeCardTrend,
} from '@docyrus/ui/components/awesome-card'
;<AwesomeCard>
  <AwesomeCardHeader>
    <AwesomeCardTitle>Total Revenue</AwesomeCardTitle>
    <AwesomeCardIcon>
      <DollarSign className="size-4" />
    </AwesomeCardIcon>
  </AwesomeCardHeader>
  <AwesomeCardBody>
    <AwesomeCardValue>$45,231.89</AwesomeCardValue>
    <AwesomeCardTrend positive>+20.1% from last month</AwesomeCardTrend>
  </AwesomeCardBody>
</AwesomeCard>
```

Components [#components]

| Component           | Description                                     |
| ------------------- | ----------------------------------------------- |
| `AwesomeCard`       | Root container with diagonal stripe background  |
| `AwesomeCardHeader` | Header section with flex layout                 |
| `AwesomeCardTitle`  | Title text element                              |
| `AwesomeCardIcon`   | Icon container in the header                    |
| `AwesomeCardBody`   | Inset content area with card background         |
| `AwesomeCardValue`  | Large value display (e.g. metrics, stats)       |
| `AwesomeCardTrend`  | Trend indicator with positive/negative coloring |

API Reference [#api-reference]

AwesomeCardTrend [#awesomecardtrend]

| Prop        | Type      | Default | Description                                                                                |
| ----------- | --------- | ------- | ------------------------------------------------------------------------------------------ |
| `positive`  | `boolean` | â€”     | When `true`, text is green. When `false`, text is red. When `undefined`, uses muted color. |
| `className` | `string`  | â€”     | Additional CSS classes                                                                     |

---

# Calendar

URL: /docs/components/calendar

Calendar component.

<ComponentPreview registryName="@docyrus/ui-calendar">
  <CalendarDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-calendar" />

<Dependencies items={[{ label: 'motion', url: 'https://www.npmjs.com/package/motion' }, { label: '@emotion/is-prop-valid', url: 'https://www.npmjs.com/package/@emotion/is-prop-valid' }, { label: 'date-fns', url: 'https://www.npmjs.com/package/date-fns' }, { label: 'class-variance-authority', url: 'https://www.npmjs.com/package/class-variance-authority' }, { label: 'sonner', url: 'https://www.npmjs.com/package/sonner' }, { label: '@hookform/resolvers', url: 'https://www.npmjs.com/package/@hookform/resolvers' }, { label: 'react-hook-form', url: 'https://www.npmjs.com/package/react-hook-form' }, { label: 'lucide-react', url: 'https://www.npmjs.com/package/lucide-react' }, { label: 're-resizable', url: 'https://www.npmjs.com/package/re-resizable' }, { label: 'zod', url: 'https://www.npmjs.com/package/zod' }, { label: 'next-themes', url: 'https://www.npmjs.com/package/next-themes' } ]} />

Usage [#usage]

```tsx
import { Calendar, calendarVariants } from '@docyrus/ui/components/calendar'
import type {
  CalendarProps,
  TCalendarView,
  TEventColor,
  IEvent,
  IUser,
  ICalendarCell,
} from '@docyrus/ui/components/calendar'
;<Calendar
  variant="default"
  size="sm"
  events={[]}
  users={[]}
  defaultView="month"
/>
```

Variants [#variants]

| Variant    | Description             |
| ---------- | ----------------------- |
| `default`  | Default style           |
| `bordered` | Bordered â€” `border-2` |
| `compact`  | Compact â€” `text-xs`   |

Sizes [#sizes]

| Size      | Description                     |
| --------- | ------------------------------- |
| `sm`      | Small â€” `max-w-3xl mx-auto`   |
| `default` | Default â€” `max-w-6xl mx-auto` |
| `lg`      | Large                           |

API Reference [#api-reference]

| Prop          | Type                                       | Default     |
| ------------- | ------------------------------------------ | ----------- |
| `variant`     | `"default"` \| `"bordered"` \| `"compact"` | `"default"` |
| `size`        | `"sm"` \| `"default"` \| `"lg"`            | `"default"` |
| `events`      | `Array<IEvent>`                            | `[]`        |
| `users`       | `Array<IUser>`                             | `[]`        |
| `isLoading`   | `boolean`                                  | `false`     |
| `defaultView` | `TCalendarView`                            | `'month'`   |
| `className`   | `string`                                   | â€”         |

Components [#components]

| Component                | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| `Calendar`               | Public export                                         |
| `calendarVariants`       | Public export                                         |
| `CalendarBody`           | Internal â€” `calendar-body.tsx`                      |
| `CalendarSidebar`        | Internal â€” `calendar-sidebar.tsx`                   |
| `CalendarProvider`       | Internal â€” `contexts/calendar-context.tsx`          |
| `DndProvider`            | Internal â€” `contexts/dnd-context.tsx`               |
| `AddEditEventDialog`     | Internal â€” `dialogs/add-edit-event-dialog.tsx`      |
| `EventDetailsDialog`     | Internal â€” `dialogs/event-details-dialog.tsx`       |
| `EventListDialog`        | Internal â€” `dialogs/events-list-dialog.tsx`         |
| `DraggableEvent`         | Internal â€” `dnd/draggable-event.tsx`                |
| `DroppableArea`          | Internal â€” `dnd/droppable-area.tsx`                 |
| `ResizableEvent`         | Internal â€” `dnd/resizable-event.tsx`                |
| `CalendarHeader`         | Internal â€” `header/calendar-header.tsx`             |
| `DateNavigator`          | Internal â€” `header/date-navigator.tsx`              |
| `TodayButton`            | Internal â€” `header/today-button.tsx`                |
| `UserSelect`             | Internal â€” `header/user-select.tsx`                 |
| `Settings`               | Internal â€” `settings/settings.tsx`                  |
| `CalendarHeaderSkeleton` | Internal â€” `skeletons/calendar-header-skeleton.tsx` |
| `CalendarSkeleton`       | Internal â€” `skeletons/calendar-skeleton.tsx`        |
| `DayViewSkeleton`        | Internal â€” `skeletons/day-view-skeleton.tsx`        |
| `MonthViewSkeleton`      | Internal â€” `skeletons/month-view-skeleton.tsx`      |
| `WeekViewSkeleton`       | Internal â€” `skeletons/week-view-skeleton.tsx`       |
| `YearViewSkeleton`       | Internal â€” `skeletons/year-view-skeleton.tsx`       |

Type Exports [#type-exports]

| Type            | Description |
| --------------- | ----------- |
| `CalendarProps` | â€”         |
| `TCalendarView` | â€”         |
| `TEventColor`   | â€”         |
| `IEvent`        | â€”         |
| `IUser`         | â€”         |
| `ICalendarCell` | â€”         |

Type Reference [#type-reference]

CalendarProps [#calendarprops]

| Field         | Type                                   | Description |
| ------------- | -------------------------------------- | ----------- |
| `events`      | `Array<IEvent>`                        | â€”         |
| `users`       | `Array<IUser>`                         | â€”         |
| `isLoading`   | `boolean`                              | â€”         |
| `defaultView` | `TCalendarView`                        | â€”         |
| `variant`     | `'default' \| 'bordered' \| 'compact'` | â€”         |
| `size`        | `'sm' \| 'default' \| 'lg'`            | â€”         |

TCalendarView [#tcalendarview]

`"day"` | `"week"` | `"month"` | `"year"` | `"agenda"`

TEventColor [#teventcolor]

`"blue"`

IEvent [#ievent]

| Field         | Type          | Description |
| ------------- | ------------- | ----------- |
| `id`          | `number`      | â€”         |
| `startDate`   | `string`      | â€”         |
| `endDate`     | `string`      | â€”         |
| `title`       | `string`      | â€”         |
| `color`       | `TEventColor` | â€”         |
| `description` | `string`      | â€”         |
| `user`        | `IUser`       | â€”         |

IUser [#iuser]

| Field         | Type             | Description |
| ------------- | ---------------- | ----------- |
| `id`          | `string`         | â€”         |
| `name`        | `string`         | â€”         |
| `picturePath` | `string \| null` | â€”         |

ICalendarCell [#icalendarcell]

| Field          | Type      | Description |
| -------------- | --------- | ----------- |
| `day`          | `number`  | â€”         |
| `currentMonth` | `boolean` | â€”         |
| `date`         | `Date`    | â€”         |

<Credits>
  <GithubInfo owner="shadcn-ui" repo="ui" />

  <GithubInfo owner="sadmann7" repo="diceui" />
</Credits>

---

# Comments Panel

URL: /docs/components/comments-panel

Comments Panel component.

<ComponentPreview registryName="@docyrus/ui-comments-panel">
  <CommentsPanelDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-comments-panel" />

<Dependencies items={[{ label: 'platejs', url: 'https://www.npmjs.com/package/platejs' }, { label: '@platejs/mention', url: 'https://www.npmjs.com/package/@platejs/mention' }, { label: '@platejs/basic-nodes', url: 'https://www.npmjs.com/package/@platejs/basic-nodes' }, { label: '@platejs/markdown', url: 'https://www.npmjs.com/package/@platejs/markdown' }, { label: 'lucide-react', url: 'https://www.npmjs.com/package/lucide-react' } ]} />

Usage [#usage]

```tsx
import { CommentsPanel } from '@docyrus/ui/components/comments-panel'
import type { CommentsPanelProps } from '@docyrus/ui/components/comments-panel'

const comments: CommentsPanelProps['comments'] = [
  {
    id: 'c-1',
    message: 'Looks good to me.',
    attachments: null,
    created_on: '2025-12-17T10:00:00Z',
    last_modified_on: '2025-12-17T10:00:00Z',
    created_by: 'u-alice',
    record_id: 'rec-1',
    parent_id: null,
  },
]

function Demo() {
  return (
    <CommentsPanel
      comments={comments}
      currentUser={{ id: 'u-alice', firstname: 'Alice', lastname: 'Johnson' }}
      users={[
        { id: 'u-alice', firstname: 'Alice', lastname: 'Johnson' },
        { id: 'u-bob', firstname: 'Bob', lastname: 'Smith' },
      ]}
      onCreateComment={({ message }) => console.log(message)}
      onUpdateComment={(id, message) => console.log(id, message)}
      onDeleteComment={(id) => console.log('delete', id)}
    />
  )
}
```

API Reference [#api-reference]

| Prop              | Type                                                              | Default      |
| ----------------- | ----------------------------------------------------------------- | ------------ |
| `comments`        | `DocyrusComment[]`                                                | â€”          |
| `currentUser`     | `CommentUser`                                                     | â€”          |
| `users`           | `CommentUser[]`                                                   | â€”          |
| `title`           | `string`                                                          | `"Comments"` |
| `editable`        | `boolean`                                                         | `true`       |
| `isLoading`       | `boolean`                                                         | `false`      |
| `onCreateComment` | `({ message, parentId?, attachments? }) => void \| Promise<void>` | â€”          |
| `onUpdateComment` | `(id: string, message: string) => void \| Promise<void>`          | â€”          |
| `onDeleteComment` | `(id: string) => void \| Promise<void>`                           | â€”          |
| `onUploadFile`    | `(file: File) => Promise<CommentAttachment>`                      | â€”          |
| `isCreatePending` | `boolean`                                                         | `false`      |
| `isDeletePending` | `boolean`                                                         | `false`      |
| `className`       | `string`                                                          | â€”          |

Components [#components]

| Component                    | Description                              |
| ---------------------------- | ---------------------------------------- |
| `CommentsPanel`              | Public export                            |
| `CommentCreateForm`          | Internal â€” `comment-create-form.tsx`   |
| `CommentEditorKit`           | Internal â€” `comment-editor-kit.tsx`    |
| `CommentEmptyState`          | Internal â€” `comment-empty-state.tsx`   |
| `CommentItem`                | Internal â€” `comment-item.tsx`          |
| `CommentMentionUsersContext` | Internal â€” `comment-mention-input.tsx` |
| `CommentMentionInputElement` | Internal â€” `comment-mention-input.tsx` |
| `CommentThread`              | Internal â€” `comment-thread.tsx`        |
| `CommentAttachment`          | Internal â€” `lib/file-utils.ts`         |

Type Exports [#type-exports]

| Type                 | Description |
| -------------------- | ----------- |
| `CommentsPanelProps` | â€”         |
| `DocyrusComment`     | â€”         |
| `CommentThread`      | â€”         |
| `CommentAttachment`  | â€”         |
| `CommentUser`        | â€”         |
| `MentionUser`        | â€”         |

Type Reference [#type-reference]

DocyrusComment [#docyruscomment]

| Field              | Type                               | Description     |
| ------------------ | ---------------------------------- | --------------- |
| `id`               | `string`                           | â€”             |
| `message`          | `string`                           | â€”             |
| `attachments`      | `Array<CommentAttachment> \| null` | â€”             |
| `created_on`       | `string`                           | ISO date string |
| `last_modified_on` | `string`                           | ISO date string |
| `created_by`       | `string`                           | user id         |
| `record_id`        | `string \| null`                   | â€”             |
| `parent_id`        | `string \| null`                   | reply to        |

CommentAttachment [#commentattachment]

| Field        | Type             | Description  |
| ------------ | ---------------- | ------------ |
| `id`         | `string`         | â€”          |
| `file_name`  | `string`         | â€”          |
| `file_type`  | `string`         | MIME type    |
| `file_size`  | `number`         | bytes        |
| `signed_url` | `string \| null` | download URL |

CommentUser [#commentuser]

| Field       | Type             | Description |
| ----------- | ---------------- | ----------- |
| `id`        | `string`         | â€”         |
| `firstname` | `string \| null` | â€”         |
| `lastname`  | `string \| null` | â€”         |

CommentThread [#commentthread]

| Field     | Type                    | Description |
| --------- | ----------------------- | ----------- |
| `comment` | `DocyrusComment`        | â€”         |
| `replies` | `Array<DocyrusComment>` | â€”         |

<Credits>
  <GithubInfo owner="shadcn-ui" repo="ui" />
</Credits>

---

# Cropper

URL: /docs/components/cropper

Cropper component with multiple variants and sizes.

<ComponentPreview registryName="@docyrus/ui-cropper">
  <CropperDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-cropper" />

<Dependencies items={[{ label: 'lucide-react', url: 'https://www.npmjs.com/package/lucide-react' } ]} />

Usage [#usage]

```tsx
import { Cropper } from '@docyrus/ui/components/cropper'
;<Cropper
  src="..."
  fileName="..."
  outputSize={DEFAULT_OUTPUT_SIZE}
  outputType="image/png"
  onCancel={() => {}}
  onApply={() => {}}
/>
```

API Reference [#api-reference]

| Prop         | Type                                          | Default               |
| ------------ | --------------------------------------------- | --------------------- |
| `src`        | `string`                                      | â€”                   |
| `fileName`   | `string`                                      | â€”                   |
| `outputSize` | `number`                                      | `DEFAULT_OUTPUT_SIZE` |
| `outputType` | `'image/png' \| 'image/jpeg' \| 'image/webp'` | `'image/png'`         |
| `onCancel`   | `() => void`                                  | â€”                   |
| `onApply`    | `(file: File) => Promise<void> \| void`       | â€”                   |
| `className`  | `string`                                      | â€”                   |

<Credits>
  <GithubInfo owner="shadcn-ui" repo="ui" />
</Credits>

---

# Data Grid

URL: /docs/components/data-grid

A virtualized, editable spreadsheet-like data grid with sorting, filtering, grouping, cell selection, and keyboard navigation.

<ComponentPreview registryName="@docyrus/ui-data-grid">
  <DataGridDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-data-grid" />

<Dependencies items={[{ label: 'lucide-react', url: 'https://www.npmjs.com/package/lucide-react' }, { label: 'sonner', url: 'https://www.npmjs.com/package/sonner' }, { label: '@tanstack/react-table', url: 'https://www.npmjs.com/package/@tanstack/react-table' }, { label: '@radix-ui/react-direction', url: 'https://www.npmjs.com/package/@radix-ui/react-direction' }, { label: '@types/react', url: 'https://www.npmjs.com/package/@types/react' }, { label: '@tanstack/react-virtual', url: 'https://www.npmjs.com/package/@tanstack/react-virtual' } ]} />

Usage [#usage]

```tsx
import {
  DataGrid,
  DataGridFilterMenu,
  DataGridGroupMenu,
  DataGridKeyboardShortcuts,
  DataGridRowHeightMenu,
  DataGridSortMenu,
  DataGridViewMenu,
  getDataGridSelectColumn,
  useDataGrid,
} from '@docyrus/ui/components/data-grid'
import type {
  ColumnDef,
  DataGridAction,
} from '@docyrus/ui/components/data-grid'

const columns: ColumnDef<Person>[] = [
  getDataGridSelectColumn<Person>(),
  {
    accessorKey: 'name',
    header: 'Name',
    size: 180,
    meta: { label: 'Name', cell: { variant: 'short-text' } },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    size: 220,
    meta: { label: 'Email', cell: { variant: 'email' } },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 130,
    meta: {
      label: 'Status',
      cell: {
        variant: 'status',
        options: [
          { label: 'Active', value: 'active', color: '#22c55e' },
          { label: 'Inactive', value: 'inactive', color: '#ef4444' },
        ],
      },
    },
  },
]

function MyGrid() {
  const [data, setData] = useState(initialData)

  const { table, ...gridProps } = useDataGrid({
    data,
    columns,
    enableSearch: true,
    enableGrouping: true,
    onDataChange: setData,
    onRowAdd: () => {
      setData((prev) => [...prev, emptyRow])
      return null
    },
    onRowsDelete: (rows, indices) => {
      setData((prev) => prev.filter((_, i) => !indices.includes(i)))
    },
  })

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <DataGridFilterMenu table={table} />
        <DataGridSortMenu table={table} />
        <DataGridGroupMenu table={table} />
        <DataGridRowHeightMenu table={table} />
        <DataGridViewMenu table={table} storageKey="my-grid" />
      </div>
      <DataGridKeyboardShortcuts enableSearch />
      <DataGrid table={table} {...gridProps} height={500} />
    </div>
  )
}
```

Toolbar Menus [#toolbar-menus]

The grid provides standalone toolbar menu components. Destructure `table` from `useDataGrid` and pass it to each menu:

| Component                   | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| `DataGridFilterMenu`        | Column-based filter menu (integrates with DataTableFilter) |
| `DataGridSortMenu`          | Multi-column sort configuration                            |
| `DataGridGroupMenu`         | Group rows by a single column                              |
| `DataGridRowHeightMenu`     | Row height selector (short, medium, tall, extra-tall)      |
| `DataGridViewMenu`          | Column visibility, order, pinning, and saved views         |
| `DataGridKeyboardShortcuts` | Keyboard shortcut reference dialog (press `/` to open)     |

All menu components accept `table: Table<TData>` and an optional `disabled?: boolean` prop.

Bulk Actions [#bulk-actions]

Show action buttons when rows are selected:

```tsx
const actions: DataGridAction<Person>[] = [
  {
    label: 'Delete',
    icon: <Trash2 className="size-3.5" />,
    variant: 'destructive',
    onAction: (rows) => deleteRows(rows),
  },
]

;<DataGrid table={table} {...gridProps} actions={actions} />
```

Skeleton [#skeleton]

Use the skeleton components to show a loading placeholder while data is fetching.

```tsx
import {
  DataGridSkeleton,
  DataGridSkeletonToolbar,
  DataGridSkeletonGrid,
} from '@docyrus/ui/components/data-grid'
;<DataGridSkeleton>
  <DataGridSkeletonToolbar actionCount={4} align="end" />
  <DataGridSkeletonGrid />
</DataGridSkeleton>
```

Features [#features]

- **Virtualized rendering** â€” Only visible rows are rendered for optimal performance
- **Cell editing** â€” Click to select, double-click or type to edit
- **Keyboard navigation** â€” Arrow keys, Tab, Enter, Escape, Home, End, Page Up/Down
- **Cell selection** â€” Click + Shift/Ctrl for multi-cell range selection
- **Copy / Cut / Paste** â€” Ctrl+C, Ctrl+X, Ctrl+V with clipboard support
- **Search** â€” Ctrl+F to open in-grid search bar
- **Context menu** â€” Right-click for cell actions
- **Row selection** â€” Select column with checkboxes for bulk operations
- **Row height** â€” Built-in row height menu (short, medium, tall, extra-tall)
- **Sorting** â€” Column header sort menu
- **Filtering** â€” Column header filter menu
- **Grouping** â€” Group rows by column values
- **RTL support** â€” Full right-to-left layout
- **Add / Delete rows** â€” Footer add row button, bulk delete via action bar
- **29 cell variants** â€” Comprehensive cell types for any data

---

API Reference [#api-reference]

useDataGrid [#usedatagrid]

The main hook that manages all grid state. Returns an object to spread onto `<DataGrid>`.

| Prop                        | Type                                                                    | Default   | Description                                                                    |
| --------------------------- | ----------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------ |
| `data`                      | `Array<TData>`                                                          | â€”       | Row data array                                                                 |
| `columns`                   | `Array<ColumnDef<TData>>`                                               | â€”       | Column definitions (TanStack Table)                                            |
| `onDataChange`              | `(data: Array<TData>) => void`                                          | â€”       | Called when cell values change                                                 |
| `onRowAdd`                  | `(event?) => Partial<CellPosition> \| Promise<...> \| null`             | â€”       | Called when "Add row" is clicked. Returning `null` appends at end.             |
| `onRowsAdd`                 | `(count: number) => void \| Promise<void>`                              | â€”       | Called when pasting requires new rows                                          |
| `onRowsDelete`              | `(rows: Array<TData>, indices: Array<number>) => void \| Promise<void>` | â€”       | Called on row deletion (bulk or single)                                        |
| `onPaste`                   | `(updates: Array<CellUpdate>) => void \| Promise<void>`                 | â€”       | Custom paste handler                                                           |
| `onFilesUpload`             | `(params) => Promise<Array<FileCellData>>`                              | â€”       | File upload handler for file/image cells                                       |
| `onFilesDelete`             | `(params) => void \| Promise<void>`                                     | â€”       | File deletion handler                                                          |
| `rowHeight`                 | `RowHeightValue`                                                        | `'short'` | Initial row height (read once at mount)                                        |
| `onRowHeightChange`         | `(height: RowHeightValue) => void`                                      | â€”       | Row height change callback                                                     |
| `overscan`                  | `number`                                                                | `4`       | Virtual scroll overscan rows                                                   |
| `measureRows`               | `boolean`                                                               | `false`   | Measure variable row heights; keep off for uniform rows to avoid layout thrash |
| `dir`                       | `'ltr' \| 'rtl'`                                                        | â€”       | Text direction                                                                 |
| `autoFocus`                 | `boolean \| Partial<CellPosition>`                                      | â€”       | Auto-focus grid or specific cell on mount                                      |
| `enableSingleCellSelection` | `boolean`                                                               | `false`   | Allow single cell click selection                                              |
| `enableColumnSelection`     | `boolean`                                                               | `false`   | Allow full column selection via header                                         |
| `enableSearch`              | `boolean`                                                               | `false`   | Enable Ctrl+F search bar                                                       |
| `enablePaste`               | `boolean`                                                               | `false`   | Enable clipboard paste                                                         |
| `enableGrouping`            | `boolean`                                                               | `true`    | Enable column grouping                                                         |
| `readOnly`                  | `boolean`                                                               | â€”       | Disable all editing                                                            |
| `initialState`              | `TableState` (TanStack)                                                 | â€”       | Pass-through initial state (sorting, columnVisibility, pinning, etc.)          |

DataGrid [#datagrid]

The rendered grid component. Accepts the return value of `useDataGrid` plus visual props.

| Prop               | Type                             | Default     | Description                             |
| ------------------ | -------------------------------- | ----------- | --------------------------------------- |
| `...useDataGrid()` | `ReturnType<typeof useDataGrid>` | â€”         | Spread the hook's return value          |
| `dir`              | `'ltr' \| 'rtl'`                 | `'ltr'`     | Layout direction                        |
| `height`           | `number`                         | `600`       | Grid height in pixels                   |
| `stretchColumns`   | `boolean`                        | `false`     | Stretch columns to fill available width |
| `addRowLabel`      | `string`                         | `'Add row'` | Label for the add row button            |
| `actions`          | `Array<DataGridAction<TData>>`   | â€”         | Bulk action buttons for selected rows   |

DataGridSkeleton [#datagridskeleton]

Container for the loading skeleton.

| Prop        | Type     | Default | Description            |
| ----------- | -------- | ------- | ---------------------- |
| `className` | `string` | â€”     | Additional CSS classes |

DataGridSkeletonToolbar [#datagridskeletontoolbar]

Toolbar skeleton with placeholder action buttons.

| Prop          | Type                           | Default | Description                          |
| ------------- | ------------------------------ | ------- | ------------------------------------ |
| `align`       | `'start' \| 'center' \| 'end'` | `'end'` | Toolbar alignment                    |
| `actionCount` | `number`                       | `4`     | Number of placeholder action buttons |

DataGridSkeletonGrid [#datagridskeletongrid]

Grid body skeleton placeholder.

| Prop        | Type     | Default | Description            |
| ----------- | -------- | ------- | ---------------------- |
| `className` | `string` | â€”     | Additional CSS classes |

getDataGridSelectColumn [#getdatagridselectcolumn]

Returns a column definition for the row selection checkbox column.

```tsx
const selectColumn = getDataGridSelectColumn<Person>()
const columns = [selectColumn, ...yourColumns]
```

---

Type Reference [#type-reference]

ColumnDef [#columndef]

Re-exported from `@tanstack/react-table`. Extended with `meta.cell` for cell variant configuration.

```tsx
{
  accessorKey: string;
  header: string;
  size?: number;
  meta?: {
    label?: string;
    cell?: CellOpts;
  };
}
```

CellOpts [#cellopts]

A discriminated union defining the cell variant and its configuration. Set via `meta.cell` on column definitions.

| Variant             | Additional Props                                     | Data Type        | Description                              |
| ------------------- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| `short-text`        | â€”                                                  | `string`         | Single-line text input                   |
| `long-text`         | â€”                                                  | `string`         | Multi-line text with expand              |
| `email`             | â€”                                                  | `string`         | Email with mailto link                   |
| `phone`             | â€”                                                  | `string`         | Phone number with tel link               |
| `number`            | `min?`, `max?`, `step?`                              | `number`         | Numeric input with constraints           |
| `currency`          | `currency?`, `min?`, `max?`, `step?`                 | `number`         | Formatted currency value                 |
| `percent`           | `min?`, `max?`, `step?`                              | `number`         | Percentage display (0-1 range)           |
| `url`               | â€”                                                  | `string`         | Clickable URL link                       |
| `checkbox`          | â€”                                                  | `boolean`        | Boolean checkbox                         |
| `switch`            | â€”                                                  | `boolean`        | Boolean toggle switch                    |
| `select`            | `options: CellSelectOption[]`                        | `string`         | Single-select dropdown                   |
| `status`            | `options: CellSelectOption[]`                        | `string`         | Color-coded status badge                 |
| `enum`              | `appSlug`, `dataSourceSlug`, `fieldSlug`, `options?` | `string`         | Backend-driven enum (requires Docyrus)   |
| `user`              | `options: CellUserOption[]`                          | `string`         | User avatar + name select                |
| `multi-select`      | `options: CellSelectOption[]`                        | `string`         | Multi-value select with badges           |
| `tag-select`        | `options: CellSelectOption[]`                        | `string`         | Colored tag chips                        |
| `date`              | â€”                                                  | `string`         | Date picker (YYYY-MM-DD)                 |
| `datetime`          | â€”                                                  | `string`         | Date + time picker (ISO 8601)            |
| `time`              | â€”                                                  | `string`         | Time-only picker (HH:mm)                 |
| `duration`          | â€”                                                  | `string`         | Duration display (HH:mm:ss)              |
| `date-range`        | â€”                                                  | `string`         | Date range (start,end)                   |
| `color`             | â€”                                                  | `string`         | Color swatch + hex picker                |
| `icon`              | â€”                                                  | `string`         | Icon name selector                       |
| `currency-code`     | â€”                                                  | `string`         | ISO currency code (USD, EUR, etc.)       |
| `file`              | `maxFileSize?`, `maxFiles?`, `accept?`, `multiple?`  | `FileCellData[]` | File upload cell                         |
| `image`             | `maxFileSize?`, `accept?`                            | `string`         | Image preview + upload                   |
| `relation`          | `dataSourceId`, `displayField?`                      | `string`         | Related record lookup (requires Docyrus) |
| `rating`            | `max?`                                               | `number`         | Star rating (default max: 5)             |
| `user-multi-select` | `options: CellUserOption[]`                          | `string`         | Multi-user select with avatars           |

CellSelectOption [#cellselectoption]

Option definition for `select`, `status`, `multi-select`, and `tag-select` variants.

| Field     | Type           | Required | Description           |
| --------- | -------------- | -------- | --------------------- |
| `label`   | `string`       | Yes      | Display label         |
| `value`   | `string`       | Yes      | Internal value        |
| `icon`    | `FC<SVGProps>` | No       | Custom icon component |
| `iconStr` | `string`       | No       | Icon name string      |
| `color`   | `string`       | No       | Badge/tag color (hex) |
| `count`   | `number`       | No       | Faceted count         |

CellUserOption [#celluseroption]

Extends `CellSelectOption` with user-specific fields.

| Field                 | Type     | Required | Description                   |
| --------------------- | -------- | -------- | ----------------------------- |
| `...CellSelectOption` | â€”      | â€”      | All select option fields      |
| `avatarUrl`           | `string` | No       | User avatar image URL         |
| `initials`            | `string` | No       | Fallback initials (e.g. "AJ") |

DataGridAction [#datagridaction]

Action button definition for the bulk action bar (shown when rows are selected).

| Field      | Type                                   | Required | Description                        |
| ---------- | -------------------------------------- | -------- | ---------------------------------- |
| `label`    | `string`                               | Yes      | Action button label                |
| `icon`     | `ReactNode`                            | No       | Action icon                        |
| `variant`  | `'default' \| 'destructive'`           | No       | Button variant                     |
| `onAction` | `(selectedRows: Array<TData>) => void` | Yes      | Action callback with selected rows |

RowHeightValue [#rowheightvalue]

```tsx
type RowHeightValue = 'short' | 'medium' | 'tall' | 'extra-tall'
```

CellUpdate [#cellupdate]

Used in paste and data update operations.

| Field      | Type      | Description      |
| ---------- | --------- | ---------------- |
| `rowIndex` | `number`  | Target row index |
| `columnId` | `string`  | Target column ID |
| `value`    | `unknown` | New cell value   |

CellPosition [#cellposition]

| Field      | Type     | Description |
| ---------- | -------- | ----------- |
| `rowIndex` | `number` | Row index   |
| `columnId` | `string` | Column ID   |

FileCellData [#filecelldata]

Data shape for files in `file` and `image` cell variants.

| Field  | Type      | Description          |
| ------ | --------- | -------------------- |
| `id`   | `string`  | Unique file ID       |
| `name` | `string`  | File name            |
| `size` | `number`  | File size in bytes   |
| `type` | `string`  | MIME type            |
| `url`  | `string?` | Download/preview URL |

Direction [#direction]

```tsx
type Direction = 'ltr' | 'rtl'
```

---

Keyboard Shortcuts [#keyboard-shortcuts]

| Shortcut                 | Action                          |
| ------------------------ | ------------------------------- |
| `Arrow Keys`             | Navigate between cells          |
| `Tab` / `Shift+Tab`      | Move to next/previous cell      |
| `Enter`                  | Start editing / Confirm edit    |
| `Escape`                 | Cancel edit / Clear selection   |
| `Ctrl+F`                 | Open search                     |
| `Ctrl+C`                 | Copy selected cells             |
| `Ctrl+X`                 | Cut selected cells              |
| `Ctrl+V`                 | Paste from clipboard            |
| `Ctrl+A`                 | Select all cells                |
| `Delete` / `Backspace`   | Clear selected cells            |
| `Home` / `End`           | Jump to first/last cell in row  |
| `Ctrl+Home` / `Ctrl+End` | Jump to first/last cell in grid |
| `Page Up` / `Page Down`  | Scroll up/down by page          |
| `Shift+Click`            | Range selection                 |
| `Ctrl+Click`             | Toggle cell in selection        |

---

# Data Table Filter

URL: /docs/components/data-table-filter

A composable filter bar for data tables with text, number, date, option, and multi-option column types.

<ComponentPreview registryName="@docyrus/ui-data-table-filter">
  <DataTableFilterDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-data-table-filter" />

Usage [#usage]

```tsx
import {
  DataTableFilter,
  useDataTableFilters,
} from '@docyrus/ui/components/data-table-filter'

const columnsConfig = [
  {
    id: 'title',
    displayName: 'Title',
    icon: TextIcon,
    type: 'text' as const,
    accessor: (row: Task) => row.title,
  },
  {
    id: 'status',
    displayName: 'Status',
    icon: CircleIcon,
    type: 'option' as const,
    accessor: (row: Task) => row.status,
    options: [
      { label: 'Todo', value: 'todo' },
      { label: 'Done', value: 'done' },
    ],
  },
  {
    id: 'effort',
    displayName: 'Effort',
    icon: HashIcon,
    type: 'number' as const,
    accessor: (row: Task) => row.effort,
    min: 0,
    max: 100,
  },
  {
    id: 'createdAt',
    displayName: 'Created',
    icon: CalendarIcon,
    type: 'date' as const,
    accessor: (row: Task) => row.createdAt,
  },
] as const

function MyFilters() {
  const { columns, filters, actions, strategy } = useDataTableFilters({
    strategy: 'client',
    data: myData,
    columnsConfig,
  })

  return (
    <DataTableFilter
      columns={columns}
      filters={filters}
      actions={actions}
      strategy={strategy}
      locale="en"
    />
  )
}
```

Features [#features]

- **5 column data types** â€” text, number, date, option, multiOption
- **Client & server strategies** â€” Client-side filtering with automatic option counting, or server-side with external filter state
- **Rich operators** â€” Type-specific operators (contains, is between, is any of, etc.)
- **i18n support** â€” Built-in locales: English, French, Dutch, German, Chinese (Simplified & Traditional)
- **Faceted counts** â€” Option counts with visual indicators
- **Keyboard friendly** â€” Full keyboard navigation through filter controls
- **Mobile responsive** â€” Adapts layout for mobile viewports
- **Controlled & uncontrolled** â€” Use internal state or manage filters externally

---

API Reference [#api-reference]

useDataTableFilters [#usedatatablefilters]

The main hook that creates columns, manages filter state, and returns action handlers.

| Prop              | Type                                               | Default | Description                                       |
| ----------------- | -------------------------------------------------- | ------- | ------------------------------------------------- |
| `strategy`        | `'client' \| 'server'`                             | â€”     | Filter strategy                                   |
| `data`            | `Array<TData>`                                     | â€”     | Row data array                                    |
| `columnsConfig`   | `ReadonlyArray<ColumnConfig<TData>>`               | â€”     | Column configuration array                        |
| `defaultFilters`  | `FiltersState`                                     | â€”     | Initial filter values (uncontrolled)              |
| `filters`         | `FiltersState`                                     | â€”     | External filter state (controlled)                |
| `onFiltersChange` | `Dispatch<SetStateAction<FiltersState>>`           | â€”     | Filter state setter (controlled)                  |
| `options`         | `Partial<Record<OptionColumnIds, ColumnOption[]>>` | â€”     | Server-provided options for option columns        |
| `faceted`         | `Partial<Record<...>>`                             | â€”     | Server-provided faceted counts and min/max values |

**Returns:**

| Field      | Type                     | Description                             |
| ---------- | ------------------------ | --------------------------------------- |
| `columns`  | `Array<Column<TData>>`   | Enriched column objects with properties |
| `filters`  | `FiltersState`           | Current filter state                    |
| `actions`  | `DataTableFilterActions` | Filter action handlers                  |
| `strategy` | `FilterStrategy`         | Active strategy                         |

DataTableFilter [#datatablefilter]

The rendered filter bar component.

| Prop       | Type                     | Default | Description                             |
| ---------- | ------------------------ | ------- | --------------------------------------- |
| `columns`  | `Array<Column<TData>>`   | â€”     | Columns from `useDataTableFilters`      |
| `filters`  | `FiltersState`           | â€”     | Filter state from `useDataTableFilters` |
| `actions`  | `DataTableFilterActions` | â€”     | Actions from `useDataTableFilters`      |
| `strategy` | `FilterStrategy`         | â€”     | Strategy from `useDataTableFilters`     |
| `locale`   | `Locale`                 | `'en'`  | Display locale                          |

---

Type Reference [#type-reference]

ColumnConfig [#columnconfig]

Configuration for a single filterable column.

| Field               | Type                      | Required               | Description                             |
| ------------------- | ------------------------- | ---------------------- | --------------------------------------- |
| `id`                | `string`                  | Yes                    | Unique column identifier                |
| `accessor`          | `(row: TData) => TVal`    | Yes                    | Function to extract value from row data |
| `displayName`       | `string`                  | Yes                    | Display label for the filter UI         |
| `icon`              | `LucideIcon`              | Yes                    | Icon component shown next to the label  |
| `type`              | `ColumnDataType`          | Yes                    | Column data type                        |
| `options`           | `Array<ColumnOption>`     | For option/multiOption | Available options for selection         |
| `facetedOptions`    | `Map<string, number>`     | No                     | Pre-computed faceted option counts      |
| `min`               | `number`                  | For number             | Minimum value constraint                |
| `max`               | `number`                  | For number             | Maximum value constraint                |
| `transformOptionFn` | `(value) => ColumnOption` | No                     | Transform raw values to options         |
| `orderFn`           | `(a, b) => number`        | No                     | Custom sort order for options           |

ColumnDataType [#columndatatype]

```tsx
type ColumnDataType = 'text' | 'number' | 'date' | 'option' | 'multiOption'
```

| Type          | Native Value    | Description                                |
| ------------- | --------------- | ------------------------------------------ |
| `text`        | `string`        | Searchable text column                     |
| `number`      | `number`        | Numeric column with range support          |
| `date`        | `Date`          | Date column with range support             |
| `option`      | `string`        | Single-value from a list of options        |
| `multiOption` | `Array<string>` | Zero or more values from a list of options |

ColumnOption [#columnoption]

Option item for `option` and `multiOption` columns.

| Field   | Type                          | Required | Description               |
| ------- | ----------------------------- | -------- | ------------------------- |
| `label` | `string`                      | Yes      | Display label             |
| `value` | `string`                      | Yes      | Internal value            |
| `icon`  | `ReactElement \| ElementType` | No       | Icon component or element |

FilterStrategy [#filterstrategy]

```tsx
type FilterStrategy = 'client' | 'server'
```

- **`client`** â€” Hook computes options, faceted counts, and min/max from the provided data array automatically.
- **`server`** â€” You provide options and faceted counts externally. The hook only manages filter state.

FilterModel [#filtermodel]

Represents a single active filter.

| Field      | Type                    | Description           |
| ---------- | ----------------------- | --------------------- |
| `columnId` | `string`                | Column being filtered |
| `type`     | `ColumnDataType`        | Column data type      |
| `operator` | `FilterOperators[type]` | Active operator       |
| `values`   | `FilterValues<type>`    | Filter values         |

FiltersState [#filtersstate]

```tsx
type FiltersState = Array<FilterModel>
```

DataTableFilterActions [#datatablefilteractions]

| Method              | Signature                      | Description                                     |
| ------------------- | ------------------------------ | ----------------------------------------------- |
| `addFilterValue`    | `(column, values) => void`     | Add values to an option/multiOption filter      |
| `removeFilterValue` | `(column, values) => void`     | Remove values from an option/multiOption filter |
| `setFilterValue`    | `(column, values) => void`     | Set filter values (any type)                    |
| `setFilterOperator` | `(columnId, operator) => void` | Change filter operator                          |
| `removeFilter`      | `(columnId) => void`           | Remove a single filter                          |
| `removeAllFilters`  | `() => void`                   | Clear all active filters                        |

Locale [#locale]

```tsx
type Locale = 'en' | 'fr' | 'nl' | 'zh_CN' | 'zh_TW' | 'de'
```

---

Filter Operators [#filter-operators]

Text Operators [#text-operators]

| Operator           | Description                            |
| ------------------ | -------------------------------------- |
| `contains`         | Value contains the search text         |
| `does not contain` | Value does not contain the search text |

Number Operators [#number-operators]

| Operator                      | Description                    |
| ----------------------------- | ------------------------------ |
| `is`                          | Equals the value               |
| `is not`                      | Does not equal the value       |
| `is less than`                | Less than the value            |
| `is less than or equal to`    | Less than or equal             |
| `is greater than`             | Greater than the value         |
| `is greater than or equal to` | Greater than or equal          |
| `is between`                  | Between two values (inclusive) |
| `is not between`              | Outside the range              |

Date Operators [#date-operators]

| Operator          | Description            |
| ----------------- | ---------------------- |
| `is`              | Exact date match       |
| `is not`          | Not this date          |
| `is before`       | Before the date        |
| `is on or before` | On or before the date  |
| `is after`        | After the date         |
| `is on or after`  | On or after the date   |
| `is between`      | Between two dates      |
| `is not between`  | Outside the date range |

Option Operators [#option-operators]

| Operator     | Description                          |
| ------------ | ------------------------------------ |
| `is`         | Matches the selected option          |
| `is not`     | Does not match                       |
| `is any of`  | Matches any of the selected options  |
| `is none of` | Matches none of the selected options |

Multi-Option Operators [#multi-option-operators]

| Operator            | Description                         |
| ------------------- | ----------------------------------- |
| `include`           | Includes the selected value         |
| `exclude`           | Excludes the selected value         |
| `include any of`    | Includes any of the selected values |
| `include all of`    | Includes all selected values        |
| `exclude if any of` | Excludes if any of the values match |
| `exclude if all`    | Excludes if all values match        |

---

# Date Time Picker

URL: /docs/components/date-time-picker

Date Time Picker component with multiple variants and sizes.

<ComponentPreview registryName="@docyrus/ui-date-time-picker">
  <DateTimePickerDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-date-time-picker" />

<Dependencies items={[{ label: 'react-hook-form', url: 'https://www.npmjs.com/package/react-hook-form' }, { label: 'class-variance-authority', url: 'https://www.npmjs.com/package/class-variance-authority' }, { label: 'lucide-react', url: 'https://www.npmjs.com/package/lucide-react' }, { label: 'date-fns', url: 'https://www.npmjs.com/package/date-fns' } ]} />

Usage [#usage]

```tsx
import { DateTimePicker } from '@docyrus/ui/components/date-time-picker'
;<DateTimePicker size="sm" />
```

Sizes [#sizes]

| Size      | Description               |
| --------- | ------------------------- |
| `sm`      | Small â€” `gap-1 text-sm` |
| `default` | Default â€” `gap-1.5`     |
| `lg`      | Large â€” `gap-2 text-lg` |

API Reference [#api-reference]

| Prop        | Type                            | Default     |
| ----------- | ------------------------------- | ----------- |
| `size`      | `"sm"` \| `"default"` \| `"lg"` | `"default"` |
| `className` | `string`                        | â€”         |

<Credits>
  <GithubInfo owner="shadcn-ui" repo="ui" />
</Credits>

---

# Day Picker

URL: /docs/components/day-picker

Day Picker component with multiple variants and sizes.

<ComponentPreview registryName="@docyrus/ui-day-picker">
  <DayPickerDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-day-picker" />

<Dependencies items={[{ label: 'class-variance-authority', url: 'https://www.npmjs.com/package/class-variance-authority' }, { label: 'lucide-react', url: 'https://www.npmjs.com/package/lucide-react' }, { label: 'react-day-picker', url: 'https://www.npmjs.com/package/react-day-picker' } ]} />

Usage [#usage]

```tsx
import { DayPicker } from '@docyrus/ui/components/day-picker'
;<DayPicker
  variant="default"
  size="default"
  showOutsideDays={true}
  fixedWeeks
  numberOfMonths={0}
  captionLayout="label"
/>
```

Variants [#variants]

| Variant   | Description                                   |
| --------- | --------------------------------------------- |
| `default` | Default style                                 |
| `outline` | Outline â€” `border border-border rounded-xl` |
| `ghost`   | Ghost â€” `bg-transparent`                    |

Sizes [#sizes]

| Size      | Description                                  |
| --------- | -------------------------------------------- |
| `default` | Default â€” `[--cell-size:36px] text-sm`     |
| `sm`      | Small â€” `[--cell-size:28px] p-2 text-xs`   |
| `lg`      | Large â€” `[--cell-size:44px] p-4 text-base` |

API Reference [#api-reference]

| Prop              | Type                                                             | Default     |
| ----------------- | ---------------------------------------------------------------- | ----------- |
| `variant`         | `"default"` \| `"outline"` \| `"ghost"`                          | `"default"` |
| `size`            | `"default"` \| `"sm"` \| `"lg"`                                  | `"default"` |
| `showOutsideDays` | `boolean`                                                        | `true`      |
| `fixedWeeks`      | `boolean`                                                        | â€”         |
| `numberOfMonths`  | `number`                                                         | â€”         |
| `captionLayout`   | `'label' \| 'dropdown' \| 'dropdown-months' \| 'dropdown-years'` | â€”         |
| `className`       | `string`                                                         | â€”         |

<Credits>
  <GithubInfo owner="shadcn-ui" repo="ui" />
</Credits>

---

# Delete Confirm Dialog

URL: /docs/components/delete-confirm-dialog

Delete Confirm Dialog component with multiple variants and sizes.

<ComponentPreview registryName="@docyrus/ui-delete-confirm-dialog">
  <DeleteConfirmDialogDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-delete-confirm-dialog" />

Usage [#usage]

```tsx
import { DeleteConfirmDialog } from '@docyrus/ui/components/delete-confirm-dialog'
;<DeleteConfirmDialog
  open
  onOpenChange={() => {}}
  objectName="..."
  count={0}
  onConfirm={() => {}}
  isPending
/>
```

API Reference [#api-reference]

| Prop           | Type                          | Default |
| -------------- | ----------------------------- | ------- |
| `open`         | `boolean`                     | â€”     |
| `onOpenChange` | `(open: boolean) => void`     | â€”     |
| `objectName`   | `string`                      | â€”     |
| `count`        | `number`                      | â€”     |
| `onConfirm`    | `() => void \| Promise<void>` | â€”     |
| `isPending`    | `boolean`                     | â€”     |
| `className`    | `string`                      | â€”     |

<Credits>
  <GithubInfo owner="shadcn-ui" repo="ui" />
</Credits>

---

# Docyrus Icon

URL: /docs/components/docyrus-icon

Docyrus Icon component with multiple variants and sizes.

<ComponentPreview registryName="@docyrus/ui-docyrus-icon">
  <DocyrusIconDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-docyrus-icon" />

<Dependencies items={[{ label: 'react-inlinesvg', url: 'https://www.npmjs.com/package/react-inlinesvg' }, { label: 'class-variance-authority', url: 'https://www.npmjs.com/package/class-variance-authority' } ]} />

Usage [#usage]

```tsx
import {
  DocyrusIcon
} from "@docyrus/ui/components/docyrus-icon";

<DocyrusIcon
  size="xs"
  animation="none"
  icon="..."
  lib="..."
  group={...}
/>
```

Sizes [#sizes]

| Size      | Description              |
| --------- | ------------------------ |
| `xs`      | Extra small â€” `size-3` |
| `sm`      | Small â€” `size-4`       |
| `default` | Default â€” `size-5`     |
| `lg`      | Large â€” `size-6`       |
| `xl`      | Extra large â€” `size-8` |

Animation [#animation]

| Animation | Description                 |
| --------- | --------------------------- |
| `none`    | Default (no animation)      |
| `spin`    | Spin â€” `animate-spin`     |
| `pulse`   | Pulse â€” `animate-pulse`   |
| `bounce`  | Bounce â€” `animate-bounce` |
| `ping`    | Ping â€” `animate-ping`     |

API Reference [#api-reference]

| Prop        | Type                                                        | Default     |
| ----------- | ----------------------------------------------------------- | ----------- |
| `size`      | `"xs"` \| `"sm"` \| `"default"` \| `"lg"` \| `"xl"`         | `"default"` |
| `animation` | `"none"` \| `"spin"` \| `"pulse"` \| `"bounce"` \| `"ping"` | `"default"` |
| `icon`      | `string`                                                    | â€”         |
| `lib`       | `string`                                                    | â€”         |
| `group`     | `string \| null`                                            | â€”         |
| `className` | `string`                                                    | â€”         |

<Credits>
  <GithubInfo owner="FortAwesome" repo="Font-Awesome" />

  <GithubInfo owner="hugeicons" repo="hugeicons-react" />
</Credits>

---

# Duration Select

URL: /docs/components/duration-select

Duration Select component with multiple variants and sizes.

<ComponentPreview registryName="@docyrus/ui-duration-select">
  <DurationSelectDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-duration-select" />

<Dependencies items={[{ label: 'lucide-react', url: 'https://www.npmjs.com/package/lucide-react' } ]} />

Usage [#usage]

```tsx
import {
  DurationSelect
} from "@docyrus/ui/components/duration-select";

<DurationSelect
  value={...}
  onChange={() => {}}
  format="compact"
  minuteIncrement={5}
  maxHours={8}
  placeholder="0h 0m"
/>
```

API Reference [#api-reference]

| Prop              | Type                                | Default     |
| ----------------- | ----------------------------------- | ----------- |
| `value`           | `number \| null \| undefined`       | â€”         |
| `onChange`        | `(seconds: number \| null) => void` | â€”         |
| `format`          | `DurationFormat`                    | `'compact'` |
| `minuteIncrement` | `number`                            | `5`         |
| `maxHours`        | `number`                            | `8`         |
| `disabled`        | `boolean`                           | `false`     |
| `invalid`         | `boolean`                           | `false`     |
| `placeholder`     | `string`                            | `'0h 0m'`   |
| `className`       | `string`                            | â€”         |

<Credits>
  <GithubInfo owner="shadcn-ui" repo="ui" />
</Credits>

---

# File Attachment Panel

URL: /docs/components/file-attachment-panel

File Attachment Panel component.

<ComponentPreview registryName="@docyrus/ui-file-attachment-panel">
  <FileAttachmentPanelDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-file-attachment-panel" />

<Dependencies items={[]} />

Usage [#usage]

```tsx
import { FileAttachmentPanel } from '@docyrus/ui/components/file-attachment-panel'
import type { FileAttachmentPanelProps } from '@docyrus/ui/components/file-attachment-panel'

const files: FileAttachmentPanelProps['files'] = [
  {
    id: 'f-1',
    file_name: 'design-review.png',
    file_type: 'image/png',
    file_size: 120000,
    signed_url:
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=640&q=80',
    source: 'local',
    file_data: null,
    created_on: new Date().toISOString(),
    record_id: 'rec-1',
  },
]

function Demo() {
  return (
    <FileAttachmentPanel
      files={files}
      onUploadFile={(file) =>
        Promise.resolve({
          ...files[0],
          id: crypto.randomUUID(),
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          signed_url: URL.createObjectURL(file),
        })
      }
      onDeleteFile={(id) => console.log('delete', id)}
    />
  )
}
```

API Reference [#api-reference]

| Prop                    | Type                                                      | Default            |
| ----------------------- | --------------------------------------------------------- | ------------------ |
| `files`                 | `DocyrusFile[]`                                           | â€”                |
| `title`                 | `string`                                                  | `"Attachments"`    |
| `editable`              | `boolean`                                                 | `true`             |
| `isLoading`             | `boolean`                                                 | `false`            |
| `maxFileSize`           | `number`                                                  | `50 * 1024 * 1024` |
| `accept`                | `string`                                                  | â€”                |
| `maxFiles`              | `number`                                                  | â€”                |
| `onUploadFile`          | `(file: File) => Promise<DocyrusFile>`                    | â€”                |
| `onDeleteFile`          | `(fileId: string) => void \| Promise<void>`               | â€”                |
| `onInsertExternalFiles` | `(files: ExternalFilePayload[]) => void \| Promise<void>` | â€”                |
| `onFileOpen`            | `(file: DocyrusFile) => void`                             | â€”                |
| `isDeletePending`       | `boolean`                                                 | `false`            |
| `className`             | `string`                                                  | â€”                |

Components [#components]

| Component             | Description                             |
| --------------------- | --------------------------------------- |
| `FileAttachmentPanel` | Public export                           |
| `FileEmptyState`      | Internal â€” `file-empty-state.tsx`     |
| `FileGrid`            | Internal â€” `file-grid.tsx`            |
| `FileItem`            | Internal â€” `file-item.tsx`            |
| `FileList`            | Internal â€” `file-list.tsx`            |
| `FileSourceMenu`      | Internal â€” `file-source-menu.tsx`     |
| `FileUploadProgress`  | Internal â€” `file-upload-progress.tsx` |
| `FileUploadZone`      | Internal â€” `file-upload-zone.tsx`     |
| `DocyrusIcon`         | Internal â€” `docyrus-icon.tsx`         |

Type Exports [#type-exports]

| Type                       | Description |
| -------------------------- | ----------- |
| `FileAttachmentPanelProps` | â€”         |
| `ViewMode`                 | â€”         |
| `DocyrusFile`              | â€”         |
| `ExternalFilePayload`      | â€”         |

Type Reference [#type-reference]

ViewMode [#viewmode]

`"list"` | `"grid"`

DocyrusFile [#docyrusfile]

| Field        | Type                                                |
| ------------ | --------------------------------------------------- |
| `id`         | `string`                                            |
| `file_name`  | `string`                                            |
| `file_type`  | `string`                                            |
| `file_size`  | `number`                                            |
| `signed_url` | `string \| null`                                    |
| `source`     | `"local" \| "microsoft_onedrive" \| "google_drive"` |
| `file_data`  | `Record<string, unknown> \| null`                   |
| `created_on` | `string`                                            |
| `record_id`  | `string \| null`                                    |

ExternalFilePayload [#externalfilepayload]

| Field        | Type                                     |
| ------------ | ---------------------------------------- |
| `source`     | `"microsoft_onedrive" \| "google_drive"` |
| `file_name`  | `string`                                 |
| `file_type`  | `string`                                 |
| `signed_url` | `string`                                 |
| `file_data`  | `Record<string, unknown> \| undefined`   |
| `expire_in`  | `number \| undefined`                    |

<Credits>
  <GithubInfo owner="shadcn-ui" repo="ui" />
</Credits>

---

# Form Fields

URL: /docs/components/form-fields

Dynamic form field system powered by TanStack Form. 47 field types with automatic dispatch via DynamicFormField.

<ComponentPreview registryName="@docyrus/ui-form-fields">
  <FormFieldsDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-form-fields" />

<Dependencies items={[{ label: '@tanstack/react-form', url: 'https://www.npmjs.com/package/@tanstack/react-form' }, { label: 'lucide-react', url: 'https://www.npmjs.com/package/lucide-react' }, { label: 'date-fns', url: 'https://www.npmjs.com/package/date-fns' }, { label: 'react-day-picker', url: 'https://www.npmjs.com/package/react-day-picker' }, { label: 'platejs', url: 'https://www.npmjs.com/package/platejs' }, { label: 'react-email-editor', url: 'https://www.npmjs.com/package/react-email-editor' }, { label: 'react-querybuilder', url: 'https://www.npmjs.com/package/react-querybuilder' }, { label: 'tailwind-scrollbar-hide', url: 'https://www.npmjs.com/package/tailwind-scrollbar-hide' }]} />

Usage [#usage]

```tsx
import { useForm } from '@tanstack/react-form'
import { DynamicFormField } from '@docyrus/ui/components/form-fields'
import type { IField, EnumOption } from '@docyrus/ui/components/form-fields'

const fields: IField[] = [
  { id: '1', name: 'Full Name', slug: 'full_name', type: 'field-text' },
  { id: '2', name: 'Priority', slug: 'priority', type: 'field-select' },
  { id: '3', name: 'Active', slug: 'is_active', type: 'field-switch' },
]

const enumOptions: EnumOption[] = [
  { id: 'low', name: 'Low', color: '#22c55e' },
  { id: 'medium', name: 'Medium', color: '#f59e0b' },
  { id: 'high', name: 'High', color: '#ef4444' },
]

function MyForm() {
  const form = useForm({
    defaultValues: { full_name: '', priority: '', is_active: false },
    onSubmit: ({ value }) => console.log(value),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      {fields.map((field) => (
        <DynamicFormField
          key={field.id}
          field={field}
          form={form}
          enumOptions={field.type === 'field-select' ? enumOptions : undefined}
        />
      ))}
    </form>
  )
}
```

Individual Field Import [#individual-field-import]

You can import individual field components to reduce bundle size:

```tsx
import { TextFormField } from '@docyrus/ui/components/form-fields/text-form-field'
import { SelectFormField } from '@docyrus/ui/components/form-fields/select-form-field'
import { SwitchFormField } from '@docyrus/ui/components/form-fields/switch-form-field'
```

Field Types [#field-types]

Text & Content [#text--content]

| Type             | Component           | Description                           |
| ---------------- | ------------------- | ------------------------------------- |
| `field-text`     | `TextFormField`     | Single-line text input                |
| `field-textarea` | `TextareaFormField` | Multi-line text area                  |
| `field-email`    | `EmailFormField`    | Email input with validation           |
| `field-url`      | `UrlFormField`      | URL input with `https://` placeholder |
| `field-phone`    | `PhoneFormField`    | Phone number with mask input          |
| `field-color`    | `ColorFormField`    | Color picker with hex input           |
| `field-icon`     | `IconFormField`     | Icon picker (Docyrus icon set)        |

Numbers [#numbers]

| Type             | Component               | Description                                                                  |
| ---------------- | ----------------------- | ---------------------------------------------------------------------------- |
| `field-number`   | `NumberFormField`       | Numeric input                                                                |
| `field-money`    | `MoneyFormField`        | Money input with currency symbol                                             |
| `field-percent`  | `PercentFormField`      | Percentage input (0-100)                                                     |
| `field-duration` | `DurationFormField`     | Duration picker grid via [Duration Select](/docs/components/duration-select) |
| `field-rating`   | `RatingFormField`       | Star rating (1-5)                                                            |
| `field-currency` | `CurrencyCodeFormField` | Currency code selector                                                       |

Selection [#selection]

| Type                   | Component                 | Description                                |
| ---------------------- | ------------------------- | ------------------------------------------ |
| `field-select`         | `SelectFormField`         | Single select with color/icon indicators   |
| `field-multiSelect`    | `MultiSelectFormField`    | Multi-value select                         |
| `field-tagSelect`      | `TagSelectFormField`      | Tag-based multi-select                     |
| `field-radioGroup`     | `RadioGroupFormField`     | Radio button group                         |
| `field-enum`           | `EnumFormField`           | Enum dropdown (slug-based values)          |
| `field-status`         | `StatusFormField`         | Status select with description + follow-up |
| `field-approvalStatus` | `ApprovalStatusFormField` | Approval workflow status                   |

Date & Time [#date--time]

| Type              | Component            | Description                       |
| ----------------- | -------------------- | --------------------------------- |
| `field-date`      | `DateFormField`      | Date picker with calendar popover |
| `field-dateTime`  | `DateTimeFormField`  | Combined date and time picker     |
| `field-time`      | `TimeFormField`      | Time picker                       |
| `field-dateRange` | `DateRangeFormField` | Date range with start/end         |

Toggle [#toggle]

| Type             | Component           | Description                          |
| ---------------- | ------------------- | ------------------------------------ |
| `field-checkbox` | `CheckboxFormField` | Checkbox with horizontal layout      |
| `field-switch`   | `SwitchFormField`   | Toggle switch with horizontal layout |

Relation & Users [#relation--users]

| Type                    | Component                  | Description             |
| ----------------------- | -------------------------- | ----------------------- |
| `field-relation`        | `RelationFormField`        | Related record lookup   |
| `field-userSelect`      | `UserSelectFormField`      | Single user selector    |
| `field-userMultiSelect` | `UserMultiSelectFormField` | Multi-user selector     |
| `field-locationSelect`  | `LocationSelectFormField`  | Location/address picker |

Rich Content [#rich-content]

| Type                | Component              | Description                                                 |
| ------------------- | ---------------------- | ----------------------------------------------------------- |
| `field-docEditor`   | `DocEditorFormField`   | Rich text editor (Plate.js) with preset-based plugin system |
| `field-htmlEditor`  | `HtmlEditorFormField`  | HTML code editor                                            |
| `field-emailEditor` | `EmailEditorFormField` | Email template editor (Unlayer)                             |
| `field-codeEditor`  | `CodeEditorFormField`  | Code editor                                                 |

Data & Structure [#data--structure]

| Type                   | Component                 | Description                 |
| ---------------------- | ------------------------- | --------------------------- |
| `field-file`           | `FileFormField`           | File upload                 |
| `field-image`          | `ImageFormField`          | Image upload with preview   |
| `field-avatar`         | `AvatarField`             | Avatar selector             |
| `field-taskList`       | `TaskListFormField`       | Checklist / task list       |
| `field-schemaRepeater` | `SchemaRepeaterFormField` | Repeatable schema sections  |
| `field-queryBuilder`   | `QueryBuilderFormField`   | Query builder               |
| `field-dynamic`        | `DynamicConfigFormField`  | Dynamic configuration field |

API Reference [#api-reference]

DynamicFormField [#dynamicformfield]

Dispatcher component that renders the correct field based on `field.type`.

```tsx
<DynamicFormField
  field={fieldConfig}
  form={form}
  enumOptions={options}
  disabled={false}
  className="my-field"
/>
```

DocEditorFormField [#doceditorformfield]

Rich text editor with preset-based plugin and toolbar system.

```tsx
import { DocEditorFormField } from '@docyrus/ui/components/form-fields/doc-editor-form-field'
import type { DocEditorPreset } from '@docyrus/ui/components/form-fields/doc-editor-form-field'
;<DocEditorFormField field={fieldConfig} form={form} preset="rich" />
```

| Prop     | Type              | Default     | Description         |
| -------- | ----------------- | ----------- | ------------------- |
| `preset` | `DocEditorPreset` | `'default'` | Editor preset level |

Presets [#presets]

| Preset    | Plugins                                                                  | Toolbar                                      |
| --------- | ------------------------------------------------------------------------ | -------------------------------------------- |
| `default` | Paragraphs, headings, lists, inline marks, link, autoformat              | Floating only (marks + turn into + link)     |
| `rich`    | + table, code block, callout, toggle, emoji, font, align, slash commands | Fixed + Floating                             |
| `ai`      | + AI chat, Copilot, mention                                              | Fixed (+ AI button) + Floating (+ AI button) |
| `full`    | + columns, math, date, ToC, comments, suggestions, DnD, block menu       | Fixed + Floating (all buttons)               |

Preset Dependencies [#preset-dependencies]

Each preset requires additional packages beyond the base `platejs` dependency:

| Preset    | Additional Packages                                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default` | `@platejs/autoformat` `@platejs/link` `@platejs/floating` `@platejs/list` `tailwind-scrollbar-hide`                                                                                             |
| `rich`    | + `@platejs/code-block` `@platejs/table` `@platejs/callout` `@platejs/toggle` `@platejs/basic-styles` `@platejs/emoji` `@platejs/slash-command` `@platejs/indent` `@emoji-mart/data` `lowlight` |
| `ai`      | + `@platejs/ai` `@platejs/markdown` `@platejs/mention` `@ai-sdk/react` `ai`                                                                                                                     |
| `full`    | + `@platejs/layout` `@platejs/math` `@platejs/date` `@platejs/toc` `@platejs/comment` `@platejs/suggestion` `@platejs/selection` `@platejs/dnd` `react-dnd` `react-dnd-html5-backend`           |

Add `@plugin "tailwind-scrollbar-hide"` to your Tailwind CSS config for all presets.

DocyrusFormFieldProps [#docyrusformfieldprops]

All form field components share this interface:

| Prop             | Type           | Default | Description                                 |
| ---------------- | -------------- | ------- | ------------------------------------------- |
| `field`          | `IField`       | â€”     | Field configuration from the data source    |
| `form`           | `any`          | â€”     | TanStack Form instance (`useForm()` result) |
| `disabled`       | `boolean`      | `false` | Whether the field is disabled               |
| `className`      | `string`       | â€”     | Additional CSS class                        |
| `enumOptions`    | `EnumOption[]` | `[]`    | Options for select-based fields             |
| `appSlug`        | `string`       | â€”     | App slug for dynamic enum loading           |
| `dataSourceSlug` | `string`       | â€”     | Data source slug for dynamic enum loading   |

IField [#ifield]

| Field          | Type               | Description                                       |
| -------------- | ------------------ | ------------------------------------------------- |
| `id`           | `string`           | Unique field identifier                           |
| `name`         | `string`           | Display label                                     |
| `slug`         | `string`           | Form value key (used as `form.Field` name)        |
| `type`         | `IFieldType`       | Field type â€” determines which component renders |
| `defaultValue` | `string \| null`   | Default value                                     |
| `validations`  | `string[] \| null` | Validation rules                                  |
| `readOnly`     | `boolean \| null`  | Read-only flag                                    |

EnumOption [#enumoption]

| Field        | Type     | Description                        |
| ------------ | -------- | ---------------------------------- |
| `id`         | `string` | Option identifier                  |
| `name`       | `string` | Display label                      |
| `color`      | `string` | Color indicator (hex)              |
| `icon`       | `string` | Docyrus icon name                  |
| `slug`       | `string` | Slug value (used by EnumFormField) |
| `sort_order` | `number` | Display order                      |

<Credits>
  <GithubInfo owner="shadcn-ui" repo="ui" />

  <GithubInfo owner="TanStack" repo="form" />

  <GithubInfo owner="udecode" repo="plate" />

  <GithubInfo owner="unlayer" repo="react-email-editor" />
</Credits>

---

# Components

URL: /docs/components

Production-ready UI components built with React, TypeScript, Tailwind CSS v4, and CVA variants.

Browse all available Docyrus UI components.

Available Components [#available-components]

| Component                                                                     | Description                                                                                                                                 |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [Avatar Select](/docs/components/avatar-select)                               | Avatar Select component with multiple variants and sizes.                                                                                   |
| [Avatar Thumbnail](/docs/components/avatar-thumbnail)                         | Avatar Thumbnail component with multiple variants and sizes.                                                                                |
| [Awesome Card](/docs/components/awesome-card)                                 | A card with a hatched-stripe header and an inset content area, perfect for displaying stats and metrics.                                    |
| [Cropper](/docs/components/cropper)                                           | Cropper component with multiple variants and sizes.                                                                                         |
| [Date Time Picker](/docs/components/date-time-picker)                         | Date Time Picker component with multiple variants and sizes.                                                                                |
| [Day Picker](/docs/components/day-picker)                                     | Day Picker component with multiple variants and sizes.                                                                                      |
| [Delete Confirm Dialog](/docs/components/delete-confirm-dialog)               | Delete Confirm Dialog component with multiple variants and sizes.                                                                           |
| [Duration Select](/docs/components/duration-select)                           | Duration Select component with multiple variants and sizes.                                                                                 |
| [Calendar](/docs/components/calendar)                                         | Calendar component.                                                                                                                         |
| [Comments Panel](/docs/components/comments-panel)                             | Comments Panel component.                                                                                                                   |
| [Data Grid](/docs/components/data-grid)                                       | A virtualized, editable spreadsheet-like data grid with sorting, filtering, grouping, cell selection, and keyboard navigation.              |
| [Data Table Filter](/docs/components/data-table-filter)                       | A composable filter bar for data tables with text, number, date, option, and multi-option column types.                                     |
| [File Attachment Panel](/docs/components/file-attachment-panel)               | File Attachment Panel component.                                                                                                            |
| [Form Fields](/docs/components/form-fields)                                   | Dynamic form field system powered by TanStack Form. 47 field types with automatic dispatch via DynamicFormField.                            |
| [Query Builder](/docs/components/query-builder)                               | Query Builder component.                                                                                                                    |
| [Record Activity Panel](/docs/components/record-activity-panel)               | Record Activity Panel component.                                                                                                            |
| [Record Delete Confirm Dialog](/docs/components/record-delete-confirm-dialog) | Record Delete Confirm Dialog component.                                                                                                     |
| [Value Renderers](/docs/components/value-renderers)                           | Read-only value display system for table cells, detail views, and kanban cards. 44 renderer types with automatic dispatch via DynamicValue. |

---

# Query Builder

URL: /docs/components/query-builder

Query Builder component.

<ComponentPreview registryName="@docyrus/ui-query-builder">
  <QueryBuilderDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-query-builder" />

<Dependencies items={[{ label: '@react-querybuilder/dnd', url: 'https://www.npmjs.com/package/@react-querybuilder/dnd' }, { label: 'react-dnd', url: 'https://www.npmjs.com/package/react-dnd' }, { label: 'react-dnd-html5-backend', url: 'https://www.npmjs.com/package/react-dnd-html5-backend' }, { label: 'react-dnd-touch-backend', url: 'https://www.npmjs.com/package/react-dnd-touch-backend' }, { label: 'react-querybuilder', url: 'https://www.npmjs.com/package/react-querybuilder' }, { label: 'lucide-react', url: 'https://www.npmjs.com/package/lucide-react' }, { label: 'class-variance-authority', url: 'https://www.npmjs.com/package/class-variance-authority' } ]} />

Usage [#usage]

```tsx
import {
  QueryBuilderDocyrus,
  queryBuilderVariants
} from "@docyrus/ui/components/query-builder";
import type {
  QueryBuilderDocyrusProps
} from "@docyrus/ui/components/query-builder";

<QueryBuilderDocyrus
  variant="default"
  size="sm"
  animated
  draggable
  showRuleNumbers
  maxDepth={0}
  emptyMessage={...}
  showClearButton
  clearButtonLabel={...}
  onRuleAdd={() => {}}
  onRuleRemove={() => {}}
  onGroupAdd={() => {}}
  onGroupRemove={() => {}}
  onClear={() => {}}
/>
```

Variants [#variants]

| Variant    | Description                                                         |
| ---------- | ------------------------------------------------------------------- |
| `default`  | Default style                                                       |
| `bordered` | Bordered â€” `rounded-lg border bg-card p-4 shadow-sm`              |
| `compact`  | Compact â€” `text-xs [&_.rule]:py-1 [&_.rule]:px-2 [&_.rule]:gap-1` |
| `striped`  | Striped â€” `[&_.rule:nth-child(even)]:bg-muted/20`                 |

Sizes [#sizes]

| Size      | Description                                              |
| --------- | -------------------------------------------------------- |
| `sm`      | Small â€” `[&_.qb-control]:h-7 [&_.qb-control]:text-xs`  |
| `default` | Default                                                  |
| `lg`      | Large â€” `[&_.qb-control]:h-10 [&_.qb-control]:text-sm` |

API Reference [#api-reference]

| Prop               | Type                                                      | Default     |
| ------------------ | --------------------------------------------------------- | ----------- |
| `variant`          | `"default"` \| `"bordered"` \| `"compact"` \| `"striped"` | `"default"` |
| `size`             | `"sm"` \| `"default"` \| `"lg"`                           | `"default"` |
| `animated`         | `boolean`                                                 | â€”         |
| `draggable`        | `boolean`                                                 | â€”         |
| `showRuleNumbers`  | `boolean`                                                 | â€”         |
| `maxDepth`         | `number`                                                  | â€”         |
| `emptyMessage`     | `ReactNode`                                               | â€”         |
| `showClearButton`  | `boolean`                                                 | â€”         |
| `clearButtonLabel` | `ReactNode`                                               | â€”         |
| `onRuleAdd`        | `() => void`                                              | â€”         |
| `onRuleRemove`     | `() => void`                                              | â€”         |
| `onGroupAdd`       | `() => void`                                              | â€”         |
| `onGroupRemove`    | `() => void`                                              | â€”         |
| `onClear`          | `() => void`                                              | â€”         |
| `className`        | `string`                                                  | â€”         |

Components [#components]

| Component              | Description   |
| ---------------------- | ------------- |
| `QueryBuilderDocyrus`  | Public export |
| `queryBuilderVariants` | Public export |

Type Exports [#type-exports]

| Type                       | Description |
| -------------------------- | ----------- |
| `QueryBuilderDocyrusProps` | â€”         |

Type Reference [#type-reference]

<Credits>
  <GithubInfo owner="react-querybuilder" repo="react-querybuilder" />

  <GithubInfo owner="shadcn-ui" repo="ui" />

  <GithubInfo owner="radix-ui" repo="primitives" />
</Credits>

---

# Record Activity Panel

URL: /docs/components/record-activity-panel

Record Activity Panel component.

<ComponentPreview registryName="@docyrus/ui-record-activity-panel">
  <RecordActivityPanelDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-record-activity-panel" />

<Dependencies items={[{ label: 'lucide-react', url: 'https://www.npmjs.com/package/lucide-react' } ]} />

Usage [#usage]

```tsx
import { RecordActivityPanel } from '@docyrus/ui/components/record-activity-panel'
import type { RecordActivity } from '@docyrus/ui/components/record-activity-panel'

const activities: RecordActivity[] = [
  {
    id: 'act-1',
    description: 'Status changed from In Progress to In Review',
    shortDescription: 'Status changed',
    icon: null,
    color: '#f59e0b',
    table_name: 'tasks',
    operation: 'STATUS_UPDATE',
    tenant_data_source_id: { id: 'ds-1', name: 'Tasks' },
    created_on: '2025-12-17T09:30:00Z',
    created_by: 'u-alice',
    created_by_user: {
      firstname: 'Alice',
      lastname: 'Johnson',
      name: 'Alice Johnson',
      email: 'alice@docyrus.com',
      mobile: null,
    },
    data_source_name: 'Tasks',
    title: 'Task #341',
  },
]

function Demo() {
  return <RecordActivityPanel activities={activities} />
}
```

API Reference [#api-reference]

| Prop         | Type               | Default |
| ------------ | ------------------ | ------- |
| `activities` | `RecordActivity[]` | â€”     |
| `isLoading`  | `boolean`          | `false` |
| `className`  | `string`           | â€”     |

Components [#components]

| Component             | Description   |
| --------------------- | ------------- |
| `RecordActivityPanel` | Public export |

<Credits>
  <GithubInfo owner="shadcn-ui" repo="ui" />

  <GithubInfo owner="sadmann7" repo="diceui" />
</Credits>

---

# Record Delete Confirm Dialog

URL: /docs/components/record-delete-confirm-dialog

Record Delete Confirm Dialog component.

<ComponentPreview registryName="@docyrus/ui-record-delete-confirm-dialog">
  <RecordDeleteConfirmDialogDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-record-delete-confirm-dialog" />

<Dependencies items={[{ label: 'lucide-react', url: 'https://www.npmjs.com/package/lucide-react' } ]} />

Usage [#usage]

```tsx
import { RecordDeleteConfirmDialog } from '@docyrus/ui/components/record-delete-confirm-dialog'
import type { DataSourceRelation } from '@docyrus/ui/components/record-delete-confirm-dialog'
import { useState } from 'react'

const relations: DataSourceRelation[] = [
  {
    dataSourceId: 'tasks',
    dataSourceName: 'Tasks',
    dataSourceSlug: 'tasks',
    appSlug: 'base',
    dataSourceType: 'table',
    fieldId: 'task_id',
    fieldSlug: 'task_id',
    fieldName: 'Task',
    fieldType: 'relation',
  },
]

function Demo() {
  const [open, setOpen] = useState(false)

  return (
    <RecordDeleteConfirmDialog
      open={open}
      onOpenChange={setOpen}
      recordCount={2}
      relations={relations}
      onConfirm={(childActions) => console.log(childActions)}
    />
  )
}
```

API Reference [#api-reference]

| Prop                 | Type                                                                   | Default |
| -------------------- | ---------------------------------------------------------------------- | ------- |
| `open`               | `boolean`                                                              | â€”     |
| `onOpenChange`       | `(open: boolean) => void`                                              | â€”     |
| `recordCount`        | `number`                                                               | â€”     |
| `relations`          | `DataSourceRelation[]`                                                 | `[]`    |
| `isLoadingRelations` | `boolean`                                                              | `false` |
| `onConfirm`          | `(childActions: Record<string, ChildAction>) => void \| Promise<void>` | â€”     |
| `isPending`          | `boolean`                                                              | `false` |
| `className`          | `string`                                                               | â€”     |

Components [#components]

| Component                   | Description   |
| --------------------------- | ------------- |
| `RecordDeleteConfirmDialog` | Public export |

Type Exports [#type-exports]

| Type                 | Description |
| -------------------- | ----------- |
| `DataSourceRelation` | â€”         |

Type Reference [#type-reference]

DataSourceRelation [#datasourcerelation]

| Field            | Type     | Description |
| ---------------- | -------- | ----------- |
| `dataSourceId`   | `string` | â€”         |
| `dataSourceName` | `string` | â€”         |
| `dataSourceSlug` | `string` | â€”         |
| `appSlug`        | `string` | â€”         |
| `dataSourceType` | `string` | â€”         |
| `fieldId`        | `string` | â€”         |
| `fieldSlug`      | `string` | â€”         |
| `fieldName`      | `string` | â€”         |
| `fieldType`      | `string` | â€”         |

<Credits>
  <GithubInfo owner="shadcn-ui" repo="ui" />
</Credits>

---

# Value Renderers

URL: /docs/components/value-renderers

Read-only value display system for table cells, detail views, and kanban cards. 44 renderer types with automatic dispatch via DynamicValue.

<ComponentPreview registryName="@docyrus/ui-value-renderers">
  <ValueRenderersDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-value-renderers" />

<Dependencies items={[{ label: 'lucide-react', url: 'https://www.npmjs.com/package/lucide-react' }]} />

Usage [#usage]

```tsx
import { DynamicValue } from '@docyrus/ui/components/value-renderers'
import type {
  IField,
  DocyrusValueProps,
} from '@docyrus/ui/components/value-renderers'

const fields: IField[] = [
  { id: '1', name: 'Full Name', slug: 'full_name', type: 'field-text' },
  { id: '2', name: 'Priority', slug: 'priority', type: 'field-select' },
  { id: '3', name: 'Status', slug: 'status', type: 'field-status' },
]

const record = {
  full_name: 'Erhan ERDOGAN',
  priority: 'high',
  status: 'in_progress',
  __status_description: 'Working on API',
}

const enumOptions = [
  { id: 'low', name: 'Low', color: '#22c55e' },
  { id: 'medium', name: 'Medium', color: '#f59e0b' },
  { id: 'high', name: 'High', color: '#ef4444' },
]

function RecordDetail() {
  return (
    <div>
      {fields.map((field) => (
        <DynamicValue
          key={field.id}
          field={field}
          value={record[field.slug]}
          record={record}
          enumOptions={field.type === 'field-select' ? enumOptions : undefined}
        />
      ))}
    </div>
  )
}
```

Individual Import [#individual-import]

You can import individual renderers to reduce bundle size:

```tsx
import { TextValue } from '@docyrus/ui/components/value-renderers/text-value'
import { SelectValue } from '@docyrus/ui/components/value-renderers/select-value'
import { StatusValue } from '@docyrus/ui/components/value-renderers/status-value'
```

Renderer Types [#renderer-types]

Text & Content [#text--content]

| Type                 | Component           | Description                            |
| -------------------- | ------------------- | -------------------------------------- |
| `field-text`         | `TextValue`         | Plain text display                     |
| `field-textarea`     | `TextValue`         | Multi-line text (shared renderer)      |
| `field-display`      | `TextValue`         | Display-only text (shared renderer)    |
| `field-code`         | `TextValue`         | Code snippet display (shared renderer) |
| `field-codeEditor`   | `CodeValue`         | Code block with monospace font         |
| `field-htmlEditor`   | `RichTextValue`     | Rendered HTML content                  |
| `field-emailEditor`  | `RichTextValue`     | Email template preview                 |
| `field-docEditor`    | `DocEditorValue`    | Document content preview               |
| `field-json`         | `JsonValue`         | JSON display with formatting           |
| `field-formula`      | `FormulaValue`      | Formula expression display             |
| `field-relatedField` | `RelatedFieldValue` | Related field value display            |

Numbers [#numbers]

| Type             | Component           | Description                 |
| ---------------- | ------------------- | --------------------------- |
| `field-number`   | `NumberValue`       | Formatted number display    |
| `field-money`    | `MoneyValue`        | Currency-formatted amount   |
| `field-percent`  | `PercentValue`      | Percentage display          |
| `field-duration` | `DurationValue`     | Duration in HH:MM:SS format |
| `field-rating`   | `RatingValue`       | Star rating display         |
| `field-currency` | `CurrencyCodeValue` | Currency code with symbol   |

Selection [#selection]

| Type                   | Component             | Description                                    |
| ---------------------- | --------------------- | ---------------------------------------------- |
| `field-select`         | `SelectValue`         | Badge with color/icon                          |
| `field-radioGroup`     | `SelectValue`         | Badge display (shared renderer)                |
| `field-enum`           | `SelectValue`         | Badge display (shared renderer)                |
| `field-multiSelect`    | `MultiSelectValue`    | Multiple badges                                |
| `field-tagSelect`      | `MultiSelectValue`    | Tag badges (shared renderer)                   |
| `field-status`         | `StatusValue`         | Status badge with description + follow-up date |
| `field-approvalStatus` | `ApprovalStatusValue` | Approval workflow badge                        |
| `field-list`           | `ListValue`           | List item badge                                |

Date & Time [#date--time]

| Type              | Component        | Description                   |
| ----------------- | ---------------- | ----------------------------- |
| `field-date`      | `DateValue`      | Localized date display        |
| `field-dateTime`  | `DateTimeValue`  | Localized date + time display |
| `field-time`      | `TimeValue`      | Localized time display        |
| `field-dateRange` | `DateRangeValue` | Date range with separator     |

Toggle [#toggle]

| Type             | Component       | Description            |
| ---------------- | --------------- | ---------------------- |
| `field-checkbox` | `CheckboxValue` | Check/X icon indicator |
| `field-switch`   | `SwitchValue`   | On/Off text indicator  |

Users & Relations [#users--relations]

| Type                    | Component        | Description           |
| ----------------------- | ---------------- | --------------------- |
| `field-userSelect`      | `UserValue`      | User avatar with name |
| `field-userMultiSelect` | `UserMultiValue` | Stacked user avatars  |
| `field-relation`        | `RelationValue`  | Related record link   |

Contact [#contact]

| Type          | Component    | Description             |
| ------------- | ------------ | ----------------------- |
| `field-email` | `EmailValue` | Email link with icon    |
| `field-phone` | `PhoneValue` | Phone with country code |
| `field-url`   | `UrlValue`   | URL link with hostname  |

Visual [#visual]

| Type          | Component    | Description                 |
| ------------- | ------------ | --------------------------- |
| `field-color` | `ColorValue` | Color swatch with hex value |
| `field-icon`  | `IconValue`  | Rendered Docyrus icon       |

Files & Media [#files--media]

| Type           | Component     | Description         |
| -------------- | ------------- | ------------------- |
| `field-file`   | `FileValue`   | File name with icon |
| `field-image`  | `ImageValue`  | Image thumbnail     |
| `field-avatar` | `AvatarValue` | Avatar thumbnail    |

Structure [#structure]

| Type                   | Component         | Description           |
| ---------------------- | ----------------- | --------------------- |
| `field-taskList`       | `TaskListValue`   | Checklist progress    |
| `field-todo`           | `TodoValue`       | Todo item count       |
| `field-inlineData`     | `InlineDataValue` | Inline data row count |
| `field-locationSelect` | `LocationValue`   | Address with map pin  |

System [#system]

| Type                        | Component                  | Description           |
| --------------------------- | -------------------------- | --------------------- |
| `field-identity`            | `IdentityValue`            | Identity hash display |
| `field-autonumber`          | `IdentityValue`            | Auto-number display   |
| `field-button`              | `ButtonValue`              | Action button label   |
| `field-conversationChannel` | `ConversationChannelValue` | Channel name          |
| `field-fileStorageFolder`   | `FileStorageFolderValue`   | Folder name           |

API Reference [#api-reference]

DynamicValue [#dynamicvalue]

Dispatcher component that renders the correct value renderer based on `field.type`.

```tsx
<DynamicValue
  field={fieldConfig}
  value={record[fieldConfig.slug]}
  record={record}
  enumOptions={options}
  className="my-value"
/>
```

DocyrusValueProps [#docyrusvalueprops]

All value renderer components share this interface:

| Prop          | Type                      | Default | Description                                 |
| ------------- | ------------------------- | ------- | ------------------------------------------- |
| `field`       | `IField`                  | â€”     | Field configuration from the data source    |
| `value`       | `unknown`                 | â€”     | The field value to display                  |
| `record`      | `Record<string, unknown>` | â€”     | Full record for accessing companion columns |
| `enumOptions` | `EnumOption[]`            | `[]`    | Options for select-based fields             |
| `className`   | `string`                  | â€”     | Additional CSS class                        |

IField [#ifield]

| Field          | Type               | Description                                      |
| -------------- | ------------------ | ------------------------------------------------ |
| `id`           | `string`           | Unique field identifier                          |
| `name`         | `string`           | Display label                                    |
| `slug`         | `string`           | Record key for accessing the value               |
| `type`         | `IFieldType`       | Field type â€” determines which renderer is used |
| `defaultValue` | `string \| null`   | Default value                                    |
| `validations`  | `string[] \| null` | Validation rules                                 |
| `readOnly`     | `boolean \| null`  | Read-only flag                                   |

EnumOption [#enumoption]

| Field        | Type     | Description           |
| ------------ | -------- | --------------------- |
| `id`         | `string` | Option identifier     |
| `name`       | `string` | Display label         |
| `color`      | `string` | Color indicator (hex) |
| `icon`       | `string` | Docyrus icon name     |
| `slug`       | `string` | Slug value            |
| `sort_order` | `number` | Display order         |

---

# Accessibility

URL: /docs/guide/accessibility

How Docyrus UI approaches accessibility and motion preferences.

Built on accessible primitives [#built-on-accessible-primitives]

Every Docyrus UI component is built on top of Radix UI primitives, which provide robust accessibility out of the box. This means proper ARIA attributes, keyboard navigation, focus management, and screen reader support are handled at the foundation level â€” not bolted on afterward.

You don't need to manually add `role`, `aria-label`, or keyboard event handlers for standard interactions. The primitives take care of it.

Motion and reduced motion [#motion-and-reduced-motion]

Animations can enhance the user experience, but they can also cause discomfort for people with vestibular disorders or motion sensitivity. Browsers expose the `prefers-reduced-motion` media query to communicate user preferences.

When a user has enabled reduced motion in their operating system settings, animations should be toned down or removed entirely. The goal is not to strip all visual feedback â€” subtle transitions like opacity fades are generally fine. What matters is avoiding large-scale movement such as scale transforms, slides, parallax effects, and auto-playing animations.

Tailwind CSS [#tailwind-css]

Tailwind CSS v4 provides the `motion-reduce` variant, which you can use to conditionally disable animations:

```tsx
<div className="animate-fade-in motion-reduce:animate-none">Content</div>
```

Motion library [#motion-library]

If your project uses the Motion library for animations, wrap your application with `MotionConfig` and set `reducedMotion` to `"user"`. This automatically disables transform and layout animations for users who prefer reduced motion, while preserving helpful transitions like opacity and color changes.

```tsx title="app/layout.tsx"
import { MotionConfig } from 'motion/react'

export default function RootLayout({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
```

Keyboard navigation [#keyboard-navigation]

All interactive Docyrus UI components support full keyboard navigation following WAI-ARIA authoring practices. This includes:

- **Focus indicators** â€” Visible focus rings on all interactive elements
- **Arrow key navigation** â€” Move between items in menus, tabs, and lists
- **Enter and Space** â€” Activate buttons, toggle switches, and select options
- **Escape** â€” Close modals, popovers, and dropdowns
- **Tab order** â€” Logical tab sequence through the interface

Resources [#resources]

- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [prefers-reduced-motion (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Motion â€” Accessibility](https://motion.dev/docs/accessibility)

---

# CLI

URL: /docs/guide/cli

The Docyrus CLI for authentication, project scaffolding, and component management.

The `@docyrus/cli` is a command-line tool that handles authentication, project creation, and component installation from the Docyrus registry.

Installation [#installation]

You can use the CLI directly with `npx` without installing it globally:

```bash
npx @docyrus/cli <command>
```

Or install it globally for quicker access:

<Tabs items={["pnpm", "npm", "yarn", "bun"]}>
<Tab>
`bash
    pnpm add -g @docyrus/cli
    `
</Tab>

  <Tab>
    ```bash
    npm install -g @docyrus/cli
    ```
  </Tab>

  <Tab>
    ```bash
    yarn global add @docyrus/cli
    ```
  </Tab>

  <Tab>
    ```bash
    bun add -g @docyrus/cli
    ```
  </Tab>
</Tabs>

Once installed globally, you can use the `docyrus` command directly:

```bash
docyrus add button
```

Commands [#commands]

Authentication [#authentication]

| Command                 | Description                         |
| ----------------------- | ----------------------------------- |
| `docyrus login`         | Log in with browser-based SSO       |
| `docyrus login --email` | Log in with email and password      |
| `docyrus logout`        | Clear stored auth tokens            |
| `docyrus whoami`        | Display current logged-in user info |

Components [#components]

| Command                   | Description                                           |
| ------------------------- | ----------------------------------------------------- |
| `docyrus add [items...]`  | Add components, hooks, or utilities from the registry |
| `docyrus add --overwrite` | Skip file conflict prompts                            |
| `docyrus add --dry-run`   | Preview installation without writing files            |
| `docyrus list`            | List available components and packages                |

Project Creation [#project-creation]

| Command                                            | Description                                        |
| -------------------------------------------------- | -------------------------------------------------- |
| `docyrus create [name]`                            | Create a new project from a template (interactive) |
| `docyrus create my-app --nextjs`                   | Create with a specific framework                   |
| `docyrus create my-app --react --shadcn --zustand` | Create with full stack flags                       |

Available framework flags: `--nextjs`, `--react`, `--vue`, `--electron`

Available UI library flags: `--shadcn`, `--diceui`, `--shadcn-vue`, `--heroui`

Available state flags: `--zustand`, `--tanstack-query`, `--tanstack-vue-query`

Available linter flags: `--eslint`, `--biome`, `--no-linter`

Code Generation [#code-generation]

| Command                      | Description                                              |
| ---------------------------- | -------------------------------------------------------- |
| `docyrus generate api-spec`  | Download OpenAPI spec from the Docyrus API               |
| `docyrus generate db [spec]` | Generate TanStack Query collections from an OpenAPI spec |

System [#system]

| Command                      | Description                                               |
| ---------------------------- | --------------------------------------------------------- |
| `docyrus info`               | Display CLI version, Node.js, OS, and auth status         |
| `docyrus config --show`      | Show current configuration                                |
| `docyrus config --token`     | Update GitHub token for private templates                 |
| `docyrus upgrade`            | Upgrade CLI to the latest version                         |
| `docyrus completion <shell>` | Generate shell completion script (bash, zsh, fish)        |
| `docyrus commitlint`         | Set up commitlint, husky, and lint-staged in your project |

Examples [#examples]

```bash
# Log in and add components
docyrus login
docyrus add button dialog date-time-picker

# Create a new Next.js project with shadcn and Zustand
docyrus create my-app --nextjs --shadcn --zustand --pnpm

# Generate TanStack Query code from an API spec
docyrus generate api-spec
docyrus generate db openapi.json --output src/
```

---

# Distributions

URL: /docs/guide/distributions

Other component distributions that complement Docyrus UI.

Docyrus UI is built on top of the shadcn ecosystem and works alongside other component distributions. Here are some libraries that complement or inspired our work.

<Cards>
  <Card icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="none"><path d="M208 128l-80 80" stroke="currentColor" strokeWidth="25" strokeLinecap="round" /><path d="M192 40L40 192" stroke="currentColor" strokeWidth="25" strokeLinecap="round" /></svg>} title="shadcn/ui" description="The foundation of Docyrus UI. Pioneered the copy-first component distribution model with beautifully designed components built on Radix UI and Tailwind CSS." href="https://ui.shadcn.com" external />

<Card icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M16 8h.01" /><path d="M8 8h.01" /><path d="M8 16h.01" /><path d="M16 16h.01" /></svg>} title="DiceUI" description="An open-source collection of accessible, unstyled components built on Radix UI. Provides compound components like combobox, file upload, kanban, and more." href="https://diceui.com" external />
</Cards>

---

# Introduction

URL: /docs/guide

Docyrus UI is an open-source component distribution built with React, TypeScript, Tailwind CSS, and the shadcn registry.

What is Docyrus UI? [#what-is-docyrus-ui]

Docyrus UI is an open-source component distribution â€” not an installable NPM library. Built with React, TypeScript, Tailwind CSS v4, and the shadcn registry, it provides production-ready UI components, hooks, and utilities that you copy directly into your codebase.

Inspired by the shadcn/ui philosophy, Docyrus UI gives you full ownership and control over every component. No wrapper overhead, no version lock-in â€” just open code that lives in your project.

Not a library â€” an open component distribution [#not-a-library--an-open-component-distribution]

Traditional UI libraries ship as NPM packages you import. When something doesn't fit, you're stuck waiting for a PR or working around the API.

Docyrus UI takes a different approach. Every component is installed as source code into your project. You own it, you modify it, you style it however you want. The registry simply delivers the starting point.

What's included [#whats-included]

- **Components** â€” Production-ready UI pieces built on top of Radix UI, covering forms, data display, navigation, feedback, and more. Each component uses CVA for variant management and supports full theme customization.

- **Hooks** â€” Reusable React hooks for common patterns like debouncing, media queries, local storage, disclosure state, and more.

- **Utilities** â€” Helper functions for class name merging, type-safe operations, and other everyday needs.

- **Icons** â€” Docyrus Icon system with support for Font Awesome, Huge Icons, and custom icon sets via CDN.

Why Docyrus UI? [#why-docyrus-ui]

- **Open source and copy-first** â€” Every component lives in your codebase. Full ownership, zero lock-in.

- **Built on shadcn registry** â€” Install components with the `shadcn` CLI or the Docyrus CLI. Same workflow you already know.

- **Tailwind CSS v4** â€” Designed from the ground up for Tailwind CSS v4 with CSS-based configuration and modern utility classes.

- **Type-safe** â€” Full TypeScript support with strict types, generics, and inference across all components, hooks, and utilities.

- **Accessible by default** â€” Built on Radix UI primitives with WAI-ARIA compliance, keyboard navigation, and screen reader support out of the box.

- **Performance-conscious** â€” Sensible defaults, tree-shakeable exports, and minimal runtime overhead. Ship only what you use.

---

# Installation

URL: /docs/guide/installation

How to install and set up Docyrus UI components in your project.

Prerequisites [#prerequisites]

Docyrus UI components are distributed via the shadcn registry. Before you start, make sure your project has shadcn/ui initialized.

If you haven't set up shadcn/ui yet, run the init command to create a `components.json` configuration file in your project root:

```bash
npx shadcn@latest init
```

Add the Docyrus registry [#add-the-docyrus-registry]

Add the Docyrus registry to your `components.json` file so the CLI knows where to fetch components from:

```json title="components.json"
{
  "registries": {
    "docyrus": {
      "url": "https://ui.docy.app/r"
    }
  }
}
```

Add components [#add-components]

You can install components using either the **Docyrus CLI** or the **shadcn CLI**.

<Tabs items={["Docyrus CLI", "shadcn CLI"]}>
<Tab>
The Docyrus CLI provides a streamlined experience with shorter command names:

    ```bash
    # Install a component
    npx @docyrus/cli add button

    # Install a hook
    npx @docyrus/cli add hooks-debounce

    # Install a utility
    npx @docyrus/cli add utils-cn

    # Install multiple items at once
    npx @docyrus/cli add button dialog hooks-debounce
    ```

    The CLI reads your `components.json` configuration and installs the correct variant automatically.

  </Tab>

  <Tab>
    You can also use the shadcn CLI directly with the full registry name:

    ```bash
    # Install a component
    npx shadcn@latest add @docyrus/ui-button

    # Install a hook
    npx shadcn@latest add @docyrus/hooks-debounce

    # Install a utility
    npx shadcn@latest add @docyrus/utils-cn
    ```

  </Tab>
</Tabs>

Import and use [#import-and-use]

Once installed, import the component from your local components directory and use it in your project:

```tsx title="app/page.tsx"
import { Button } from '@/components/docyrus/button'

export default function Home() {
  return (
    <div>
      <Button variant="default">Click me</Button>
    </div>
  )
}
```

Components are installed as source code â€” you can freely modify, extend, or restyle them to fit your needs.

---

# Packages

URL: /docs/guide/packages

Official Docyrus NPM packages for authentication, API integration, code generation, and developer tooling.

All `@docyrus/*` packages are published on NPM and designed to work together. They cover authentication, API integration, code generation, and developer tooling for Docyrus-powered applications.

Core [#core]

<Cards>
  <Card icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>} title="@docyrus/api-client" description="A modern, type-safe API client for JavaScript and TypeScript with support for multiple backend types, streaming, error handling, and token management." href="https://www.npmjs.com/package/@docyrus/api-client" external />

<Card icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>} title="@docyrus/signin" description="Authentication provider for Docyrus apps. Supports React, Vue, Electron, and Next.js SSR with OAuth2 and session management." href="https://www.npmjs.com/package/@docyrus/signin" external />

<Card icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>} title="@docyrus/i18n" description="Internationalization provider with API-based and static translation support, cookie-based locale persistence, and variable interpolation." href="https://www.npmjs.com/package/@docyrus/i18n" external />
</Cards>

Dev Tools [#dev-tools]

<Cards>
  <Card icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4" /><path d="m6 8-4 4 4 4" /><path d="m14.5 4-5 16" /></svg>} title="@docyrus/tanstack-db-generator" description="Code generator for TanStack Query and database integration. Generates typed collections from OpenAPI specs for the Docyrus API." href="https://www.npmjs.com/package/@docyrus/tanstack-db-generator" external />

<Card icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>} title="@docyrus/rules" description="Shared ESLint and Biome configurations for Docyrus projects. Provides consistent linting and formatting rules across your codebase." href="https://www.npmjs.com/package/@docyrus/rules" external />
</Cards>

Utilities [#utilities]

<Cards>
  <Card icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>} title="@docyrus/addin-client" description="Client for embedded add-ins to communicate with the host app from an iframe using postMessage. Handles handshake, RPC calls, and event dispatching." href="https://www.npmjs.com/package/@docyrus/addin-client" external />

<Card icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" /><line x1="6" x2="18" y1="17" y2="17" /></svg>} title="@docyrus/logo-asset-generator" description="CLI tool to generate favicon and app icons from a source logo. Produces all required sizes for web, iOS, and Android." href="https://www.npmjs.com/package/@docyrus/logo-asset-generator" external />

<Card icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>} title="@docyrus/dom-selector-client" description="DOM selector CLI client for programmatic element selection and inspection in web pages." href="https://www.npmjs.com/package/@docyrus/dom-selector-client" external />
</Cards>

---

# Troubleshooting

URL: /docs/guide/troubleshooting

Common issues and solutions when using Docyrus UI.

Verify your versions [#verify-your-versions]

Make sure your environment meets or exceeds these minimum versions to ensure Docyrus UI components work correctly.

| Dependency   | Minimum Version |
| ------------ | --------------- |
| React        | 19              |
| Next.js      | 15              |
| Tailwind CSS | 4.0             |
| Node.js      | 18              |
| Radix UI     | 1.4.0           |

Registry not found [#registry-not-found]

If you see a "registry not found" error when installing components, make sure you've added the Docyrus registry to your `components.json` file. The registry URL should point to `https://ui.docy.app/r`. Without this entry, neither the shadcn CLI nor the Docyrus CLI will know where to fetch components from.

Components not resolving after installation [#components-not-resolving-after-installation]

After installing a component, your imports should point to the local file path where the component was placed â€” not to an NPM package. If your IDE shows unresolved imports, check that the component files were actually written to disk and that your TypeScript path aliases match the install location.

Tailwind CSS v4 classes not applying [#tailwind-css-v4-classes-not-applying]

Tailwind CSS v4 uses a CSS-based configuration system. If component styles aren't applying, make sure your CSS entry file includes a `@source` directive that covers the directory where Docyrus UI components are installed. Without this, Tailwind's compiler won't scan those files for utility classes.

Dark mode not working [#dark-mode-not-working]

Docyrus UI components use CSS custom properties (CSS variables) for theming. Dark mode relies on these variables being defined in your global stylesheet. If dark mode isn't working, verify that your theme variables are set up correctly for both light and dark color schemes.

Motion library version conflicts [#motion-library-version-conflicts]

Some Docyrus UI components use the Motion library for animations. If you see runtime errors related to motion or framer-motion, make sure you're using a compatible version. Docyrus UI targets Motion v12 and above.

Still having issues? [#still-having-issues]

If none of the above solutions resolve your problem, please [open an issue on GitHub](https://github.com/docyrus/docyrus-ui/issues) with a description of what you're experiencing and your environment details.

---

# Hooks

URL: /docs/hooks

Reusable React hooks for common patterns.

Browse all available Docyrus UI hooks.

Available Hooks [#available-hooks]

No public hooks yet.

---

# Gallery

URL: /docs/icons/gallery

Browse all available Docyrus icons from Font Awesome and Huge Icons.

<IconGallery />

Usage [#usage]

```tsx
import { DocyrusIcon } from '@docyrus/ui/components/docyrus-icon';

<DocyrusIcon icon="fab github" size="lg" />
<DocyrusIcon icon="huge home-01" />
```

Click any icon above to copy its name to clipboard.

See [Get Started](/docs/icons) for installation, API reference, sizes, and animations.

Libraries [#libraries]

| Library             | Prefix | Style        |
| ------------------- | ------ | ------------ |
| Font Awesome Brands | `fab`  | Fill-based   |
| Huge Icons          | `huge` | Stroke-based |

---

# Get Started

URL: /docs/icons

DocyrusIcon component â€” render icons from Font Awesome Brands and Huge Icons with variants and animations.

<ComponentPreview registryName="@docyrus/ui-docyrus-icon">
  <DocyrusIconDemo />
</ComponentPreview>

Installation [#installation]

<InstallTabs componentName="@docyrus/ui-docyrus-icon" />

<Dependencies items={[{ label: 'react-inlinesvg', url: 'https://www.npmjs.com/package/react-inlinesvg' }, { label: 'class-variance-authority', url: 'https://www.npmjs.com/package/class-variance-authority' } ]} />

Usage [#usage]

```tsx
import { DocyrusIcon } from "@docyrus/ui/components/docyrus-icon";

<DocyrusIcon icon="fab github" size="lg" />
<DocyrusIcon icon="huge home-01" />
```

Sizes [#sizes]

| Size      | Description              |
| --------- | ------------------------ |
| `xs`      | Extra small â€” `size-3` |
| `sm`      | Small â€” `size-4`       |
| `default` | Default â€” `size-5`     |
| `lg`      | Large â€” `size-6`       |
| `xl`      | Extra large â€” `size-8` |

Animation [#animation]

| Animation | Description                 |
| --------- | --------------------------- |
| `none`    | Default (no animation)      |
| `spin`    | Spin â€” `animate-spin`     |
| `pulse`   | Pulse â€” `animate-pulse`   |
| `bounce`  | Bounce â€” `animate-bounce` |
| `ping`    | Ping â€” `animate-ping`     |

API Reference [#api-reference]

| Prop        | Type                                                        | Default     |
| ----------- | ----------------------------------------------------------- | ----------- |
| `size`      | `"xs"` \| `"sm"` \| `"default"` \| `"lg"` \| `"xl"`         | `"default"` |
| `animation` | `"none"` \| `"spin"` \| `"pulse"` \| `"bounce"` \| `"ping"` | `"default"` |
| `icon`      | `string`                                                    | â€”         |
| `lib`       | `string`                                                    | â€”         |
| `group`     | `string \| null`                                            | â€”         |
| `className` | `string`                                                    | â€”         |

Libraries [#libraries]

| Library             | Prefix | Style        |
| ------------------- | ------ | ------------ |
| Font Awesome Brands | `fab`  | Fill-based   |
| Huge Icons          | `huge` | Stroke-based |

Browse the full icon library in the [Gallery](/docs/icons/gallery).

<Credits>
  <GithubInfo owner="FortAwesome" repo="Font-Awesome" />

  <GithubInfo owner="hugeicons" repo="hugeicons-react" />
</Credits>

---

# Overview

URL: /docs/utilities

Helper functions and data utilities for Docyrus UI.

Browse all available Docyrus UI utilities. Each utility is installed as source code into your project.

Available Utilities [#available-utilities]

No public utilities yet.
