import { z } from 'zod'

export const activityFormSchema = z
  .object({
    subject: z.string().min(1, 'Subject is required'),
    description: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    record_owner: z.string().optional()
  })
  .refine(
    value => !value.start_date ||
      !value.end_date ||
      new Date(value.end_date) >= new Date(value.start_date),
    {
      message: 'End date must be after start date',
      path: ['end_date']
    }
  )

export type ActivityFormData = z.infer<typeof activityFormSchema>
