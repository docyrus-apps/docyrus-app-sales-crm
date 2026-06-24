import { z } from 'zod'

export const salesOrderItemFormSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  qty: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be positive'),
  discount: z.number().min(0).max(100).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  product: z.string().optional(),
  related_sales_order: z.string().min(1, 'Related sales order is required')
})

export type SalesOrderItemFormData = z.infer<typeof salesOrderItemFormSchema>
