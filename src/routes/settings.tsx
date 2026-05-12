import { useEffect, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DEFAULT_FIELD_SALES_CONFIG,
  type FieldSalesConfig,
} from '@/lib/field-sales'
import {
  useFieldSalesConfig,
  useUpdateFieldSalesConfig,
} from '@/hooks/use-field-sales'

export function SettingsPage() {
  const { data, isLoading } = useFieldSalesConfig()
  const updateConfig = useUpdateFieldSalesConfig()
  const [draft, setDraft] = useState<FieldSalesConfig>(
    DEFAULT_FIELD_SALES_CONFIG,
  )

  useEffect(() => {
    if (data) {
      setDraft(data)
    }
  }, [data])

  const updateDraft = <K extends keyof FieldSalesConfig>(
    key: K,
    value: FieldSalesConfig[K],
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const save = async () => {
    await updateConfig.mutateAsync(draft)
  }

  return (
    <>
      <PageHeader
        title="Ayarlar"
        icon={<Settings2 className="h-4 w-4 text-cyan-500" />}
        titleSuffix={<Badge variant="secondary">Saha Satış</Badge>}
        actions={
          <Button onClick={save} disabled={updateConfig.isPending || isLoading}>
            {updateConfig.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        }
      />
      <PageContainer className="space-y-4">
        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Plan Yapısı</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="approval-mode">Plan onay periyodu</Label>
                  <Select
                    value={draft.approvalMode}
                    onValueChange={(value) =>
                      updateDraft(
                        'approvalMode',
                        value as FieldSalesConfig['approvalMode'],
                      )
                    }
                  >
                    <SelectTrigger id="approval-mode" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Haftalık</SelectItem>
                      <SelectItem value="monthly">Aylık</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="planning-entity">Plan ilişki kaynağı</Label>
                  <Select
                    value={draft.planningEntity}
                    onValueChange={(value) =>
                      updateDraft(
                        'planningEntity',
                        value as FieldSalesConfig['planningEntity'],
                      )
                    }
                  >
                    <SelectTrigger id="planning-entity" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="organization">Firmalar</SelectItem>
                      <SelectItem value="contact">Kişiler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slot-minutes">Varsayılan zaman aralığı</Label>
                  <Select
                    value={String(draft.slotMinutes)}
                    onValueChange={(value) =>
                      updateDraft(
                        'slotMinutes',
                        Number(value) as FieldSalesConfig['slotMinutes'],
                      )
                    }
                  >
                    <SelectTrigger id="slot-minutes" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 dakika</SelectItem>
                      <SelectItem value="60">60 dakika</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                  <div className="space-y-1">
                    <div className="font-medium">Hafta sonlarını göster</div>
                    <div className="text-sm text-muted-foreground">
                      Planlama ekranında cumartesi ve pazar kolonlarını açar.
                    </div>
                  </div>
                  <Switch
                    checked={draft.showWeekends}
                    onCheckedChange={(checked) =>
                      updateDraft('showWeekends', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Çalışma Saatleri ve Konum</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="day-start">Başlangıç saati</Label>
                    <Input
                      id="day-start"
                      type="time"
                      value={draft.dayStartTime}
                      onChange={(event) =>
                        updateDraft('dayStartTime', event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="day-end">Bitiş saati</Label>
                    <Input
                      id="day-end"
                      type="time"
                      value={draft.dayEndTime}
                      onChange={(event) =>
                        updateDraft('dayEndTime', event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                  <div className="space-y-1">
                    <div className="font-medium">Konum kontrolünü kullan</div>
                    <div className="text-sm text-muted-foreground">
                      Yakındaki planlar ve firmalar akışında mesafe doğrulaması
                      yapar.
                    </div>
                  </div>
                  <Switch
                    checked={draft.locationCheckEnabled}
                    onCheckedChange={(checked) =>
                      updateDraft('locationCheckEnabled', checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distance">
                    Maksimum kuş uçuşu mesafe (metre)
                  </Label>
                  <Input
                    id="distance"
                    type="number"
                    min={0}
                    step={10}
                    value={draft.allowedDistanceMeters}
                    onChange={(event) =>
                      updateDraft(
                        'allowedDistanceMeters',
                        Number(event.target.value || 0),
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </>
  )
}
