import { useState } from 'react'

import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Download,
  File,
  FileText,
  FileType,
  Image,
  Trash2,
  Upload
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/animate-ui/components/buttons/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger
} from '@/components/ui/file-upload'
import { getApiClient } from '@/lib/api'
import { formatDate } from '@/lib/formatters'

interface FileAttachmentsProps {
  appSlug: string;
  dataSource: string;
  recordId: string;
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  url: string;
  created_on: string;
  created_by?: {
    id: string;
    name: string;
  };
}

const ACCEPTED_FILE_TYPES = [
  'image/*',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  'application/pdf',
  '.pdf',
  'application/msword',
  '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.docx',
  'application/vnd.ms-excel',
  '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xlsx',
  'text/*',
  '.txt',
  '.csv'
].join(', ')

export function FileAttachments({
  appSlug,
  dataSource,
  recordId
}: FileAttachmentsProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)

  // Fetch files
  const {
    data: files,
    isLoading,
    error
  } = useQuery<Array<FileAttachment>>({
    queryKey: ['files', dataSource, recordId],
    queryFn: async () => {
      const apiClient = getApiClient()

      if (!apiClient) throw new Error('API client not initialized')

      return await apiClient.get(
        `/v1/apps/${appSlug}/data-sources/${dataSource}/items/${recordId}/files`
      )
    }
  })

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: Array<File>) => {
      const apiClient = getApiClient()

      if (!apiClient) throw new Error('API client not initialized')

      const formData = new FormData()

      files.forEach((file) => {
        formData.append('files', file)
      })

      return await apiClient.post(
        `/v1/apps/${appSlug}/data-sources/${dataSource}/items/${recordId}/files/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['files', dataSource, recordId]
      })
      setUploading(false)
      toast.success(t('files.uploadSuccess'))
    },
    onError: (err: Error) => {
      setUploading(false)
      toast.error(t('files.uploadError', { error: err.message }))
    }
  })

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const apiClient = getApiClient()

      if (!apiClient) throw new Error('API client not initialized')

      await apiClient.delete(
        `/v1/apps/${appSlug}/data-sources/${dataSource}/items/${recordId}/files/${fileId}`
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['files', dataSource, recordId]
      })
      toast.success(t('files.deleteSuccess'))
    },
    onError: (err: Error) => {
      toast.error(t('files.deleteError', { error: err.message }))
    }
  })

  const handleUpload = async (uploadedFiles: Array<File>) => {
    if (uploadedFiles.length === 0) return

    setUploading(true)
    uploadMutation.mutate(uploadedFiles)
  }

  const handleDownload = async (file: FileAttachment) => {
    try {
      const apiClient = getApiClient()

      if (!apiClient) throw new Error('API client not initialized')

      const response = await apiClient.get(file.url, {
        responseType: 'blob'
      })

      const blob = response instanceof Blob ? response : new Blob([response])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.setAttribute('download', file.name)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(t('files.downloadError'))
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = [
'Bytes',
'KB',
'MB',
'GB'
]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5" />
    if (mimeType.startsWith('text/')) return <FileText className="h-5 w-5" />
    if (mimeType === 'application/pdf') return <FileType className="h-5 w-5" />

    return <File className="h-5 w-5" />
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-6">
          <p className="text-sm text-destructive">
            {t('files.failedToLoad', { error: error.message })}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {t('files.uploadFiles')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            multiple
            maxFiles={10}
            maxSize={10 * 1024 * 1024} // 10MB
            accept={ACCEPTED_FILE_TYPES}
            value={[]}
            onValueChange={(accepted) => {
              if (accepted.length > 0) void handleUpload(accepted)
            }}
            disabled={uploading || uploadMutation.isPending}>
            <FileUploadDropzone className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t('files.dropHint', {
                  defaultValue: 'Drag & drop files here, or'
                })}
              </p>
              <FileUploadTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading || uploadMutation.isPending}>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('files.chooseFiles', { defaultValue: 'Choose files' })}
                </Button>
              </FileUploadTrigger>
            </FileUploadDropzone>
          </FileUpload>
        </CardContent>
      </Card>

      {/* File List */}
      {files && files.length > 0 ? (
        <div className="space-y-2">
          {files.map(file => (
            <Card key={file.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 text-muted-foreground">
                      {getFileIcon(file.mime_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>
                          {formatDate(file.created_on, { format: 'relative' })}
                        </span>
                        {file.created_by && (
                          <>
                            <span>•</span>
                            <span>{file.created_by.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(file.id)}
                      disabled={deleteMutation.isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {t('files.noFiles')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('files.uploadHint')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
