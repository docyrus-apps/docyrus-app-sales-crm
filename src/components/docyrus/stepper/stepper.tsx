'use client';

import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useMemo,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode
} from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import { StepConnector } from './step-connector';
import { type StepProps } from './step';

export type StepperVariant = 'default' | 'outline' | 'dots' | 'dashed' | 'gradient' | 'minimal';
export type StepperSize = 'sm' | 'default' | 'lg';
export type StepperOrientation = 'horizontal' | 'vertical';

export interface StepperContextValue {
  activeStep: number;
  orientation: StepperOrientation;
  variant: StepperVariant;
  size: StepperSize;
  nonLinear: boolean;
  alternativeLabel: boolean;
  onStepClick?: (index: number) => void;
  totalSteps: number;
}

const StepperContext = createContext<StepperContextValue | null>(null);

export function useStepperContext() {
  const ctx = useContext(StepperContext);

  if (!ctx) throw new Error('useStepperContext must be used within <Stepper>');

  return ctx;
}

const stepperVariants = cva('flex w-full', {
  variants: {
    variant: {
      default: '',
      outline: '',
      dots: '',
      dashed: '',
      gradient: '',
      minimal: ''
    },
    size: {
      sm: '',
      default: '',
      lg: ''
    },
    orientation: {
      horizontal: 'flex-row items-start',
      vertical: 'flex-col'
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    orientation: 'horizontal'
  }
});

export interface StepperProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
  VariantProps<typeof stepperVariants> {
  activeStep?: number;
  nonLinear?: boolean;
  alternativeLabel?: boolean;
  onStepClick?: (index: number) => void;
  connector?: ReactNode;
  children: ReactNode;
}

const Stepper = forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      orientation = 'horizontal',
      activeStep = 0,
      nonLinear = false,
      alternativeLabel = false,
      onStepClick,
      connector,
      children,
      ...props
    },
    ref
  ) => {
    const steps = Children.toArray(children).filter(isValidElement) as ReactElement<StepProps>[];
    const totalSteps = steps.length;

    const contextValue = useMemo<StepperContextValue>(() => ({
      activeStep,
      orientation: orientation ?? 'horizontal',
      variant: variant ?? 'default',
      size: size ?? 'default',
      nonLinear,
      alternativeLabel,
      onStepClick,
      totalSteps
    }), [
      activeStep,
      orientation,
      variant,
      size,
      nonLinear,
      alternativeLabel,
      onStepClick,
      totalSteps
    ]);

    const makeConnector = (completed: boolean) => {
      if (connector && isValidElement(connector)) {
        return cloneElement(connector, { _completed: completed } as Record<string, unknown>);
      }

      return <StepConnector _completed={completed} />;
    };

    return (
      <StepperContext value={contextValue}>
        <div
          ref={ref}
          className={cn(stepperVariants({
            variant, size, orientation, className
          }))}
          role="group"
          aria-label="Progress"
          {...props}>
          {steps.map((step, index) => {
            const isLast = index === totalSteps - 1;
            const stepCompleted = index < activeStep;
            const conn = !isLast ? makeConnector(stepCompleted) : null;

            return (
              <div
                key={`step-${index}`}
                className={cn(
                  'flex',
                  orientation === 'horizontal' ? cn('flex-1 items-start', alternativeLabel && 'flex-col items-center') : 'flex-col'
                )}>
                <div
                  className={cn(
                    'flex',
                    orientation === 'horizontal' && !alternativeLabel && 'flex-1 items-center',
                    orientation === 'horizontal' && alternativeLabel && 'w-full flex-col items-center',
                    orientation === 'vertical' && 'items-start gap-3'
                  )}>
                  {cloneElement(step, { _index: index } as Partial<StepProps>)}
                  {conn && orientation === 'horizontal' && !alternativeLabel && (
                    <div className="mx-2 flex-1">
                      {conn}
                    </div>
                  )}
                </div>
                {conn && orientation === 'horizontal' && alternativeLabel && (
                  <div className="mt-2 w-full px-4">
                    {conn}
                  </div>
                )}
                {conn && orientation === 'vertical' && (
                  <div className="ml-4 py-1" style={size === 'sm' ? { marginLeft: 12 } : size === 'lg' ? { marginLeft: 20 } : { marginLeft: 16 }}>
                    <div className="flex gap-3">
                      <div className="flex justify-center" style={{ width: 2 }}>
                        {conn}
                      </div>
                      {step.props.children && (
                        <div className="flex-1 pb-4">
                          {step.props.children}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </StepperContext>
    );
  }
);

Stepper.displayName = 'Stepper';

export { Stepper, stepperVariants };