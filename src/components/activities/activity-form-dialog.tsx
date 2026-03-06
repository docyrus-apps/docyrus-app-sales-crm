import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LogActivityPayload } from '@/components/docyrus/log-activity-form/types'
import {
  AwesomeDialog,
  AwesomeDialogBody,
  AwesomeDialogHeader,
} from '@/components/docyrus/awesome-dialog'
import { LogActivityForm } from '@/components/docyrus/log-activity-form/log-activity-form'
import { useCreateActivity } from '@/hooks/use-activities'
import { useUsers } from '@/hooks/use-users'

interface ActivityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity?: any
  mode: 'create' | 'edit'
}

export function ActivityFormDialog({
  open,
  onOpenChange,
}: ActivityFormDialogProps) {
  const { t } = useTranslation()
  const createActivity = useCreateActivity()
  const { data: users = [] } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mentionUsers = users.map((user: any) => ({
    key: user.id,
    text: `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim() || user.email,
    initials:
      `${(user.firstname?.[0] ?? '').toUpperCase()}${(user.lastname?.[0] ?? '').toUpperCase()}` ||
      '?',
  }))

  const handleSubmit = async (payload: LogActivityPayload) => {
    setIsSubmitting(true)
    try {
      await createActivity.mutateAsync({
        subject: payload.taskSubject ?? payload.subject ?? payload.type,
        description: payload.bodyText,
        start_date: payload.startDate?.toISOString(),
        end_date: payload.endDate?.toISOString(),
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AwesomeDialog
      open={open}
      onOpenChange={onOpenChange}
      container="modal"
      size="lg"
    >
      <AwesomeDialogHeader
        title={t('activities.form.createTitle')}
        description={t('activities.form.createDescription')}
      />
      <AwesomeDialogBody>
        <LogActivityForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          mentionUsers={mentionUsers}
          submitLabel={t('activities.form.createButton')}
        />
      </AwesomeDialogBody>
    </AwesomeDialog>
  )
}
