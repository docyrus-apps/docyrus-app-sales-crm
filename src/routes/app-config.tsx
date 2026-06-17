import { useEffect, useState } from 'react'
import { MapPinned, Phone, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  type AppModuleKey,
  type AppModulesConfig,
  DEFAULT_APP_MODULES_CONFIG,
} from '@/lib/app-config'
import { useAppModules, useUpdateAppModules } from '@/hooks/use-app-config'

type ModuleMeta = {
  key: AppModuleKey
  icon: typeof MapPinned
  titleKey: string
  descriptionKey: string
  comingSoon?: boolean
}

const MODULES: Array<ModuleMeta> = [
  {
    key: 'fieldSales',
    icon: MapPinned,
    titleKey: 'appConfig.modules.fieldSales.title',
    descriptionKey: 'appConfig.modules.fieldSales.description',
  },
  {
    key: 'webphone',
    icon: Phone,
    titleKey: 'appConfig.modules.webphone.title',
    descriptionKey: 'appConfig.modules.webphone.description',
    comingSoon: true,
  },
]

export function AppConfigPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useAppModules()
  const updateModules = useUpdateAppModules()
  const [draft, setDraft] = useState<AppModulesConfig>(
    DEFAULT_APP_MODULES_CONFIG,
  )

  useEffect(() => {
    if (data) {
      setDraft(data)
    }
  }, [data])

  const toggle = (key: AppModuleKey, value: boolean) =>
    setDraft((current) => ({ ...current, [key]: value }))

  const dirty = data
    ? (Object.keys(draft) as Array<AppModuleKey>).some(
        (key) => draft[key] !== data[key],
      )
    : false

  const save = async () => {
    await updateModules.mutateAsync(draft)
  }

  return (
    <>
      <PageHeader
        title={t('appConfig.title')}
        icon={<SlidersHorizontal className="h-4 w-4 text-cyan-500" />}
        actions={
          <Button
            onClick={save}
            disabled={updateModules.isPending || isLoading || !dirty}
          >
            {updateModules.isPending ? t('common.saving') : t('common.save')}
          </Button>
        }
      />
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
              {MODULES.map((module) => (
                <div
                  key={module.key}
                  className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <module.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 font-medium">
                        {t(module.titleKey)}
                        {module.comingSoon && (
                          <Badge variant="secondary">
                            {t('appConfig.comingSoon')}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t(module.descriptionKey)}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={draft[module.key]}
                    onCheckedChange={(checked) => toggle(module.key, checked)}
                    aria-label={t(module.titleKey)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </>
  )
}
