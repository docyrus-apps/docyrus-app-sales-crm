import { createStorageClient, isSupabaseConfigured } from './supabase'

/*
 * Puts an import file where the Docyrus import API expects to find it.
 *
 * `GET …/import/details` downloads the file from tenant storage at
 * `tenant-{tenantNo}/tmp/import/{fileName}` and rebuilds that path from the
 * tenant in the caller's token. The deployed API exposes no upload route of its
 * own, so writing the file there is the app's job — the same thing the legacy
 * shell does before it calls analyse.
 *
 * The upload carries the user's own token, so storage policies still decide what
 * may be written; nothing here grants access the user does not already have.
 */

const STORAGE_BUCKET = 'tenant'
const CACHE_CONTROL = '3600'

/** False when the storage env vars are absent — import cannot run at all then. */
export const isImportUploadConfigured = isSupabaseConfigured

/*
 * Kept local rather than reusing the wizard's `slugify`: that one lives in the
 * CLI-managed component tree and importing it drags the whole field-component
 * graph in behind a type-only entry point.
 */
function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Mirrors the legacy shell's `getFilename()`: slugified base + original
 * extension. The analyse phase looks the file up by this name, so it has to be
 * the last segment of the path we write to.
 */
export function buildImportFileName(originalName: string): string {
  const dot = originalName.lastIndexOf('.')
  const extension = dot > 0 ? originalName.slice(dot + 1).toLowerCase() : ''
  const base =
    slugify(dot > 0 ? originalName.slice(0, dot) : originalName) || 'import'

  return extension ? `${base}.${extension}` : base
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const segments = token.split('.')

  if (segments.length < 2) return null

  try {
    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/')
    const padding = (4 - (base64.length % 4)) % 4

    return JSON.parse(atob(base64 + '='.repeat(padding))) as Record<
      string,
      unknown
    >
  } catch {
    return null
  }
}

/**
 * Whether this token can sign storage requests.
 *
 * Running inside the Docyrus shell the app is handed the shell's own session
 * token, which storage accepts. The standalone OAuth2 flow issues an API token
 * instead — it carries a `cid` client-id claim, only the Docyrus API knows how
 * to exchange it, and storage rejects it. The API draws the same line when it
 * decides how to validate an incoming token.
 */
export function isTenantStorageToken(
  token: string | null | undefined
): boolean {
  if (!token) return false

  const payload = decodeJwtPayload(token)

  return payload !== null && !('cid' in payload)
}

export async function uploadImportFile({
  file,
  tenantNo,
  accessToken
}: {
  file: File;
  tenantNo: string;
  accessToken: string;
}): Promise<{ fileName: string; filePath: string }> {
  const fileName = buildImportFileName(file.name)
  const filePath = `tenant-${tenantNo}/tmp/import/${fileName}`

  /*
   * `upsert` lets a re-run overwrite the previous attempt instead of failing on
   * a name that is already taken.
   */
  const { error } = await createStorageClient(accessToken)
    .storage.from(STORAGE_BUCKET)
    .upload(filePath, file, { cacheControl: CACHE_CONTROL, upsert: true })

  if (error) {
    throw new Error(`Import upload failed: ${error.message}`)
  }

  return { fileName, filePath }
}
