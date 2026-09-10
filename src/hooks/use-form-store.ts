import { useEffect } from 'react'

type FormStore = {
  readonly state: { readonly values: unknown };
  /*
   * TanStack Store has returned both a plain unsubscribe function and a
   * `{ unsubscribe }` subscription object across versions, so accept either.
   */
  subscribe: (listener: (...args: Array<any>) => void) => unknown;
}

function unsubscribe(subscription: unknown): void {
  if (typeof subscription === 'function') {
    subscription()

    return
  }

  if (
    subscription &&
    typeof (subscription as { unsubscribe?: unknown }).unsubscribe === 'function'
  ) {
    ;(subscription as { unsubscribe: () => void }).unsubscribe()
  }
}

/**
 * Clear a form's submit-error banner as soon as the user edits any field.
 *
 * The banner is only written on submit, so after a failed validation it kept
 * claiming e.g. "Company Name: This field is required" even once the field had
 * been filled in — the inline field errors updated live while the summary above
 * them went stale.
 *
 * Compares the `values` identity: TanStack Form replaces that object only on a
 * real value change, so writing the error itself (or flipping `isSubmitting`)
 * does not clear the banner it just set.
 */
export function useFormErrorReset(
  store: FormStore,
  clearError: (value: null) => void
) {
  useEffect(() => {
    let previousValues = store.state.values

    const subscription = store.subscribe(() => {
      const nextValues = store.state.values

      if (nextValues === previousValues) return

      previousValues = nextValues
      clearError(null)
    })

    return () => unsubscribe(subscription)
  }, [store, clearError])
}

