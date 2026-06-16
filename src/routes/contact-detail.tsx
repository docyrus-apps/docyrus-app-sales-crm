/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useMemo } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  Briefcase,
  Building2,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  StickyNote,
  User,
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
import { RelatedDealsTable } from '@/components/crm/related-deals-table'
import { RecordActivityTimeline } from '@/components/crm/record-activity-timeline'
import { useDialer } from '@/components/dialer/dialer-widget'
import { useContact, useUpdateContact } from '@/hooks/use-contacts'
import { useCompanies } from '@/hooks/use-companies'
import { useDeals } from '@/hooks/use-deals'
import { useRecordEvents } from '@/hooks/use-events'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'
import {
  type FieldChange,
  type RecordDetailField,
} from '@/components/docyrus/editable-record-detail'
import type { IField } from '@/components/docyrus/form-fields/types'

const FIELD_SLUGS = ['name', 'job_title', 'email', 'mobile', 'organization']

function makeField(
  slug: string,
  name: string,
  type: IField['type'] = 'field-text',
): IField {
  return { id: slug, name, slug, type }
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

function relationId(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'object' && 'id' in value)
    return (value as { id?: string }).id ?? null

  return typeof value === 'string' ? value : null
}

function relationName(value: unknown): string | undefined {
  if (value && typeof value === 'object' && 'name' in value)
    return (value as { name?: string }).name
  if (typeof value === 'string') return value

  return undefined
}

export function ContactDetail() {
  const { t } = useTranslation()
  const { contactId } = useParams({ strict: false })
  const { tab } = useSearch({ from: '/contacts/$contactId' })
  const navigate = useNavigate({ from: '/contacts/$contactId' })
  const { data: contact, isLoading } = useContact(contactId)
  const updateContact = useUpdateContact()
  const dialer = useDialer()

  const activeTab = tab || 'overview'

  const handleTabChange = (value: string) => {
    void navigate({ search: { tab: value }, replace: true })
  }

  const { data: companies = [] } = useCompanies({
    columns: ['id', 'name'],
    orderBy: 'name ASC',
  })

  const { data: deals = [], isLoading: dealsLoading } = useDeals(
    contactId
      ? {
          columns: [
            'id',
            'name',
            'stage',
            'deal_value',
            'expected_closing_date',
          ],
          filters: {
            rules: [
              { field: 'contact_person', operator: '=', value: contactId },
            ],
          },
          orderBy: 'created_on desc',
        }
      : undefined,
  )

  const { data: events = [], isLoading: eventsLoading } = useRecordEvents(
    'contact',
    contactId,
  )

  const detailFields = useMemo<Array<RecordDetailField>>(
    () => [
      { field: makeField('name', t('contacts.name')) },
      { field: makeField('job_title', t('contacts.jobTitle')) },
      { field: makeField('email', t('contacts.email'), 'field-email') },
      { field: makeField('mobile', t('contacts.mobile'), 'field-phone') },
      {
        field: makeField(
          'organization',
          t('contacts.organization'),
          'field-select',
        ),
        enumOptions: companies.map((company: any) => ({
          id: company.id,
          name: company.name,
        })),
      },
    ],
    [t, companies],
  )

  const flatRecord = useMemo<Record<string, unknown>>(() => {
    if (!contact) return {}

    return {
      name: contact.name ?? '',
      job_title: contact.job_title ?? '',
      email: contact.email ?? '',
      mobile: contact.mobile ?? '',
      organization: relationId(contact.organization),
    }
  }, [contact])

  const handleInlineSave = async (
    changes: Array<FieldChange>,
    _values: Record<string, unknown>,
  ) => {
    if (!contactId || changes.length === 0) return

    const payload = Object.fromEntries(
      changes.map((change) => [
        change.fieldSlug,
        change.newValue === '' ? null : change.newValue,
      ]),
    )

    await updateContact.mutateAsync({ contactId, data: payload })
  }

  const organizationName = relationName(contact?.organization)
  const contactName =
    contact?.name?.trim() ||
    t('contacts.untitled', {
      defaultValue: 'Untitled Contact',
    })

  const tabs = useMemo<Array<RecordDetailTab>>(() => {
    return [
      {
        value: 'overview',
        label: t('contacts.tabs.overview'),
        icon: <User className="size-3.5" />,
        content: (
          <div className="space-y-5">
            <div className="grid gap-2.5 sm:grid-cols-3">
              <RecordKpiCard
                label={t('contacts.organization')}
                value={organizationName ?? '—'}
                icon={<Building2 className="size-3.5" />}
              />
              <RecordKpiCard
                label={t('contacts.tabs.deals', { defaultValue: 'Deals' })}
                value={deals.length}
                icon={<Briefcase className="size-3.5" />}
              />
              <RecordKpiCard
                label={t('contacts.jobTitle')}
                value={contact?.job_title || '—'}
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
        label: t('contacts.tabs.activity'),
        icon: <Activity className="size-3.5" />,
        content: (
          <RecordActivityTimeline events={events} isLoading={eventsLoading} />
        ),
      },
      {
        value: 'deals',
        label: t('contacts.tabs.deals', { defaultValue: 'Deals' }),
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
        label: t('contacts.tabs.comments'),
        icon: <MessageSquare className="size-3.5" />,
        bare: true,
        content: (
          <div className="h-full overflow-auto p-4">
            <CommentsPanel
              appSlug="base"
              dataSource="contact"
              recordId={contactId!}
            />
          </div>
        ),
      },
      {
        value: 'files',
        label: t('contacts.tabs.files'),
        icon: <FileText className="size-3.5" />,
        bare: true,
        content: (
          <div className="h-full overflow-auto p-4">
            <FileAttachments
              appSlug="base"
              dataSource="contact"
              recordId={contactId!}
            />
          </div>
        ),
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    t,
    organizationName,
    deals,
    dealsLoading,
    events,
    eventsLoading,
    contact?.job_title,
    contactId,
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
        disabled={!contact?.email}
        onClick={() => contact?.email && window.open(`mailto:${contact.email}`)}
      >
        <Mail className="size-3.5" />
        {t('contacts.actions.email', { defaultValue: 'Email' })}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-[13px]"
        disabled={!contact?.mobile}
        onClick={() => contact?.mobile && window.open(`sms:${contact.mobile}`)}
      >
        <MessageSquare className="size-3.5" />
        {t('contacts.actions.sms', { defaultValue: 'SMS' })}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-[13px] text-emerald-600"
        onClick={() =>
          dialer.open({ name: contactName, number: contact?.mobile })
        }
      >
        <Phone className="size-3.5" />
        {t('contacts.actions.call', { defaultValue: 'Call' })}
      </Button>
    </>
  )

  return (
    <PageContainer className="flex h-full min-h-0 flex-col overflow-hidden">
      <RecordDetailLayout
        isLoading={isLoading}
        avatar={
          <Avatar className="size-9 rounded-lg">
            <AvatarFallback className="rounded-lg bg-muted text-xs font-semibold">
              {getInitials(contact?.name)}
            </AvatarFallback>
          </Avatar>
        }
        title={contactName}
        subtitle={contact?.job_title || organizationName}
        onBack={() => navigate({ to: '/contacts' })}
        detailFields={detailFields}
        fieldSlugs={FIELD_SLUGS}
        record={flatRecord}
        onInlineSave={handleInlineSave}
        editTitle={t('common.editAll', { defaultValue: 'Edit All' })}
        attributeActions={attributeActions}
        dialerTrigger={
          <button
            type="button"
            onClick={() =>
              dialer.open({ name: contactName, number: contact?.mobile })
            }
            aria-label="Call contact"
            className="flex size-8 shrink-0 items-center justify-center rounded-md border text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          >
            <Phone className="size-4" />
          </button>
        }
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </PageContainer>
  )
}
