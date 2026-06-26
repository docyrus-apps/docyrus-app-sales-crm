'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react';

import { type DocyrusAgentProject } from '@/hooks/docyrus/use-docyrus-agent-projects';
import { type DocyrusAgentThread } from '@/hooks/docyrus/use-docyrus-agent-threads';

import { DocyrusAgentSidebar } from './docyrus-agent-sidebar';
import { DocyrusAgentSidebarHeader } from './docyrus-agent-sidebar-header';
import { DocyrusAgentSidebarNewChatButton } from './docyrus-agent-sidebar-new-chat-button';
import { DocyrusAgentSidebarProjectsSection } from './docyrus-agent-sidebar-projects-section';
import { DocyrusAgentSidebarThreadsSection } from './docyrus-agent-sidebar-threads-section';
import { type AgentProfile } from './types';

export interface DocyrusAgentThreadsSidebarProps {
  threads: Array<DocyrusAgentThread>;
  activeThreadId?: string | null;
  isLoading?: boolean;
  onSelectThread?: (thread: DocyrusAgentThread) => void;
  onNewThread?: () => void;
  onRenameThread?: (thread: DocyrusAgentThread, subject: string) => void | Promise<void>;
  onDeleteThread?: (thread: DocyrusAgentThread) => void | Promise<void>;
  /** Agent identity rendered in the header (avatar + name). */
  agent?: AgentProfile;
  /** Slot in place of the default agent header. */
  header?: ReactNode;
  /** Show a close / collapse button on the right of the header. */
  onClose?: () => void;
  /**
   * Controlled open state. On wide screens (>= md), the sidebar collapses via a width
   * transition. On narrow screens (< md), it renders as a floating drawer overlay with
   * a dismissable backdrop. Defaults to `true`.
   */
  open?: boolean;
  /** Slot rendered between the New Chat row and the Projects section (e.g. custom nav items). */
  navExtra?: ReactNode;
  /** When provided, renders a Projects section between New Chat and Recents. */
  projects?: Array<DocyrusAgentProject>;
  activeProjectId?: string | null;
  /** Maximum projects to show before the "Show more" button. Defaults to 3. */
  maxVisibleProjects?: number;
  onSelectProject?: (project: DocyrusAgentProject | null) => void;
  onNewProject?: () => void;
  onRenameProject?: (project: DocyrusAgentProject, name: string) => void | Promise<void>;
  onDeleteProject?: (project: DocyrusAgentProject) => void | Promise<void>;
  onShowMoreProjects?: () => void;
  /** Label shown above the thread list (defaults to "RECENT SESSIONS (N)"). */
  sessionsLabel?: ReactNode;
  /** Whether the recents section starts collapsed. */
  defaultCollapsed?: boolean;
  /** Custom empty state for the threads list. */
  emptyState?: ReactNode;
  className?: string;
}

/**
 * Default composition of the agent sidebar: header → New Chat → optional nav extra →
 * optional Projects section → Recent Sessions list. Internally just wires together
 * `DocyrusAgentSidebar`, `DocyrusAgentSidebarHeader`, `DocyrusAgentSidebarNewChatButton`,
 * `DocyrusAgentSidebarProjectsSection`, and `DocyrusAgentSidebarThreadsSection`.
 *
 * For custom layouts, compose those sub-components directly instead of using this view.
 */
export const DocyrusAgentThreadsSidebar = ({
  threads,
  activeThreadId,
  isLoading,
  onSelectThread,
  onNewThread,
  onRenameThread,
  onDeleteThread,
  agent,
  header,
  onClose,
  open = true,
  navExtra,
  projects,
  activeProjectId,
  maxVisibleProjects = 3,
  onSelectProject,
  onNewProject,
  onRenameProject,
  onDeleteProject,
  onShowMoreProjects,
  sessionsLabel,
  defaultCollapsed = false,
  emptyState,
  className
}: DocyrusAgentThreadsSidebarProps) => (
  <DocyrusAgentSidebar className={className} open={open} onClose={onClose}>
    {header ?? <DocyrusAgentSidebarHeader agent={agent} onClose={onClose} />}

    <DocyrusAgentSidebarNewChatButton onClick={onNewThread} />

    {navExtra && <div className="px-2">{navExtra}</div>}

    {projects && (
      <DocyrusAgentSidebarProjectsSection
        activeProjectId={activeProjectId}
        maxVisibleProjects={maxVisibleProjects}
        projects={projects}
        onDeleteProject={onDeleteProject}
        onNewProject={onNewProject}
        onRenameProject={onRenameProject}
        onSelectProject={onSelectProject}
        onShowMoreProjects={onShowMoreProjects} />
    )}

    <DocyrusAgentSidebarThreadsSection
      activeThreadId={activeThreadId}
      defaultCollapsed={defaultCollapsed}
      emptyState={emptyState}
      isLoading={isLoading}
      label={sessionsLabel}
      threads={threads}
      onDeleteThread={onDeleteThread}
      onRenameThread={onRenameThread}
      onSelectThread={onSelectThread} />
  </DocyrusAgentSidebar>
);