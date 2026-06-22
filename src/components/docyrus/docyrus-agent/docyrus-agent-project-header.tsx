'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

import { type DocyrusAgentProject } from '@/hooks/docyrus/use-docyrus-agent-projects';

export interface DocyrusAgentProjectHeaderProps {
  project: DocyrusAgentProject;
  /** Goes back to the projects list. */
  onBack?: () => void;
  /** Override the "All Projects" link label. */
  allProjectsLabel?: string;
  /** Slot rendered to the left of the back link (e.g. sidebar-toggle spacer). */
  leading?: ReactNode;
  className?: string;
}

/**
 * Project detail header — "← All Projects" back link, project name (large), and
 * description (muted) beneath. Slot `leading` reserves space next to the back link
 * (e.g. to clear floating sidebar buttons when the sidebar is closed).
 */
export const DocyrusAgentProjectHeader = ({
  project,
  onBack,
  allProjectsLabel,
  leading,
  className
}: DocyrusAgentProjectHeaderProps) => {
  const { t } = useUiTranslation();

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center gap-2">
        {leading}
        {onBack && (
          <button
            className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            type="button"
            onClick={onBack}>
            <ArrowLeft className="size-4" />
            {allProjectsLabel ?? t('ui.agent.allProjects', 'All Projects')}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
        {project.description && (
          <p className="text-base text-muted-foreground">{project.description}</p>
        )}
      </div>
    </div>
  );
};