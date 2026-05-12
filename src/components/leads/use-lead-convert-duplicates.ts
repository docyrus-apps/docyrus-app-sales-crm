import { useEffect, useRef, useState } from 'react'
import type {
  LeadConvertConversionMode,
  LeadConvertEntityCandidate,
  LeadConvertForm,
} from '@/components/leads/lead-convert-tabs'
import {
  getErrorMessage,
  isAbortLikeError,
  logLeadConvertEvent,
  makeStepDetail,
  normalize,
  normalizeDomain,
  normalizePhone,
  sanitizeKeyword,
  unwrapItems,
  type LeadConvertPrecheckTargetSummary,
  type LeadConvertStepDetail,
  type LeadConvertStepState,
} from '@/components/leads/lead-convert-utils'

type DocyrusClient = any

export type LeadConvertPrecheckSummary = {
  company: LeadConvertPrecheckTargetSummary
  contact: LeadConvertPrecheckTargetSummary
  deal: LeadConvertPrecheckTargetSummary
}

export interface UseLeadConvertDuplicatesOptions {
  client: DocyrusClient | null
  lead: any
  t: (key: string, params?: Record<string, unknown>) => string
  setIsWorking: (working: boolean) => void
  setStep: (key: 'precheck', state: LeadConvertStepState) => void
  setStepDetail: (
    key: 'precheck',
    details: Array<LeadConvertStepDetail>,
  ) => void
  setErrorMessage: (message: string | null) => void
  onExactCompanyMatch: (id: string) => void
  onExactContactMatch: (id: string) => void
}

export interface UseLeadConvertDuplicatesResult {
  companyCandidates: Array<LeadConvertEntityCandidate>
  contactCandidates: Array<LeadConvertEntityCandidate>
  dealCandidates: Array<LeadConvertEntityCandidate>
  exactCompanyId: string | null
  exactContactId: string | null
  precheckSummary: LeadConvertPrecheckSummary
  duplicatesChecked: boolean
  setDuplicatesChecked: (checked: boolean) => void
  findDuplicates: (args: {
    form: LeadConvertForm
    mode: LeadConvertConversionMode
  }) => Promise<void>
}

const INITIAL_SUMMARY: LeadConvertPrecheckSummary = {
  company: { status: 'unchecked', count: 0 },
  contact: { status: 'unchecked', count: 0 },
  deal: { status: 'unchecked', count: 0 },
}

export function useLeadConvertDuplicates({
  client,
  lead,
  t,
  setIsWorking,
  setStep,
  setStepDetail,
  setErrorMessage,
  onExactCompanyMatch,
  onExactContactMatch,
}: UseLeadConvertDuplicatesOptions): UseLeadConvertDuplicatesResult {
  const [companyCandidates, setCompanyCandidates] = useState<
    Array<LeadConvertEntityCandidate>
  >([])
  const [contactCandidates, setContactCandidates] = useState<
    Array<LeadConvertEntityCandidate>
  >([])
  const [dealCandidates, setDealCandidates] = useState<
    Array<LeadConvertEntityCandidate>
  >([])
  const [exactCompanyId, setExactCompanyId] = useState<string | null>(null)
  const [exactContactId, setExactContactId] = useState<string | null>(null)
  const [precheckSummary, setPrecheckSummary] =
    useState<LeadConvertPrecheckSummary>(INITIAL_SUMMARY)
  const [duplicatesChecked, setDuplicatesChecked] = useState(false)

  const duplicateCheckRef = useRef<{
    requestId: number
    controller: AbortController | null
  }>({ requestId: 0, controller: null })

  useEffect(
    () => () => {
      duplicateCheckRef.current.requestId += 1
      duplicateCheckRef.current.controller?.abort()
      duplicateCheckRef.current.controller = null
    },
    [],
  )

  const findDuplicates: UseLeadConvertDuplicatesResult['findDuplicates'] =
    async ({ form, mode }) => {
      if (!client) return
      duplicateCheckRef.current.controller?.abort()
      const requestId = duplicateCheckRef.current.requestId + 1
      const controller = new AbortController()
      duplicateCheckRef.current = { requestId, controller }
      setIsWorking(true)
      setErrorMessage(null)
      setStep('precheck', 'running')

      try {
        if (!form.dealName.trim()) {
          throw new Error(t('leads.convert.validation.dealNameRequired'))
        }

        if (mode === 'company_contact_deal' && !form.companyName.trim()) {
          throw new Error(t('leads.convert.validation.companyNameRequired'))
        }

        if (mode !== 'deal_only' && !form.contactName.trim()) {
          throw new Error(t('leads.convert.validation.contactNameRequired'))
        }

        const companyKeyword =
          sanitizeKeyword(form.companyName) ||
          normalizeDomain(form.companyWebsite)
        const contactKeyword =
          sanitizeKeyword(form.contactName) ||
          sanitizeKeyword(form.contactEmail) ||
          sanitizeKeyword(form.contactPhone)
        const [companies, contacts, deals] = await Promise.all([
          mode === 'company_contact_deal' && companyKeyword
            ? client.get(
                '/v1/apps/base/data-sources/organization/items',
                {
                  columns: 'id,name,email,phone,website,country(id,name)',
                  filterKeyword: companyKeyword,
                  limit: 8,
                },
                { signal: controller.signal },
              )
            : Promise.resolve([]),
          mode !== 'deal_only' && contactKeyword
            ? client.get(
                '/v1/apps/base/data-sources/contact/items',
                {
                  columns: 'id,name,email,mobile,organization(id,name)',
                  filterKeyword: contactKeyword,
                  limit: 8,
                },
                { signal: controller.signal },
              )
            : Promise.resolve([]),
          lead?.id
            ? client.get(
                '/v1/apps/base_crm/data-sources/deal/items',
                {
                  columns:
                    'id,name,stage(id,name),organization(id,name),source_lead(id,name)',
                  filters: {
                    rules: [
                      { field: 'source_lead', operator: '=', value: lead.id },
                    ],
                  },
                  limit: 8,
                },
                { signal: controller.signal },
              )
            : Promise.resolve([]),
        ])

        if (
          controller.signal.aborted ||
          duplicateCheckRef.current.requestId !== requestId
        ) {
          return
        }

        const companyMatches = unwrapItems(companies)
        const contactMatches = unwrapItems(contacts)
        const dealMatches = unwrapItems(deals)
        const companyDomain = normalizeDomain(form.companyWebsite)
        const companyName = normalize(form.companyName)
        const companyPhone = normalizePhone(form.companyPhone)
        const contactEmail = normalize(form.contactEmail)
        const contactPhone = normalizePhone(form.contactPhone)
        const exactCompany = companyMatches.find((candidate) => {
          const candidateDomain = normalizeDomain(
            String(candidate.website ?? ''),
          )
          const candidatePhone = normalizePhone(String(candidate.phone ?? ''))
          const candidateName = normalize(String(candidate.name ?? ''))

          return (
            (companyDomain && candidateDomain === companyDomain) ||
            (companyName && candidateName === companyName) ||
            (companyPhone && candidatePhone === companyPhone)
          )
        })
        const exactContact = contactMatches.find((candidate) => {
          const candidateEmail = normalize(String(candidate.email ?? ''))
          const candidatePhone = normalizePhone(String(candidate.mobile ?? ''))

          return (
            (contactEmail && candidateEmail === contactEmail) ||
            (contactPhone && candidatePhone === contactPhone)
          )
        })

        setCompanyCandidates(companyMatches)
        setContactCandidates(contactMatches)
        setDealCandidates(dealMatches)
        setExactCompanyId(exactCompany?.id ?? null)
        setExactContactId(exactContact?.id ?? null)

        if (exactCompany?.id) onExactCompanyMatch(exactCompany.id)
        if (exactContact?.id) onExactContactMatch(exactContact.id)

        const precheckDetails: Array<LeadConvertStepDetail> = []
        precheckDetails.push(
          makeStepDetail(
            'success',
            t('leads.convert.check.dealName', { value: form.dealName }),
          ),
        )
        if (mode === 'company_contact_deal') {
          precheckDetails.push(
            makeStepDetail(
              'success',
              t('leads.convert.check.companyName', { value: form.companyName }),
            ),
          )
        }
        if (mode !== 'deal_only') {
          precheckDetails.push(
            makeStepDetail(
              'success',
              t('leads.convert.check.contactName', { value: form.contactName }),
            ),
          )
        }
        if (mode === 'company_contact_deal') {
          if (companyMatches.length > 0) {
            precheckDetails.push(
              makeStepDetail(
                exactCompany ? 'warn' : 'info',
                exactCompany
                  ? t('leads.convert.check.similarCompaniesFound', {
                      count: companyMatches.length,
                      name: exactCompany.name,
                    })
                  : t('leads.convert.check.similarCompaniesSuggested', {
                      count: companyMatches.length,
                    }),
              ),
            )
          } else {
            precheckDetails.push(
              makeStepDetail(
                'success',
                t('leads.convert.check.noCompanyConflict'),
              ),
            )
          }
        }
        if (mode !== 'deal_only') {
          if (contactMatches.length > 0) {
            precheckDetails.push(
              makeStepDetail(
                exactContact ? 'warn' : 'info',
                exactContact
                  ? t('leads.convert.check.similarContactsFound', {
                      count: contactMatches.length,
                      name: exactContact.name,
                    })
                  : t('leads.convert.check.similarContactsSuggested', {
                      count: contactMatches.length,
                    }),
              ),
            )
          } else {
            precheckDetails.push(
              makeStepDetail(
                'success',
                t('leads.convert.check.noContactConflict'),
              ),
            )
          }
        }
        if (dealMatches.length > 0) {
          const first = dealMatches[0]
          precheckDetails.push(
            makeStepDetail(
              'warn',
              t('leads.convert.check.previousDeals', {
                count: dealMatches.length,
                name: first?.name ?? t('common.unknown'),
              }),
            ),
          )
        } else {
          precheckDetails.push(
            makeStepDetail(
              'success',
              t('leads.convert.check.noDealConflict'),
            ),
          )
        }
        setStepDetail('precheck', precheckDetails)

        setPrecheckSummary({
          company:
            mode === 'company_contact_deal'
              ? {
                  status:
                    companyMatches.length === 0
                      ? 'clean'
                      : exactCompany
                        ? 'exact'
                        : 'matches',
                  count: companyMatches.length,
                  exactName: exactCompany?.name,
                }
              : { status: 'unchecked', count: 0 },
          contact:
            mode !== 'deal_only'
              ? {
                  status:
                    contactMatches.length === 0
                      ? 'clean'
                      : exactContact
                        ? 'exact'
                        : 'matches',
                  count: contactMatches.length,
                  exactName: exactContact?.name,
                }
              : { status: 'unchecked', count: 0 },
          deal: {
            status: dealMatches.length === 0 ? 'clean' : 'matches',
            count: dealMatches.length,
            exactName: dealMatches[0]?.name,
          },
        })

        setDuplicatesChecked(true)
        const hasAnyMatch =
          companyMatches.length > 0 ||
          contactMatches.length > 0 ||
          dealMatches.length > 0
        logLeadConvertEvent('info', 'precheck_completed', {
          leadId: lead?.id,
          mode,
          companyMatches: companyMatches.length,
          contactMatches: contactMatches.length,
          dealMatches: dealMatches.length,
          exactCompanyId: exactCompany?.id ?? null,
          exactContactId: exactContact?.id ?? null,
          hasAnyMatch,
        })
        setStep('precheck', hasAnyMatch ? 'warn' : 'done')
      } catch (error) {
        if (controller.signal.aborted || isAbortLikeError(error)) {
          return
        }
        setStep('precheck', 'failed')
        const errMsg = getErrorMessage(error, t)
        setStepDetail('precheck', [
          makeStepDetail(
            'error',
            t('leads.convert.result.errorPrefix', { message: errMsg }),
          ),
        ])
        setErrorMessage(errMsg)
        logLeadConvertEvent('error', 'precheck_failed', {
          leadId: lead?.id,
          mode,
          message: errMsg,
        })
      } finally {
        if (duplicateCheckRef.current.requestId === requestId) {
          duplicateCheckRef.current.controller = null
          setIsWorking(false)
        }
      }
    }

  return {
    companyCandidates,
    contactCandidates,
    dealCandidates,
    exactCompanyId,
    exactContactId,
    precheckSummary,
    duplicatesChecked,
    setDuplicatesChecked,
    findDuplicates,
  }
}
