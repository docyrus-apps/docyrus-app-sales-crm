import type { RestApiClient } from '@docyrus/api-client'
import type { RuleGroupType } from 'react-querybuilder'

export type PivotFilterRule = {
  field: string;
  operator: string;
  value?: unknown;
}

export interface DocyrusPivotFilterGroupField {
  fieldSlug: string;
  label?: string;
  operator?: string;
  value?: unknown;
  [key: string]: unknown;
}

export interface DocyrusPivotFilterGroupProps {
  client: RestApiClient;
  appSlug: string;
  dataSourceSlug: string;
  fields: ReadonlyArray<DocyrusPivotFilterGroupField>;
  activeFilters?: RuleGroupType;
  onFilterRuleChange?: (rules: Array<PivotFilterRule> | null) => void;
}

export function DocyrusPivotFilterGroup(_: DocyrusPivotFilterGroupProps) {
  return null
}
