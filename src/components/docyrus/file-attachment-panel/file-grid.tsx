import { DocyrusIcon } from '@/components/docyrus/docyrus-icon';
import { Button } from '@/components/ui/button';

import { type DocyrusFile } from './lib/file-utils';
import { getSourceIcon } from './lib/file-utils';

interface FileGridProps {
  files: Array<DocyrusFile>;
  editable: boolean;
  onOpen: (file: DocyrusFile) => void;
  onDelete: (file: DocyrusFile) => void;
}

export function FileGrid({
  files, editable, onOpen, onDelete
}: FileGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 @md/file-panel:grid-cols-3 @lg/file-panel:grid-cols-4">
      {files.map((file) => {
        const sourceIcon = getSourceIcon(file.source);

        return (
          <div
            key={file.id}
            className="group relative cursor-pointer overflow-hidden rounded-lg border bg-muted/30"
            onClick={() => onOpen(file)}>
            <div className="aspect-square">
              {file.signed_url ? (
                <img
                  src={file.signed_url}
                  alt={file.file_name}
                  className="size-full object-cover"
                  loading="lazy" />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <DocyrusIcon
                    icon="far file-image"
                    className="size-8 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
              <p className="truncate text-xs font-medium text-white">
                {file.file_name}
              </p>
            </div>
            {sourceIcon && (
              <div className="absolute right-1.5 top-1.5">
                <DocyrusIcon
                  icon={sourceIcon}
                  className="size-3.5 text-white drop-shadow-sm" />
              </div>
            )}
            {editable && (
              <div className="absolute left-1.5 top-1.5 opacity-0 group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="sm"
                  className="size-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(file);
                  }}>
                  <DocyrusIcon icon="far trash" className="size-3" />
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}