import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FileSourceMenuProps {
  onUploadClick: () => void
  onOneDriveClick?: () => void
  onGoogleDriveClick?: () => void
  showOneDrive: boolean
  showGoogleDrive: boolean
}

export function FileSourceMenu({
  onUploadClick,
  onOneDriveClick,
  onGoogleDriveClick,
  showOneDrive,
  showGoogleDrive,
}: FileSourceMenuProps) {
  const hasExternalSources = showOneDrive || showGoogleDrive

  if (!hasExternalSources) {
    return (
      <Button variant="ghost" size="sm" onClick={onUploadClick}>
        <DocyrusIcon icon="far plus" className="size-3.5" />
        <span className="hidden @sm/file-panel:inline">Add</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <DocyrusIcon icon="far plus" className="size-3.5" />
          <span className="hidden @sm/file-panel:inline">Add</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onUploadClick}>
          <DocyrusIcon icon="far upload" className="size-3.5" />
          Upload from computer
        </DropdownMenuItem>
        {showOneDrive && (
          <DropdownMenuItem onClick={onOneDriveClick}>
            <DocyrusIcon icon="fab microsoft" className="size-3.5" />
            OneDrive
          </DropdownMenuItem>
        )}
        {showGoogleDrive && (
          <DropdownMenuItem onClick={onGoogleDriveClick}>
            <DocyrusIcon icon="fab google-drive" className="size-3.5" />
            Google Drive
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
