import { useMemo } from 'react'

import type { EnumEntity } from '@/collections/enums.collection'
import type { SelectOption } from '@/components/leads/field-mapping-row'
import type { LeadConvertForm } from '@/components/leads/lead-convert-tabs'

import { useEnumEntities } from '@/hooks/use-enums'
import { getRelationName, normalizeConversionKey } from '@/lib/lead-conversion'

export type EnumOption = { id: string; name: string }

export function optionByName(
  options: Array<{ id?: string; name?: string }>,
  name?: string
): string | undefined {
  if (!name) return undefined
  const normalized = normalizeConversionKey(name)

  return options.find(
    option => normalizeConversionKey(option.name) === normalized
  )?.id
}

export function mapLeadTypeToCustomerType(
  options: Array<{ id?: string; name?: string }>,
  leadTypeName?: string
): string | undefined {
  const normalized = (leadTypeName ?? '').toLowerCase().trim()

  if (normalized.includes('existing'))
    return optionByName(options, 'Existing Business')
  if (normalized.includes('new')) return optionByName(options, 'New Business')

  return undefined
}

function toEnumSelectOptions(
  opts: Array<{ id?: string; name?: string }>
): Array<SelectOption> {
  return opts
    .filter((o): o is { id: string; name: string } => Boolean(o.id && o.name))
    .map(o => ({ value: o.id, label: o.name }))
}

type EnumFormSlice = Pick<
  LeadConvertForm,
  | 'dealStageId'
  | 'dealLeadSourceId'
  | 'dealCustomerTypeId'
  | 'companyIndustry'
  | 'companySize'
>

export interface LeadConvertEnumMappings {
  stageOptions: Array<EnumEntity>;
  dealLeadSourceOptions: Array<EnumEntity>;
  customerTypeOptions: Array<EnumEntity>;
  orgIndustryOptions: Array<EnumEntity>;
  orgCompanySizeOptions: Array<EnumEntity>;

  stageSelectOptions: Array<SelectOption>;
  leadSourceSelectOptions: Array<SelectOption>;
  customerTypeSelectOptions: Array<SelectOption>;
  industrySelectOptions: Array<SelectOption>;
  companySizeSelectOptions: Array<SelectOption>;

  leadCompanyIndustryName: string;
  leadCompanySizeName: string;
  leadSourceName: string;
  leadTypeName: string;

  newStageId: string | undefined;
  mappedDealLeadSourceId: string | undefined;
  mappedCustomerTypeId: string | undefined;
  mappedCompanyIndustryId: string | undefined;
  mappedCompanySizeId: string | undefined;

  effectiveStageId: string;
  effectiveLeadSourceId: string;
  effectiveCustomerTypeId: string;
  effectiveCompanyIndustryId: string;
  effectiveCompanySizeId: string;
}

export function useLeadConvertEnumMappings(
  lead: any,
  form: EnumFormSlice
): LeadConvertEnumMappings {
  const { data: stageOptions = [] } = useEnumEntities('stage', {
    appSlug: 'base_crm',
    dataSourceSlug: 'deal'
  })
  const { data: dealLeadSourceOptions = [] } = useEnumEntities('lead_source', {
    appSlug: 'base_crm',
    dataSourceSlug: 'deal'
  })
  const { data: customerTypeOptions = [] } = useEnumEntities('customer_type', {
    appSlug: 'base_crm',
    dataSourceSlug: 'deal'
  })
  const { data: orgIndustryOptions = [] } = useEnumEntities('industry', {
    appSlug: 'base',
    dataSourceSlug: 'organization'
  })
  const { data: orgCompanySizeOptions = [] } = useEnumEntities('company_size', {
    appSlug: 'base',
    dataSourceSlug: 'organization'
  })

  const stageSelectOptions = useMemo(
    () => toEnumSelectOptions(stageOptions),
    [stageOptions]
  )
  const leadSourceSelectOptions = useMemo(
    () => toEnumSelectOptions(dealLeadSourceOptions),
    [dealLeadSourceOptions]
  )
  const customerTypeSelectOptions = useMemo(
    () => toEnumSelectOptions(customerTypeOptions),
    [customerTypeOptions]
  )
  const industrySelectOptions = useMemo(
    () => toEnumSelectOptions(orgIndustryOptions),
    [orgIndustryOptions]
  )
  const companySizeSelectOptions = useMemo(
    () => toEnumSelectOptions(orgCompanySizeOptions),
    [orgCompanySizeOptions]
  )

  const leadCompanyIndustryName = getRelationName(lead?.company_industry) ?? ''
  const leadCompanySizeName = getRelationName(lead?.company_size) ?? ''
  const leadSourceName = getRelationName(lead?.lead_source) ?? ''
  const leadTypeName = getRelationName(lead?.lead_type) ?? ''

  const newStageId = useMemo(
    () => optionByName(stageOptions, 'New'),
    [stageOptions]
  )
  const mappedDealLeadSourceId = useMemo(
    () => optionByName(dealLeadSourceOptions, leadSourceName),
    [dealLeadSourceOptions, leadSourceName]
  )
  const mappedCustomerTypeId = useMemo(
    () => mapLeadTypeToCustomerType(customerTypeOptions, leadTypeName),
    [customerTypeOptions, leadTypeName]
  )
  const mappedCompanyIndustryId = useMemo(
    () => optionByName(orgIndustryOptions, leadCompanyIndustryName),
    [orgIndustryOptions, leadCompanyIndustryName]
  )
  const mappedCompanySizeId = useMemo(
    () => optionByName(orgCompanySizeOptions, leadCompanySizeName),
    [orgCompanySizeOptions, leadCompanySizeName]
  )

  const effectiveStageId = form.dealStageId || newStageId || ''
  const effectiveLeadSourceId =
    form.dealLeadSourceId || mappedDealLeadSourceId || ''
  const effectiveCustomerTypeId =
    form.dealCustomerTypeId || mappedCustomerTypeId || ''
  const effectiveCompanyIndustryId =
    form.companyIndustry || mappedCompanyIndustryId || ''
  const effectiveCompanySizeId = form.companySize || mappedCompanySizeId || ''

  return {
    stageOptions,
    dealLeadSourceOptions,
    customerTypeOptions,
    orgIndustryOptions,
    orgCompanySizeOptions,
    stageSelectOptions,
    leadSourceSelectOptions,
    customerTypeSelectOptions,
    industrySelectOptions,
    companySizeSelectOptions,
    leadCompanyIndustryName,
    leadCompanySizeName,
    leadSourceName,
    leadTypeName,
    newStageId,
    mappedDealLeadSourceId,
    mappedCustomerTypeId,
    mappedCompanyIndustryId,
    mappedCompanySizeId,
    effectiveStageId,
    effectiveLeadSourceId,
    effectiveCustomerTypeId,
    effectiveCompanyIndustryId,
    effectiveCompanySizeId
  }
}
