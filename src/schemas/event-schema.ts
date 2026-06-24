import { z } from 'zod'

export const eventFormSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  calendar: z.string().optional(),
  event_notes: z.record(z.any()).optional()
})

export type EventFormData = z.infer<typeof eventFormSchema>
