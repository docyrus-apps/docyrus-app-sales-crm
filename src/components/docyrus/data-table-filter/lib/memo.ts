export function memo<TDeps extends ReadonlyArray<any>, TResult>(
  getDeps: () => TDeps,
  compute: (deps: TDeps) => TResult,
  _options: { key: string },
): () => TResult {
  let prevDeps: TDeps | undefined
  let cachedResult: TResult | undefined
  let hasCachedResult = false

  return () => {
    const deps = getDeps()

    if (!hasCachedResult || !prevDeps || !shallowEqual(prevDeps, deps)) {
      cachedResult = compute(deps)
      prevDeps = deps
      hasCachedResult = true

      return cachedResult
    } else {
    }

    return cachedResult as TResult
  }
}

function shallowEqual<T>(
  arr1: ReadonlyArray<T>,
  arr2: ReadonlyArray<T>,
): boolean {
  if (arr1 === arr2) return true
  if (arr1.length !== arr2.length) return false

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }

  return true
}
