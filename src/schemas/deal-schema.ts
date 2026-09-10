import { z } from 'zod'

export const dealFormSchema = z.object({
  organization: z.string().min(1, 'validation.organizationRequired'),
  contact_person: z.string().optional(),
  stage: z.string().min(1, 'validation.stageRequired'),
  deal_value: z.number().min(0, 'validation.dealValuePositive').optional(),
  expected_revenue: z
    .number()
    .min(0, 'validation.expectedRevenuePositive')
    .optional(),
  close_probability: z
    .number()
    .min(0, 'validation.closeProbabilityRange')
    .max(100, 'validation.closeProbabilityRange')
    .optional(),
  expected_closing_date: z.string().optional(),
  lead_source: z.string().optional(),
  customer_type: z.string().optional(),
  reason_for_lost: z.string().optional(),
  country: z.string().optional(),
  hot_prospect: z.boolean().optional(),
  record_owner: z.string().optional()
})

export type DealFormData = z.infer<typeof dealFormSchema>
