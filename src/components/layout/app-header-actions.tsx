import {
  Building2,
  CheckSquare,
  ChevronDown,
  Contact,
  DollarSign,
  Plus,
  UserRoundSearch,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityFormDialog } from '@/components/activities/activity-form-dialog'
import { CompanyFormDialog } from '@/components/companies/company-form-dialog'
import { ContactFormDialog } from '@/components/contacts/contact-form-dialog'
import { DealFormDialog } from '@/components/deals/deal-form-dialog'
import { LeadFormDialog } from '@/components/leads/lead-form-dialog'
import { QuickTaskDialog } from '@/components/tasks/quick-task-dialog'
import { FieldSalesLocationActions } from '@/components/field-sales/field-sales-location-actions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AppHeaderActions() {
  const { t } = useTranslation()
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  const [dealOpen, setDealOpen] = useState(false)
  const [leadOpen, setLeadOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [companyOpen, setCompanyOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)

  return (
    <>
      <DropdownMenu open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            {t('quickAdd.label')}
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>{t('quickAdd.label')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setQuickCreateOpen(false)
              setLeadOpen(true)
            }}
          >
            <UserRoundSearch className="size-4" />
            {t('leads.newLead')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setQuickCreateOpen(false)
              setDealOpen(true)
            }}
          >
            <DollarSign className="size-4" />
            {t('deals.newDeal')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setQuickCreateOpen(false)
              setTaskOpen(true)
            }}
          >
            <CheckSquare className="size-4" />
            {t('tasks.newTask')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setQuickCreateOpen(false)
              setCompanyOpen(true)
            }}
          >
            <Building2 className="size-4" />
            {t('companies.newCompany')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setQuickCreateOpen(false)
              setContactOpen(true)
            }}
          >
            <Contact className="size-4" />
            {t('contacts.newContact')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setQuickCreateOpen(false)
              setActivityOpen(true)
            }}
          >
            <Zap className="size-4" />
            {t('activities.newActivity')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FieldSalesLocationActions />

      <LeadFormDialog
        open={leadOpen}
        onOpenChange={setLeadOpen}
        mode="create"
      />
      <DealFormDialog
        open={dealOpen}
        onOpenChange={setDealOpen}
        mode="create"
      />
      <CompanyFormDialog
        open={companyOpen}
        onOpenChange={setCompanyOpen}
        mode="create"
      />
      <ContactFormDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        mode="create"
      />
      <QuickTaskDialog open={taskOpen} onOpenChange={setTaskOpen} />
      <ActivityFormDialog
        open={activityOpen}
        onOpenChange={setActivityOpen}
        mode="create"
      />
    </>
  )
}
