import { useEffect, useState } from 'react'

import { type FieldSalesConfig } from '@/lib/field-sales'

import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_FIELD_SALES_CONFIG } from '@/lib/field-sales'
import {
  useFieldSalesConfig,
  useUpdateFieldSalesConfig
} from '@/hooks/use-field-sales'

interface FieldSalesSettingsFormProps {
  /** Called after a successful save (e.g. to close a containing modal). */
  onSaved?: () => void;
}

/**
 * Field sales settings form (plan structure, working hours, location check).
 * Reused by the `/settings` route and the App Config settings modal.
 */
export function FieldSalesSettingsForm({
  onSaved
}: FieldSalesSettingsFormProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useFieldSalesConfig()
  const updateConfig = useUpdateFieldSalesConfig()
  const [draft, setDraft] = useState<FieldSalesConfig>(
    DEFAULT_FIELD_SALES_CONFIG
  )

  useEffect(() => {
    if (data) setDraft(data)
  }, [data])

  const updateDraft = <K extends keyof FieldSalesConfig>(
    key: K,
    value: FieldSalesConfig[K]
  ) => {
    setDraft(current => ({ ...current, [key]: value }))
  }

  const save = async () => {
    await updateConfig.mutateAsync(draft)
    onSaved?.()
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('fieldSales.settings.planStructure')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="approval-mode">
                {t('fieldSales.settings.approvalPeriod')}
              </Label>
              <Select
                value={draft.approvalMode}
                onValueChange={value => updateDraft(
                    'approvalMode',
                    value as FieldSalesConfig['approvalMode']
                  )}>
                <SelectTrigger id="approval-mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">
                    {t('fieldSales.settings.weekly')}
                  </SelectItem>
                  <SelectItem value="monthly">
                    {t('fieldSales.settings.monthly')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planning-entity">
                {t('fieldSales.settings.planningEntity')}
              </Label>
              <Select
                value={draft.planningEntity}
                onValueChange={value => updateDraft(
                    'planningEntity',
                    value as FieldSalesConfig['planningEntity']
                  )}>
                <SelectTrigger id="planning-entity" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organization">
                    {t('fieldSales.settings.organizations')}
                  </SelectItem>
                  <SelectItem value="contact">
                    {t('fieldSales.settings.contacts')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot-minutes">
                {t('fieldSales.settings.slotDuration')}
              </Label>
              <Select
                value={String(draft.slotMinutes)}
                onValueChange={value => updateDraft(
                    'slotMinutes',
                    Number(value) as FieldSalesConfig['slotMinutes']
                  )}>
                <SelectTrigger id="slot-minutes" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">
                    {t('fieldSales.settings.thirtyMinutes')}
                  </SelectItem>
                  <SelectItem value="60">
                    {t('fieldSales.settings.sixtyMinutes')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div className="space-y-1">
                <div className="font-medium">
                  {t('fieldSales.settings.showWeekends')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('fieldSales.settings.showWeekendsDescription')}
                </div>
              </div>
              <Switch
                checked={draft.showWeekends}
                onCheckedChange={checked => updateDraft('showWeekends', checked)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t('fieldSales.settings.workingHoursLocation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="day-start">
                  {t('fieldSales.settings.startTime')}
                </Label>
                <Input
                  id="day-start"
                  type="time"
                  value={draft.dayStartTime}
                  onChange={event => updateDraft('dayStartTime', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="day-end">
                  {t('fieldSales.settings.endTime')}
                </Label>
                <Input
                  id="day-end"
                  type="time"
                  value={draft.dayEndTime}
                  onChange={event => updateDraft('dayEndTime', event.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div className="space-y-1">
                <div className="font-medium">
                  {t('fieldSales.settings.useLocationCheck')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('fieldSales.settings.locationCheckDescription')}
                </div>
              </div>
              <Switch
                checked={draft.locationCheckEnabled}
                onCheckedChange={checked => updateDraft('locationCheckEnabled', checked)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="distance">
                {t('fieldSales.settings.maxDistance')}
              </Label>
              <Input
                id="distance"
                type="number"
                min={0}
                step={10}
                value={draft.allowedDistanceMeters}
                onChange={event => updateDraft(
                    'allowedDistanceMeters',
                    Number(event.target.value || 0)
                  )} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={updateConfig.isPending || isLoading}>
          {updateConfig.isPending
            ? t('fieldSales.common.saving')
            : t('fieldSales.common.save')}
        </Button>
      </div>
    </div>
  )
}
