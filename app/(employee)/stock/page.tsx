import { getCurrentUser } from '@/server/actions/auth'
import { getProducts } from '@/server/actions/products'
import { getStockBalances, getStockMovements } from '@/server/actions/stock'
import { PageHeader } from '@/components/shared/PageHeader'
import { StockMovementForm } from '@/components/employee/StockMovementForm'
import { StockBalancesTable } from '@/components/employee/StockBalancesTable'
import { StockMovementsLog } from '@/components/employee/StockMovementsLog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function StockPage() {
  const user = await getCurrentUser()
  if (!user || !user.employee.location_id) return null

  const locationId = user.employee.location_id

  const [products, balances, movements] = await Promise.all([
    getProducts(),
    getStockBalances(locationId),
    getStockMovements({ location_id: locationId, limit: 50 }),
  ])

  return (
    <div>
      <PageHeader
        title="Склад"
        description="Учёт поступлений, возвратов и списаний"
      />

      <Tabs defaultValue="add">
        <TabsList className="mb-6">
          <TabsTrigger value="add">Добавить движение</TabsTrigger>
          <TabsTrigger value="balance">Остатки</TabsTrigger>
          <TabsTrigger value="log">История</TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <StockMovementForm
            products={products}
            locationId={locationId}
          />
        </TabsContent>

        <TabsContent value="balance">
          <StockBalancesTable balances={balances} />
        </TabsContent>

        <TabsContent value="log">
          <StockMovementsLog movements={movements} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
