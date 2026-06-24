'use client'

// @ts-nocheck
/* eslint-disable */
/*
 * Source: https://usehooks-ts.com/react-hook/use-debounce-callback
 */

import { useEffect, useMemo, useRef } from 'react'

import { debounce } from '../lib/debounce'
import { useUnmount } from './use-unmount'

type DebounceOptions = {
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

type ControlFunctions = {
  cancel: () => void
  flush: () => void
  isPending: () => boolean
}

export type DebouncedState<T extends (...args: any) => ReturnType<T>> = ((
  ...args: Parameters<T>
) => ReturnType<T> | undefined) &
  ControlFunctions

export function useDebounceCallback<T extends (...args: any) => ReturnType<T>>(
  func: T,
  delay = 500,
  options?: DebounceOptions,
): DebouncedState<T> {
  const debouncedFuncRef = useRef<ReturnType<typeof debounce>>(null)

  useUnmount(() => {
    if (debouncedFuncRef.current) {
      debouncedFuncRef.current.cancel()
    }
  })

  const debounced = useMemo(() => {
    const debouncedFuncRefInstance = debounce(func, delay, options)

    const wrappedFunc: DebouncedState<T> = (...args: Parameters<T>) => {
      return debouncedFuncRefInstance(...args)
    }

    wrappedFunc.cancel = () => {
      debouncedFuncRefInstance.cancel()
    }

    wrappedFunc.isPending = () => {
      return !!debouncedFuncRef.current
    }

    wrappedFunc.flush = () => {
      return debouncedFuncRefInstance.flush()
    }

    return wrappedFunc
  }, [func, delay, options])

  useEffect(() => {
    debouncedFuncRef.current = debounce(func, delay, options)
  }, [func, delay, options])

  return debounced
}
