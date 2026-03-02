import { DocyrusIcon } from '@/components/docyrus/docyrus-icon';

interface FileEmptyStateProps {
  editable: boolean;
}

export function FileEmptyState({ editable }: FileEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <DocyrusIcon
        icon="fal file-circle-plus"
        className="size-8 text-muted-foreground/50" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          No files attached
        </p>
        <p className="text-xs text-muted-foreground/70">
          {editable
            ? 'Drop files here or use the add button above'
            : 'No files have been attached yet'}
        </p>
      </div>
    </div>
  );
}