export interface RecordActivityUser {
  name: string | null
  email: string | null
  mobile: string | null
  firstname: string | null
  lastname: string | null
}

export interface RecordActivity {
  id: string
  description: string
  shortDescription: string
  icon: string | null
  color: string
  table_name: string
  operation: string
  tenant_data_source_id: { id: string; name: string | null }
  created_on: string | null
  created_by: string | null
  created_by_user: RecordActivityUser | null
  data_source_name: string | null
  title: string | null
}

export interface RecordActivityPanelProps {
  activities: Array<RecordActivity>
  isLoading?: boolean
  className?: string
}
