import { BarChart3 } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'

export function Reports() {
  return (
    <>
      <PageHeader title="Reports" />
      <PageContainer>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Reports</p>
            <p className="text-sm text-muted-foreground mt-2">
              Reporting features coming soon.
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  )
}
