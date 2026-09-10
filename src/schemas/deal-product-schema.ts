import { z } from 'zod'

export const dealProductFormSchema = z.object({
  category: z.string().min(1, 'validation.categoryRequired'),
  qty: z.number().min(1, 'validation.quantityMin'),
  unit_price: z.number().min(0, 'validation.unitPricePositive'),
  discount: z.number().min(0).max(100).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  product: z.string().min(1, 'validation.productRequired'),
  related_deal: z.string().min(1, 'validation.relatedDealRequired')
})

export type DealProductFormData = z.infer<typeof dealProductFormSchema>
