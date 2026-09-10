import { AlertCircle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface FormSubmitAlertProps {
  title: string;
  message?: string | null;
  className?: string;
}

export function FormSubmitAlert({
  title,
  message,
  className
}: FormSubmitAlertProps) {
  if (!message) return null

  return (
    <Alert variant="destructive" className={cn('bg-destructive/5', className)}>
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
      </AlertDescription>
    </Alert>
  )
}
