import { z } from 'zod'

export const taskFormSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().optional(),
  organization: z.string().optional(),
  record_owner: z.string().optional(),
  parent: z.string().optional(),
  section: z.string().optional(),
  project: z.string().optional(),
  followers: z.array(z.string()).optional(),
})

export type TaskFormData = z.infer<typeof taskFormSchema>
