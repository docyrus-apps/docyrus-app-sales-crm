import { type DocyrusFile } from './lib/file-utils';

export interface ExternalFilePayload {
  source: 'microsoft_onedrive' | 'google_drive';
  file_name: string;
  file_type: string;
  signed_url: string;
  file_data?: Record<string, unknown>;
  expire_in?: number;
}

export interface FileAttachmentPanelProps {
  files: Array<DocyrusFile>;
  title?: string;
  editable?: boolean;
  isLoading?: boolean;
  maxHeight?: number | string;
  maxFileSize?: number;
  accept?: string;
  maxFiles?: number;
  onUploadFile?: (file: File) => Promise<DocyrusFile>;
  onDeleteFile?: (fileId: string) => void | Promise<void>;
  onInsertExternalFiles?: (files: Array<ExternalFilePayload>) => void | Promise<void>;
  onFileOpen?: (file: DocyrusFile) => void;
  isDeletePending?: boolean;
  className?: string;
}

export interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

export type ViewMode = 'list' | 'grid';