import { z } from 'zod'

export const leadFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company_name: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  lead_source: z.string().optional(),
  lead_status: z.string().optional(),
  lead_type: z.string().optional(),
  country: z.string().optional(),
  record_owner: z.string().optional(),
  contact_message: z.string().optional(),
})

export type LeadFormData = z.infer<typeof leadFormSchema>
