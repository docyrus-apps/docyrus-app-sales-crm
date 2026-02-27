export interface DocyrusFile {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  signed_url: string | null;
  source: 'local' | 'microsoft_onedrive' | 'google_drive';
  file_data: Record<string, unknown> | null;
  created_on: string;
  record_id: string | null;
}

export interface FileIconInfo {
  icon: string;
  lib: string;
  color: string;
}

export function getFileIcon(mimeType: string): FileIconInfo {
  if (!mimeType)
    return { icon: 'far file', lib: 'far', color: 'text-muted-foreground' };

  if (mimeType.startsWith('image/'))
    return { icon: 'far file-image', lib: 'far', color: 'text-purple-500' };
  if (mimeType === 'application/pdf')
    return { icon: 'far file-pdf', lib: 'far', color: 'text-red-500' };
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
    return { icon: 'far file-excel', lib: 'far', color: 'text-green-500' };
  if (mimeType.includes('document') || mimeType.includes('wordprocessing'))
    return { icon: 'far file-word', lib: 'far', color: 'text-blue-500' };
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return { icon: 'far file-powerpoint', lib: 'far', color: 'text-orange-500' };
  if (mimeType.startsWith('text/'))
    return { icon: 'far file-lines', lib: 'far', color: 'text-gray-500' };
  if (mimeType.startsWith('video/'))
    return { icon: 'far file-video', lib: 'far', color: 'text-pink-500' };
  if (mimeType.startsWith('audio/'))
    return { icon: 'far file-audio', lib: 'far', color: 'text-teal-500' };
  if (
    mimeType.includes('zip')
    || mimeType.includes('compressed')
    || mimeType.includes('archive')
  )
    return { icon: 'far file-zipper', lib: 'far', color: 'text-yellow-500' };

  return { icon: 'far file', lib: 'far', color: 'text-muted-foreground' };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function isImageFile(mimeType: string): boolean {
  return /^image\/(jpeg|png|gif|webp|svg\+xml|bmp)$/.test(mimeType);
}

export function getSourceIcon(source: string): string | null {
  if (source === 'microsoft_onedrive') return 'fab microsoft';
  if (source === 'google_drive') return 'fab google-drive';

  return null;
}

export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');

  if (lastDot === -1) return '';

  return fileName.slice(lastDot + 1).toLowerCase();
}