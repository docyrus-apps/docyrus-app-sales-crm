import { useState } from 'react'

import { useTranslation } from 'react-i18next'
import { Loader2, ShoppingCart } from 'lucide-react'

import { useMyInfo } from '@/hooks/use-users'
import { useCreateSalesOrder } from '@/hooks/use-sales-orders'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const SALES_ORDER_DRAFT_STATUS_ID = '019c48d0-6c11-7389-822c-7bf9f87b047e'

interface FieldSalesQuickOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}

export function FieldSalesQuickOrderDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName
}: FieldSalesQuickOrderDialogProps) {
  const { t } = useTranslation()
  const createSalesOrder = useCreateSalesOrder()
  const { data: myInfo } = useMyInfo()
  const [orderLabel, setOrderLabel] = useState('')

  const createOrder = async () => {
    await createSalesOrder.mutateAsync({
      name:
        orderLabel.trim() ||
        t('fieldSales.quickOrder.orderNameTemplate', {
          name: organizationName
        }),
      organization: organizationId,
      status: SALES_ORDER_DRAFT_STATUS_ID,
      record_owner: myInfo?.id
    })

    setOrderLabel('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-cyan-500" />
            {t('fieldSales.quickOrder.title')}
          </DialogTitle>
          <DialogDescription>
            {t('fieldSales.quickOrder.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 px-4 py-3">
            <div className="text-sm text-muted-foreground">
              {t('fieldSales.quickOrder.customer')}
            </div>
            <div className="font-medium">{organizationName}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-label">
              {t('fieldSales.quickOrder.label')}
            </Label>
            <Input
              id="order-label"
              value={orderLabel}
              onChange={event => setOrderLabel(event.target.value)}
              placeholder={t('fieldSales.quickOrder.orderNameTemplate', {
                name: organizationName
              })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('fieldSales.common.cancel')}
          </Button>
          <Button onClick={createOrder} disabled={createSalesOrder.isPending}>
            {createSalesOrder.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('fieldSales.quickOrder.openButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
