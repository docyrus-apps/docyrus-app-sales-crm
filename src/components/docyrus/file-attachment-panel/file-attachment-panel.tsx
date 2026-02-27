'use client';

import {
  useCallback, useMemo, useRef, useState
} from 'react';

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon';

import { DeleteConfirmDialog } from '@/components/docyrus/delete-confirm-dialog';

import { Button } from '@/components/ui/button';

import { ScrollArea } from '@/components/ui/scroll-area';

import { Separator } from '@/components/ui/separator';

import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';

import { type FileAttachmentPanelProps, type UploadingFile, type ViewMode } from './types';

import { FileEmptyState } from './file-empty-state';
import { FileGrid } from './file-grid';
import { FileList } from './file-list';
import { FileSourceMenu } from './file-source-menu';
import { FileUploadProgress } from './file-upload-progress';
import { FileUploadZone } from './file-upload-zone';

import { type DocyrusFile } from './lib/file-utils';
import { useDisclosure } from './hooks/use-disclosure';

import { useGoogleDrivePicker } from './hooks/use-google-drive-picker';
import { useOneDrivePicker } from './hooks/use-onedrive-picker';
import { isImageFile } from './lib/file-utils';

const MAX_FILE_SIZE_DEFAULT = 50 * 1024 * 1024; // 50 MB

export function FileAttachmentPanel({
  files,
  title = 'Attachments',
  editable = true,
  isLoading = false,
  maxHeight = 560,
  maxFileSize = MAX_FILE_SIZE_DEFAULT,
  accept,
  maxFiles,
  onUploadFile,
  onDeleteFile,
  onInsertExternalFiles,
  onFileOpen,
  isDeletePending = false,
  className
}: FileAttachmentPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [uploadingFiles, setUploadingFiles] = useState<Array<UploadingFile>>([]);
  const [fileToDelete, setFileToDelete] = useState<DocyrusFile | null>(null);
  const deleteDialog = useDisclosure();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const oneDrive = useOneDrivePicker();
  const googleDrive = useGoogleDrivePicker();

  const hasImages = useMemo(
    () => files?.some(f => isImageFile(f.file_type)) ?? false,
    [files]
  );

  const handleFileOpen = useCallback(
    (file: DocyrusFile) => {
      if (onFileOpen) {
        onFileOpen(file);
      } else if (file.signed_url) {
        window.open(file.signed_url, '_blank', 'noopener,noreferrer');
      }
    },
    [onFileOpen]
  );

  const handleDeleteClick = useCallback(
    (file: DocyrusFile) => {
      setFileToDelete(file);
      deleteDialog.onOpen();
    },
    [deleteDialog]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!fileToDelete) return;
    await onDeleteFile?.(fileToDelete.id);
    deleteDialog.onClose();
    setFileToDelete(null);
  }, [fileToDelete, onDeleteFile, deleteDialog]);

  const processUpload = useCallback(
    async (file: File) => {
      const uploadId = crypto.randomUUID();

      setUploadingFiles(prev => [
        ...prev,
        {
          id: uploadId, file, progress: 0, status: 'uploading'
        }
      ]);

      try {
        setUploadingFiles(prev => prev.map(uf => (uf.id === uploadId ? { ...uf, progress: 50 } : uf)));
        await onUploadFile?.(file);
        setUploadingFiles(prev => prev.map(uf => uf.id === uploadId
          ? { ...uf, progress: 100, status: 'complete' }
          : uf));
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(uf => uf.id !== uploadId));
        }, 1500);
      } catch {
        setUploadingFiles(prev => prev.map(uf => uf.id === uploadId
          ? { ...uf, status: 'error', error: 'Upload failed' }
          : uf));
      }
    },
    [onUploadFile]
  );

  const handleFilesSelected = useCallback(
    (selectedFiles: Array<File>) => {
      if (maxFiles && files) {
        const remaining = maxFiles - files.length;

        if (remaining <= 0) {
          return;
        }
        selectedFiles = selectedFiles.slice(0, remaining);
      }
      for (const file of selectedFiles) {
        void processUpload(file);
      }
    },
    [maxFiles, files, processUpload]
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleOneDriveClick = useCallback(async () => {
    const files = await oneDrive.openPicker();

    if (files.length > 0) {
      await onInsertExternalFiles?.(files);
    }
  }, [oneDrive, onInsertExternalFiles]);

  const handleGoogleDriveClick = useCallback(async () => {
    const files = await googleDrive.openPicker();

    if (files.length > 0) {
      await onInsertExternalFiles?.(files);
    }
  }, [googleDrive, onInsertExternalFiles]);

  const resolvedHeight = maxHeight
    ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight)
    : undefined;

  const renderLoading = () => (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-4 px-1 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="inline-block size-5 animate-spin rounded-full border-2 border-border border-t-foreground/70" />
        <span>Loading files…</span>
      </div>
      <div className="w-full max-w-3xl space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-32 w-full rounded-lg border border-dashed border-border/60" />
      </div>
    </div>
  );

  return (
    <div
      className={cn('@container/file-panel flex flex-col min-h-0 overflow-hidden', className)}
      style={
        resolvedHeight ? {
          maxHeight: resolvedHeight
        } : undefined
      }>
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{title}</h3>
          {files && files.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({files.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasImages && (
            <div className="flex items-center">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="size-7"
                onClick={() => setViewMode('list')}>
                <DocyrusIcon icon="far list" className="size-3.5" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="size-7"
                onClick={() => setViewMode('grid')}>
                <DocyrusIcon icon="far grid-2" className="size-3.5" />
              </Button>
            </div>
          )}
          {editable && (
            <FileSourceMenu
              onUploadClick={handleUploadClick}
              onOneDriveClick={handleOneDriveClick}
              onGoogleDriveClick={handleGoogleDriveClick}
              showOneDrive={oneDrive.isAvailable}
              showGoogleDrive={googleDrive.isAvailable} />
          )}
        </div>
      </div>

      <Separator className="my-2" />

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        {isLoading ? (
          renderLoading()
        ) : !files || files.length === 0 ? (
          editable ? (
            <FileUploadZone
              accept={accept}
              maxFileSize={maxFileSize}
              onFilesSelected={handleFilesSelected} />
          ) : (
            <FileEmptyState editable={false} />
          )
        ) : (
          <div className="flex flex-col gap-2">
            {viewMode === 'grid' && hasImages ? (
              <FileGrid
                files={files}
                editable={editable}
                onOpen={handleFileOpen}
                onDelete={handleDeleteClick} />
            ) : (
              <FileList
                files={files}
                editable={editable}
                onOpen={handleFileOpen}
                onDelete={handleDeleteClick} />
            )}

            {editable && (
              <FileUploadZone
                accept={accept}
                maxFileSize={maxFileSize}
                onFilesSelected={handleFilesSelected} />
            )}
          </div>
        )}

        {/* Upload progress */}
        {uploadingFiles.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5">
            {uploadingFiles.map(uf => (
              <FileUploadProgress key={uf.id} file={uf} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Hidden file input for source menu */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(Array.from(e.target.files));
            e.target.value = '';
          }
        }} />

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.onClose}
        objectName="file"
        count={1}
        onConfirm={handleDeleteConfirm}
        isPending={isDeletePending} />
    </div>
  );
}