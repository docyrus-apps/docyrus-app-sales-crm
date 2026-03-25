'use client';

import { tUi, type UiI18nLocale } from '@/lib/ui-i18n';

import { useResourceSchedulerContext } from './resource-scheduler-context';
import { ResourceSchedulerEventRow } from './resource-scheduler-event-row';
import { ResourceSchedulerTimelineHeader } from './resource-scheduler-timeline-header';
import { ResourceSchedulerToday } from './resource-scheduler-today';

export function ResourceSchedulerTimeline() {
  const {
    resources,
    eventsByResource,
    totalTimelineWidth,
    isLoading,
    locale
  } = useResourceSchedulerContext();

  return (
    <div className="relative" style={{ minWidth: totalTimelineWidth }}>
      <ResourceSchedulerTimelineHeader />
      <div className="relative">
        <ResourceSchedulerToday />
        {resources.length === 0 && !isLoading && (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            {tUi(locale as UiI18nLocale, 'schedulerNoEvents')}
          </div>
        )}
        {resources.map(resource => (
          <ResourceSchedulerEventRow
            key={resource.id}
            resourceId={resource.id}
            events={eventsByResource.get(resource.id) ?? []} />
        ))}
      </div>
    </div>
  );
}