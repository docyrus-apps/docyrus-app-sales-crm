import { FIELD_SALES_APP_ID } from './field-sales'

/**
 * App-level configuration lives in the same tenant app config record as the
 * field-sales settings (see {@link FIELD_SALES_APP_ID}). Each concern stores
 * its own key under the shared `data` blob: field-sales settings live under
 * `data.fieldSales`, while module on/off switches live under `data.modules`.
 */
export const APP_CONFIG_APP_ID = FIELD_SALES_APP_ID

export type AppModuleKey = 'fieldSales' | 'webphone'

export interface AppModulesConfig {
  /** Field sales workspace: planning, approvals, calendar, location action. */
  fieldSales: boolean;
  /** Webphone / call center telephony surface (wired up in a later step). */
  webphone: boolean;
}

export const DEFAULT_APP_MODULES_CONFIG: AppModulesConfig = {
  fieldSales: true,
  webphone: false
}

export function getAppModulesConfig(
  value: Partial<AppModulesConfig> | null | undefined
): AppModulesConfig {
  return {
    ...DEFAULT_APP_MODULES_CONFIG,
    ...(value ?? {})
  }
}

export function isModuleEnabled(
  modules: AppModulesConfig | undefined,
  key: AppModuleKey
): boolean {
  return modules ? modules[key] : DEFAULT_APP_MODULES_CONFIG[key]
}
