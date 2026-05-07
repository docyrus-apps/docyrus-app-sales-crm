export interface DataSourceRelation {
  dataSourceId: string
  dataSourceName: string
  dataSourceSlug: string
  appSlug: string
  dataSourceType: string
  fieldId: string
  fieldSlug: string
  fieldName: string
  fieldType: string
}

export type ChildAction = 'keep' | 'delete'

export interface RecordDeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recordCount: number
  relations?: Array<DataSourceRelation>
  isLoadingRelations?: boolean
  onConfirm: (childActions: Record<string, ChildAction>) => void | Promise<void>
  isPending?: boolean
}
