'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface DocyrusAgentSidebarProps {
  /**
   * Controlled open state. On wide screens (>= md), the sidebar collapses to `w-0`
   * via a width transition. On narrow screens (< md), it renders as a floating drawer
   * overlay with a dismissable backdrop. Defaults to `true`.
   */
  open?: boolean;
  /** Called when the backdrop is clicked on narrow screens. */
  onClose?: () => void;
  /** Width of the open sidebar. Defaults to `w-72`. */
  widthClassName?: string;
  /** Sidebar body. Compose with `DocyrusAgentSidebarHeader`, `…ProjectsSection`, `…ThreadsSection`, or any custom content. */
  children?: ReactNode;
  className?: string;
}

/**
 * Sidebar shell that handles the responsive open/close behavior:
 * - Inline when the surrounding container is at least ~48rem (`@3xl`) — width transition
 * - Floating drawer below that threshold — absolute overlay with a backdrop
 *
 * Uses Tailwind v4 container queries (`@3xl/agent:`), so the layout responds to the chat
 * panel's width rather than the viewport. The parent **must** declare a container
 * (`@container/agent` or `@container`) — typically the flex row that holds the sidebar
 * and the chat surface. The floating drawer is positioned `absolute inset-0`, so the
 * same parent should be `relative overflow-hidden`.
 *
 * Drop your own content as children — typically `DocyrusAgentSidebarHeader`,
 * `DocyrusAgentSidebarNewChatButton`, `DocyrusAgentSidebarProjectsSection`, and
 * `DocyrusAgentSidebarThreadsSection`.
 */
export const DocyrusAgentSidebar = ({
  open = true,
  onClose,
  widthClassName = 'w-72',
  children,
  className
}: DocyrusAgentSidebarProps) => {
  const minWidthClass = widthClassName.replace(/^w-/, 'min-w-');

  return (
    <>
      <aside
        className={cn(
          'hidden h-full shrink-0 flex-col overflow-hidden border-r bg-background transition-[width] duration-300 @3xl/agent:flex',
          open ? widthClassName : 'w-0 border-r-0',
          className
        )}
        inert={!open}>
        <div className={cn('flex min-h-0 flex-1 flex-col', widthClassName, minWidthClass)}>
          {children}
        </div>
      </aside>

      {open && (
        <div className="absolute inset-0 z-50 @3xl/agent:hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-black/30"
            onClick={onClose} />
          <aside
            className={cn(
              'absolute left-0 top-0 flex h-full flex-col overflow-hidden border-r bg-background shadow-xl',
              widthClassName,
              className
            )}>
            <div className={cn('flex min-h-0 flex-1 flex-col', widthClassName, minWidthClass)}>
              {children}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};