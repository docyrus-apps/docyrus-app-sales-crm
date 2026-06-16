/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  Building2,
  CircleDot,
  ClipboardList,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  StickyNote,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  RecordDetailLayout,
  RecordKpiCard,
  RecordTabPlaceholder,
  type RecordDetailTab,
} from '@/components/crm/record-detail-layout'
import { RecordActivityTimeline } from '@/components/crm/record-activity-timeline'
import { useDialer } from '@/components/dialer/dialer-widget'
import { useLead, useUpdateLead } from '@/hooks/use-leads'
import { useRecordEvents } from '@/hooks/use-events'
import { LeadConvertDialog } from '@/components/leads/lead-convert-dialog'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'
import { getRelationId, isLeadConvertedRecord } from '@/lib/lead-conversion'
import {
  type FieldChange,
  type RecordDetailField,
} from '@/components/docyrus/editable-record-detail'
import type { IField } from '@/components/docyrus/form-fields/types'

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
  'company_industry',
  'company_size',
  'address',
  'city',
  'state',
  'countries',
  'record_owner',
  'contact_message',
]

// Slugs that are enum / relation objects — rendered read-only (display name).
const RELATION_SLUGS = new Set([
  'lead_status',
  'lead_source',
  'lead_type',
  'company_industry',
  'company_size',
  'city',
  'state',
  'countries',
  'record_owner',
])

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

export function LeadDetail() {
  const { t } = useTranslation()
  const { leadId } = useParams({ strict: false })
  const { tab } = useSearch({ from: '/leads/$leadId' })
  const navigate = useNavigate({ from: '/leads/$leadId' })
  const { data: lead, isLoading } = useLead(leadId)
  const updateLead = useUpdateLead()
  const dialer = useDialer()
  const [isConvertOpen, setIsConvertOpen] = useState(false)

  const activeTab = tab || 'overview'

  const handleTabChange = (value: string) => {
    void navigate({ search: { tab: value }, replace: true })
  }

  const { data: events = [], isLoading: eventsLoading } = useRecordEvents(
    'lead',
    leadId,
  )

  const detailFields = useMemo<Array<RecordDetailField>>(
    () => [
      {
        field: makeField(
          'name',
          t('leads.form.contactNameLabel', { defaultValue: 'Contact Name' }),
        ),
      },
      { field: makeField('lead_status', t('leads.status')), readOnly: true },
      {
        field: makeField(
          'email',
          t('leads.form.emailLabel', { defaultValue: 'Contact Email' }),
          'field-email',
        ),
      },
      {
        field: makeField(
          'phone',
          t('leads.form.phoneLabel', { defaultValue: 'Contact Phone' }),
          'field-phone',
        ),
      },
      {
        field: makeField(
          'contact_job_title',
          t('leads.form.jobTitleLabel', { defaultValue: 'Contact Job Title' }),
        ),
      },
      { field: makeField('lead_source', t('leads.source')), readOnly: true },
      { field: makeField('lead_type', t('leads.leadType')), readOnly: true },
      {
        field: makeField(
          'company_name_text',
          t('leads.form.companyLabel', { defaultValue: 'Company Name' }),
        ),
      },
      {
        field: makeField(
          'website',
          t('leads.form.websiteLabel', { defaultValue: 'Company Website' }),
          'field-url',
        ),
      },
      {
        field: makeField(
          'company_email',
          t('leads.form.companyEmailLabel', { defaultValue: 'Company Email' }),
          'field-email',
        ),
      },
      {
        field: makeField(
          'company_phone',
          t('leads.form.companyPhoneLabel', { defaultValue: 'Company Phone' }),
          'field-phone',
        ),
      },
      {
        field: makeField(
          'company_industry',
          t('leads.form.companyIndustryLabel', {
            defaultValue: 'Company Industry',
          }),
        ),
        readOnly: true,
      },
      {
        field: makeField(
          'company_size',
          t('leads.form.companySizeLabel', { defaultValue: 'Company Size' }),
        ),
        readOnly: true,
      },
      {
        field: makeField(
          'address',
          t('leads.form.addressLabel', { defaultValue: 'Company Address' }),
          'field-textarea',
        ),
      },
      {
        field: makeField(
          'city',
          t('leads.form.cityLabel', { defaultValue: 'Company City' }),
        ),
        readOnly: true,
      },
      {
        field: makeField(
          'state',
          t('leads.form.stateLabel', { defaultValue: 'Company State' }),
        ),
        readOnly: true,
      },
      {
        field: makeField(
          'countries',
          t('leads.form.countryLabel', { defaultValue: 'Company Country' }),
        ),
        readOnly: true,
      },
      {
        field: makeField(
          'record_owner',
          t('leads.owner', { defaultValue: 'Owner' }),
        ),
        readOnly: true,
      },
      {
        field: makeField(
          'contact_message',
          t('leads.form.qualificationNotesLabel', {
            defaultValue: 'Qualification Notes',
          }),
          'field-textarea',
        ),
      },
    ],
    [t],
  )

  const flatRecord = useMemo<Record<string, unknown>>(() => {
    if (!lead) return {}

    const record: Record<string, unknown> = {}

    for (const slug of FIELD_SLUGS) {
      const raw = (lead as Record<string, unknown>)[slug]

      record[slug] = RELATION_SLUGS.has(slug) ? extractName(raw) : (raw ?? '')
    }

    return record
  }, [lead])

  const isConverted = lead ? isLeadConvertedRecord(lead) : false
  const convertedDealId = getRelationId(lead?.converted_deal)
  const hasPartialConvert =
    !isConverted &&
    Boolean(
      getRelationId(lead?.converted_organization) ||
      getRelationId(lead?.converted_contact) ||
      getRelationId(lead?.converted_deal),
    )

  const handleInlineSave = async (
    changes: Array<FieldChange>,
    _values: Record<string, unknown>,
  ) => {
    if (!leadId || isConverted || changes.length === 0) return

    const payload = Object.fromEntries(
      changes.map((change) => [
        change.fieldSlug,
        change.newValue === '' ? null : change.newValue,
      ]),
    )

    await updateLead.mutateAsync({ leadId, data: payload })
  }

  // Generated entity type omits `name`, present at runtime.
  const leadRecord = lead as (typeof lead & { name?: string }) | undefined
  const leadName =
    leadRecord?.name?.trim() ||
    t('leads.untitledLead', { defaultValue: 'Untitled Lead' })
  const statusName = extractName(lead?.lead_status)

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
                icon={<CircleDot className="size-3.5" />}
              />
              <RecordKpiCard
                label={t('leads.source')}
                value={extractName(lead?.lead_source) || '—'}
              />
              <RecordKpiCard
                label={t('leads.form.companyLabel', {
                  defaultValue: 'Company Name',
                })}
                value={lead?.company_name_text || '—'}
                icon={<Building2 className="size-3.5" />}
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
        label: t('leads.tabs.activity'),
        icon: <Activity className="size-3.5" />,
        content: (
          <RecordActivityTimeline events={events} isLoading={eventsLoading} />
        ),
      },
      {
        value: 'emails',
        label: t('contacts.tabs.emails', { defaultValue: 'Emails' }),
        icon: <Mail className="size-3.5" />,
        content: (
          <RecordTabPlaceholder
            icon={<Mail className="size-5" />}
            title={t('common.notAvailableYet', {
              defaultValue: 'Not available yet',
            })}
            description={t('contacts.emailsComingSoon', {
              defaultValue: 'Email history will appear here once connected.',
            })}
          />
        ),
      },
      {
        value: 'notes',
        label: t('leads.tabs.comments'),
        icon: <MessageSquare className="size-3.5" />,
        bare: true,
        content: (
          <div className="h-full overflow-auto p-4">
            <CommentsPanel
              appSlug="base_crm"
              dataSource="leads"
              recordId={leadId!}
            />
          </div>
        ),
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
              recordId={leadId!}
            />
          </div>
        ),
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    t,
    statusName,
    lead?.lead_source,
    lead?.company_name_text,
    events,
    eventsLoading,
    leadId,
  ])

  const attributeActions = (
    <>
      {!isConverted && (
        <Button
          variant="default"
          size="sm"
          className="h-7 gap-1.5 text-[13px]"
          onClick={() => setIsConvertOpen(true)}
        >
          <RefreshCw className="size-3.5" />
          {hasPartialConvert
            ? t('leads.convert.resumeButton', {
                defaultValue: 'Dönüşüme devam et',
              })
            : t('leads.convert.convertButton')}
        </Button>
      )}
      {isConverted && convertedDealId && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-[13px]"
          onClick={() =>
            navigate({
              to: '/deals/$dealId',
              params: { dealId: convertedDealId },
              search: { tab: 'overview' },
            })
          }
        >
          {t('deals.viewDeal', { defaultValue: 'View deal' })}
        </Button>
      )}
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
        disabled={!lead?.email}
        onClick={() => lead?.email && window.open(`mailto:${lead.email}`)}
      >
        <Mail className="size-3.5" />
        {t('contacts.actions.email', { defaultValue: 'Email' })}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-[13px]"
        disabled={!lead?.phone}
        onClick={() => lead?.phone && window.open(`sms:${lead.phone}`)}
      >
        <MessageSquare className="size-3.5" />
        {t('contacts.actions.sms', { defaultValue: 'SMS' })}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-[13px] text-emerald-600"
        disabled={!lead?.phone}
        onClick={() => dialer.open({ name: leadName, number: lead?.phone })}
      >
        <Phone className="size-3.5" />
        {t('contacts.actions.call', { defaultValue: 'Call' })}
      </Button>
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
        attributeActions={attributeActions}
        readOnly={isConverted}
        dialerTrigger={
          <button
            type="button"
            onClick={() => dialer.open({ name: leadName, number: lead?.phone })}
            aria-label="Call lead"
            className="flex size-8 shrink-0 items-center justify-center rounded-md border text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          >
            <Phone className="size-4" />
          </button>
        }
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <LeadConvertDialog
        open={isConvertOpen}
        onOpenChange={setIsConvertOpen}
        lead={lead}
      />
    </PageContainer>
  )
}
