import { AlertCircle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface FormSubmitAlertProps {
  title: string;
  message?: string | null;
}

export function FormSubmitAlert({ title, message }: FormSubmitAlertProps) {
  if (!message) return null

  return (
    <Alert variant="destructive" className="bg-destructive/5">
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
      </AlertDescription>
    </Alert>
  )
}
