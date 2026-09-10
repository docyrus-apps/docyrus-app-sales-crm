/* eslint-disable */
// @ts-nocheck
import { useEffect, useLayoutEffect } from 'react'

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export { useIsomorphicLayoutEffect }
