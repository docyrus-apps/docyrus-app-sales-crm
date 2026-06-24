'use client'

// @ts-nocheck
/* eslint-disable */
import { User } from 'lucide-react'

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

interface ExpandedUser {
  id: string
  name?: string
  display_name?: string
  email?: string
  avatar_url?: string
  profile_image_url?: string
}

function isExpandedUser(val: unknown): val is ExpandedUser {
  return typeof val === 'object' && val !== null && 'id' in val
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .flatMap((part) => (part[0] ? [part[0]] : []))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function UserMultiValue({
  value,
  enumOptions,
  className,
}: DocyrusValueProps) {
  if (value == null || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-muted-foreground">–</span>
  }

  const items: Array<unknown> = Array.isArray(value) ? value : [value]

  return (
    <AvatarGroup className={cn(className)}>
      {items.map((item) => {
        if (isExpandedUser(item)) {
          const name = item.display_name ?? item.name ?? item.email ?? item.id
          const avatarUrl = item.avatar_url ?? item.profile_image_url

          return (
            <Avatar key={item.id} size="sm">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>
          )
        }

        const enumMatch =
          typeof item === 'string'
            ? enumOptions?.find((o) => o.id === item)
            : undefined

        if (enumMatch) {
          return (
            <Avatar key={`user-${String(item)}`} size="sm">
              <AvatarFallback>{getInitials(enumMatch.name)}</AvatarFallback>
            </Avatar>
          )
        }

        return (
          <Avatar key={`user-${String(item)}`} size="sm">
            <AvatarFallback>
              <User className="size-3" />
            </AvatarFallback>
          </Avatar>
        )
      })}
    </AvatarGroup>
  )
}
