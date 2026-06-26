'use client';

// @ts-nocheck
/* eslint-disable */
import { useCallback, useEffect, useRef } from 'react';

import { type AwesomeDialogProps } from './types';

import { AwesomeDialogContent } from './awesome-dialog-content';
import { DrawerContainer } from './containers/drawer-container';
import { ModalContainer } from './containers/modal-container';
import { SheetContainer } from './containers/sheet-container';
import { AwesomeDialogProvider, useAwesomeDialog } from './contexts/dialog-context';
import { useOptionalGlobalDialog } from './contexts/global-dialog-context';

export function AwesomeDialog({
  open,
  onOpenChange,
  children,
  container = 'modal',
  side = 'right',
  size = 'default',
  pattern = true,
  patternStyle = 'stripes',
  resizable = false,
  fullscreenable = false,
  defaultFullscreen = false,
  minimizable = false,
  preventOutsideClose = false,
  dialogId,
  className
}: AwesomeDialogProps) {
  const handleClose = useCallback(() => {
    onOpenChange?.(false);
  }, [onOpenChange]);

  useGlobalRegistration(dialogId, open);

  return (
    <AwesomeDialogProvider
      container={container}
      side={side}
      size={size}
      fullscreenable={fullscreenable}
      defaultFullscreen={defaultFullscreen}
      minimizable={minimizable}
      resizable={resizable}
      onClose={handleClose}
      dialogId={dialogId}>
      <AwesomeDialogInner
        open={open}
        onOpenChange={onOpenChange}
        pattern={pattern}
        patternStyle={patternStyle}
        preventOutsideClose={preventOutsideClose}
        className={className}>
        {children}
      </AwesomeDialogInner>
    </AwesomeDialogProvider>
  );
}

function AwesomeDialogInner({
  open,
  onOpenChange,
  children,
  pattern,
  patternStyle,
  preventOutsideClose,
  className
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: AwesomeDialogProps['children'];
  pattern?: boolean;
  patternStyle?: AwesomeDialogProps['patternStyle'];
  preventOutsideClose?: boolean;
  className?: string;
}) {
  const {
    container,
    side,
    size,
    isFullscreen,
    dialogId
  } = useAwesomeDialog();

  const globalDialog = useOptionalGlobalDialog();
  const isMinimized = dialogId && globalDialog ? globalDialog.isMinimized(dialogId) : false;

  const effectiveOpen = open && !isMinimized;

  const handleOpenChange = useCallback((value: boolean) => {
    if (!value && isMinimized) return;
    onOpenChange?.(value);
  }, [onOpenChange, isMinimized]);

  const content = (
    <AwesomeDialogContent
      pattern={pattern}
      patternStyle={patternStyle}
      isFullscreen={isFullscreen}
      className={className}>
      {children}
    </AwesomeDialogContent>
  );

  switch (container) {
    case 'sheet':
      return (
        <SheetContainer
          open={effectiveOpen}
          onOpenChange={handleOpenChange}
          side={side}
          size={size}
          preventOutsideClose={preventOutsideClose}
          isFullscreen={isFullscreen}>
          {content}
        </SheetContainer>
      );

    case 'drawer':
      return (
        <DrawerContainer
          open={effectiveOpen}
          onOpenChange={handleOpenChange}
          side={side}
          size={size}
          preventOutsideClose={preventOutsideClose}>
          {content}
        </DrawerContainer>
      );

    default:
      return (
        <ModalContainer
          open={effectiveOpen}
          onOpenChange={handleOpenChange}
          size={size}
          preventOutsideClose={preventOutsideClose}
          isFullscreen={isFullscreen}>
          {content}
        </ModalContainer>
      );
  }
}

function useGlobalRegistration(dialogId: string | undefined, open: boolean | undefined) {
  const globalDialog = useOptionalGlobalDialog();
  const globalDialogRef = useRef(globalDialog);

  globalDialogRef.current = globalDialog;

  useEffect(() => {
    if (!dialogId || !globalDialogRef.current) return;

    if (open) {
      globalDialogRef.current.register(dialogId, {});
    } else {
      globalDialogRef.current.unregister(dialogId);
    }

    return () => {
      globalDialogRef.current?.unregister(dialogId);
    };
  }, [dialogId, open]);
}