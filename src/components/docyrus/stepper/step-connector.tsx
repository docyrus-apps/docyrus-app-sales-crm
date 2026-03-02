'use client';

import { forwardRef, type HTMLAttributes } from 'react';

import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

import { useStepperContext } from './stepper';

export interface StepConnectorProps extends HTMLAttributes<HTMLDivElement> {
  animated?: boolean;
  /** @internal — injected by Stepper */
  _completed?: boolean;
}

const StepConnector = forwardRef<HTMLDivElement, StepConnectorProps>(
  ({
    className, animated = true, _completed = false, ...props
  }, ref) => {
    const { orientation, variant } = useStepperContext();
    const isVertical = orientation === 'vertical';
    const isDashed = variant === 'dashed';

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          isVertical ? 'h-8 w-0.5' : 'h-0.5 w-full',
          'bg-muted-foreground/20',
          isDashed && 'bg-transparent',
          className
        )}
        {...props}>
        {isDashed && (
          <div
            className={cn(
              'absolute inset-0',
              isVertical
                ? 'border-l-2 border-dashed border-muted-foreground/30'
                : 'border-t-2 border-dashed border-muted-foreground/30'
            )} />
        )}
        {animated && (
          <motion.div
            className={cn(
              'absolute bg-primary',
              isVertical ? 'left-0 top-0 w-full' : 'left-0 top-0 h-full',
              isDashed && (isVertical
                ? 'border-l-2 border-solid border-primary bg-transparent'
                : 'border-t-2 border-solid border-primary bg-transparent')
            )}
            initial={false}
            animate={
              isVertical
                ? { height: _completed ? '100%' : 0 }
                : { width: _completed ? '100%' : 0 }
            }
            transition={{ duration: 0.4, ease: 'easeInOut' }} />
        )}
      </div>
    );
  }
);

StepConnector.displayName = 'StepConnector';

export { StepConnector };