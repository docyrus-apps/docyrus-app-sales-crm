import { z } from 'zod'

export const dealFormSchema = z.object({
  organization: z.string().min(1, 'Organization is required'),
  contact_person: z.string().optional(),
  stage: z.string().min(1, 'Stage is required'),
  deal_value: z.number().min(0, 'Deal value must be positive').optional(),
  expected_revenue: z
    .number()
    .min(0, 'Expected revenue must be positive')
    .optional(),
  close_probability: z
    .number()
    .min(0, 'Close probability must be between 0 and 100')
    .max(100, 'Close probability must be between 0 and 100')
    .optional(),
  expected_closing_date: z.string().optional(),
  lead_source: z.string().optional(),
  customer_type: z.string().optional(),
  country: z.string().optional(),
  hot_prospect: z.boolean().optional(),
  record_owner: z.string().optional()
})

export type DealFormData = z.infer<typeof dealFormSchema>
