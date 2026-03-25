'use client';

import { useEffect, useRef } from 'react';

import {
  Maximize2, Minimize2, Minus, X
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { AvatarThumbnail } from '@/components/docyrus/avatar-thumbnail';
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon';

import { type AwesomeDialogHeaderProps } from './types';

import { useAwesomeDialog } from './contexts/dialog-context';
import { useOptionalGlobalDialog } from './contexts/global-dialog-context';

export function AwesomeDialogHeader({
  children,
  className,
  title,
  description,
  icon,
  iconLib,
  avatar,
  closable = true,
  headerButtons,
  onClose
}: AwesomeDialogHeaderProps) {
  const {
    fullscreenable,
    isFullscreen,
    toggleFullscreen,
    minimizable,
    onClose: contextOnClose,
    dialogId
  } = useAwesomeDialog();

  const globalDialog = useOptionalGlobalDialog();
  const globalDialogRef = useRef(globalDialog);

  globalDialogRef.current = globalDialog;

  const handleClose = onClose ?? contextOnClose;

  useEffect(() => {
    if (!dialogId || !globalDialogRef.current) return;
    if (!title && !icon) return;
    globalDialogRef.current.register(dialogId, { title, icon });
  }, [dialogId, title, icon]);

  const canMinimize = minimizable && dialogId && globalDialog;
  const handleMinimize = canMinimize ? () => globalDialog.minimize(dialogId) : undefined;

  return (
    <div
      data-slot="awesome-dialog-header"
      className={cn(
        'flex shrink-0 items-center gap-3 border-b bg-muted/50 px-4 py-3',
        className
      )}>
      {avatar && (
        <AvatarThumbnail
          color={avatar.color}
          icon={avatar.icon}
          image={avatar.image ? { signed_url: avatar.image } : undefined}
          size={8}
          shape="rounded" />
      )}

      {icon && (
        <DocyrusIcon
          icon={icon}
          lib={iconLib}
          size="default"
          className="text-muted-foreground" />
      )}

      {(title || description) && (
        <div className="flex min-w-0 flex-1 flex-col">
          {title && (
            <div
              data-slot="awesome-dialog-title"
              className="truncate text-base font-medium text-foreground">
              {title}
            </div>
          )}
          {description && (
            <div
              data-slot="awesome-dialog-description"
              className="truncate text-sm text-muted-foreground">
              {description}
            </div>
          )}
        </div>
      )}

      {children && !title && (
        <div className="flex min-w-0 flex-1 items-center">{children}</div>
      )}

      {!children && !title && <div className="flex-1" />}

      <div className="flex shrink-0 items-center gap-1">
        {headerButtons}

        {fullscreenable && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Restore' : 'Maximize'}>
            {isFullscreen ? <Minimize2 /> : <Maximize2 />}
          </Button>
        )}

        {handleMinimize && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleMinimize}
            aria-label="Minimize">
            <Minus />
          </Button>
        )}

        {closable && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClose}
            aria-label="Close">
            <X />
          </Button>
        )}
      </div>
    </div>
  );
}