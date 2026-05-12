import { useState } from 'react'
import { getRelationId } from '@/lib/lead-conversion'
import type { LeadConvertForm } from '@/components/leads/lead-convert-tabs'

const SEARCH_RELEVANT_FIELDS = new Set<keyof LeadConvertForm>([
  'companyName',
  'companyWebsite',
  'companyPhone',
  'contactName',
  'contactEmail',
  'contactPhone',
])

export interface UseLeadConvertFormOptions {
  lead: any
  t: (key: string) => string
  onSearchRelevantChange?: () => void
}

export interface UseLeadConvertFormResult {
  form: LeadConvertForm
  updateForm: (key: keyof LeadConvertForm, value: string) => void
  sourceDealName: string
}

export function useLeadConvertForm({
  lead,
  t,
  onSearchRelevantChange,
}: UseLeadConvertFormOptions): UseLeadConvertFormResult {
  const [form, setForm] = useState<LeadConvertForm>(() => ({
    companyName: lead?.company_name_text || '',
    companyWebsite: lead?.website || '',
    companyEmail: lead?.company_email || '',
    companyPhone: lead?.company_phone || '',
    companyAddress: lead?.address || '',
    companyCity: lead?.city || '',
    companyIndustry: '',
    companySize: '',
    companyCountry: getRelationId(lead?.countries) || '',
    contactName: lead?.name || '',
    contactEmail: lead?.email || '',
    contactPhone: lead?.phone || '',
    contactJobTitle: lead?.contact_job_title || '',
    dealName:
      [lead?.company_name_text, lead?.name].filter(Boolean).join(' - ') ||
      lead?.name ||
      t('leads.convert.dealDefaultName'),
    dealValue: lead?.deal_value ? String(lead.deal_value) : '',
    notes: lead?.contact_message || '',
    dealStageId: '',
    dealLeadSourceId: '',
    dealCustomerTypeId: '',
    dealCountry: getRelationId(lead?.countries) || '',
    dealOwner: getRelationId(lead?.record_owner) || '',
  }))

  const updateForm = (key: keyof LeadConvertForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (SEARCH_RELEVANT_FIELDS.has(key)) {
      onSearchRelevantChange?.()
    }
  }

  const sourceDealName =
    [lead?.company_name_text, lead?.name].filter(Boolean).join(' - ') ||
    lead?.name ||
    t('leads.convert.dealDefaultName')

  return { form, updateForm, sourceDealName }
}
