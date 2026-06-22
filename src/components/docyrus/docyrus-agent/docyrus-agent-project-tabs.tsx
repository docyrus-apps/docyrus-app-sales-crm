'use client';

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react';

import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

export type DocyrusAgentProjectDetailTab = 'sessions' | 'works' | 'documents';

export interface DocyrusAgentProjectTabsProps {
  /** Slot for the Sessions tab body. */
  sessionsContent: ReactNode;
  /** Slot for the Works tab body. Omit to disable the tab. */
  worksContent?: ReactNode;
  /** Slot for the Documents tab body. Omit to disable the tab. */
  documentsContent?: ReactNode;
  /** Override labels. */
  sessionsLabel?: ReactNode;
  worksLabel?: ReactNode;
  documentsLabel?: ReactNode;
  /** Controlled active tab. Defaults to `'sessions'`. */
  value?: DocyrusAgentProjectDetailTab;
  onValueChange?: (tab: DocyrusAgentProjectDetailTab) => void;
  className?: string;
}

/**
 * Sessions / Works / Documents segmented tab strip used inside the project detail view.
 * Each tab body is a slot — pass your own list, gallery, or empty state. Tabs whose
 * content slot is omitted render disabled.
 */
export const DocyrusAgentProjectTabs = ({
  sessionsContent,
  worksContent,
  documentsContent,
  sessionsLabel,
  worksLabel,
  documentsLabel,
  value,
  onValueChange,
  className
}: DocyrusAgentProjectTabsProps) => {
  const { t } = useUiTranslation();

  return (
    <Tabs
      className={cn('flex flex-col gap-4', className)}
      value={value ?? 'sessions'}
      onValueChange={v => onValueChange?.(v as DocyrusAgentProjectDetailTab)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="sessions">
          {sessionsLabel ?? t('ui.agent.sessions', 'Sessions')}
        </TabsTrigger>
        <TabsTrigger disabled={!worksContent} value="works">
          {worksLabel ?? t('ui.agent.works', 'Works')}
        </TabsTrigger>
        <TabsTrigger disabled={!documentsContent} value="documents">
          {documentsLabel ?? t('ui.agent.documents', 'Documents')}
        </TabsTrigger>
      </TabsList>

      <TabsContent className="m-0" value="sessions">{sessionsContent}</TabsContent>
      <TabsContent className="m-0" value="works">{worksContent}</TabsContent>
      <TabsContent className="m-0" value="documents">{documentsContent}</TabsContent>
    </Tabs>
  );
};