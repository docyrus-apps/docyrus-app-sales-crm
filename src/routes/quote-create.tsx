import { useState } from 'react'

import { useNavigate, useSearch } from '@tanstack/react-router'

import { QuoteCreateWizard } from '@/components/quotes/quote-create-wizard'
import { PageContainer } from '@/components/layout/page-container'

export function QuoteCreatePage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const [open, setOpen] = useState(true)

  return (
    <PageContainer className="flex min-h-0 flex-1 flex-col">
      <QuoteCreateWizard
        open={open}
        initialOrganizationId={search.organization}
        initialOrganizationName={search.organizationName}
        initialDealId={search.deal}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) void navigate({ to: '/sales-orders' })
        }} />
    </PageContainer>
  )
}
