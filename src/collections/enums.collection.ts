// Generated collection for enums
import { apiClient } from '../lib/api'

export interface EnumEntity {
  /** Unique identifier */
  id: string

  /** Enum name */
  name: string

  /** Description of the enum */
  description?: string

  /** Color code */
  color?: string

  /** Icon identifier */
  icon?: string

  /** Whether the enum is active */
  active: boolean

  /** Parent enum ID */
  parent?: string

  /** Enum number identifier */
  no: number

  /** Sort order */
  sortOrder?: number

  /** Whether this is a final option */
  isFinalOption?: boolean

  /** App slug */
  appSlug: string

  /** Data source slug */
  dataSourceSlug: string

  /** Field slug */
  fieldSlug: string
}

export const EnumsCollection = {
  /**
   * List all enums
   * List all enums in a tree structure
   * @returns Record<string, Record<string, Record<string, Array<EnumEntity>>>>
   */
  getEnums: (): Promise<
    Record<string, Record<string, Record<string, Array<EnumEntity>>>>
  > =>
    apiClient.get<
      Record<string, Record<string, Record<string, Array<EnumEntity>>>>
    >('/v1/apps/enums'),
}
