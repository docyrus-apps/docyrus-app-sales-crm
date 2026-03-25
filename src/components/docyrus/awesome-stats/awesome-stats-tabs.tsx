'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';

import { Tabs as TabsPrimitive } from 'radix-ui';
import { GripVertical } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useReducedMotion
} from 'motion/react';

import { cn } from '@/lib/utils';
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  type SortableProps
} from '@/components/ui/sortable';

import { type AwesomeStatItem } from './types';

function AwesomeStatsTabs({
  items,
  defaultTabId,
  renderItem,
  sortable = false,
  onItemsOrderChange
}: {
  items: AwesomeStatItem[];
  defaultTabId?: string;
  renderItem: (item: AwesomeStatItem) => ReactNode;
  sortable?: boolean;
  onItemsOrderChange?: (items: AwesomeStatItem[]) => void;
}) {
  const initialTabId = useMemo(() => {
    if (!items.length) return '';

    return items.find(item => item.id === defaultTabId)?.id ?? items[0]?.id ?? '';
  }, [defaultTabId, items]);
  const [activeTabId, setActiveTabId] = useState(initialTabId);
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    opacity: 0
  });
  const listRef = useRef<HTMLDivElement | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!items.some(item => item.id === activeTabId)) {
      setActiveTabId(initialTabId);
    }
  }, [activeTabId, initialTabId, items]);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const listElement = listRef.current;
      const triggerElement = triggerRefs.current[activeTabId];

      if (!listElement || !triggerElement) {
        setIndicator(prev => ({ ...prev, opacity: 0 }));

        return;
      }

      const listRect = listElement.getBoundingClientRect();
      const triggerRect = triggerElement.getBoundingClientRect();

      setIndicator({
        left: triggerRect.left - listRect.left,
        width: triggerRect.width,
        opacity: 1
      });
    };

    updateIndicator();

    const resizeObserver = new ResizeObserver(updateIndicator);

    if (listRef.current) {
      resizeObserver.observe(listRef.current);
    }

    const currentTrigger = triggerRefs.current[activeTabId];

    if (currentTrigger) {
      resizeObserver.observe(currentTrigger);
    }

    window.addEventListener('resize', updateIndicator);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTabId, items]);

  const activeItem = items.find(item => item.id === activeTabId) ?? items[0];

  if (!activeItem) return null;

  const tabsList = (
    <Sortable
      {...{
        value: items,
        getItemValue: (item: AwesomeStatItem) => item.id,
        onValueChange: onItemsOrderChange,
        orientation: 'horizontal'
      } as SortableProps<AwesomeStatItem>}>
      <TabsPrimitive.Root value={activeTabId} onValueChange={setActiveTabId}>
        <SortableContent asChild>
          <TabsPrimitive.List
            ref={listRef}
            className="relative flex w-full flex-wrap items-center gap-1 rounded-2xl border bg-muted/40 p-1">
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-1 rounded-xl bg-background shadow-sm ring-1 ring-foreground/10"
              animate={indicator}
              transition={prefersReducedMotion ? { duration: 0.12 } : { type: 'spring', stiffness: 260, damping: 28 }} />

            {items.map(item => (
              <SortableItem key={item.id} value={item.id} asChild>
                <TabsPrimitive.Trigger
                  ref={(node) => {
                    triggerRefs.current[item.id] = node;
                  }}
                  value={item.id}
                  className={cn(
                    'relative z-10 inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    'text-muted-foreground hover:text-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                    'data-[state=active]:text-foreground'
                  )}>
                  {sortable ? (
                    <SortableItemHandle asChild>
                      <span
                        className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground/70"
                        aria-label={`Reorder ${typeof item.title === 'string' ? item.title : 'stat'}`}>
                        <GripVertical className="size-3.5" />
                      </span>
                    </SortableItemHandle>
                  ) : null}
                  <span className="truncate">{item.title}</span>
                </TabsPrimitive.Trigger>
              </SortableItem>
            ))}
          </TabsPrimitive.List>
        </SortableContent>
      </TabsPrimitive.Root>
    </Sortable>
  );

  return (
    <div className="space-y-4">
      {tabsList}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeItem.id}
          initial={prefersReducedMotion ? { opacity: 0 } : {
            opacity: 0,
            y: 8
          }}
          animate={prefersReducedMotion ? { opacity: 1 } : {
            opacity: 1,
            y: 0
          }}
          exit={prefersReducedMotion ? { opacity: 0 } : {
            opacity: 0,
            y: -8
          }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          layout>
          {renderItem(activeItem)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export { AwesomeStatsTabs };