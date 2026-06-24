import { useMemo, useState } from 'react'

import type { EnumOption, IField } from '@/components/docyrus/form-fields/types'

import { type RecordDetailTab } from '@/components/crm/record-detail-layout'

import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  Building2,
  CircleDot,
  ClipboardList,
  FileText,
  ListTodo,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  StickyNote
} from 'lucide-react'

import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  RecordDetailLayout,
  RecordKpiCard,
  RecordTabPlaceholder
} from '@/components/crm/record-detail-layout'
import { RecordActivityPanel } from '@/components/docyrus/record-activity-panel'
import { RecordTasksPanel } from '@/components/crm/record-tasks-panel'
import { LocationField } from '@/components/crm/location-field'
import { useDialer } from '@/components/dialer/dialer-widget'
import { useWebphone } from '@/components/webphone/webphone-context'
import { useLead, useUpdateLead } from '@/hooks/use-leads'
import { useRecordActivities } from '@/hooks/use-record-activities'
import { useEnumEntities } from '@/hooks/use-enums'
import { useUsers } from '@/hooks/use-users'
import { useContacts } from '@/hooks/use-contacts'
import { LeadConvertDialog } from '@/components/leads/lead-convert-dialog'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'
import { getRelationId, isLeadConvertedRecord } from '@/lib/lead-conversion'
import { useSetDetailBreadcrumbTitle } from '@/lib/detail-breadcrumb'

import {
  type FieldChange,
  type RecordDetailField
} from '@/components/docyrus/editable-record-detail'

const FIELD_SLUGS = [
  'name',
  'lead_status',
  'email',
  'phone',
  'contact_job_title',
  'lead_source',
  'lead_type',
  'company_name_text',
  'website',
  'company_email',
  'company_phone',
  'lead_category',
  'company_industry',
  'company_size',
  'contact_person',
  'address',
  'state',
  'location',
  'record_owner',
  'contact_message'
]

// Enum-backed slugs — editable selects when their options load (value = id).
const ENUM_SLUGS = [
  'lead_status',
  'lead_source',
  'lead_type',
  'lead_category',
  'company_industry',
  'company_size'
] as const

// Relation/user slugs edited as selects — flat record stores the id value.
const ID_RELATION_SLUGS = new Set(['countries', 'record_owner', 'contact_person'])

function makeField(
  slug: string,
  name: string,
  type: IField['type'] = 'field-text'
): IField {
  return {
    id: slug,
    name,
    slug,
    type
  }
}

function extractName(value: unknown): string {
  if (value && typeof value === 'object' && 'name' in value)
    return (value as { name?: string }).name ?? ''
  if (typeof value === 'string') return value

  return ''
}

function toOptions(
  items: Array<{
    id: string;
    name: string;
    color?: string | null;
    icon?: string | null;
  }>
): Array<EnumOption> {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    color: item.color ?? undefined,
    icon: item.icon ?? undefined
  }))
}

function getInitials(value?: string): string {
  if (!value) return '#'

  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('') || '#'
  )
}

export function LeadDetail() {
  const { t } = useTranslation()
  const { leadId } = useParams({ strict: false })
  const { tab } = useSearch({ from: '/leads/$leadId' })
  const navigate = useNavigate({ from: '/leads/$leadId' })
  const { data: lead, isLoading } = useLead(leadId)
  const updateLead = useUpdateLead()
  const dialer = useDialer()
  const webphone = useWebphone()
  const [isConvertOpen, setIsConvertOpen] = useState(false)

  const activeTab = tab || 'overview'

  const handleTabChange = (value: string) => {
    void navigate({ search: { tab: value }, replace: true })
  }

  const { data: activities = [], isLoading: activitiesLoading } =
    useRecordActivities('base_crm', 'leads', leadId)

  const enumOpts = { appSlug: 'base_crm', dataSourceSlug: 'leads' }
  const { data: leadStatusEntities = [] } = useEnumEntities(
    'lead_status',
    enumOpts
  )
  const { data: leadSourceEntities = [] } = useEnumEntities(
    'lead_source',
    enumOpts
  )
  const { data: leadTypeEntities = [] } = useEnumEntities('lead_type', enumOpts)
  const { data: companyIndustryEntities = [] } = useEnumEntities(
    'company_industry',
    enumOpts
  )
  const { data: companySizeEntities = [] } = useEnumEntities(
    'company_size',
    enumOpts
  )
  const { data: leadCategoryEntities = [] } = useEnumEntities(
    'lead_category',
    enumOpts
  )

  const enumEntities = useMemo(
    () => ({
      lead_status: leadStatusEntities,
      lead_source: leadSourceEntities,
      lead_type: leadTypeEntities,
      lead_category: leadCategoryEntities,
      company_industry: companyIndustryEntities,
      company_size: companySizeEntities
    }),
    [
      leadStatusEntities,
      leadSourceEntities,
      leadTypeEntities,
      leadCategoryEntities,
      companyIndustryEntities,
      companySizeEntities
    ]
  )

  const { data: users = [] } = useUsers()
  const { data: contacts = [] } = useContacts({
    columns: ['id', 'name'],
    orderBy: 'name ASC'
  })

  const contactOptions = useMemo<Array<EnumOption>>(
    () => contacts.map((contact: any) => ({
        id: contact.id,
        name: contact.name
      })),
    [contacts]
  )

  const ownerOptions = useMemo<Array<EnumOption>>(
    () => users.map((user: any) => ({
        id: user.id,
        name:
          `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim() ||
          user.email ||
          user.name ||
          user.id
      })),
    [users]
  )

  const detailFields = useMemo<Array<RecordDetailField>>(() => {
    const enumField = (
      slug: (typeof ENUM_SLUGS)[number],
      name: string,
      type: IField['type'] = 'field-select'
    ): RecordDetailField => {
      const entities = enumEntities[slug]
      const editable = entities.length > 0

      return {
        field: makeField(slug, name, editable ? type : 'field-text'),
        enumOptions: toOptions(entities),
        readOnly: !editable
      }
    }

    return [
      {
        field: makeField(
          'name',
          t('leads.form.contactNameLabel', { defaultValue: 'Contact Name' })
        )
      },
      enumField('lead_status', t('leads.status'), 'field-status'),
      {
        field: makeField(
          'email',
          t('leads.form.emailLabel', { defaultValue: 'Contact Email' }),
          'field-email'
        )
      },
      {
        field: makeField(
          'phone',
          t('leads.form.phoneLabel', { defaultValue: 'Contact Phone' }),
          'field-phone'
        )
      },
      {
        field: makeField(
          'contact_job_title',
          t('leads.form.jobTitleLabel', { defaultValue: 'Contact Job Title' })
        )
      },
      enumField('lead_source', t('leads.source')),
      enumField('lead_type', t('leads.leadType')),
      enumField(
        'lead_category',
        t('leads.leadCategory', { defaultValue: 'Lead Category' })
      ),
      {
        field: makeField(
          'contact_person',
          t('leads.contactPerson', { defaultValue: 'Contact Person' }),
          'field-select'
        ),
        enumOptions: contactOptions
      },
      {
        field: makeField(
          'company_name_text',
          t('leads.form.companyLabel', { defaultValue: 'Company Name' })
        )
      },
      {
        field: makeField(
          'website',
          t('leads.form.websiteLabel', { defaultValue: 'Company Website' }),
          'field-url'
        )
      },
      {
        field: makeField(
          'company_email',
          t('leads.form.companyEmailLabel', { defaultValue: 'Company Email' }),
          'field-email'
        )
      },
      {
        field: makeField(
          'company_phone',
          t('leads.form.companyPhoneLabel', { defaultValue: 'Company Phone' }),
          'field-phone'
        )
      },
      enumField(
        'company_industry',
        t('leads.form.companyIndustryLabel', {
          defaultValue: 'Company Industry'
        })
      ),
      enumField(
        'company_size',
        t('leads.form.companySizeLabel', { defaultValue: 'Company Size' })
      ),
      {
        field: makeField(
          'address',
          t('leads.form.addressLabel', { defaultValue: 'Company Address' }),
          'field-textarea'
        )
      },
      {
        field: makeField(
          'state',
          t('leads.form.stateLabel', { defaultValue: 'Company State' })
        )
      },
      {
        field: makeField(
          'location',
          t('companies.location', { defaultValue: 'Location' }),
          'field-locationSelect'
        )
      },
      {
        field: makeField(
          'record_owner',
          t('leads.owner', { defaultValue: 'Owner' }),
          'field-select'
        ),
        enumOptions: ownerOptions
      },
      {
        field: makeField(
          'contact_message',
          t('leads.form.qualificationNotesLabel', {
            defaultValue: 'Qualification Notes'
          }),
          'field-textarea'
        )
      }
    ]
  }, [
t,
enumEntities,
ownerOptions,
contactOptions
])

  const flatRecord = useMemo<Record<string, unknown>>(() => {
    if (!lead) return {}

    const record: Record<string, unknown> = {}

    for (const slug of FIELD_SLUGS) {
      const raw = (lead as Record<string, unknown>)[slug]

      if ((ENUM_SLUGS as ReadonlyArray<string>).includes(slug)) {
        const entities = enumEntities[slug as (typeof ENUM_SLUGS)[number]]

        // Editable enum → store the id (select value); otherwise show the name.
        record[slug] =
          entities.length > 0 ? (getRelationId(raw) ?? '') : extractName(raw)
      } else if (ID_RELATION_SLUGS.has(slug)) {
        // Relation/user select → store the id.
        record[slug] = getRelationId(raw) ?? ''
      } else {
        record[slug] = raw ?? ''
      }
    }

    /*
     * "location" is a synthetic row — expose its underlying fields so
     * LocationField can read the country relation + city.
     */
    record.countries = lead.countries ?? null
    record.city = lead.city ?? ''

    return record
  }, [lead, enumEntities])

  const isConverted = lead ? isLeadConvertedRecord(lead) : false
  const convertedDealId = getRelationId(lead?.converted_deal)
  const hasPartialConvert =
    !isConverted &&
    Boolean(
      getRelationId(lead?.converted_organization) ||
      getRelationId(lead?.converted_contact) ||
      getRelationId(lead?.converted_deal)
    )

  const handleInlineSave = async (
    changes: Array<FieldChange>,
    _values: Record<string, unknown>
  ) => {
    if (!leadId || isConverted || changes.length === 0) return

    const payload = Object.fromEntries(
      changes.map(change => [change.fieldSlug, change.newValue === '' ? null : change.newValue])
    )

    await updateLead.mutateAsync({ leadId, data: payload })
  }

  // Generated entity type omits `name`, present at runtime.
  const leadRecord = lead
  const leadName =
    leadRecord?.name?.trim() ||
    t('leads.untitledLead', { defaultValue: 'Untitled Lead' })
  const statusName = extractName(lead?.lead_status)

  useSetDetailBreadcrumbTitle(leadRecord ? leadName : null)

  const tabs = useMemo<Array<RecordDetailTab>>(() => {
    return [
      {
        value: 'overview',
        label: t('leads.tabs.overview'),
        icon: <ClipboardList className="size-3.5" />,
        content: (
          <div className="space-y-5">
            <div className="grid gap-2.5 sm:grid-cols-3">
              <RecordKpiCard
                label={t('leads.status')}
                value={statusName || '—'}
                icon={<CircleDot className="size-3.5" />} />
              <RecordKpiCard
                label={t('leads.source')}
                value={extractName(lead?.lead_source) || '—'} />
              <RecordKpiCard
                label={t('leads.form.companyLabel', {
                  defaultValue: 'Company Name'
                })}
                value={lead?.company_name_text || '—'}
                icon={<Building2 className="size-3.5" />} />
            </div>

            <div className="rounded-xl border p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold">
                  {t('contacts.recentActivity', {
                    defaultValue: 'Recent activity'
                  })}
                </h3>
                <button
                  type="button"
                  onClick={() => handleTabChange('activity')}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  {t('common.viewAll', { defaultValue: 'View all' })}
                </button>
              </div>
              <RecordActivityPanel
                activities={activities.slice(0, 2)}
                isLoading={activitiesLoading} />
            </div>
          </div>
        )
      },
      {
        value: 'activity',
        label: t('leads.tabs.activity'),
        icon: <Activity className="size-3.5" />,
        content: (
          <RecordActivityPanel
            activities={activities}
            isLoading={activitiesLoading}
            filterable />
        )
      },
      {
        value: 'emails',
        label: t('contacts.tabs.emails', { defaultValue: 'Emails' }),
        icon: <Mail className="size-3.5" />,
        content: (
          <RecordTabPlaceholder
            icon={<Mail className="size-5" />}
            title={t('common.notAvailableYet', {
              defaultValue: 'Not available yet'
            })}
            description={t('contacts.emailsComingSoon', {
              defaultValue: 'Email history will appear here once connected.'
            })} />
        )
      },
      {
        value: 'comments',
        label: t('leads.tabs.comments'),
        icon: <MessageSquare className="size-3.5" />,
        bare: true,
        content: (
          <div className="h-full overflow-auto p-4">
            <CommentsPanel
              appSlug="base_crm"
              dataSource="leads"
              recordId={leadId!} />
          </div>
        )
      },
      {
        value: 'notes',
        label: t('leads.tabs.notes', { defaultValue: 'Notes' }),
        icon: <StickyNote className="size-3.5" />,
        content: (
          <RecordTabPlaceholder
            icon={<StickyNote className="size-5" />}
            title={t('common.comingSoon', { defaultValue: 'Coming soon' })}
            description={t('common.notesComingSoon', {
              defaultValue: 'Notes will be available here soon.'
            })} />
        )
      },
      {
        value: 'tasks',
        label: t('leads.tabs.tasks', { defaultValue: 'Tasks' }),
        icon: <ListTodo className="size-3.5" />,
        bare: true,
        content: <RecordTasksPanel parentField="lead" parentId={leadId} />
      },
      {
        value: 'files',
        label: t('leads.tabs.files'),
        icon: <FileText className="size-3.5" />,
        bare: true,
        content: (
          <div className="h-full overflow-auto p-4">
            <FileAttachments
              appSlug="base_crm"
              dataSource="leads"
              recordId={leadId!} />
          </div>
        )
      }
    ]
  }, [
    t,
    statusName,
    lead?.lead_source,
    lead?.company_name_text,
    activities,
    activitiesLoading,
    leadId
  ])

  /*
   * Open the webphone call composer with the lead's own number(s): the direct
   * phone plus the company line when present, both linked back to this lead.
   */
  const openCallComposer = () => dialer.open({
      recordLabel: leadName,
      targets: [
        { label: leadName, number: lead?.phone, leadId },
        ...(lead?.company_phone
          ? [
              {
                label: lead?.company_name_text || leadName,
                sublabel: t('webphone.dialer.companyLine', {
                  defaultValue: 'Company'
                }),
                number: lead.company_phone,
                leadId
              }
            ]
          : [])
      ]
    })

  const attributeActions = (
    <>
      {!isConverted && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-[13px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-300"
          onClick={() => setIsConvertOpen(true)}>
          <RefreshCw className="size-3.5" />
          {hasPartialConvert
            ? t('leads.convert.resumeButton')
            : t('leads.convert.convertButton')}
        </Button>
      )}
      {isConverted && convertedDealId && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-[13px]"
          onClick={() => navigate({
              to: '/deals/$dealId',
              params: { dealId: convertedDealId },
              search: { tab: 'overview' }
            })}>
          {t('deals.viewDeal', { defaultValue: 'View deal' })}
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-[13px]"
        onClick={() => handleTabChange('notes')}>
        <StickyNote className="size-3.5" />
        {t('contacts.actions.note', { defaultValue: 'Note' })}
      </Button>
      <div className="ml-auto flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={!lead?.email}
          onClick={() => lead?.email && window.open(`mailto:${lead.email}`)}
          aria-label={t('contacts.actions.email', { defaultValue: 'Email' })}
          title={t('contacts.actions.email', { defaultValue: 'Email' })}>
          <Mail className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={!lead?.phone}
          onClick={() => lead?.phone && window.open(`sms:${lead.phone}`)}
          aria-label={t('contacts.actions.sms', { defaultValue: 'SMS' })}
          title={t('contacts.actions.sms', { defaultValue: 'SMS' })}>
          <MessageSquare className="size-3.5" />
        </Button>
        {webphone.enabled && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-emerald-600"
            onClick={openCallComposer}
            aria-label={t('contacts.actions.call', { defaultValue: 'Call' })}
            title={t('contacts.actions.call', { defaultValue: 'Call' })}>
            <Phone className="size-3.5" />
          </Button>
        )}
      </div>
    </>
  )

  return (
    <PageContainer className="flex h-full min-h-0 flex-col overflow-hidden pt-0 pb-0">
      <RecordDetailLayout
        isLoading={isLoading}
        avatar={
          <Avatar className="size-9 rounded-lg">
            <AvatarFallback className="rounded-lg bg-muted text-xs font-semibold">
              {getInitials(leadRecord?.name)}
            </AvatarFallback>
          </Avatar>
        }
        title={leadName}
        subtitle={statusName || lead?.company_name_text}
        onBack={() => navigate({ to: '/leads' })}
        detailFields={detailFields}
        fieldSlugs={FIELD_SLUGS}
        record={flatRecord}
        onInlineSave={handleInlineSave}
        editTitle={t('common.editAll', { defaultValue: 'Edit All' })}
        fieldRenderers={{
          location: ({ record, save, readOnly }) => (
            <LocationField
              record={record}
              onSave={save}
              countryField="countries"
              readOnly={readOnly} />
          )
        }}
        attributeActions={attributeActions}
        attributeNotice={
          isConverted ? (
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-[12px] text-muted-foreground">
              <Lock className="size-3.5 shrink-0" />
              <span>
                {t('leads.convert.readOnlyNotice', {
                  defaultValue: 'Bu lead dönüştürüldü, alanlar salt okunur.'
                })}
              </span>
            </div>
          ) : null
        }
        readOnly={isConverted}
        dialerTrigger={
          webphone.enabled ? (
            <button
              type="button"
              onClick={openCallComposer}
              aria-label={t('common.callLead')}
              className="flex size-8 shrink-0 items-center justify-center rounded-md border text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30">
              <Phone className="size-4" />
            </button>
          ) : undefined
        }
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange} />

      <LeadConvertDialog
        open={isConvertOpen}
        onOpenChange={setIsConvertOpen}
        lead={lead} />
    </PageContainer>
  )
}
