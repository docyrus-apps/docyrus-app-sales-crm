// @ts-nocheck
/* eslint-disable */
import {
  Ban,
  Binary,
  Braces,
  Brackets,
  Calendar,
  CalendarClock,
  Fingerprint,
  Hash,
  KeyRound,
  Link2,
  List,
  Mail,
  ToggleLeft,
  Type,
} from 'lucide-react'

import { type ToolboxItemDef } from '../json-schema-designer-types'

/** The full catalogue of draggable schema-type entries for the toolbox. */
export const TOOLBOX_ITEMS: ToolboxItemDef[] = [
  {
    id: 'string',
    label: 'String',
    description: 'Text value',
    icon: Type,
    category: 'Primitives',
    template: { type: 'string' },
    keywords: ['string', 'text', 'char'],
  },
  {
    id: 'number',
    label: 'Number',
    description: 'Decimal number',
    icon: Hash,
    category: 'Primitives',
    template: { type: 'number' },
    keywords: ['number', 'decimal', 'float'],
  },
  {
    id: 'integer',
    label: 'Integer',
    description: 'Whole number',
    icon: Binary,
    category: 'Primitives',
    template: { type: 'integer' },
    keywords: ['integer', 'int', 'whole', 'number'],
  },
  {
    id: 'boolean',
    label: 'Boolean',
    description: 'True or false',
    icon: ToggleLeft,
    category: 'Primitives',
    template: { type: 'boolean' },
    keywords: ['boolean', 'bool', 'flag', 'toggle'],
  },
  {
    id: 'null',
    label: 'Null',
    description: 'Null value',
    icon: Ban,
    category: 'Primitives',
    template: { type: 'null' },
    keywords: ['null', 'empty', 'none'],
  },

  {
    id: 'object',
    label: 'Object',
    description: 'Nested properties',
    icon: Braces,
    category: 'Containers',
    template: { type: 'object' },
    keywords: ['object', 'group', 'nested', 'properties'],
  },
  {
    id: 'array',
    label: 'Array',
    description: 'List of items',
    icon: Brackets,
    category: 'Containers',
    template: { type: 'array' },
    keywords: ['array', 'list', 'collection', 'items'],
  },

  {
    id: 'enum',
    label: 'Enum',
    description: 'Fixed set of values',
    icon: List,
    category: 'Presets',
    template: { type: 'string', enumValues: ['option_1', 'option_2'] },
    keywords: ['enum', 'select', 'choice', 'options'],
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Email address string',
    icon: Mail,
    category: 'Presets',
    template: { type: 'string', format: 'email' },
    keywords: ['email', 'mail', 'address'],
  },
  {
    id: 'date',
    label: 'Date',
    description: 'ISO 8601 date',
    icon: Calendar,
    category: 'Presets',
    template: { type: 'string', format: 'date' },
    keywords: ['date', 'day', 'calendar'],
  },
  {
    id: 'datetime',
    label: 'Date & Time',
    description: 'ISO 8601 date-time',
    icon: CalendarClock,
    category: 'Presets',
    template: { type: 'string', format: 'date-time' },
    keywords: ['datetime', 'date-time', 'timestamp'],
  },
  {
    id: 'uri',
    label: 'URI',
    description: 'URL / URI string',
    icon: Link2,
    category: 'Presets',
    template: { type: 'string', format: 'uri' },
    keywords: ['uri', 'url', 'link', 'web'],
  },
  {
    id: 'uuid',
    label: 'UUID',
    description: 'Unique identifier',
    icon: Fingerprint,
    category: 'Presets',
    template: { type: 'string', format: 'uuid' },
    keywords: ['uuid', 'guid', 'id', 'identifier'],
  },
  {
    id: 'password',
    label: 'Password',
    description: 'Masked secret string',
    icon: KeyRound,
    category: 'Presets',
    template: { type: 'string', format: 'password' },
    keywords: ['password', 'secret', 'credential'],
  },
]

/** Toolbox categories in display order. */
export const TOOLBOX_CATEGORIES: string[] = [
  'Primitives',
  'Containers',
  'Presets',
]

/** Lookup a toolbox entry by its id. */
export function getToolboxItem(id: string): ToolboxItemDef | undefined {
  return TOOLBOX_ITEMS.find((item) => item.id === id)
}

/** Common JSON Schema `format` values offered in the properties panel. */
export const STRING_FORMATS: { value: string; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'date', label: 'date' },
  { value: 'time', label: 'time' },
  { value: 'date-time', label: 'date-time' },
  { value: 'duration', label: 'duration' },
  { value: 'email', label: 'email' },
  { value: 'idn-email', label: 'idn-email' },
  { value: 'hostname', label: 'hostname' },
  { value: 'ipv4', label: 'ipv4' },
  { value: 'ipv6', label: 'ipv6' },
  { value: 'uri', label: 'uri' },
  { value: 'uri-reference', label: 'uri-reference' },
  { value: 'uuid', label: 'uuid' },
  { value: 'regex', label: 'regex' },
  { value: 'json-pointer', label: 'json-pointer' },
  { value: 'password', label: 'password' },
]
