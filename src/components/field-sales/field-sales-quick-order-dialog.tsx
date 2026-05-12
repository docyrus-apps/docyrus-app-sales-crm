import { useState } from 'react'
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
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const SALES_ORDER_DRAFT_STATUS_ID = '019c48d0-6c11-7389-822c-7bf9f87b047e'

interface FieldSalesQuickOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  organizationName: string
}

export function FieldSalesQuickOrderDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: FieldSalesQuickOrderDialogProps) {
  const createSalesOrder = useCreateSalesOrder()
  const { data: myInfo } = useMyInfo()
  const [orderLabel, setOrderLabel] = useState('')

  const createOrder = async () => {
    await createSalesOrder.mutateAsync({
      name: orderLabel.trim() || `${organizationName} Siparişi`,
      organization: organizationId,
      status: SALES_ORDER_DRAFT_STATUS_ID,
      record_owner: myInfo?.id,
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
            Sipariş Oluştur
          </DialogTitle>
          <DialogDescription>
            Sipariş taslağı bu müşteri için oluşturulur ve satış siparişleri
            akışında devam eder.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 px-4 py-3">
            <div className="text-sm text-muted-foreground">Müşteri</div>
            <div className="font-medium">{organizationName}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-label">Sipariş başlığı</Label>
            <Input
              id="order-label"
              value={orderLabel}
              onChange={(event) => setOrderLabel(event.target.value)}
              placeholder={`${organizationName} Siparişi`}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button onClick={createOrder} disabled={createSalesOrder.isPending}>
            {createSalesOrder.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Siparişi Aç
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
