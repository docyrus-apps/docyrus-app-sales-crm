/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCreateDeal } from '@/hooks/use-deals'
import { useUpdateLead } from '@/hooks/use-leads'

interface LeadConvertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: any
}

export function LeadConvertDialog({
  open,
  onOpenChange,
  lead,
}: LeadConvertDialogProps) {
  const navigate = useNavigate()
  const createDeal = useCreateDeal()
  const updateLead = useUpdateLead()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  const handleConvert = async () => {
    if (!lead) return

    setIsConverting(true)
    try {
      // Map lead data to deal data
      const dealData = {
        organizations:
          typeof lead.company_name === 'object'
            ? lead.company_name.id
            : lead.company_name || '',
        stage: 'prospecting', // Default stage for new deals
        lead_source: lead.lead_source || '',
        country: lead.country || '',
        // Initialize with empty/default values
        deal_value: 0,
        expected_revenue: 0,
        close_probability: 10,
        hot_prospect: false,
      }

      // Create the deal
      const newDeal = await createDeal.mutateAsync(dealData)

      // Update lead status to "Converted"
      await updateLead.mutateAsync({
        leadId: lead.id,
        data: {
          lead_status: 'converted',
        },
      })

      toast.success('Lead converted to deal successfully')
      onOpenChange(false)

      // Navigate to the new deal
      if (newDeal?.id) {
        navigate({ to: `/deals/${newDeal.id}` })
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to convert lead')
    } finally {
      setIsConverting(false)
    }
  }

  const handleConfirm = () => {
    setShowConfirmation(true)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Lead to Deal</DialogTitle>
            <DialogDescription>
              This will create a new deal based on this lead's information and
              mark the lead as converted.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Lead Information</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium">Title:</span> {lead?.title}
                </p>
                {lead?.company_name && (
                  <p>
                    <span className="font-medium">Company:</span>{' '}
                    {typeof lead.company_name === 'object'
                      ? lead.company_name.name
                      : lead.company_name}
                  </p>
                )}
                {lead?.lead_source && (
                  <p>
                    <span className="font-medium">Source:</span>{' '}
                    {lead.lead_source}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-md bg-muted p-4">
              <p className="text-sm">
                A new deal will be created in the{' '}
                <span className="font-medium">Prospecting</span> stage. You can
                update the deal details after conversion.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm}>
              Convert to Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will convert the lead to a deal and mark it as
              converted. This action can be reversed by editing the lead status
              later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConverting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert} disabled={isConverting}>
              {isConverting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Conversion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
