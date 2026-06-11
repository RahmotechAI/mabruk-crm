import { getCurrentUser } from '@/server/actions/auth'
import { getStockBalances, getStockMovements } from '@/server/actions/stock'
import { getProducts } from '@/server/actions/products'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmployeeInventoryEntryForm } from '@/components/employee/EmployeeInventoryEntryForm'
import { StockBalancesTable } from '@/components/employee/StockBalancesTable'
import { StockMovementsLog } from '@/components/employee/StockMovementsLog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function InventoryPage() {
  const user = await getCurrentUser()
  if (!user || !user.employee.location_id) return null

  const locationId = user.employee.location_id

  const [products, balances, movements] = await Promise.all([
    getProducts(),
    getStockBalances(locationId),
    getStockMovements({ location_id: locationId, limit: 100 }),
  ])

  return (
    <div>
      <PageHeader
        title="Склад"
        description="Учёт движения товаров на вашей торговой точке"
      />

      <Tabs defaultValue="entry">
        <TabsList className="mb-6">
          <TabsTrigger value="entry">Ввод данных</TabsTrigger>
          <TabsTrigger value="balance">Остатки</TabsTrigger>
          <TabsTrigger value="log">История</TabsTrigger>
        </TabsList>

        <TabsContent value="entry">
          <EmployeeInventoryEntryForm
            products={products}
            locationId={locationId}
            balances={balances}
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
