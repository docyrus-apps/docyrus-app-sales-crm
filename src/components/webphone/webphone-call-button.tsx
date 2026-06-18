import { Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useWebphone } from './webphone-context'
import { Button } from '@/components/ui/button'

interface WebphoneCallButtonProps {
  phone?: string | null
  contactId?: string
  leadId?: string
  size?: 'sm' | 'default' | 'icon'
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  className?: string
  label?: string
}

/**
 * Click-to-call action for a customer record. Hidden when the module is off,
 * disabled until WebRTC is registered, idle, and a phone number is present.
 */
export function WebphoneCallButton({
  phone,
  contactId,
  leadId,
  size = 'sm',
  variant = 'outline',
  className,
  label,
}: WebphoneCallButtonProps) {
  const { t } = useTranslation()
  const { enabled, ready, registrationStatus, activeSession, dial } =
    useWebphone()

  if (!enabled) return null

  const trimmed = phone?.trim() ?? ''
  const canDial =
    ready && registrationStatus === 'registered' && !activeSession && !!trimmed

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      disabled={!canDial}
      onClick={() => {
        if (trimmed) void dial(trimmed, { contactId, leadId })
      }}
    >
      <Phone className="size-4" />
      {size !== 'icon' && (label ?? t('webphone.callButton'))}
    </Button>
  )
}
