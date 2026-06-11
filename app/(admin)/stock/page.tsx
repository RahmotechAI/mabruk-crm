import { getProducts } from '@/server/actions/products'
import { getStockBalances, getStockMovements } from '@/server/actions/stock'
import { getLocations } from '@/server/actions/locations'
import { PageHeader } from '@/components/shared/PageHeader'
import { AdminStockMovementForm } from '@/components/admin/AdminStockMovementForm'
import { StockBalancesTable } from '@/components/employee/StockBalancesTable'
import { StockMovementsLog } from '@/components/employee/StockMovementsLog'
import { LocationSelector } from '@/components/admin/LocationSelector'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SearchParams {
  location_id?: string
}

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const [products, locations] = await Promise.all([
    getProducts(),
    getLocations(),
  ])

  const locationId = sp.location_id || locations[0]?.id

  const [balances, movements] = locationId
    ? await Promise.all([
        getStockBalances(locationId),
        getStockMovements({ location_id: locationId, limit: 100 }),
      ])
    : [[], []]

  return (
    <div>
      <PageHeader title="Склад" description="Управление складскими операциями по всем точкам" />

      {locations.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm font-medium text-slate-600">Торговая точка:</label>
          <LocationSelector locations={locations} value={locationId ?? ''} />
        </div>
      )}

      <Tabs defaultValue="add">
        <TabsList className="mb-6">
          <TabsTrigger value="add">Добавить движение</TabsTrigger>
          <TabsTrigger value="balance">Остатки</TabsTrigger>
          <TabsTrigger value="log">История</TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          {locationId ? (
            <AdminStockMovementForm products={products} locationId={locationId} />
          ) : (
            <p className="text-sm text-slate-400">Сначала создайте торговую точку</p>
          )}
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
