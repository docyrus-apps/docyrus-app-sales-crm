import { useEffect, useState } from 'react'
import { Loader2, LogOut } from 'lucide-react'
import { useMyInfo } from '@/hooks/use-users'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { type ActiveFieldSalesVisit } from '@/components/field-sales/field-sales-visit-sheet'

export interface FieldSalesCheckoutPayload {
  subject: string
  description: string
}

interface FieldSalesCheckoutSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  visit: ActiveFieldSalesVisit | null
  elapsedLabel: string
  saving?: boolean
  onSave: (payload: FieldSalesCheckoutPayload) => Promise<void> | void
}

export function FieldSalesCheckoutSheet({
  open,
  onOpenChange,
  visit,
  elapsedLabel,
  saving = false,
  onSave,
}: FieldSalesCheckoutSheetProps) {
  const { data: myInfo } = useMyInfo()
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!visit) return

    setSubject(`${visit.organizationName} ziyareti`)
    setDescription('')
  }, [visit])

  const save = async () => {
    await onSave({
      subject:
        subject.trim() || `${visit?.organizationName || 'Müşteri'} ziyareti`,
      description: description.trim(),
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl sm:max-w-xl">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <LogOut className="h-5 w-5 text-emerald-500" />
            Check-out
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 p-4">
          <Card>
            <CardContent className="space-y-3 px-4 py-4 text-sm">
              <div>
                <div className="text-muted-foreground">Müşteri</div>
                <div className="font-medium">
                  {visit?.organizationName || '-'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Süre</div>
                <div className="font-medium">{elapsedLabel}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Ziyareti yapan</div>
                <div className="font-medium">
                  {[myInfo?.firstname, myInfo?.lastname]
                    .filter(Boolean)
                    .join(' ') ||
                    myInfo?.email ||
                    '-'}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="visit-subject">Ziyaret başlığı</Label>
            <Input
              id="visit-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Ziyaret başlığı"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visit-description">Ziyaret notları</Label>
            <Textarea
              id="visit-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={10}
              placeholder="Ziyarette alınan notları, görüşülen konuları ve sonraki adımları yazın"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button onClick={save} disabled={saving || !visit}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Ziyareti Kaydet
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
