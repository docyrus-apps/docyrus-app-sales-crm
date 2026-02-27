import { Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'

export function Activities() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader title={t('activities.title')} />
      <PageContainer>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">{t('activities.pageTitle')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('activities.comingSoon')}
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  )
}
