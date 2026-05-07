export function intersection<T>(a: Array<T>, b: Array<T>): Array<T> {
  return a.filter((x) => b.includes(x))
}

/**
 * Computes a stable hash string for any value using deep inspection.
 * This function recursively builds a string for primitives, arrays, and objects.
 * It uses a cache (WeakMap) to avoid rehashing the same object twice, which is
 * particularly beneficial if an object appears in multiple places.
 */
function deepHash(value: any, cache = new WeakMap<object, string>()): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  const type = typeof value

  if (type === 'number' || type === 'boolean' || type === 'string') {
    return `${type}:${value.toString()}`
  }
  if (type === 'function') {
    return `function:${value.toString()}`
  }

  if (type === 'object') {
    const cachedHash = cache.get(value)

    if (cachedHash !== undefined) {
      return cachedHash
    }
    let hash: string

    if (Array.isArray(value)) {
      hash = `array:[${value.map((v) => deepHash(v, cache)).join(',')}]`
    } else {
      const keys = Object.keys(value).sort()
      const props = keys
        .map((k) => `${k}:${deepHash(value[k], cache)}`)
        .join(',')

      hash = `object:{${props}}`
    }
    cache.set(value, hash)

    return hash
  }

  return `${type}:${value.toString()}`
}

/**
 * Performs deep equality check for any two values.
 * This recursively checks primitives, arrays, and plain objects.
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null || a === undefined || b === undefined)
    return false

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }

    return true
  }

  if (typeof a === 'object') {
    if (typeof b !== 'object') return false
    const aKeys = Object.keys(a).sort()
    const bKeys = Object.keys(b).sort()

    if (aKeys.length !== bKeys.length) return false
    for (let i = 0; i < aKeys.length; i++) {
      const aKey = aKeys[i] as string
      const bKey = bKeys[i] as string

      if (aKey !== bKey) return false
      if (!deepEqual(a[aKey], b[bKey])) return false
    }

    return true
  }

  return false
}

/**
 * Returns a new array containing only the unique values from the input array.
 * Uniqueness is determined by deep equality.
 *
 * @param arr - The array of values to be filtered.
 * @returns A new array with duplicates removed.
 */
export function uniq<T>(arr: Array<T>): Array<T> {
  const seen = new Map<string, Array<T>>()
  const result: Array<T> = []

  for (const item of arr) {
    const hash = deepHash(item)

    if (seen.has(hash)) {
      const itemsWithHash = seen.get(hash)

      if (!itemsWithHash) continue
      let duplicateFound = false

      for (const existing of itemsWithHash) {
        if (deepEqual(existing, item)) {
          duplicateFound = true
          break
        }
      }
      if (!duplicateFound) {
        itemsWithHash.push(item)
        result.push(item)
      }
    } else {
      seen.set(hash, [item])
      result.push(item)
    }
  }

  return result
}

export function take<T>(a: Array<T>, n: number): Array<T> {
  return a.slice(0, n)
}

export function flatten<T>(a: Array<Array<T>>): Array<T> {
  return a.flat()
}

export function addUniq<T>(arr: Array<T>, values: Array<T>): Array<T> {
  return uniq([...arr, ...values])
}

export function removeUniq<T>(arr: Array<T>, values: Array<T>): Array<T> {
  return arr.filter((v) => !values.includes(v))
}

export function isAnyOf<T>(value: T, values: Array<T>): boolean {
  return values.includes(value)
}
