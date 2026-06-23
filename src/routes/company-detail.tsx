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
  ListTodo,
  Mail,
  MessageSquare,
  Phone,
  StickyNote,
  Users,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { CompanyLogoAvatar } from '@/components/companies/company-logo-avatar'
import {
  RecordDetailLayout,
  RecordKpiCard,
  RecordTabPlaceholder,
  type RecordDetailTab,
} from '@/components/crm/record-detail-layout'
import { RelatedContactsTable } from '@/components/crm/related-contacts-table'
import { RelatedDealsTable } from '@/components/crm/related-deals-table'
import { RelatedQuotesTable } from '@/components/crm/related-quotes-table'
import { RecordActivityPanel } from '@/components/docyrus/record-activity-panel'
import { RecordTasksPanel } from '@/components/crm/record-tasks-panel'
import { LocationField } from '@/components/crm/location-field'
import { useDialer } from '@/components/dialer/dialer-widget'
import { useWebphone } from '@/components/webphone/webphone-context'
import { useCompany, useUpdateCompany } from '@/hooks/use-companies'
import { useContacts } from '@/hooks/use-contacts'
import { useDeals } from '@/hooks/use-deals'
import { useSalesOrders } from '@/hooks/use-sales-orders'
import { useLeads } from '@/hooks/use-leads'
import { useEnumEntities } from '@/hooks/use-enums'
import { useSetDetailBreadcrumbTitle } from '@/lib/detail-breadcrumb'
import { useRecordActivities } from '@/hooks/use-record-activities'
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
  'commercial_title',
  'industry',
  'type',
  'status',
  'lifecycle_stage',
  'email',
  'phone',
  'website',
  'address',
  'location',
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
  const webphone = useWebphone()
  const [addContactOpen, setAddContactOpen] = useState(false)

  const activeTab = tab || 'overview'

  const handleTabChange = (value: string) => {
    void navigate({ search: { tab: value }, replace: true })
  }

  const enumOpts = { appSlug: 'base', dataSourceSlug: 'organization' }
  const { data: statusEntities = [] } = useEnumEntities('status', enumOpts)
  const { data: typeEntities = [] } = useEnumEntities('type', enumOpts)
  const { data: industryEntities = [] } = useEnumEntities('industry', enumOpts)
  const { data: lifecycleEntities = [] } = useEnumEntities(
    'lifecycle_stage',
    enumOpts,
  )

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

  const { data: companyQuotes = [], isLoading: quotesLoading } = useSalesOrders(
    companyId
      ? {
          columns: ['id', 'status', 'grand_total', 'created_on'],
          filters: {
            rules: [{ field: 'organization', operator: '=', value: companyId }],
          },
          orderBy: 'created_on DESC',
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

  const { data: activities = [], isLoading: activitiesLoading } =
    useRecordActivities('base', 'organization', companyId)

  const statusEditable = statusEntities.length > 0
  const typeEditable = typeEntities.length > 0
  const industryEditable = industryEntities.length > 0
  const lifecycleEditable = lifecycleEntities.length > 0

  const detailFields = useMemo<Array<RecordDetailField>>(
    () => [
      { field: makeField('name', t('companies.name')) },
      {
        field: makeField(
          'commercial_title',
          t('companies.commercialTitle', { defaultValue: 'Commercial Title' }),
        ),
      },
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
      {
        field: makeField(
          'lifecycle_stage',
          t('companies.lifecycleStage', { defaultValue: 'Lifecycle Stage' }),
          lifecycleEditable ? 'field-select' : 'field-text',
        ),
        enumOptions: toOptions(lifecycleEntities),
        readOnly: !lifecycleEditable,
      },
      { field: makeField('email', t('companies.email'), 'field-email') },
      { field: makeField('phone', t('companies.phone'), 'field-phone') },
      { field: makeField('website', t('companies.website'), 'field-url') },
      { field: makeField('address', t('companies.address')) },
      {
        field: makeField(
          'location',
          t('companies.location', { defaultValue: 'Location' }),
          'field-locationSelect',
        ),
      },
      { field: makeField('district', t('companies.district')) },
      { field: makeField('tax_number', t('companies.taxNumber')) },
    ],
    [
      t,
      statusEditable,
      typeEditable,
      industryEditable,
      lifecycleEditable,
      statusEntities,
      typeEntities,
      industryEntities,
      lifecycleEntities,
    ],
  )

  const flatRecord = useMemo<Record<string, unknown>>(() => {
    if (!company) return {}

    return {
      name: company.name ?? '',
      commercial_title: company.commercial_title ?? '',
      industry: industryEditable
        ? fieldId(company.industry)
        : extractName(company.industry),
      type: typeEditable ? fieldId(company.type) : extractName(company.type),
      status: statusEditable
        ? fieldId(company.status)
        : extractName(company.status),
      lifecycle_stage: lifecycleEditable
        ? fieldId(company.lifecycle_stage)
        : extractName(company.lifecycle_stage),
      email: company.email ?? '',
      phone: company.phone ?? '',
      website: company.website ?? '',
      address: company.address ?? '',
      country: company.country ?? null,
      city: extractName(company.city),
      district: company.district ?? '',
      tax_number: company.tax_number ?? '',
    }
  }, [
    company,
    statusEditable,
    typeEditable,
    industryEditable,
    lifecycleEditable,
  ])

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

  useSetDetailBreadcrumbTitle(company ? companyName : null)

  const companyLogoUrl =
    company?.company_logo && typeof company.company_logo === 'object'
      ? ((company.company_logo as { signed_url?: string }).signed_url ??
        undefined)
      : undefined
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
              <RecordActivityPanel
                activities={activities.slice(0, 2)}
                isLoading={activitiesLoading}
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
          <RecordActivityPanel
            activities={activities}
            isLoading={activitiesLoading}
            filterable
          />
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
            onCall={(c) =>
              webphone.enabled
                ? dialer.open({
                    recordLabel: c.name,
                    targets: [
                      {
                        label: c.name ?? c.mobile ?? '',
                        sublabel: c.job_title || undefined,
                        number: c.mobile,
                        contactId: c.id,
                      },
                    ],
                  })
                : c.mobile && window.open(`tel:${c.mobile}`)
            }
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
        value: 'quotes',
        label: t('quotes.tabLabel', { defaultValue: 'Quotes' }),
        icon: <FileText className="size-3.5" />,
        count: companyQuotes.length,
        bare: true,
        content: (
          <RelatedQuotesTable
            quotes={companyQuotes as any}
            isLoading={quotesLoading}
            onOpenQuote={(id) =>
              navigate({ to: '/quotes/$quoteId', params: { quoteId: id } })
            }
            onNewQuote={() =>
              navigate({
                to: '/quotes/new',
                search: {
                  organization: companyId,
                  organizationName: company?.name,
                },
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
        value: 'comments',
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
        value: 'notes',
        label: t('companies.tabs.notes', { defaultValue: 'Notes' }),
        icon: <StickyNote className="size-3.5" />,
        content: (
          <RecordTabPlaceholder
            icon={<StickyNote className="size-5" />}
            title={t('common.comingSoon', { defaultValue: 'Coming soon' })}
            description={t('common.notesComingSoon', {
              defaultValue: 'Notes will be available here soon.',
            })}
          />
        ),
      },
      {
        value: 'tasks',
        label: t('companies.tabs.tasks', { defaultValue: 'Tasks' }),
        icon: <ListTodo className="size-3.5" />,
        bare: true,
        content: (
          <RecordTasksPanel parentField="organization" parentId={companyId} />
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
    companyQuotes,
    quotesLoading,
    company?.name,
    leads,
    leadsLoading,
    activities,
    activitiesLoading,
    companyId,
  ])

  // Open the webphone call composer with the company's main line plus any
  // related contacts that have a number; the composer handles the picker.
  const openCallComposer = () =>
    dialer.open({
      recordLabel: companyName,
      targets: [
        ...(company?.phone
          ? [
              {
                label: companyName,
                sublabel: t('webphone.dialer.mainLine', {
                  defaultValue: 'Main line',
                }),
                number: company.phone,
              },
            ]
          : []),
        ...contactsWithPhone.map((c: any) => ({
          label: c.name,
          sublabel: c.job_title || undefined,
          number: c.mobile,
          contactId: c.id,
        })),
      ],
    })

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
      <div className="ml-auto flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={!company?.email}
          onClick={() =>
            company?.email && window.open(`mailto:${company.email}`)
          }
          aria-label={t('contacts.actions.email', { defaultValue: 'Email' })}
          title={t('contacts.actions.email', { defaultValue: 'Email' })}
        >
          <Mail className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={!company?.phone}
          onClick={() => company?.phone && window.open(`sms:${company.phone}`)}
          aria-label={t('contacts.actions.sms', { defaultValue: 'SMS' })}
          title={t('contacts.actions.sms', { defaultValue: 'SMS' })}
        >
          <MessageSquare className="size-3.5" />
        </Button>
        {webphone.enabled && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-emerald-600"
            onClick={openCallComposer}
            aria-label={t('contacts.actions.call', { defaultValue: 'Call' })}
            title={t('contacts.actions.call', { defaultValue: 'Call' })}
          >
            <Phone className="size-3.5" />
          </Button>
        )}
      </div>
    </>
  )

  const dialerTrigger = webphone.enabled ? (
    <button
      type="button"
      onClick={openCallComposer}
      aria-label={t('common.openDialer')}
      className="flex size-8 shrink-0 items-center justify-center rounded-md border text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
    >
      <Phone className="size-4" />
    </button>
  ) : undefined

  return (
    <PageContainer className="flex h-full min-h-0 flex-col overflow-hidden pt-0 pb-0">
      <RecordDetailLayout
        isLoading={isLoading}
        avatar={
          <CompanyLogoAvatar
            companyId={companyId}
            name={company?.name}
            logoUrl={companyLogoUrl}
          />
        }
        title={companyName}
        subtitle={statusName || extractName(company?.industry)}
        onBack={() => navigate({ to: '/companies' })}
        detailFields={detailFields}
        fieldSlugs={FIELD_SLUGS}
        record={flatRecord}
        onInlineSave={handleInlineSave}
        editTitle={t('common.editAll', { defaultValue: 'Edit All' })}
        fieldRenderers={{
          location: ({ record, save }) => (
            <LocationField record={record} onSave={save} />
          ),
        }}
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
