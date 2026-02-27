import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'

export function Emails() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader title={t('emails.title')} />
      <PageContainer>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">{t('emails.pageTitle')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('emails.comingSoon')}
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  )
}
