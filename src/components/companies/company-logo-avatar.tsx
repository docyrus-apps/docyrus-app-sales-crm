import { useRef, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUploadCompanyLogo } from '@/hooks/use-companies'

function getInitials(value?: string): string {
  if (!value) return '#'

  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '#'
  )
}

interface CompanyLogoAvatarProps {
  companyId?: string
  name?: string
  /** Current logo URL (company_logo.signed_url) */
  logoUrl?: string
  className?: string
}

const MAX_LOGO_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Company header logo. Renders the uploaded logo (or initials) and, on hover,
 * exposes a click target to upload a new image. The picked file is uploaded to
 * the organization data source and stored on the record's `company_logo` field.
 */
export function CompanyLogoAvatar({
  companyId,
  name,
  logoUrl,
  className,
}: CompanyLogoAvatarProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadLogo = useUploadCompanyLogo()
  const isUploading = uploadLogo.isPending

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !companyId) return

    if (!file.type.startsWith('image/')) {
      toast.error(
        t('companies.logoInvalidType', {
          defaultValue: 'Please choose an image file',
        }),
      )

      return
    }

    if (file.size > MAX_LOGO_SIZE) {
      toast.error(
        t('companies.logoTooLarge', {
          defaultValue: 'Image must be smaller than 5MB',
        }),
      )

      return
    }

    uploadLogo.mutate({ companyId, file })
  }

  return (
    <div className={cn('group relative size-9 shrink-0', className)}>
      <Avatar className="size-9 rounded-lg">
        {logoUrl && <AvatarImage src={logoUrl} alt={name ?? ''} />}
        <AvatarFallback className="rounded-lg bg-muted text-xs font-semibold">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      <button
        type="button"
        disabled={isUploading || !companyId}
        onClick={() => inputRef.current?.click()}
        aria-label={t('companies.uploadLogo', {
          defaultValue: 'Upload logo',
        })}
        title={t('companies.uploadLogo', { defaultValue: 'Upload logo' })}
        className={cn(
          'absolute inset-0 flex items-center justify-center rounded-lg bg-black/55 text-white transition-opacity',
          'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          'disabled:cursor-not-allowed',
          isUploading && 'opacity-100',
        )}
      >
        {isUploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Camera className="size-4" />
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelect}
      />
    </div>
  )
}
