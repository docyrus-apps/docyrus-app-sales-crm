'use client';

// @ts-nocheck
/* eslint-disable */
export { AwesomeDialog } from './awesome-dialog';
export { AwesomeDialogHeader } from './awesome-dialog-header';
export { AwesomeDialogBody } from './awesome-dialog-body';
export { AwesomeDialogFooter } from './awesome-dialog-footer';
export { AwesomeDialogToolbar } from './awesome-dialog-toolbar';
export { AwesomeDialogContent } from './awesome-dialog-content';

export { GlobalDialogProvider } from './contexts/global-dialog-context';

export { GlobalDialogBar } from './global-dialog-bar';

export type {
  AwesomeDialogProps,
  AwesomeDialogHeaderProps,
  AwesomeDialogBodyProps,
  AwesomeDialogFooterProps,
  AwesomeDialogToolbarProps,
  DialogContainer,
  DialogSide,
  DialogSize,
  DialogState,
  GlobalDialogContextValue,
  GlobalDialogProviderProps,
  ToolbarMenuItem,
  ToolbarMenuAction
} from './types';

export { useGlobalDialog, useOptionalGlobalDialog } from './contexts/global-dialog-context';
export { useAwesomeDialog } from './contexts/dialog-context';