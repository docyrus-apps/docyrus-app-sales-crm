import { z } from 'zod'

export const productFormSchema = z.object({
  name: z.string().min(1, 'validation.productNameRequired'),
  product_code: z.string().min(1, 'validation.productCodeRequired'),
  Unit: z.string().optional(),
  unit_price: z.number().min(0, 'validation.unitPricePositive').optional(),
  __unit_price_currency: z.enum(['TRY', 'USD', 'EUR']).default('TRY'),
  category: z.string().optional(),
  tax: z
    .number()
    .min(0, 'validation.taxRange')
    .max(100, 'validation.taxRange')
    .optional()
})

export type ProductFormData = z.infer<typeof productFormSchema>
