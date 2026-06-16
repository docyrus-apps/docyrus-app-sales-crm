/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  Briefcase,
  Building2,
  ClipboardList,
  FileText,
  Globe,
  Mail,
  MessageSquare,
  Phone,
  StickyNote,
  Users,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu'
import {
  RecordDetailLayout,
  RecordKpiCard,
  type RecordDetailTab,
} from '@/components/crm/record-detail-layout'
import { RelatedContactsTable } from '@/components/crm/related-contacts-table'
import { RelatedDealsTable } from '@/components/crm/related-deals-table'
import { RecordActivityTimeline } from '@/components/crm/record-activity-timeline'
import { useDialer } from '@/components/dialer/dialer-widget'
import { useCompany, useUpdateCompany } from '@/hooks/use-companies'
import { useContacts } from '@/hooks/use-contacts'
import { useDeals } from '@/hooks/use-deals'
import { useLeads } from '@/hooks/use-leads'
import { useEnumEntities } from '@/hooks/use-enums'
import { useRecordEvents } from '@/hooks/use-events'
import { ContactFormDialog } from '@/components/contacts/contact-form-dialog'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'
import {
  type FieldChange,
  type RecordDetailField,
} from '@/components/docyrus/editable-record-detail'
import type { EnumOption, IField } from '@/components/docyrus/form-fields/types'

const FIELD_SLUGS = [
  'name',
  'industry',
  'type',
  'status',
  'email',
  'phone',
  'website',
  'address',
  'country',
  'city',
  'district',
  'tax_number',
]

function makeField(
  slug: string,
  name: string,
  type: IField['type'] = 'field-text',
): IField {
  return { id: slug, name, slug, type }
}

function extractName(value: unknown): string {
  if (value && typeof value === 'object' && 'name' in value)
    return ((value as { name?: string }).name ?? '') as string
  if (typeof value === 'string') return value

  return ''
}

function fieldId(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'object' && 'id' in value)
    return (value as { id?: string }).id ?? null

  return typeof value === 'string' ? value : null
}

function getInitials(value?: string): string {
  if (!value) return '#'

  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '#'
  )
}

function toOptions(
  items: Array<{
    id: string
    name: string
    color?: string | null
    icon?: string | null
  }>,
): Array<EnumOption> {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    color: item.color ?? undefined,
    icon: item.icon ?? undefined,
  }))
}

export function CompanyDetail() {
  const { t } = useTranslation()
  const { companyId } = useParams({ strict: false })
  const { tab } = useSearch({ from: '/companies/$companyId' })
  const navigate = useNavigate({ from: '/companies/$companyId' })
  const { data: company, isLoading } = useCompany(companyId)
  const updateCompany = useUpdateCompany()
  const dialer = useDialer()
  const [addContactOpen, setAddContactOpen] = useState(false)

  const activeTab = tab || 'overview'

  const handleTabChange = (value: string) => {
    void navigate({ search: { tab: value }, replace: true })
  }

  const enumOpts = { appSlug: 'base', dataSourceSlug: 'organization' }
  const { data: statusEntities = [] } = useEnumEntities('status', enumOpts)
  const { data: typeEntities = [] } = useEnumEntities('type', enumOpts)
  const { data: industryEntities = [] } = useEnumEntities('industry', enumOpts)

  const { data: contacts = [], isLoading: contactsLoading } = useContacts(
    companyId
      ? {
          columns: ['id', 'name', 'job_title', 'email', 'mobile'],
          filters: {
            rules: [{ field: 'organization', operator: '=', value: companyId }],
          },
          orderBy: 'created_on desc',
        }
      : undefined,
  )

  const { data: deals = [], isLoading: dealsLoading } = useDeals(
    companyId
      ? {
          columns: [
            'id',
            'name',
            'stage',
            'deal_value',
            'expected_closing_date',
            'close_probability',
          ],
          filters: {
            rules: [{ field: 'organization', operator: '=', value: companyId }],
          },
          orderBy: 'created_on desc',
        }
      : undefined,
  )

  const { data: leads = [], isLoading: leadsLoading } = useLeads(
    companyId
      ? {
          columns: ['id', 'name', 'email', 'phone', 'lead_status'],
          filters: {
            rules: [
              {
                field: 'converted_organization',
                operator: '=',
                value: companyId,
              },
            ],
          },
          orderBy: 'created_on desc',
        }
      : undefined,
  )

  const { data: events = [], isLoading: eventsLoading } = useRecordEvents(
    'organization',
    companyId,
  )

  const statusEditable = statusEntities.length > 0
  const typeEditable = typeEntities.length > 0
  const industryEditable = industryEntities.length > 0

  const detailFields = useMemo<Array<RecordDetailField>>(
    () => [
      { field: makeField('name', t('companies.name')) },
      {
        field: makeField(
          'industry',
          t('companies.industry'),
          industryEditable ? 'field-select' : 'field-text',
        ),
        enumOptions: toOptions(industryEntities),
        readOnly: !industryEditable,
      },
      {
        field: makeField(
          'type',
          t('companies.type'),
          typeEditable ? 'field-select' : 'field-text',
        ),
        enumOptions: toOptions(typeEntities),
        readOnly: !typeEditable,
      },
      {
        field: makeField(
          'status',
          t('companies.status'),
          statusEditable ? 'field-status' : 'field-text',
        ),
        enumOptions: toOptions(statusEntities),
        readOnly: !statusEditable,
      },
      { field: makeField('email', t('companies.email'), 'field-email') },
      { field: makeField('phone', t('companies.phone'), 'field-phone') },
      { field: makeField('website', t('companies.website'), 'field-url') },
      { field: makeField('address', t('companies.address')) },
      {
        field: makeField(
          'country',
          t('companies.country', { defaultValue: 'Country' }),
        ),
        readOnly: true,
      },
      {
        field: makeField('city', t('companies.city', { defaultValue: 'City' })),
        readOnly: true,
      },
      { field: makeField('district', t('companies.district')) },
      { field: makeField('tax_number', t('companies.taxNumber')) },
    ],
    [
      t,
      statusEditable,
      typeEditable,
      industryEditable,
      statusEntities,
      typeEntities,
      industryEntities,
    ],
  )

  const flatRecord = useMemo<Record<string, unknown>>(() => {
    if (!company) return {}

    return {
      name: company.name ?? '',
      industry: industryEditable
        ? fieldId(company.industry)
        : extractName(company.industry),
      type: typeEditable ? fieldId(company.type) : extractName(company.type),
      status: statusEditable
        ? fieldId(company.status)
        : extractName(company.status),
      email: company.email ?? '',
      phone: company.phone ?? '',
      website: company.website ?? '',
      address: company.address ?? '',
      country: extractName(company.country),
      city: extractName(company.city),
      district: company.district ?? '',
      tax_number: company.tax_number ?? '',
    }
  }, [company, statusEditable, typeEditable, industryEditable])

  const handleInlineSave = async (
    changes: Array<FieldChange>,
    _values: Record<string, unknown>,
  ) => {
    if (!companyId || changes.length === 0) return

    const payload = Object.fromEntries(
      changes.map((change) => [
        change.fieldSlug,
        change.newValue === '' ? null : change.newValue,
      ]),
    )

    await updateCompany.mutateAsync({ companyId, data: payload })
  }

  const companyName =
    company?.name?.trim() ||
    t('companies.untitled', { defaultValue: 'Untitled Company' })
  const statusName = extractName(company?.status)
  const contactsWithPhone = useMemo(
    () => contacts.filter((c: any) => c.mobile),
    [contacts],
  )

  const openContact = (id: string) =>
    navigate({
      to: '/contacts/$contactId',
      params: { contactId: id },
      search: { tab: 'overview' },
    })

  const tabs = useMemo<Array<RecordDetailTab>>(() => {
    return [
      {
        value: 'overview',
        label: t('companies.tabs.overview'),
        icon: <Building2 className="size-3.5" />,
        content: (
          <div className="space-y-5">
            <div className="grid gap-2.5 sm:grid-cols-3">
              <RecordKpiCard
                label={t('companies.tabs.contacts')}
                value={contacts.length}
                icon={<Users className="size-3.5" />}
              />
              <RecordKpiCard
                label={t('companies.tabs.deals')}
                value={deals.length}
                icon={<Briefcase className="size-3.5" />}
              />
              <RecordKpiCard
                label={t('companies.industry')}
                value={extractName(company?.industry) || '—'}
              />
            </div>

            <div className="rounded-xl border p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold">
                  {t('contacts.recentActivity', {
                    defaultValue: 'Recent activity',
                  })}
                </h3>
                <button
                  type="button"
                  onClick={() => handleTabChange('activity')}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {t('common.viewAll', { defaultValue: 'View all' })}
                </button>
              </div>
              <RecordActivityTimeline
                events={events}
                isLoading={eventsLoading}
                limit={2}
              />
            </div>
          </div>
        ),
      },
      {
        value: 'activity',
        label: t('companies.tabs.activity', { defaultValue: 'Activity' }),
        icon: <Activity className="size-3.5" />,
        content: (
          <RecordActivityTimeline events={events} isLoading={eventsLoading} />
        ),
      },
      {
        value: 'contacts',
        label: t('companies.tabs.contacts'),
        icon: <Users className="size-3.5" />,
        count: contacts.length,
        bare: true,
        content: (
          <RelatedContactsTable
            contacts={contacts as any}
            isLoading={contactsLoading}
            addLabel={t('contacts.new', { defaultValue: 'New Contact' })}
            emptyLabel={t('companies.contacts.empty')}
            onAddContact={() => setAddContactOpen(true)}
            onOpenContact={openContact}
            onEmail={(c) => c.email && window.open(`mailto:${c.email}`)}
            onCall={(c) => dialer.open({ name: c.name, number: c.mobile })}
            onSms={(c) => c.mobile && window.open(`sms:${c.mobile}`)}
          />
        ),
      },
      {
        value: 'deals',
        label: t('companies.tabs.deals'),
        icon: <Briefcase className="size-3.5" />,
        count: deals.length,
        bare: true,
        content: (
          <RelatedDealsTable
            deals={deals as any}
            isLoading={dealsLoading}
            emptyLabel={t('companies.deals.empty')}
            onOpenDeal={(id) =>
              navigate({
                to: '/deals/$dealId',
                params: { dealId: id },
                search: { tab: 'activity' },
              })
            }
          />
        ),
      },
      {
        value: 'leads',
        label: t('companies.tabs.leads'),
        icon: <ClipboardList className="size-3.5" />,
        count: leads.length,
        content: leadsLoading ? (
          <div className="space-y-2">
            <div className="h-12 animate-pulse rounded-lg bg-muted/40" />
            <div className="h-12 animate-pulse rounded-lg bg-muted/40" />
          </div>
        ) : !leads.length ? (
          <p className="px-2 py-8 text-center text-[13px] text-muted-foreground">
            {t('companies.leads.empty')}
          </p>
        ) : (
          <ul className="space-y-1">
            {leads.map((lead: any) => (
              <li
                key={lead.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  navigate({
                    to: '/leads/$leadId',
                    params: { leadId: lead.id },
                    search: { tab: 'overview' },
                  })
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter')
                    navigate({
                      to: '/leads/$leadId',
                      params: { leadId: lead.id },
                      search: { tab: 'overview' },
                    })
                }}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/60"
              >
                <span className="truncate font-medium">
                  {lead.name || t('leads.untitledLead')}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {extractName(lead.lead_status)}
                </span>
              </li>
            ))}
          </ul>
        ),
      },
      {
        value: 'notes',
        label: t('companies.tabs.comments'),
        icon: <MessageSquare className="size-3.5" />,
        bare: true,
        content: (
          <div className="h-full overflow-auto p-4">
            <CommentsPanel
              appSlug="base"
              dataSource="organization"
              recordId={companyId!}
            />
          </div>
        ),
      },
      {
        value: 'files',
        label: t('companies.tabs.files'),
        icon: <FileText className="size-3.5" />,
        bare: true,
        content: (
          <div className="h-full overflow-auto p-4">
            <FileAttachments
              appSlug="base"
              dataSource="organization"
              recordId={companyId!}
            />
          </div>
        ),
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    t,
    company?.industry,
    contacts,
    contactsLoading,
    deals,
    dealsLoading,
    leads,
    leadsLoading,
    events,
    eventsLoading,
    companyId,
  ])

  const attributeActions = (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-[13px]"
        onClick={() => handleTabChange('notes')}
      >
        <StickyNote className="size-3.5" />
        {t('contacts.actions.note', { defaultValue: 'Note' })}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-[13px]"
        disabled={!company?.email}
        onClick={() => company?.email && window.open(`mailto:${company.email}`)}
      >
        <Mail className="size-3.5" />
        {t('contacts.actions.email', { defaultValue: 'Email' })}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-[13px]"
        disabled={!company?.website}
        onClick={() =>
          company?.website && window.open(company.website, '_blank')
        }
      >
        <Globe className="size-3.5" />
        {t('companies.website')}
      </Button>
    </>
  )

  const dialerTrigger = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open dialer"
          className="flex size-8 shrink-0 items-center justify-center rounded-md border text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
        >
          <Phone className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {t('companies.callContact', { defaultValue: 'Call a contact' })}
        </DropdownMenuLabel>
        {contactsWithPhone.length === 0 ? (
          <DropdownMenuItem disabled>
            {t('companies.noContactPhones', {
              defaultValue: 'No contact phone numbers',
            })}
          </DropdownMenuItem>
        ) : (
          contactsWithPhone.map((c: any) => (
            <DropdownMenuItem
              key={c.id}
              onClick={() => dialer.open({ name: c.name, number: c.mobile })}
            >
              <Phone className="size-4 text-emerald-600" />
              <span className="truncate">{c.name}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <PageContainer className="flex h-full min-h-0 flex-col overflow-hidden">
      <RecordDetailLayout
        isLoading={isLoading}
        avatar={
          <Avatar className="size-9 rounded-lg">
            <AvatarFallback className="rounded-lg bg-muted text-xs font-semibold">
              {getInitials(company?.name)}
            </AvatarFallback>
          </Avatar>
        }
        title={companyName}
        subtitle={statusName || extractName(company?.industry)}
        onBack={() => navigate({ to: '/companies' })}
        detailFields={detailFields}
        fieldSlugs={FIELD_SLUGS}
        record={flatRecord}
        onInlineSave={handleInlineSave}
        editTitle={t('common.editAll', { defaultValue: 'Edit All' })}
        attributeActions={attributeActions}
        dialerTrigger={dialerTrigger}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <ContactFormDialog
        open={addContactOpen}
        onOpenChange={setAddContactOpen}
        contact={{ organization: company }}
        mode="create"
      />
    </PageContainer>
  )
}
