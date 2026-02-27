import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { Button } from '@/components/animate-ui/components/buttons/button'

import { type DocyrusFile } from './lib/file-utils'
import { formatFileSize, getFileIcon, getSourceIcon } from './lib/file-utils'

interface FileItemProps {
  file: DocyrusFile
  editable: boolean
  onOpen: (file: DocyrusFile) => void
  onDelete: (file: DocyrusFile) => void
}

export function FileItem({ file, editable, onOpen, onDelete }: FileItemProps) {
  const iconInfo = getFileIcon(file.file_type)
  const sourceIcon = getSourceIcon(file.source)

  return (
    <div
      className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent/50 cursor-pointer"
      onClick={() => onOpen(file)}
    >
      <div className="relative shrink-0">
        <DocyrusIcon
          icon={iconInfo.icon}
          className={`size-4 ${iconInfo.color}`}
        />
        {sourceIcon && (
          <DocyrusIcon
            icon={sourceIcon}
            className="absolute -bottom-1 -right-1 size-2.5 text-muted-foreground"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{file.file_name}</p>
      </div>
      <span className="hidden shrink-0 text-xs text-muted-foreground @md/file-panel:inline">
        {formatFileSize(file.file_size)}
      </span>
      {editable && (
        <Button
          variant="ghost"
          size="sm"
          className="size-7 shrink-0 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(file)
          }}
        >
          <DocyrusIcon
            icon="far trash"
            className="size-3.5 text-muted-foreground"
          />
        </Button>
      )}
    </div>
  )
}
