// Generated collection for enums
import { useDocyrusClient } from '@docyrus/signin'

export interface EnumEntity {
  /** Unique identifier */
  id: string

  /** Enum name */
  name: string

  /** Description of the enum */
  description?: string | null

  /** Color code */
  color?: string | null

  /** Icon identifier */
  icon?: string | null

  /** Whether the enum is active */
  active: boolean

  /** Parent enum ID */
  parent?: string | null

  /** Enum number identifier */
  no: number

  /** Sort order */
  sortOrder?: number | null

  /** Whether this is a final option */
  isFinalOption?: boolean | null

  /** App slug */
  appSlug: string

  /** Data source slug */
  dataSourceSlug: string

  /** Field slug */
  fieldSlug: string
}

export function useEnumsCollection() {
  const client = useDocyrusClient()

  return {
    /**
     * List all enums
     * List all enums in a tree structure
     * @returns Record<string, Record<string, Record<string, Array<EnumEntity>>>>
     */
    getEnums: (): Promise<
      Record<string, Record<string, Record<string, Array<EnumEntity>>>>
    > =>
      client!.get<
        Record<string, Record<string, Record<string, Array<EnumEntity>>>>
      >('/v1/apps/enums'),
  }
}
