import { z } from 'zod'

export const leadFormSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  contact_job_title: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  company_name_text: z.string().optional(),
  company_email: z
    .string()
    .email('Invalid company email address')
    .optional()
    .or(z.literal('')),
  company_phone: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  company_industry: z.string().optional(),
  company_size: z.string().optional(),
  lead_source: z.string().optional(),
  lead_status: z.string().optional(),
  lead_type: z.string().optional(),
  country: z.string().optional(),
  record_owner: z.string().optional(),
  contact_message: z.string().optional(),
  lost_reason: z.string().optional(),
  deal_value: z.number().min(0, 'Estimated value must be positive').optional(),
  leads_products_tags: z.array(z.string()).optional()
})

export type LeadFormData = z.infer<typeof leadFormSchema>
