import { z } from 'zod'

export const contactFormSchema = z.object({
  name: z.string().min(1, 'validation.nameRequired'),
  job_title: z.string().optional(),
  email: z.string().email('validation.invalidEmail').optional().or(z.literal('')),
  mobile: z.string().optional(),
  organization: z.string().optional()
})

export type ContactFormData = z.infer<typeof contactFormSchema>
