import { useEffect, useMemo, useState } from 'react'

import type { ActiveFieldSalesVisit } from '@/components/field-sales/field-sales-visit-sheet'

import {
  CheckCheck,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { useCompanies } from '@/hooks/use-companies'
import {
  useCreateFieldSalesPlan,
  useFieldSalesConfig,
  useFieldSalesPlans,
  useUpdateFieldSalesPlan
} from '@/hooks/use-field-sales'
import { useMyInfo } from '@/hooks/use-users'
import {
  FIELD_SALES_EVENT_TYPE_IDS,
  FIELD_SALES_PLAN_STATUS_IDS,
  getFieldSalesPlanStatusCode,
  getRelationName,
  haversineDistanceMeters,
  parseMapLocation
} from '@/lib/field-sales'
import { FieldSalesCheckoutSheet } from '@/components/field-sales/field-sales-checkout-sheet'
import { FieldSalesVisitSheet } from '@/components/field-sales/field-sales-visit-sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PositionState {
  latitude: number;
  longitude: number;
}

type PlanRecord = {
  id?: string;
  subject?: string;
  start_date?: string;
  status?: unknown;
  organization?: any;
  contact?: any;
  location?: Record<string, unknown> | null;
  check_in_time?: string;
}

type CompanyRecord = {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  map_location?: Record<string, unknown> | null;
}

function formatElapsed(startedAtMs: number) {
  const elapsedSeconds = Math.max(
    1,
    Math.floor((Date.now() - startedAtMs) / 1000)
  )
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatDistance(distanceMeters: number, noLocationLabel: string) {
  if (!Number.isFinite(distanceMeters)) {
    return noLocationLabel
  }

  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`
  }

  return `${Math.round(distanceMeters)} m`
}

export function FieldSalesLocationActions() {
  const { t } = useTranslation()
  const { data: config } = useFieldSalesConfig()
  const { data: plans = [] } = useFieldSalesPlans()
  const { data: myInfo } = useMyInfo()
  const { data: companies = [] } = useCompanies({
    columns: [
'id',
'name',
'phone',
'email',
'address',
'map_location'
],
    orderBy: 'name ASC',
    limit: 500
  })
  const createPlan = useCreateFieldSalesPlan()
  const updatePlan = useUpdateFieldSalesPlan()

  const [locationOpen, setLocationOpen] = useState(false)
  const [visitSheetOpen, setVisitSheetOpen] = useState(false)
  const [checkoutSheetOpen, setCheckoutSheetOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const [position, setPosition] = useState<PositionState | null>(null)
  const [locationError, setLocationError] = useState<string>('')
  const [activeVisit, setActiveVisit] = useState<ActiveFieldSalesVisit | null>(
    null
  )
  const [elapsedLabel, setElapsedLabel] = useState('00:01')

  useEffect(() => {
    if (!activeVisit) return

    setElapsedLabel(formatElapsed(activeVisit.startedAtMs))
    const timer = window.setInterval(() => {
      setElapsedLabel(formatElapsed(activeVisit.startedAtMs))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [activeVisit])

  const requestCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError(t('fieldSales.locationActions.geolocationUnavailable'))

      return
    }

    setLocating(true)
    setLocationError('')

    try {
      const coords = await new Promise<GeolocationCoordinates>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            result => resolve(result.coords),
            error => reject(error),
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          )
        }
      )

      setPosition({
        latitude: coords.latitude,
        longitude: coords.longitude
      })
    } catch (error: any) {
      setLocationError(
        error?.message || t('fieldSales.locationActions.couldNotGetLocation')
      )
    } finally {
      setLocating(false)
    }
  }

  const currentPoint = position
    ? {
        latitude: position.latitude,
        longitude: position.longitude
      }
    : null

  const nearbyCompanies = useMemo(() => {
    const maxDistance = config?.allowedDistanceMeters ?? 250
    const locationCheckEnabled = config?.locationCheckEnabled ?? true

    return (companies as Array<CompanyRecord>)
      .map((company) => {
        const companyLocation = parseMapLocation(company.map_location)
        const distance =
          currentPoint && companyLocation
            ? haversineDistanceMeters(currentPoint, companyLocation)
            : Number.POSITIVE_INFINITY

        return {
          company,
          distance
        }
      })
      .filter(({ company, distance }) => {
        if (!locationCheckEnabled) return Boolean(company.id)

        return Number.isFinite(distance) && distance <= maxDistance
      })
      .sort((first, second) => first.distance - second.distance)
  }, [
    companies,
    config?.allowedDistanceMeters,
    config?.locationCheckEnabled,
    currentPoint
  ])

  const nearbyPlans = useMemo(() => {
    const maxDistance = config?.allowedDistanceMeters ?? 250
    const locationCheckEnabled = config?.locationCheckEnabled ?? true

    return (plans as Array<PlanRecord>)
      .filter(plan => getFieldSalesPlanStatusCode(plan.status) === 'waiting')
      .map((plan) => {
        const organizationId =
          typeof plan.organization === 'object'
            ? plan.organization?.id
            : plan.organization
        const organization = (companies as Array<CompanyRecord>).find(
          company => company.id === organizationId
        )
        const location =
          parseMapLocation(plan.organization?.map_location) ||
          parseMapLocation(plan.contact?.map_location) ||
          parseMapLocation(organization?.map_location) ||
          parseMapLocation(plan.location)
        const distance =
          currentPoint && location
            ? haversineDistanceMeters(currentPoint, location)
            : Number.POSITIVE_INFINITY

        return {
          plan,
          organization,
          distance
        }
      })
      .filter(({ plan, organization, distance }) => {
        if (!plan.id || !(organization?.id || plan.organization)) return false
        if (!locationCheckEnabled) return true

        return Number.isFinite(distance) && distance <= maxDistance
      })
      .sort((first, second) => first.distance - second.distance)
  }, [
    companies,
    config?.allowedDistanceMeters,
    config?.locationCheckEnabled,
    currentPoint,
    plans
  ])

  const openLocationPopover = async (open: boolean) => {
    setLocationOpen(open)

    if (open) {
      await requestCurrentLocation()
    }
  }

  const startPlannedVisit = async (
    plan: PlanRecord,
    organization?: CompanyRecord
  ) => {
    if (!plan.id || !myInfo?.id) return

    const nowIso = new Date().toISOString()
    const checkInLocation = currentPoint
      ? {
          latitude: currentPoint.latitude,
          longitude: currentPoint.longitude
        }
      : null

    await updatePlan.mutateAsync({
      planId: plan.id,
      data: {
        status: FIELD_SALES_PLAN_STATUS_IDS.checkedIn,
        check_in_time: nowIso,
        actual_start_date: nowIso,
        location: checkInLocation
      }
    })

    setActiveVisit({
      source: 'plan',
      planId: plan.id,
      organizationId:
        (typeof plan.organization === 'object'
          ? plan.organization?.id
          : plan.organization) ||
          organization?.id ||
          '',
      organizationName:
        getRelationName(plan.organization) ||
        organization?.name ||
        getRelationName(plan.contact),
      startedAtMs: Date.now() - 1000,
      checkInTimeIso: nowIso,
      checkInLocation
    })
    setElapsedLabel('00:01')
    setLocationOpen(false)
    setVisitSheetOpen(true)
  }

  const startUnplannedVisit = (company: CompanyRecord) => {
    if (!company.id) return

    const nowIso = new Date().toISOString()
    const checkInLocation = currentPoint
      ? {
          latitude: currentPoint.latitude,
          longitude: currentPoint.longitude
        }
      : null

    setActiveVisit({
      source: 'company',
      organizationId: company.id,
      organizationName: company.name || t('fieldSales.common.organization'),
      startedAtMs: Date.now() - 1000,
      checkInTimeIso: nowIso,
      checkInLocation
    })
    setElapsedLabel('00:01')
    setLocationOpen(false)
    setVisitSheetOpen(true)
  }

  const completeVisit = async ({
    subject,
    description
  }: {
    subject: string;
    description: string;
  }) => {
    if (!activeVisit || !myInfo?.id) return

    const nowIso = new Date().toISOString()
    const payload = {
      subject,
      description,
      status: FIELD_SALES_PLAN_STATUS_IDS.completed,
      check_out_time: nowIso,
      actual_end_date: nowIso
    }

    if (activeVisit.planId) {
      await updatePlan.mutateAsync({
        planId: activeVisit.planId,
        data: payload
      })
    } else {
      await createPlan.mutateAsync({
        name: subject,
        subject,
        description,
        organization: activeVisit.organizationId,
        start_date: activeVisit.checkInTimeIso,
        end_date: nowIso,
        check_in_time: activeVisit.checkInTimeIso,
        check_out_time: nowIso,
        actual_start_date: activeVisit.checkInTimeIso,
        actual_end_date: nowIso,
        event_type: FIELD_SALES_EVENT_TYPE_IDS.unplannedVisit,
        status: FIELD_SALES_PLAN_STATUS_IDS.completed,
        require_approval: false,
        record_owner: myInfo.id,
        location: activeVisit.checkInLocation
      })
    }

    setCheckoutSheetOpen(false)
    setVisitSheetOpen(false)
    setActiveVisit(null)
    setElapsedLabel('00:01')
    toast.success(t('fieldSales.messages.visitSaved'))
  }

  return (
    <>
      {activeVisit ? (
        <Button
          variant="default"
          size="sm"
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          aria-label={t('fieldSales.locationActions.activeVisit')}
          onClick={() => setCheckoutSheetOpen(true)}>
          <CheckCheck className="size-4" />
          <span className="text-xs font-semibold">{elapsedLabel}</span>
        </Button>
      ) : (
        <Popover open={locationOpen} onOpenChange={openLocationPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              aria-label={t('fieldSales.locationActions.locationAndVisit')}>
              {locating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LocateFixed className="size-4" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-[min(420px,calc(100vw-2rem))] p-0">
            <Tabs defaultValue="plans" className="gap-0">
              <div className="border-b px-4 pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">
                      {t('fieldSales.scheduleBoard.nearbyRecords')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('fieldSales.scheduleBoard.nearbyDescription')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void requestCurrentLocation()}>
                    {t('fieldSales.common.refresh')}
                  </Button>
                </div>
                <TabsList className="h-auto w-full flex-wrap justify-start">
                  <TabsTrigger value="plans">
                    {t('fieldSales.scheduleBoard.nearbyPlans')}
                  </TabsTrigger>
                  <TabsTrigger value="companies">
                    {t('fieldSales.scheduleBoard.nearbyOrganizations')}
                  </TabsTrigger>
                </TabsList>
              </div>

              {locationError ? (
                <div className="px-4 py-3 text-sm text-destructive">
                  {locationError}
                </div>
              ) : null}

              <TabsContent value="plans" className="m-0">
                <ScrollArea className="h-96 px-4 py-4">
                  <div className="space-y-3">
                    {nearbyPlans.length === 0 ? (
                      <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                        {t('fieldSales.scheduleBoard.noNearbyPlans')}
                      </div>
                    ) : (
                      nearbyPlans.map(({ plan, organization, distance }) => (
                        <Card key={plan.id}>
                          <CardContent className="space-y-3 px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">
                                  {plan.subject ||
                                    getRelationName(plan.organization) ||
                                    getRelationName(plan.contact) ||
                                    t('fieldSales.scheduleBoard.plannedVisit')}
                                </div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {organization?.name ||
                                    getRelationName(plan.organization) ||
                                    getRelationName(plan.contact)}
                                </div>
                              </div>
                              <Badge variant="secondary">
                                {formatDistance(
                                  distance,
                                  t('fieldSales.locationActions.noLocation')
                                )}
                              </Badge>
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => void startPlannedVisit(plan, organization)}>
                              <Navigation className="mr-2 h-4 w-4" />
                              {t('fieldSales.common.checkIn')}
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="companies" className="m-0">
                <ScrollArea className="h-96 px-4 py-4">
                  <div className="space-y-3">
                    {nearbyCompanies.length === 0 ? (
                      <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                        {t('fieldSales.scheduleBoard.noNearbyOrganizations')}
                      </div>
                    ) : (
                      nearbyCompanies.map(({ company, distance }) => (
                        <Card key={company.id}>
                          <CardContent className="space-y-3 px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">
                                  {company.name}
                                </div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {company.address ||
                                    company.phone ||
                                    company.email ||
                                    t('fieldSales.scheduleBoard.noDetails')}
                                </div>
                              </div>
                              <Badge variant="secondary">
                                {formatDistance(
                                  distance,
                                  t('fieldSales.locationActions.noLocation')
                                )}
                              </Badge>
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => startUnplannedVisit(company)}>
                              <MapPin className="mr-2 h-4 w-4" />
                              {t('fieldSales.common.checkIn')}
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
      )}

      <FieldSalesVisitSheet
        open={visitSheetOpen}
        onOpenChange={setVisitSheetOpen}
        visit={activeVisit}
        elapsedLabel={elapsedLabel}
        onStartOrder={() => {}} />

      <FieldSalesCheckoutSheet
        open={checkoutSheetOpen}
        onOpenChange={setCheckoutSheetOpen}
        visit={activeVisit}
        elapsedLabel={elapsedLabel}
        saving={createPlan.isPending || updatePlan.isPending}
        onSave={completeVisit} />
    </>
  )
}
