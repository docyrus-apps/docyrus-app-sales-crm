import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useProducts } from '@/hooks/use-products'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function Products() {
  const { data: products, isLoading } = useProducts()

  return (
    <PageContainer>
      <PageHeader
        title="Products"
        description="Manage your product catalog"
        actions={
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            New Product
          </Button>
        }
      />

      {isLoading && <Skeleton className="h-64 w-full" />}

      {products && products.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">No products yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add your first product to the catalog
            </p>
          </CardContent>
        </Card>
      )}

      {products && products.length > 0 && (
        <div className="text-sm">Found {products.length} products</div>
      )}
    </PageContainer>
  )
}
