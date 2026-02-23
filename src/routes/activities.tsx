import { Zap } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'

export function Activities() {
  return (
    <>
      <PageHeader title="Activities" />
      <PageContainer>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Activities</p>
            <p className="text-sm text-muted-foreground mt-2">
              Activity tracking coming soon.
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  )
}
