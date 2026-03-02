'use client';

import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode
} from 'react';

import { AnimatePresence, motion } from 'motion/react';

import { cn } from '@/lib/utils';

import { useStepperContext } from './stepper';

export type StepStatus = 'wait' | 'process' | 'finish' | 'error';

export interface StepProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  status?: StepStatus;
  icon?: ReactNode;
  label?: ReactNode;
  description?: ReactNode;
  optional?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  /** @internal — injected by Stepper */
  _index?: number;
}

const indicatorSizeMap = {
  sm: 'h-6 w-6 text-xs',
  default: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base'
} as const;

const dotSizeMap = {
  sm: 'h-2 w-2',
  default: 'h-2.5 w-2.5',
  lg: 'h-3 w-3'
} as const;

const dotActiveSizeMap = {
  sm: 'h-3 w-3',
  default: 'h-3.5 w-3.5',
  lg: 'h-4 w-4'
} as const;

const iconSizeMap = {
  sm: 12,
  default: 16,
  lg: 20
} as const;

function CheckIcon({ size }: { size: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round">
      <motion.path
        d="M5 13l4 4L19 7"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }} />
    </motion.svg>
  );
}

function ErrorIcon({ size }: { size: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round">
      <motion.path
        d="M18 6L6 18"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }} />
      <motion.path
        d="M6 6l12 12"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut', delay: 0.1 }} />
    </motion.svg>
  );
}

function StepIndicator({
  status,
  index,
  icon,
  variant,
  size
}: {
  status: StepStatus;
  index: number;
  icon?: ReactNode;
  variant: string;
  size: 'sm' | 'default' | 'lg';
}) {
  const iconSize = iconSizeMap[size];

  if (variant === 'minimal') {
    return (
      <AnimatePresence mode="wait">
        {status === 'finish' && (
          <motion.span
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-primary">
            <CheckIcon size={iconSize} />
          </motion.span>
        )}
        {status === 'error' && (
          <motion.span
            key="error"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-destructive">
            <ErrorIcon size={iconSize} />
          </motion.span>
        )}
      </AnimatePresence>
    );
  }

  if (variant === 'dots') {
    const isActive = status === 'process';

    return (
      <motion.div
        animate={{ scale: isActive ? 1.2 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={cn(
          'rounded-full transition-colors duration-200',
          isActive ? dotActiveSizeMap[size] : dotSizeMap[size],
          status === 'wait' && 'bg-muted-foreground/30',
          status === 'process' && 'bg-primary',
          status === 'finish' && 'bg-primary',
          status === 'error' && 'bg-destructive'
        )}>
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/30"
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        )}
      </motion.div>
    );
  }

  const content = icon ?? (
    <AnimatePresence mode="wait">
      {status === 'finish' ? (
        <motion.span
          key="check"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
          <CheckIcon size={iconSize} />
        </motion.span>
      ) : status === 'error' ? (
        <motion.span
          key="error"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
          <ErrorIcon size={iconSize} />
        </motion.span>
      ) : (
        <motion.span
          key="number"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="font-semibold leading-none">
          {index + 1}
        </motion.span>
      )}
    </AnimatePresence>
  );

  const variantClasses = getIndicatorVariantClasses(variant, status);

  return (
    <motion.div
      layout
      initial={false}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'relative z-10 flex shrink-0 items-center justify-center rounded-full font-medium transition-colors duration-200',
        indicatorSizeMap[size],
        variantClasses
      )}>
      {content}
      {status === 'process' && variant !== 'gradient' && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ boxShadow: ['0 0 0 0px var(--color-primary)', '0 0 0 6px transparent'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          style={{ '--color-primary': 'hsl(var(--primary) / 0.3)' } as CSSProperties} />
      )}
      {variant === 'gradient' && status === 'process' && (
        <motion.div
          className="absolute inset-0 rounded-full opacity-80"
          style={{
            background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.6) 50%, hsl(var(--primary)) 100%)',
            backgroundSize: '200% 100%'
          }}
          animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
      )}
    </motion.div>
  );
}

function getIndicatorVariantClasses(variant: string, status: StepStatus): string {
  switch (variant) {
    case 'outline':
      return cn(
        'border-2',
        status === 'wait' && 'border-muted-foreground/30 text-muted-foreground',
        status === 'process' && 'border-primary text-primary',
        status === 'finish' && 'border-primary bg-primary text-primary-foreground',
        status === 'error' && 'border-destructive text-destructive'
      );

    case 'dashed':
      return cn(
        'border-2',
        status === 'wait' && 'border-dashed border-muted-foreground/30 text-muted-foreground',
        status === 'process' && 'border-solid border-primary text-primary',
        status === 'finish' && 'border-solid border-primary bg-primary text-primary-foreground',
        status === 'error' && 'border-solid border-destructive bg-destructive text-destructive-foreground'
      );

    case 'gradient':
      return cn(
        status === 'wait' && 'bg-muted text-muted-foreground',
        status === 'process' && 'bg-primary text-primary-foreground',
        status === 'finish' && 'bg-primary text-primary-foreground',
        status === 'error' && 'bg-destructive text-destructive-foreground'
      );

    default: // 'default'
      return cn(
        status === 'wait' && 'bg-muted text-muted-foreground',
        status === 'process' && 'bg-primary text-primary-foreground',
        status === 'finish' && 'bg-primary text-primary-foreground',
        status === 'error' && 'bg-destructive text-destructive-foreground'
      );
  }
}

const Step = forwardRef<HTMLDivElement, StepProps>(
  (
    {
      className,
      status: statusProp,
      icon,
      label,
      description,
      optional = false,
      disabled = false,
      _index = 0,
      ...props
    },
    ref
  ) => {
    const {
      activeStep,
      orientation,
      variant,
      size,
      nonLinear,
      alternativeLabel,
      onStepClick
    } = useStepperContext();

    const status: StepStatus = statusProp ?? (
      _index < activeStep ? 'finish'
        : _index === activeStep ? 'process' : 'wait'
    );

    const clickable = nonLinear && !disabled && onStepClick;

    const handleClick = () => {
      if (clickable) onStepClick(_index);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (clickable && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onStepClick(_index);
      }
    };

    if (variant === 'minimal') {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center gap-1.5',
            clickable && 'cursor-pointer',
            className
          )}
          role={clickable ? 'button' : undefined}
          tabIndex={clickable ? 0 : undefined}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          {...props}>
          <StepIndicator
            status={status}
            index={_index}
            icon={icon}
            variant={variant}
            size={size} />
          <div className="flex flex-col">
            <span
              className={cn(
                'text-sm font-medium transition-colors duration-200',
                status === 'wait' && 'text-muted-foreground',
                status === 'process' && 'text-foreground',
                status === 'finish' && 'text-foreground',
                status === 'error' && 'text-destructive',
                size === 'sm' && 'text-xs',
                size === 'lg' && 'text-base'
              )}>
              {label}
            </span>
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
            {optional && (
              <span className="text-xs italic text-muted-foreground">Optional</span>
            )}
          </div>
          {status === 'process' && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              layoutId="minimal-underline"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }} />
          )}
        </div>
      );
    }

    if (variant === 'dots') {
      return (
        <div
          ref={ref}
          className={cn(
            'relative flex flex-col items-center gap-2',
            orientation === 'vertical' && 'flex-row',
            clickable && 'cursor-pointer',
            className
          )}
          role={clickable ? 'button' : undefined}
          tabIndex={clickable ? 0 : undefined}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          {...props}>
          <StepIndicator
            status={status}
            index={_index}
            icon={icon}
            variant={variant}
            size={size} />
          {label && (
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'text-xs font-medium transition-colors duration-200',
                  status === 'wait' && 'text-muted-foreground',
                  status === 'process' && 'text-foreground',
                  status === 'finish' && 'text-foreground',
                  status === 'error' && 'text-destructive',
                  size === 'lg' && 'text-sm'
                )}>
                {label}
              </span>
              {description && (
                <span className="text-xs text-muted-foreground">{description}</span>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex shrink-0',
          orientation === 'horizontal' && !alternativeLabel && 'items-center gap-2',
          orientation === 'horizontal' && alternativeLabel && 'flex-col items-center gap-1.5',
          orientation === 'vertical' && 'items-start gap-3',
          clickable && 'cursor-pointer',
          className
        )}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}>
        <StepIndicator
          status={status}
          index={_index}
          icon={icon}
          variant={variant}
          size={size} />
        {(label || description) && (
          <div className={cn('flex flex-col', alternativeLabel && 'items-center text-center')}>
            <span
              className={cn(
                'font-medium leading-tight transition-colors duration-200',
                status === 'wait' && 'text-muted-foreground',
                status === 'process' && 'text-foreground',
                status === 'finish' && 'text-foreground',
                status === 'error' && 'text-destructive',
                size === 'sm' && 'text-xs',
                size === 'default' && 'text-sm',
                size === 'lg' && 'text-base'
              )}>
              {label}
            </span>
            {description && (
              <span
                className={cn(
                  'text-muted-foreground',
                  size === 'sm' && 'text-[10px]',
                  size === 'default' && 'text-xs',
                  size === 'lg' && 'text-sm'
                )}>
                {description}
              </span>
            )}
            {optional && (
              <span className="text-xs italic text-muted-foreground">Optional</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Step.displayName = 'Step';

export { Step };