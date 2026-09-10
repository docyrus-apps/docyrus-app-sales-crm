import { z } from 'zod'

export const activityFormSchema = z
  .object({
    subject: z.string().min(1, 'validation.subjectRequired'),
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
      message: 'validation.endDateAfterStart',
      path: ['end_date']
    }
  )

export type ActivityFormData = z.infer<typeof activityFormSchema>
