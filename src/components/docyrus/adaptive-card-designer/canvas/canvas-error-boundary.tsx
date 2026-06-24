'use client'

// @ts-nocheck
/* eslint-disable */
import { Component, type ErrorInfo, type ReactNode } from 'react'

import { AlertTriangle } from 'lucide-react'

interface CanvasErrorBoundaryProps {
  /** Bumped whenever the upstream payload changes so a fixed payload clears the error state. */
  resetKey: unknown
  children: ReactNode
}

interface CanvasErrorBoundaryState {
  error: Error | null
}

/*
 * The AdaptiveCard renderer can throw when an element is malformed — most
 * commonly when the user types JSON in Monaco with required arrays missing
 * (Chart data, FactSet facts, etc.). Without an error boundary the React
 * tree above unmounts and the whole designer goes blank. This boundary
 * isolates the failure to the canvas pane and shows the error message + a
 * hint to fix the JSON, while leaving the toolbox / structure tree / JSON
 * editor fully usable so the user can correct the payload.
 *
 * `resetKey` (typically the canonical payload) is compared between renders;
 * when it changes the boundary clears its error state so a corrected
 * payload renders again automatically.
 */
export class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): CanvasErrorBoundaryState {
    return { error }
  }

  componentDidUpdate(prevProps: CanvasErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (typeof console !== 'undefined') {
      console.warn('[AdaptiveCardDesigner] canvas render error', error, info)
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="m-4 flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-destructive">
            <AlertTriangle className="size-3.5" />
            Render error
          </div>
          <p className="break-words text-destructive">
            {this.state.error.message}
          </p>
          <p className="text-muted-foreground">
            The card payload is invalid for the renderer. Fix the JSON below or
            adjust the element via the structure tree — the canvas will retry
            once the payload changes.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
