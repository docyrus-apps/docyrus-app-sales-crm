import { z } from 'zod'

export const taskFormSchema = z
  .object({
    subject: z.string().min(1, 'validation.subjectRequired'),
    description: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    organization: z.string().optional(),
    deal: z.string().optional(),
    record_owner: z.string().optional(),
    parent: z.string().optional(),
    section: z.string().optional(),
    project: z.string().optional(),
    followers: z.array(z.string()).optional()
  })
  .refine(
    value => !value.start_date ||
      !value.end_date ||
      new Date(value.end_date) >= new Date(value.start_date),
    { path: ['end_date'], message: 'validation.dueDateBeforeStart' }
  )

export type TaskFormData = z.infer<typeof taskFormSchema>
