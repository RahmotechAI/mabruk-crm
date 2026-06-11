import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { getAllProducts } from '@/server/actions/products'
import { ProductsManager } from '@/components/admin/ProductsManager'

export default async function ProductsPage() {
  const products = await getAllProducts()

  return (
    <div>
      <PageHeader
        title="Товары и цены"
        description="Управление товарами и ценами. Цены хранятся с историей изменений."
      />
      <Card>
        <CardContent className="pt-6">
          <ProductsManager initialProducts={products} />
        </CardContent>
      </Card>
    </div>
  )
}
