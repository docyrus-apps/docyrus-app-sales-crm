import { z } from 'zod'

export const companyFormSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  country: z.string().optional(),
  city: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  address: z.string().optional(),
  tax_number: z.string().optional(),
  district: z.string().optional()
})

export type CompanyFormData = z.infer<typeof companyFormSchema>
