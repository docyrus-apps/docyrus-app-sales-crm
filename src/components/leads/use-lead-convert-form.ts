import { useEffect, useState } from 'react'
import type { LeadConvertForm } from '@/components/leads/lead-convert-tabs'

const SEARCH_RELEVANT_FIELDS = new Set<keyof LeadConvertForm>([
  'companyName',
  'companyWebsite',
  'companyPhone',
  'contactName',
  'contactEmail',
  'contactPhone',
])

function buildSourceDealName(lead: any, t: (key: string) => string): string {
  return (
    [lead?.company_name_text, lead?.name].filter(Boolean).join(' - ') ||
    lead?.name ||
    t('leads.convert.dealDefaultName')
  )
}

function buildInitialForm(
  lead: any,
  t: (key: string) => string,
): LeadConvertForm {
  return {
    companyName: lead?.company_name_text || '',
    companyWebsite: lead?.website || '',
    companyEmail: lead?.company_email || '',
    companyPhone: lead?.company_phone || '',
    companyAddress: lead?.address || '',
    companyCity: lead?.city || '',
    companyIndustry: '',
    companySize: '',
    contactName: lead?.name || '',
    contactEmail: lead?.email || '',
    contactPhone: lead?.phone || '',
    contactJobTitle: lead?.contact_job_title || '',
    dealName: buildSourceDealName(lead, t),
    dealValue: lead?.deal_value ? String(lead.deal_value) : '',
    notes: lead?.contact_message || '',
    dealStageId: '',
    dealLeadSourceId: '',
    dealCustomerTypeId: '',
  }
}

export interface UseLeadConvertFormOptions {
  lead: any
  t: (key: string) => string
  /**
   * Whether the convert dialog is open. The form is re-seeded from the lead
   * whenever the dialog opens (or the lead identity changes while open) so that
   * text fields are pre-filled even when the dialog stays mounted while the
   * lead is still loading (e.g. on the lead detail page).
   */
  open?: boolean
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
  open = true,
  onSearchRelevantChange,
}: UseLeadConvertFormOptions): UseLeadConvertFormResult {
  const [form, setForm] = useState<LeadConvertForm>(() =>
    buildInitialForm(lead, t),
  )

  const leadId = lead?.id
  useEffect(() => {
    if (!open) return
    // Re-seed from the (now loaded) lead each time the dialog opens or the
    // lead identity changes. Editing within an open session is preserved
    // because this only fires on open/leadId transitions.
    setForm(buildInitialForm(lead, t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId])

  const updateForm = (key: keyof LeadConvertForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (SEARCH_RELEVANT_FIELDS.has(key)) {
      onSearchRelevantChange?.()
    }
  }

  const sourceDealName = buildSourceDealName(lead, t)

  return { form, updateForm, sourceDealName }
}
