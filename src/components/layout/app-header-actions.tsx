import { FieldSalesLocationActions } from '@/components/field-sales/field-sales-location-actions'
import { WebphoneStatusBadge } from '@/components/webphone/webphone-status-badge'
import { WebphoneDialpad } from '@/components/webphone/webphone-dialpad'
import { useAppModules } from '@/hooks/use-app-config'
import { isModuleEnabled } from '@/lib/app-config'

export function AppHeaderActions() {
  const { data: modules } = useAppModules()
  const fieldSalesEnabled = isModuleEnabled(modules, 'fieldSales')
  const webphoneEnabled = isModuleEnabled(modules, 'webphone')

  return (
    <>
      {webphoneEnabled && (
        <div className="flex items-center gap-1">
          <WebphoneStatusBadge />
          <WebphoneDialpad />
        </div>
      )}

      {webphoneEnabled && fieldSalesEnabled && (
        <span
          aria-hidden
          className="mx-1 h-5 w-px shrink-0 self-center rounded-full bg-border/70" />
      )}

      {fieldSalesEnabled && <FieldSalesLocationActions />}
    </>
  )
}
