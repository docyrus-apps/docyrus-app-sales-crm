import { type DocyrusFile } from './lib/file-utils'

import { FileItem } from './file-item'

interface FileListProps {
  files: Array<DocyrusFile>
  editable: boolean
  onOpen: (file: DocyrusFile) => void
  onDelete: (file: DocyrusFile) => void
}

export function FileList({ files, editable, onOpen, onDelete }: FileListProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {files.map((file) => (
        <FileItem
          key={file.id}
          file={file}
          editable={editable}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
