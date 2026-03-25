'use client';

import {
  type ComponentProps,
  forwardRef,
  type ReactNode
} from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { Check, Circle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { cn } from '@/lib/utils';

const timelineDotVariants = cva(
  'relative z-10 flex shrink-0 items-center justify-center rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        outline: 'border-2 border-primary bg-transparent'
      },
      size: {
        sm: 'size-2.5',
        md: 'size-3',
        lg: 'size-4'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

const timelineLineVariants = cva(
  'absolute left-1/2 w-0.5 -translate-x-1/2',
  {
    variants: {
      lineStyle: {
        solid: '',
        dashed: 'border-l-2 border-dashed bg-transparent!'
      }
    },
    defaultVariants: {
      lineStyle: 'solid'
    }
  }
);

const SIZE_CONFIG = {
  sm: {
    statusDot: 20, statusIcon: 10, gap: 'gap-3', text: 'text-sm', desc: 'text-xs', time: 'text-[11px]'
  },
  md: {
    statusDot: 24, statusIcon: 12, gap: 'gap-4', text: 'text-sm', desc: 'text-sm', time: 'text-xs'
  },
  lg: {
    statusDot: 28, statusIcon: 14, gap: 'gap-5', text: 'text-base', desc: 'text-sm', time: 'text-sm'
  }
} as const;

export type TimelineSize = 'sm' | 'md' | 'lg';
export type TimelineVariant = NonNullable<VariantProps<typeof timelineDotVariants>['variant']>;
export type TimelineStatus = 'completed' | 'active' | 'pending' | 'error';
export type TimelineLineStyle = 'solid' | 'dashed';
export type TimelineLayout = 'left' | 'alternate' | 'right';

export interface TimelineItem {
  title: string;
  description?: string;
  time?: string;
  icon?: ReactNode;
  dotColor?: string;
  status?: TimelineStatus;
  content?: ReactNode;
  lineStyle?: TimelineLineStyle;
}

export interface TimelineProps extends Omit<ComponentProps<'div'>, 'children'> {
  items: TimelineItem[];
  size?: TimelineSize;
  variant?: TimelineVariant;
  lineStyle?: TimelineLineStyle;
  layout?: TimelineLayout;
  animated?: boolean;
  onItemClick?: (item: TimelineItem, index: number) => void;
  titleClassName?: string;
  descriptionClassName?: string;
  timeClassName?: string;
}

function resolveLineStyle(
  itemStatus: TimelineStatus | undefined,
  itemLineStyle: TimelineLineStyle | undefined,
  globalLineStyle: TimelineLineStyle | undefined
): TimelineLineStyle {
  if (itemLineStyle) return itemLineStyle;
  if (itemStatus === 'active' || itemStatus === 'pending') return 'dashed';

  return globalLineStyle ?? 'solid';
}

function getLineColorClass(status: TimelineStatus | undefined): string {
  if (!status) return 'bg-border';

  switch (status) {
    case 'completed': return 'bg-primary';

    case 'active': return 'bg-primary';

    case 'pending': return 'bg-muted-foreground/40';

    case 'error': return 'bg-destructive';
  }
}

function getDashBorderColorClass(status: TimelineStatus | undefined): string {
  if (!status) return 'border-border';

  switch (status) {
    case 'completed': return 'border-primary';

    case 'active': return 'border-primary';

    case 'pending': return 'border-muted-foreground/40';

    case 'error': return 'border-destructive';
  }
}

function StatusDot({
  status,
  size
}: {
  status: TimelineStatus;
  size: TimelineSize;
}) {
  const config = SIZE_CONFIG[size];
  const dotSize = status === 'pending' ? Math.round(config.statusDot * 0.6) : config.statusDot;
  const iconSize = config.statusIcon;

  switch (status) {
    case 'completed':
      return (
        <div
          className="relative z-10 flex shrink-0 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500"
          style={{ width: dotSize, height: dotSize }}>
          <Check className="text-white" style={{ width: iconSize, height: iconSize }} strokeWidth={3} />
        </div>
      );

    case 'active':
      return (
        <div
          className="relative z-10 flex shrink-0 items-center justify-center rounded-full bg-primary"
          style={{ width: dotSize, height: dotSize }}>
          <Circle
            className="fill-primary-foreground text-primary-foreground"
            style={{ width: dotSize * 0.4, height: dotSize * 0.4 }} />
        </div>
      );

    case 'pending':
      return (
        <div
          className="relative z-10 shrink-0 rounded-full bg-muted-foreground/40"
          style={{ width: dotSize, height: dotSize }} />
      );

    case 'error':
      return (
        <div
          className="relative z-10 flex shrink-0 items-center justify-center rounded-full bg-red-600 dark:bg-red-500"
          style={{ width: dotSize, height: dotSize }}>
          <X className="text-white" style={{ width: iconSize, height: iconSize }} strokeWidth={3} />
        </div>
      );
  }
}

function TimelineRow({
  item,
  index,
  isLast,
  size,
  variant,
  globalLineStyle,
  layout,
  animated,
  onItemClick,
  titleClassName,
  descriptionClassName,
  timeClassName
}: {
  item: TimelineItem;
  index: number;
  isLast: boolean;
  size: TimelineSize;
  variant: TimelineVariant;
  globalLineStyle?: TimelineLineStyle;
  layout: TimelineLayout;
  animated: boolean;
  onItemClick?: (item: TimelineItem, index: number) => void;
  titleClassName?: string;
  descriptionClassName?: string;
  timeClassName?: string;
}) {
  const config = SIZE_CONFIG[size];
  const isPending = item.status === 'pending';
  const lineVariant = resolveLineStyle(item.status, item.lineStyle, globalLineStyle);
  const isRight = layout === 'left' || (layout === 'alternate' && index % 2 === 0);
  const hasStatus = !!item.status;

  const dotColWidth = hasStatus ? config.statusDot + 8 : 20;

  const dot = item.status ? (
    <StatusDot status={item.status} size={size} />
  ) : item.icon ? (
    <div className="relative z-10 flex shrink-0 items-center justify-center">
      {item.icon}
    </div>
  ) : (
    <div
      className={cn(timelineDotVariants({ variant, size }))}
      style={{
        ...(item.dotColor && variant === 'default' ? { backgroundColor: item.dotColor } : {}),
        ...(item.dotColor && variant === 'outline' ? { borderColor: item.dotColor } : {})
      }} />
  );

  const line = !isLast && (
    <div
      className={cn(
        timelineLineVariants({ lineStyle: lineVariant }),
        lineVariant === 'solid' ? getLineColorClass(item.status) : getDashBorderColorClass(item.status)
      )}
      style={{ top: (hasStatus ? config.statusDot : 12) + 4, bottom: 0 }} />
  );

  const content = (
    <div className={cn('flex-1 pb-1', isPending && 'opacity-50')}>
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          !isRight && 'flex-row-reverse'
        )}>
        <span
          className={cn(
            'font-medium text-foreground',
            config.text,
            !isRight && 'text-right',
            titleClassName
          )}>
          {item.title}
        </span>
        {item.time && (
          <span
            className={cn(
              'shrink-0 text-muted-foreground',
              config.time,
              timeClassName
            )}>
            {item.time}
          </span>
        )}
      </div>
      {item.description && (
        <p
          className={cn(
            'mt-0.5 text-muted-foreground',
            config.desc,
            !isRight && 'text-right',
            descriptionClassName
          )}>
          {item.description}
        </p>
      )}
      {item.content && (
        <div className={cn('mt-2', !isRight && 'flex justify-end')}>
          {item.content}
        </div>
      )}
    </div>
  );

  const clickable = !!onItemClick;

  const wrappedContent = clickable ? (
    <button
      type="button"
      className="flex-1 cursor-pointer text-left transition-opacity hover:opacity-80 active:opacity-60"
      onClick={() => onItemClick(item, index)}>
      {content}
    </button>
  ) : content;

  let rowContent: ReactNode;

  if (layout === 'alternate') {
    rowContent = (
      <>
        <div className={cn('flex flex-1 justify-end', isRight && 'invisible')}>
          <div className="flex-1 pb-4 pr-3">
            {wrappedContent}
          </div>
        </div>
        <div className="relative flex flex-col items-center" style={{ width: dotColWidth }}>
          {dot}
          {line}
        </div>
        <div className={cn('flex flex-1', !isRight && 'invisible')}>
          <div className="flex-1 pb-4 pl-3">
            {wrappedContent}
          </div>
        </div>
      </>
    );
  } else {
    const isLeftContent = layout === 'right';

    rowContent = (
      <>
        {isLeftContent && (
          <div className="flex-1 pb-4 pr-3">
            {wrappedContent}
          </div>
        )}
        <div className="relative flex flex-col items-center" style={{ width: dotColWidth }}>
          {dot}
          {line}
        </div>
        {!isLeftContent && (
          <div className="flex-1 pb-4 pl-3">
            {wrappedContent}
          </div>
        )}
      </>
    );
  }

  if (animated) {
    return (
      <motion.div
        className="flex items-stretch"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.3, ease: 'easeOut' }}>
        {rowContent}
      </motion.div>
    );
  }

  return (
    <div className="flex items-stretch">
      {rowContent}
    </div>
  );
}

const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
  ({
    items,
    size = 'md',
    variant = 'default',
    lineStyle,
    layout = 'left',
    animated = false,
    onItemClick,
    className,
    titleClassName,
    descriptionClassName,
    timeClassName,
    ...props
  }, ref) => {
    const rows = items.map((item, i) => (
      <TimelineRow
        key={i}
        item={item}
        index={i}
        isLast={i === items.length - 1}
        size={size}
        variant={variant ?? 'default'}
        globalLineStyle={lineStyle}
        layout={layout}
        animated={animated}
        onItemClick={onItemClick}
        titleClassName={titleClassName}
        descriptionClassName={descriptionClassName}
        timeClassName={timeClassName} />
    ));

    return (
      <div
        ref={ref}
        className={cn('relative', className)}
        {...props}>
        {animated ? (
          <AnimatePresence mode="sync">
            {rows}
          </AnimatePresence>
        ) : rows}
      </div>
    );
  }
);

Timeline.displayName = 'Timeline';

export { Timeline, timelineDotVariants, timelineLineVariants };