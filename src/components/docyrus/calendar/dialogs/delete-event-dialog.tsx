'use client'

import { useState } from 'react'

import { TrashIcon } from 'lucide-react'
import { toast } from 'sonner'

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
import { Button } from '@/components/ui/button'

import { useCalendar } from '../contexts/calendar-context'

interface DeleteEventDialogProps {
  eventId: number
}

export default function DeleteEventDialog({ eventId }: DeleteEventDialogProps) {
  const { removeEvent } = useCalendar()
  const [open, setOpen] = useState(false)

  const deleteEvent = () => {
    try {
      removeEvent(eventId)
      toast.success('Event deleted successfully.')
      setOpen(false)
    } catch {
      toast.error('Error deleting event.')
    }
  }

  if (!eventId) {
    return null
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <TrashIcon />
        Delete
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteEvent}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
