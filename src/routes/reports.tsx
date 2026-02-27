import { BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'

export function Reports() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader title={t('reports.title')} />
      <PageContainer>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">{t('reports.pageTitle')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('reports.comingSoon')}
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  )
}
