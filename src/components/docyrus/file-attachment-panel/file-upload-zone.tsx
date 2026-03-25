import {
  type DragEvent, useCallback, useRef, useState
} from 'react';

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon';
import { Button } from '@/components/ui/button';

interface FileUploadZoneProps {
  accept?: string;
  maxFileSize?: number;
  onFilesSelected: (files: Array<File>) => void;
}

export function FileUploadZone({
  accept,
  maxFileSize,
  onFilesSelected
}: FileUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const files = Array.from(fileList);
      const valid = maxFileSize ? files.filter(f => f.size <= maxFileSize) : files;

      if (valid.length > 0) {
        onFilesSelected(valid);
      }
    },
    [maxFileSize, onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/40'
      }`}>
      <DocyrusIcon
        icon="fal cloud-arrow-up"
        className={`size-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground/50'}`} />
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Drag & drop files here, or{' '}
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-sm"
            onClick={() => inputRef.current?.click()}>
            browse
          </Button>
        </p>
        {maxFileSize && (
          <p className="mt-0.5 text-xs text-muted-foreground/70">
            Max file size: {Math.round(maxFileSize / (1024 * 1024))} MB
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
            e.target.value = '';
          }
        }} />
    </div>
  );
}