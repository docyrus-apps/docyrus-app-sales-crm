import { z } from 'zod'

export const eventFormSchema = z
  .object({
    subject: z.string().min(1, 'validation.subjectRequired'),
    description: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    calendar: z.string().optional(),
    event_notes: z.record(z.any()).optional()
  })
  .refine(
    value => !value.start_date ||
      !value.end_date ||
      new Date(value.end_date) >= new Date(value.start_date),
    { path: ['end_date'], message: 'validation.endDateBeforeStart' }
  )

export type EventFormData = z.infer<typeof eventFormSchema>
