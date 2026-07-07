'use client'

// @ts-nocheck
/* eslint-disable */
/* @sidebar-exclude */

import { memo, useMemo } from 'react'

import InlineSvg from 'react-inlinesvg'
import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'
const docyrusIconVariants = cva('inline-flex shrink-0', {
  variants: {
    size: {
      xs: 'size-3',
      sm: 'size-4',
      default: 'size-5',
      lg: 'size-6',
      xl: 'size-8',
    },
    animation: {
      none: '',
      spin: 'animate-spin',
      pulse: 'animate-pulse',
      bounce: 'animate-bounce',
      ping: 'animate-ping',
    },
  },
  defaultVariants: {
    size: 'default',
    animation: 'none',
  },
})

const FA_LIBS = ['far', 'fal', 'fab', 'fas', 'fac']

const EMOJI_RE =
  /^(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji}\uFE0F))*$/u

function isEmoji(value: string): boolean {
  return EMOJI_RE.test(value)
}

interface ParsedIcon {
  lib: string | null
  group: string | null
  name: string
  isEmoji: boolean
  isDot: boolean
}

function parseIcon(icon: string, defaultLib: string = 'kv'): ParsedIcon {
  if (icon === 'dot') {
    return {
      lib: null,
      group: null,
      name: 'dot',
      isEmoji: false,
      isDot: true,
    }
  }

  if (isEmoji(icon)) {
    return {
      lib: null,
      group: null,
      name: icon,
      isEmoji: true,
      isDot: false,
    }
  }

  if (icon === 'null') {
    return {
      lib: 'fas',
      group: null,
      name: 'square',
      isEmoji: false,
      isDot: false,
    }
  }

  const parts = icon.trim().split(' ')

  if (parts.length === 2) {
    return {
      lib: parts[0] ?? '',
      group: null,
      name: parts[1] ?? '',
      isEmoji: false,
      isDot: false,
    }
  }

  if (parts.length === 3) {
    return {
      lib: parts[0] ?? '',
      group: parts[1] ?? null,
      name: parts[2] ?? '',
      isEmoji: false,
      isDot: false,
    }
  }

  return {
    lib: defaultLib,
    group: null,
    name: icon.trim(),
    isEmoji: false,
    isDot: false,
  }
}

function buildIconUrl(lib: string, group: string | null, name: string): string {
  const groupSegment = group ? `/${group}` : ''

  return `https://static.docyrus.app/assets/icons/${lib}${groupSegment}/${name}.svg`
}

export interface DocyrusIconProps extends VariantProps<
  typeof docyrusIconVariants
> {
  icon: string
  lib?: string
  group?: string | null
  className?: string
}

export const DocyrusIcon = memo(
  ({
    icon,
    lib = 'kv',
    group = null,
    size,
    animation,
    className,
  }: DocyrusIconProps) => {
    const parsed = useMemo(() => parseIcon(icon, lib), [icon, lib])

    const resolvedGroup = group ?? parsed.group
    const variantClass = docyrusIconVariants({ size, animation })

    if (parsed.isDot) {
      return (
        <span
          className={cn(variantClass, 'items-center justify-center', className)}
        >
          <span>&#x2022;</span>
        </span>
      )
    }

    if (parsed.isEmoji) {
      return (
        <span className={cn(variantClass, className)} title={parsed.name}>
          {parsed.name}
        </span>
      )
    }

    const iconLib = parsed.lib ?? lib
    const src = buildIconUrl(iconLib, resolvedGroup, parsed.name)

    const fillClass = FA_LIBS.includes(iconLib) ? 'fill-current' : ''
    const strokeClass = iconLib === 'huge' ? 'stroke-inherit' : ''

    const loader = (
      <span
        aria-hidden="true"
        className={cn(
          variantClass,
          'rounded-sm bg-current opacity-10',
          className,
        )}
      />
    )

    return (
      <InlineSvg
        src={src}
        loader={loader}
        className={cn(variantClass, fillClass, strokeClass, className)}
      />
    )
  },
)

export type { DocyrusIconProps as DocyrusIconPropsType }
