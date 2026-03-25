'use client';

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';

import {
  ChevronRight, Maximize2, Minimize2
} from 'lucide-react';
import gsap from 'gsap';

import { cn } from '@/lib/utils';

import { type PatternStyle, getPatternStyle } from '@/lib/pattern-styles';

import { useClickOutside } from '@/components/docyrus/use-click-outside';

type ExpandDirection = 'rt' | 'rb' | 'lt' | 'lb';

function computeExpandedPosition(
  rect: DOMRect,
  direction: ExpandDirection,
  targetW: number,
  targetH: number
) {
  switch (direction) {
    case 'rb': return { x: rect.left, y: rect.top };

    case 'rt': return { x: rect.left, y: rect.top + rect.height - targetH };

    case 'lb': return { x: rect.left + rect.width - targetW, y: rect.top };

    case 'lt': return { x: rect.left + rect.width - targetW, y: rect.top + rect.height - targetH };
  }
}

function parseDimension(value: number | string): number {
  return typeof value === 'number' ? value : parseFloat(value);
}

type AwesomeCardContextValue = {
  collapsible: boolean;
  isCollapsed: boolean;
  toggle: () => void;
  chevronPosition: 'left' | 'right';
  expandable: boolean;
  isExpanded: boolean;
  toggleExpand: () => void;
  expandTrigger: 'hover' | 'click';
  registerBodyRef: (el: HTMLDivElement | null) => void;
  registerExpandedBodyRef: (el: HTMLDivElement | null) => void;
};

const AwesomeCardContext = createContext<AwesomeCardContextValue>({
  collapsible: false,
  isCollapsed: false,
  toggle: () => {},
  chevronPosition: 'left',
  expandable: false,
  isExpanded: false,
  toggleExpand: () => {},
  expandTrigger: 'click',
  registerBodyRef: () => {},
  registerExpandedBodyRef: () => {}
});

function useAwesomeCard() {
  return useContext(AwesomeCardContext);
}

function AwesomeCard({
  className,
  children,
  pattern = true,
  patternStyle = 'stripes',
  collapsible = false,
  collapsed: collapsedProp,
  chevronPosition = 'left',
  expandable = false,
  expandTrigger = 'click',
  expandDirection = 'rb',
  expandedWidth = 480,
  expandedHeight = 320,
  expanded: expandedProp,
  onExpandedChange,
  expandSpeed = 0.35
}: {
  className?: string;
  children?: ReactNode;
  pattern?: boolean;
  patternStyle?: PatternStyle;
  collapsible?: boolean;
  collapsed?: boolean;
  chevronPosition?: 'left' | 'right';
  expandable?: boolean;
  expandTrigger?: 'hover' | 'click';
  expandDirection?: ExpandDirection;
  expandedWidth?: number | string;
  expandedHeight?: number | string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  expandSpeed?: number;
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(collapsedProp ?? false);
  const isCollapsed = collapsible ? internalCollapsed : false;

  const toggleCollapse = useCallback(() => {
    if (collapsible) {
      setInternalCollapsed(prev => !prev);
    }
  }, [collapsible]);

  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = expandable ? (expandedProp !== undefined ? expandedProp : internalExpanded) : false;

  const setExpanded = useCallback((value: boolean) => {
    if (expandedProp === undefined) {
      setInternalExpanded(value);
    }
    onExpandedChange?.(value);
  }, [expandedProp, onExpandedChange]);

  const toggleExpand = useCallback(() => {
    if (expandable) {
      setExpanded(!isExpanded);
    }
  }, [expandable, isExpanded, setExpanded]);

  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const expandedBodyRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const originalRectRef = useRef<DOMRect | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [placeholderSize, setPlaceholderSize] = useState<{ w: number; h: number } | null>(null);

  const registerBodyRef = useCallback((el: HTMLDivElement | null) => {
    bodyRef.current = el;
  }, []);

  const registerExpandedBodyRef = useCallback((el: HTMLDivElement | null) => {
    expandedBodyRef.current = el;
  }, []);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);

    mq.addEventListener('change', handler);

    return () => mq.removeEventListener('change', handler);
  }, []);

  useClickOutside(cardRef, () => {
    if (isExpanded && expandTrigger === 'click') {
      setExpanded(false);
    }
  });

  useEffect(() => {
    if (!expandable || !isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandable, isExpanded, setExpanded]);

  useEffect(() => {
    if (!isExpanded) return;
    const handleResize = () => setExpanded(false);

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded, setExpanded]);

  const handleMouseEnter = useCallback(() => {
    if (!expandable || expandTrigger !== 'hover') return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setExpanded(true), 150);
  }, [expandable, expandTrigger, setExpanded]);

  const handleMouseLeave = useCallback(() => {
    if (!expandable || expandTrigger !== 'hover') return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setExpanded(false), 300);
  }, [expandable, expandTrigger, setExpanded]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!expandable) return;

    const card = cardRef.current;
    const body = bodyRef.current;
    const expandedBody = expandedBodyRef.current;

    if (!card) return;

    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    const targetW = parseDimension(expandedWidth);
    const targetH = parseDimension(expandedHeight);

    if (isExpanded) {
      const rect = card.getBoundingClientRect();

      originalRectRef.current = rect;
      setPlaceholderSize({ w: rect.width, h: rect.height });

      const targetPos = computeExpandedPosition(rect, expandDirection, targetW, targetH);

      if (prefersReducedMotion) {
        gsap.set(card, {
          position: 'fixed',
          left: targetPos.x,
          top: targetPos.y,
          width: targetW,
          height: targetH,
          zIndex: 50,
          overflow: 'visible',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        });
        if (body) gsap.set(body, { opacity: 0 });
        if (expandedBody) gsap.set(expandedBody, { opacity: 1 });

        return;
      }

      gsap.set(card, {
        position: 'fixed',
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        zIndex: 50,
        overflow: 'visible'
      });

      if (expandedBody) gsap.set(expandedBody, { opacity: 0 });

      const tl = gsap.timeline();

      tl.to(card, {
        left: targetPos.x,
        top: targetPos.y,
        width: targetW,
        height: targetH,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        duration: expandSpeed,
        ease: 'power2.out'
      }, 0);

      if (body) {
        tl.to(body, {
          opacity: 0,
          duration: expandSpeed * 0.5,
          ease: 'power1.in'
        }, 0);
      }

      if (expandedBody) {
        tl.to(expandedBody, {
          opacity: 1,
          duration: expandSpeed * 0.5,
          ease: 'power1.out'
        }, expandSpeed * 0.4);
      }

      timelineRef.current = tl;
    } else if (originalRectRef.current) {
      const rect = originalRectRef.current;

      if (prefersReducedMotion) {
        gsap.set(card, {
          clearProps: 'position,left,top,width,height,zIndex,boxShadow,overflow'
        });
        if (body) gsap.set(body, { opacity: 1 });
        if (expandedBody) gsap.set(expandedBody, { opacity: 0 });
        originalRectRef.current = null;
        setPlaceholderSize(null);

        return;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(card, {
            clearProps: 'position,left,top,width,height,zIndex,boxShadow,overflow'
          });
          if (body) gsap.set(body, { clearProps: 'opacity' });
          if (expandedBody) gsap.set(expandedBody, { opacity: 0 });
          originalRectRef.current = null;
          setPlaceholderSize(null);
        }
      });

      if (expandedBody) {
        tl.to(expandedBody, {
          opacity: 0,
          duration: expandSpeed * 0.4,
          ease: 'power1.in'
        }, 0);
      }

      if (body) {
        tl.to(body, {
          opacity: 1,
          duration: expandSpeed * 0.5,
          ease: 'power1.out'
        }, expandSpeed * 0.3);
      }

      tl.to(card, {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
        duration: expandSpeed,
        ease: 'power2.inOut'
      }, 0);

      timelineRef.current = tl;
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
    };
  }, [
    expandable,
    isExpanded,
    expandDirection,
    expandedWidth,
    expandedHeight,
    expandSpeed,
    prefersReducedMotion
  ]);

  return (
    <AwesomeCardContext.Provider value={{
      collapsible,
      isCollapsed,
      toggle: toggleCollapse,
      chevronPosition,
      expandable,
      isExpanded,
      toggleExpand,
      expandTrigger,
      registerBodyRef,
      registerExpandedBodyRef
    }}>
      {/* Placeholder to maintain layout space when card is fixed */}
      {placeholderSize && (
        <div
          aria-hidden="true"
          style={{ width: placeholderSize.w, height: placeholderSize.h }} />
      )}
      <div
        ref={cardRef}
        data-slot="awesome-card"
        data-collapsed={isCollapsed || undefined}
        data-expanded={isExpanded || undefined}
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-xl border hover:border-card-foreground/30 bg-muted/50 text-card-foreground shadow-sm p-1.5',
          className
        )}
        style={pattern ? getPatternStyle(patternStyle) : undefined}
        onMouseEnter={expandable && expandTrigger === 'hover' ? handleMouseEnter : undefined}
        onMouseLeave={expandable && expandTrigger === 'hover' ? handleMouseLeave : undefined}>
        {children}
      </div>
    </AwesomeCardContext.Provider>
  );
}

function AwesomeCardHeader({
  className,
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  const {
    collapsible, isCollapsed, toggle, chevronPosition,
    expandable, isExpanded, toggleExpand, expandTrigger
  } = useAwesomeCard();

  const content = (
    <>
      <div className="pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex w-full items-center justify-between">
        {collapsible && chevronPosition === 'left' && (
          <ChevronRight
            className={cn(
              'mr-1.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200',
              !isCollapsed && 'rotate-90'
            )} />
        )}
        <div className="flex flex-1 items-center justify-between">
          {children}
        </div>
        {collapsible && chevronPosition === 'right' && (
          <ChevronRight
            className={cn(
              'ml-1.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200',
              !isCollapsed && 'rotate-90'
            )} />
        )}
        {expandable && expandTrigger === 'click' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
            className={cn(
              'ml-1.5 flex size-6 shrink-0 items-center justify-center rounded-md',
              'text-muted-foreground/60 hover:text-foreground hover:bg-muted',
              'transition-colors duration-150'
            )}
            aria-label={isExpanded ? 'Collapse card' : 'Expand card'}>
            {isExpanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
        )}
      </div>
    </>
  );

  if (collapsible) {
    return (
      <button
        type="button"
        data-slot="awesome-card-header"
        className={cn(
          'relative flex w-full cursor-pointer items-center justify-between px-2 pb-0 pt-1 text-left',
          className
        )}
        onClick={toggle}>
        {content}
      </button>
    );
  }

  return (
    <div
      data-slot="awesome-card-header"
      className={cn(
        'relative flex items-center justify-between px-2 pb-0 pt-1',
        className
      )}>
      {content}
    </div>
  );
}

function AwesomeCardTitle({
  className,
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-slot="awesome-card-title"
      className={cn('text-base font-normal text-muted-foreground group-hover:text-foreground', className)}>
      {children}
    </div>
  );
}

function AwesomeCardIcon({
  className,
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-slot="awesome-card-icon"
      className={cn('text-muted-foreground/60', className)}>
      {children}
    </div>
  );
}

function AwesomeCardBody({
  className,
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  const { isCollapsed, registerBodyRef } = useAwesomeCard();
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerBodyRef(innerRef.current);

    return () => registerBodyRef(null);
  }, [registerBodyRef]);

  return (
    <div
      className={cn(
        'grid min-h-0 flex-1 transition-[grid-template-rows] duration-200 ease-in-out',
        isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
      )}>
      <div className="flex min-h-0 flex-col overflow-hidden">
        <div className="mt-2 flex min-h-0 flex-1 flex-col px-0 pb-0">
          <div
            ref={innerRef}
            data-slot="awesome-card-body"
            className={cn(
              'flex-1 rounded-lg border bg-card px-5 py-4',
              className
            )}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function AwesomeCardExpandedBody({
  className,
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  const { registerExpandedBodyRef } = useAwesomeCard();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerExpandedBodyRef(ref.current);

    return () => registerExpandedBodyRef(null);
  }, [registerExpandedBodyRef]);

  return (
    <div
      ref={ref}
      data-slot="awesome-card-expanded-body"
      className={cn(
        'absolute inset-x-0 bottom-0 top-8 mt-2 rounded-lg border bg-card px-5 py-4 overflow-auto',
        className
      )}
      style={{ opacity: 0 }}>
      {children}
    </div>
  );
}

function AwesomeCardValue({
  className,
  children
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-slot="awesome-card-value"
      className={cn(
        'text-3xl font-bold tracking-tight tabular-nums text-foreground',
        className
      )}>
      {children}
    </div>
  );
}

function AwesomeCardTrend({
  className,
  positive,
  children
}: {
  className?: string;
  positive?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      data-slot="awesome-card-trend"
      className={cn('mt-1 flex items-center gap-1.5 text-sm', className)}>
      {positive !== undefined && (
        <span
          className={cn(
            'font-semibold',
            positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          )}>
          {children}
        </span>
      )}
      {positive === undefined && (
        <span className="text-muted-foreground">{children}</span>
      )}
    </div>
  );
}

export {
  AwesomeCard,
  AwesomeCardHeader,
  AwesomeCardTitle,
  AwesomeCardIcon,
  AwesomeCardBody,
  AwesomeCardExpandedBody,
  AwesomeCardValue,
  AwesomeCardTrend
};

export type { ExpandDirection, PatternStyle };