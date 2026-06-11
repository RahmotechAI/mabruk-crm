import { getCurrentUser } from '@/server/actions/auth'
import { getStockBalances, getStockMovements } from '@/server/actions/stock'
import { PageHeader } from '@/components/shared/PageHeader'
import { StockBalancesTable } from '@/components/employee/StockBalancesTable'
import { StockMovementsLog } from '@/components/employee/StockMovementsLog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function StockPage() {
  const user = await getCurrentUser()
  if (!user || !user.employee.location_id) return null

  const locationId = user.employee.location_id

  const [balances, movements] = await Promise.all([
    getStockBalances(locationId),
    getStockMovements({ location_id: locationId, limit: 50 }),
  ])

  return (
    <div>
      <PageHeader
        title="Склад"
        description="Остатки и история движения товаров на вашей точке"
      />

      <Tabs defaultValue="balance">
        <TabsList className="mb-6">
          <TabsTrigger value="balance">Остатки</TabsTrigger>
          <TabsTrigger value="log">История</TabsTrigger>
        </TabsList>

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
