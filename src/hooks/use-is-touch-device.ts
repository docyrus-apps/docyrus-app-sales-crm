/* eslint-disable */
// @ts-nocheck
'use client'

import { useCallback, useSyncExternalStore } from 'react'

const getIsTouchDevice = () =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

const getServerSnapshot = () => false

export function useIsTouchDevice() {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener('resize', onStoreChange)

    return () => window.removeEventListener('resize', onStoreChange)
  }, [])

  return useSyncExternalStore(subscribe, getIsTouchDevice, getServerSnapshot)
}
