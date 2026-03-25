'use client';

import { forwardRef, useState } from 'react';

import { Share2Icon } from 'lucide-react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage
} from '@/components/ui/avatar';

import { Button } from '@/components/ui/button';

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

import { TooltipProvider } from '@/components/ui/tooltip';

import { tUi } from '@/lib/ui-i18n';

import { RecordSharingPanel } from './record-sharing-panel';
import { type RecordSharingButtonProps } from './types';

const recordSharingButtonVariants = cva('', {
  variants: {
    variant: {
      button: '',
      'avatar-group': ''
    },
    size: {
      sm: '',
      default: '',
      lg: ''
    }
  },
  defaultVariants: {
    variant: 'button',
    size: 'default'
  }
});

const RecordSharingButton = forwardRef<HTMLDivElement, RecordSharingButtonProps>(
  ({
    variant = 'button',
    size = 'default',
    maxAvatars = 3,
    align = 'end',
    side = 'bottom',
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    disabled = false,
    triggerClassName,
    className,
    sharedEntities,
    ...panelProps
  }, ref) => {
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;

    const handleOpenChange = (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }

      controlledOnOpenChange?.(nextOpen);
    };

    const { locale } = panelProps;

    const trigger = variant === 'avatar-group' ? (
      <button
        type="button"
        disabled={disabled}
        className={cn(
          'cursor-pointer transition-opacity disabled:cursor-not-allowed disabled:opacity-50',
          triggerClassName
        )}>
        <AvatarGroup>
          {sharedEntities.slice(0, maxAvatars).map(entity => (
            <Avatar key={entity.id} size="sm">
              {entity.avatarUrl && (
                <AvatarImage src={entity.avatarUrl} alt={entity.name} />
              )}
              <AvatarFallback>
                {entity.initials ?? entity.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {sharedEntities.length > maxAvatars && (
            <AvatarGroupCount>
              +{sharedEntities.length - maxAvatars}
            </AvatarGroupCount>
          )}
          {sharedEntities.length === 0 && (
            <Avatar size="sm">
              <AvatarFallback>
                <Share2Icon className="size-3" />
              </AvatarFallback>
            </Avatar>
          )}
        </AvatarGroup>
      </button>
    ) : (
      <Button
        variant="outline"
        size={size}
        disabled={disabled}
        className={cn('gap-2', triggerClassName)}>
        <Share2Icon className="size-4" />
        {tUi(locale, 'rsShare')}
      </Button>
    );

    return (
      <TooltipProvider>
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <div ref={ref} className={cn(recordSharingButtonVariants({ variant, size }), className)}>
            <PopoverTrigger asChild>
              {trigger}
            </PopoverTrigger>
          </div>
          <PopoverContent
            align={align}
            side={side}
            className="w-105 max-w-[calc(100vw-1.5rem)] p-4">
            <RecordSharingPanel
              sharedEntities={sharedEntities}
              {...panelProps} />
          </PopoverContent>
        </Popover>
      </TooltipProvider>
    );
  }
);

RecordSharingButton.displayName = 'RecordSharingButton';

export { RecordSharingButton, recordSharingButtonVariants };