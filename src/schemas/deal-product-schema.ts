import { z } from 'zod'

export const dealProductFormSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  qty: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be positive'),
  discount: z.number().min(0).max(100).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  product: z.string().min(1, 'Product is required'),
  related_deal: z.string().min(1, 'Related deal is required')
})

export type DealProductFormData = z.infer<typeof dealProductFormSchema>
