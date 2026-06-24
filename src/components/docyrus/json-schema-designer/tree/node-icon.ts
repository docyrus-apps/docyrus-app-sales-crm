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
  type LucideIcon,
  Mail,
  ToggleLeft,
  Type,
} from 'lucide-react'

import {
  type JsonSchemaType,
  type SchemaNode,
} from '../json-schema-designer-types'

export type NodeIconKey =
  | JsonSchemaType
  | 'enum'
  | 'email'
  | 'date'
  | 'date-time'
  | 'uri'
  | 'uuid'
  | 'password'

/** Static map of icon key → lucide component (indexed, never created in render). */
export const NODE_ICONS: Record<NodeIconKey, LucideIcon> = {
  string: Type,
  number: Hash,
  integer: Binary,
  boolean: ToggleLeft,
  object: Braces,
  array: Brackets,
  null: Ban,
  enum: List,
  email: Mail,
  date: Calendar,
  'date-time': CalendarClock,
  uri: Link2,
  uuid: Fingerprint,
  password: KeyRound,
}

/** Resolve the most descriptive icon key for a node from its type / format / enum. */
export function getNodeIconKey(
  node: Pick<SchemaNode, 'type' | 'format' | 'enumValues'>,
): NodeIconKey {
  if (node.enumValues && node.enumValues.length > 0) return 'enum'

  if (node.type === 'string' && node.format) {
    switch (node.format) {
      case 'email':

      case 'idn-email':
        return 'email'

      case 'date':
        return 'date'

      case 'date-time':
        return 'date-time'

      case 'uri':

      case 'uri-reference':
        return 'uri'

      case 'uuid':
        return 'uuid'

      case 'password':
        return 'password'

      default:
        break
    }
  }

  return node.type
}
