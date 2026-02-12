import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'

export function Emails() {
  return (
    <PageContainer>
      <PageHeader title="Emails" description="View and manage email threads" />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">Email threads</p>
          <p className="text-sm text-muted-foreground mt-2">Coming soon</p>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
