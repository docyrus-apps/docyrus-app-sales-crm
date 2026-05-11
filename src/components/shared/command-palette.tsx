import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import {
  Building2,
  Calendar,
  CheckSquare,
  DollarSign,
  FileText,
  Mail,
  Package,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { useDeals } from '@/hooks/use-deals'
import { useLeads } from '@/hooks/use-leads'
import { useCompanies } from '@/hooks/use-companies'
import { useTasks } from '@/hooks/use-tasks'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateDeal?: () => void
  onCreateLead?: () => void
  onCreateTask?: () => void
  onCreateEvent?: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  onCreateDeal,
  onCreateLead,
  onCreateTask,
  onCreateEvent,
}: CommandPaletteProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  // Fetch data for search
  const { data: deals } = useDeals()
  const { data: leads } = useLeads()
  const { data: companies } = useCompanies()
  const { data: tasks } = useTasks()

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  // Filter results based on search
  const filteredDeals =
    deals
      ?.filter((deal: any) => {
        if (!search) return false
        const orgName =
          deal.organization && typeof deal.organization === 'object'
            ? deal.organization.name || ''
            : deal.organization || ''
        return orgName.toLowerCase().includes(search.toLowerCase())
      })
      .slice(0, 5) || []

  const filteredLeads =
    leads
      ?.filter((lead: any) => {
        if (!search) return false
        const name = lead.name || ''
        const company = lead.company_name_text || ''
        return (
          name.toLowerCase().includes(search.toLowerCase()) ||
          company.toLowerCase().includes(search.toLowerCase())
        )
      })
      .slice(0, 5) || []

  const filteredCompanies =
    companies
      ?.filter((company: any) => {
        if (!search) return false
        return company.name?.toLowerCase().includes(search.toLowerCase())
      })
      .slice(0, 5) || []

  const filteredTasks =
    tasks
      ?.filter((task: any) => {
        if (!search) return false
        return task.subject?.toLowerCase().includes(search.toLowerCase())
      })
      .slice(0, 5) || []

  const handleSelect = (callback: () => void) => {
    onOpenChange(false)
    callback()
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput
          placeholder={t('commandPalette.searchPlaceholder')}
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>{t('commandPalette.noResults')}</CommandEmpty>

          {/* Quick Actions */}
          {!search && (
            <>
              <CommandGroup heading={t('commandPalette.quickActions')}>
                {onCreateDeal && (
                  <CommandItem
                    onSelect={() => handleSelect(onCreateDeal)}
                    className="cursor-pointer gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t('commandPalette.newDeal')}</span>
                  </CommandItem>
                )}
                {onCreateLead && (
                  <CommandItem
                    onSelect={() => handleSelect(onCreateLead)}
                    className="cursor-pointer gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t('commandPalette.newLead')}</span>
                  </CommandItem>
                )}
                {onCreateTask && (
                  <CommandItem
                    onSelect={() => handleSelect(onCreateTask)}
                    className="cursor-pointer gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t('commandPalette.newTask')}</span>
                  </CommandItem>
                )}
                {onCreateEvent && (
                  <CommandItem
                    onSelect={() => handleSelect(onCreateEvent)}
                    className="cursor-pointer gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t('commandPalette.newEvent')}</span>
                  </CommandItem>
                )}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Navigation */}
          {!search && (
            <>
              <CommandGroup heading={t('commandPalette.navigation')}>
                <CommandItem
                  onSelect={() =>
                    handleSelect(() => navigate({ to: '/deals' }))
                  }
                  className="cursor-pointer gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>{t('commandPalette.dealsPipeline')}</span>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    handleSelect(() => navigate({ to: '/leads' }))
                  }
                  className="cursor-pointer gap-2"
                >
                  <Users className="h-4 w-4" />
                  <span>{t('commandPalette.leads')}</span>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    handleSelect(() => navigate({ to: '/companies' }))
                  }
                  className="cursor-pointer gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  <span>{t('commandPalette.companies')}</span>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    handleSelect(() => navigate({ to: '/tasks' }))
                  }
                  className="cursor-pointer gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>{t('commandPalette.tasks')}</span>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    handleSelect(() => navigate({ to: '/calendar' }))
                  }
                  className="cursor-pointer gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{t('commandPalette.calendar')}</span>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    handleSelect(() => navigate({ to: '/emails' }))
                  }
                  className="cursor-pointer gap-2"
                >
                  <Mail className="h-4 w-4" />
                  <span>{t('commandPalette.emails')}</span>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    handleSelect(() => navigate({ to: '/products' }))
                  }
                  className="cursor-pointer gap-2"
                >
                  <Package className="h-4 w-4" />
                  <span>{t('commandPalette.products')}</span>
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    handleSelect(() => navigate({ to: '/sales-orders' }))
                  }
                  className="cursor-pointer gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>{t('commandPalette.salesOrders')}</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Search Results - Deals */}
          {search && filteredDeals.length > 0 && (
            <>
              <CommandGroup heading={t('commandPalette.searchResults.deals')}>
                {filteredDeals.map((deal: any) => (
                  <CommandItem
                    key={deal.id}
                    onSelect={() =>
                      handleSelect(() =>
                        navigate({
                          to: '/deals/$dealId',
                          params: { dealId: deal.id },
                        }),
                      )
                    }
                    className="cursor-pointer gap-2"
                  >
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>
                          {deal.organization &&
                          typeof deal.organization === 'object'
                            ? deal.organization.name
                            : 'Deal'}
                        </span>
                        {deal.stage && (
                          <Badge variant="secondary" className="text-xs">
                            {typeof deal.stage === 'object'
                              ? deal.stage.name
                              : deal.stage}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Search Results - Leads */}
          {search && filteredLeads.length > 0 && (
            <>
              <CommandGroup heading={t('commandPalette.searchResults.leads')}>
                {filteredLeads.map((lead: any) => (
                  <CommandItem
                    key={lead.id}
                    onSelect={() =>
                      handleSelect(() =>
                        navigate({
                          to: '/leads/$leadId',
                          params: { leadId: lead.id },
                        }),
                      )
                    }
                    className="cursor-pointer gap-2"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>
                          {lead.name || `Lead #${lead.id.slice(0, 8)}`}
                        </span>
                        {lead.lead_status && (
                          <Badge variant="secondary" className="text-xs">
                            {typeof lead.lead_status === 'object'
                              ? lead.lead_status.name
                              : lead.lead_status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Search Results - Companies */}
          {search && filteredCompanies.length > 0 && (
            <>
              <CommandGroup
                heading={t('commandPalette.searchResults.companies')}
              >
                {filteredCompanies.map((company: any) => (
                  <CommandItem
                    key={company.id}
                    onSelect={() =>
                      handleSelect(() =>
                        navigate({
                          to: '/companies/$companyId',
                          params: { companyId: company.id },
                        }),
                      )
                    }
                    className="cursor-pointer gap-2"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>{company.name}</span>
                        {company.industry && (
                          <Badge variant="secondary" className="text-xs">
                            {typeof company.industry === 'object'
                              ? company.industry.name
                              : company.industry}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Search Results - Tasks */}
          {search && filteredTasks.length > 0 && (
            <>
              <CommandGroup heading={t('commandPalette.searchResults.tasks')}>
                {filteredTasks.map((task: any) => (
                  <CommandItem
                    key={task.id}
                    onSelect={() => handleSelect(() => {})}
                    className="cursor-pointer gap-2"
                  >
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>{task.subject}</span>
                        {task.status && (
                          <Badge variant="secondary" className="text-xs">
                            {typeof task.status === 'object'
                              ? task.status.name
                              : task.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
