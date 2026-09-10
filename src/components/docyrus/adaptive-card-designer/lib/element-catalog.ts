// @ts-nocheck
/* eslint-disable */
import {
  Activity,
  AlignVerticalSpaceAround,
  Badge as BadgeIcon,
  BarChart3,
  Calendar,
  CheckSquare,
  ChevronDown,
  Clock,
  Code as CodeIcon,
  Columns3,
  Donut,
  Film,
  Gauge,
  Grid3x3,
  Hash,
  Image as ImageIcon,
  Images,
  LayoutGrid,
  LineChart,
  Link as LinkIcon,
  List as ListIcon,
  ListChecks,
  Loader,
  MousePointerClick,
  Package,
  PanelTop,
  PieChart,
  RectangleHorizontal,
  RefreshCw,
  Send,
  SquareMousePointer,
  Star,
  Table as TableIcon,
  Type as TypeIcon,
  Zap,
} from 'lucide-react'

import { type ToolboxItem } from '../adaptive-card-designer-types'
import { createDefaultNode } from './node-factories'

function entry(
  type: string,
  label: string,
  icon: ToolboxItem['icon'],
  group: ToolboxItem['group'],
  keywords: string[] = [],
): ToolboxItem {
  return {
    id: type,
    type,
    label,
    icon,
    group,
    keywords: [type.toLowerCase(), label.toLowerCase(), ...keywords],
    factory: () => createDefaultNode(type),
  }
}

/** Default catalog of toolbox items, grouped to match the Microsoft designer. */
export const TOOLBOX_ITEMS: ToolboxItem[] = [
  entry('TextBlock', 'Text Block', TypeIcon, 'elements', ['text', 'paragraph']),
  entry('RichTextBlock', 'Rich Text', TypeIcon, 'elements', [
    'inline',
    'mixed',
  ]),
  entry('Image', 'Image', ImageIcon, 'elements', ['picture', 'photo']),
  entry('Media', 'Media', Film, 'elements', ['video', 'audio']),
  entry('Container', 'Container', LayoutGrid, 'elements', ['group', 'wrapper']),
  entry('ColumnSet', 'Column Set', Columns3, 'elements', ['columns', 'row']),
  entry('FactSet', 'Fact Set', ListChecks, 'elements', [
    'key',
    'value',
    'pairs',
  ]),
  entry('ImageSet', 'Image Set', Images, 'elements', ['gallery', 'thumbnails']),
  entry('Table', 'Table', TableIcon, 'elements', ['grid', 'rows', 'cells']),
  entry('ActionSet', 'Action Set', SquareMousePointer, 'elements', ['buttons']),
  entry('Badge', 'Badge', BadgeIcon, 'elements', ['pill', 'tag']),
  entry('CodeBlock', 'Code Block', CodeIcon, 'elements', ['code', 'snippet']),
  entry('CompoundButton', 'Compound Button', RectangleHorizontal, 'elements', [
    'button',
    'card',
  ]),
  entry('Icon', 'Icon', Zap, 'elements', ['symbol']),
  entry('ProgressBar', 'Progress Bar', Activity, 'elements', [
    'progress',
    'linear',
  ]),
  entry('ProgressRing', 'Progress Ring', Loader, 'elements', [
    'progress',
    'spinner',
  ]),
  entry('Rating', 'Rating', Star, 'elements', ['stars']),

  entry('Input.Text', 'Text Input', TypeIcon, 'inputs', ['textbox', 'string']),
  entry('Input.Number', 'Number Input', Hash, 'inputs', ['integer', 'decimal']),
  entry('Input.Date', 'Date Input', Calendar, 'inputs', ['day']),
  entry('Input.Time', 'Time Input', Clock, 'inputs', ['hour']),
  entry('Input.Toggle', 'Toggle Input', CheckSquare, 'inputs', [
    'switch',
    'boolean',
  ]),
  entry('Input.ChoiceSet', 'Choice Set', ListIcon, 'inputs', [
    'select',
    'dropdown',
    'radio',
  ]),
  entry('Input.Rating', 'Rating Input', Star, 'inputs', ['stars']),

  entry('Action.Submit', 'Submit', Send, 'actions', ['post']),
  entry('Action.Execute', 'Execute', Zap, 'actions', ['verb', 'invoke']),
  entry('Action.OpenUrl', 'Open URL', LinkIcon, 'actions', ['link']),
  entry('Action.ShowCard', 'Show Card', PanelTop, 'actions', [
    'nested',
    'expand',
  ]),
  entry(
    'Action.ToggleVisibility',
    'Toggle Visibility',
    MousePointerClick,
    'actions',
    ['show', 'hide'],
  ),
  entry('Action.ResetInputs', 'Reset Inputs', RefreshCw, 'actions', ['clear']),

  entry('Accordion', 'Accordion', ChevronDown, 'advanced', [
    'collapse',
    'panel',
  ]),
  entry('TabSet', 'Tab Set', Grid3x3, 'advanced', ['tabs']),
  entry('Carousel', 'Carousel', AlignVerticalSpaceAround, 'advanced', [
    'slides',
    'pages',
  ]),
  entry('LoopComponent', 'Loop Component', Package, 'advanced', [
    'microsoft',
    'loop',
  ]),
  entry('Component', 'Component', Package, 'advanced', ['custom']),
  entry('Chart.VerticalBar', 'Vertical Bar Chart', BarChart3, 'advanced', [
    'chart',
    'bar',
  ]),
  entry('Chart.HorizontalBar', 'Horizontal Bar Chart', BarChart3, 'advanced', [
    'chart',
    'bar',
  ]),
  entry('Chart.Pie', 'Pie Chart', PieChart, 'advanced', ['chart']),
  entry('Chart.Donut', 'Donut Chart', Donut, 'advanced', ['chart', 'ring']),
  entry('Chart.Line', 'Line Chart', LineChart, 'advanced', ['chart', 'trend']),
  entry('Chart.Gauge', 'Gauge', Gauge, 'advanced', ['chart', 'meter']),
]

/** Display labels for the four built-in toolbox groups, in render order. */
export const TOOLBOX_GROUP_ORDER: Array<{ id: string; label: string }> = [
  { id: 'elements', label: 'Elements' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'actions', label: 'Actions' },
  { id: 'advanced', label: 'Advanced' },
]

/** Merge a user-supplied list of extra items at the end of each catalog. */
export function buildToolbox(extras: ToolboxItem[] = []): ToolboxItem[] {
  return [...TOOLBOX_ITEMS, ...extras]
}
