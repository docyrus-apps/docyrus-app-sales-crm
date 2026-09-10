import { useMemo } from 'react'

import { useDocyrusAuth } from '@docyrus/signin'

import type { UploadedFileInfo } from '@/components/docyrus/data-import-wizard'
import {
  isImportUploadConfigured,
  isTenantStorageToken,
  uploadImportFile,
} from '@/lib/import-file-upload'

import { useMyInfo } from './use-users'

/**
 * Supplies the import wizard's `uploadFile` phase, or `undefined` when this
 * session cannot write to tenant storage (missing storage config, or a token
 * storage will not accept).
 *
 * `undefined` is a signal to the caller rather than a soft failure: without an
 * uploader the wizard falls back to an upload endpoint the deployed API does
 * not serve, so a page should hide its Import entry point instead of offering a
 * run that cannot finish.
 */
export function useImportFileUploader():
  | ((file: File) => Promise<UploadedFileInfo>)
  | undefined {
  const { tokens } = useDocyrusAuth()
  const accessToken = tokens?.accessToken ?? null
  const canUpload = useMemo(
    () => isImportUploadConfigured && isTenantStorageToken(accessToken),
    [accessToken],
  )
  const { data: me } = useMyInfo()
  const tenantNo = me?.tenant?.no ?? null

  return useMemo(() => {
    if (!canUpload || !accessToken || !tenantNo) return undefined

    return async (file: File): Promise<UploadedFileInfo> => {
      const { fileName, filePath } = await uploadImportFile({
        file,
        tenantNo,
        accessToken,
      })

      return {
        fileName,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        filePath,
      }
    }
  }, [accessToken, canUpload, tenantNo])
}
