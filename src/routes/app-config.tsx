import { useEffect, useMemo, useState } from 'react'

import type { AppModuleKey, AppModulesConfig } from '@/lib/app-config'

import {
  CheckCircle2,
  MapPinned,
  Phone,
  Settings2,
  SlidersHorizontal,
  TriangleAlert
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { DEFAULT_APP_MODULES_CONFIG } from '@/lib/app-config'
import { useAppModules, useUpdateAppModules } from '@/hooks/use-app-config'
import { useWebphone } from '@/components/webphone/webphone-context'
import { WebphoneSettingsForm } from '@/components/webphone/webphone-settings-form'
import { FieldSalesSettingsForm } from '@/components/field-sales/field-sales-settings-form'

type ModuleMeta = {
  key: AppModuleKey;
  icon: typeof MapPinned;
  titleKey: string;
  descriptionKey: string;
}

const MODULES: Array<ModuleMeta> = [
  {
    key: 'fieldSales',
    icon: MapPinned,
    titleKey: 'appConfig.modules.fieldSales.title',
    descriptionKey: 'appConfig.modules.fieldSales.description'
  },
  {
    key: 'webphone',
    icon: Phone,
    titleKey: 'appConfig.modules.webphone.title',
    descriptionKey: 'appConfig.modules.webphone.description'
  }
]

interface ModuleStatus {
  complete: boolean;
  issues: Array<string>;
}

function ModuleStatusIndicator({ complete, issues }: ModuleStatus) {
  const { t } = useTranslation()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="flex size-7 items-center justify-center"
          aria-label={
            complete
              ? t('appConfig.status.complete')
              : t('appConfig.status.incomplete')
          }>
          {complete ? (
            <CheckCircle2 className="size-4 text-emerald-500" />
          ) : (
            <TriangleAlert className="size-4 text-amber-500" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-60">
        {complete ? (
          t('appConfig.status.complete')
        ) : (
          <div className="space-y-1">
            <div>{t('appConfig.status.incomplete')}</div>
            {issues.length > 0 && (
              <ul className="ml-3 list-disc text-xs">
                {issues.map(issue => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export function AppConfigPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useAppModules()
  const updateModules = useUpdateAppModules()
  const webphone = useWebphone()

  const [draft, setDraft] = useState<AppModulesConfig>(
    DEFAULT_APP_MODULES_CONFIG
  )
  const [settingsModal, setSettingsModal] = useState<AppModuleKey | null>(null)

  useEffect(() => {
    if (data) setDraft(data)
  }, [data])

  const toggle = (key: AppModuleKey, value: boolean) => setDraft(current => ({ ...current, [key]: value }))

  const dirty = data
    ? (Object.keys(draft) as Array<AppModuleKey>).some(
        key => draft[key] !== data[key]
      )
    : false

  const save = async () => {
    await updateModules.mutateAsync(draft)
  }

  const statusByModule = useMemo<Record<AppModuleKey, ModuleStatus>>(
    () => ({
      webphone: {
        complete: webphone.ready,
        issues: webphone.readinessReasons.map(reason => t(`webphone.readiness.${reason}`, { defaultValue: reason }))
      },
      fieldSales: {
        complete: true,
        issues: []
      }
    }),
    [webphone.ready, webphone.readinessReasons, t]
  )

  return (
    <>
      <PageHeader
        title={t('appConfig.title')}
        icon={<SlidersHorizontal className="h-4 w-4 text-cyan-500" />}
        actions={
          <Button
            onClick={save}
            disabled={updateModules.isPending || isLoading || !dirty}>
            {updateModules.isPending ? t('common.saving') : t('common.save')}
          </Button>
        } />
      <PageContainer className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t('appConfig.modules.title')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('appConfig.modules.subtitle')}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {MODULES.map((module) => {
                const status = statusByModule[module.key]

                return (
                  <div
                    key={module.key}
                    className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <module.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="font-medium">{t(module.titleKey)}</div>
                        <div className="text-sm text-muted-foreground">
                          {t(module.descriptionKey)}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {draft[module.key] && (
                        <>
                          <ModuleStatusIndicator
                            complete={status.complete}
                            issues={status.issues} />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground"
                                onClick={() => setSettingsModal(module.key)}
                                aria-label={t('appConfig.settings.open')}>
                                <Settings2 className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('appConfig.settings.open')}
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                      <Switch
                        checked={draft[module.key]}
                        onCheckedChange={checked => toggle(module.key, checked)}
                        aria-label={t(module.titleKey)} />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </PageContainer>

      <Dialog
        open={settingsModal !== null}
        onOpenChange={(open) => {
          if (!open) setSettingsModal(null)
        }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {settingsModal === 'webphone'
                ? t('webphone.settings.title')
                : t('appConfig.fieldSalesSettingsTitle')}
            </DialogTitle>
            <DialogDescription>
              {settingsModal === 'webphone'
                ? t('webphone.settings.subtitle')
                : t('appConfig.fieldSalesSettingsSubtitle')}
            </DialogDescription>
          </DialogHeader>
          {settingsModal === 'webphone' ? (
            <WebphoneSettingsForm onSaved={() => setSettingsModal(null)} />
          ) : settingsModal === 'fieldSales' ? (
            <FieldSalesSettingsForm onSaved={() => setSettingsModal(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
