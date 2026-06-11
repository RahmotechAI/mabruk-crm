import { getProducts } from '@/server/actions/products'
import { getStockBalances, getStockMovements, getInventoryReport } from '@/server/actions/stock'
import { getLocations } from '@/server/actions/locations'
import { getEmployees } from '@/server/actions/employees'
import { PageHeader } from '@/components/shared/PageHeader'
import { AdminStockMovementForm } from '@/components/admin/AdminStockMovementForm'
import { AdminInventoryReport } from '@/components/admin/AdminInventoryReport'
import { StockBalancesTable } from '@/components/employee/StockBalancesTable'
import { StockMovementsLogAdmin } from '@/components/admin/StockMovementsLogAdmin'
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
  const [products, locations, employees] = await Promise.all([
    getProducts(),
    getLocations(),
    getEmployees(),
  ])

  const locationId = sp.location_id || locations[0]?.id

  const [balances, movements, inventoryReport] = await Promise.all([
    locationId ? getStockBalances(locationId) : Promise.resolve([]),
    locationId ? getStockMovements({ location_id: locationId, limit: 100 }) : Promise.resolve([]),
    getInventoryReport(),
  ])

  return (
    <div>
      <PageHeader title="Склад" description="Управление складскими операциями по всем точкам" />

      <Tabs defaultValue="inventory">
        <TabsList className="mb-6">
          <TabsTrigger value="inventory">Учёт по точкам</TabsTrigger>
          <TabsTrigger value="add">Добавить движение</TabsTrigger>
          <TabsTrigger value="balance">Остатки</TabsTrigger>
          <TabsTrigger value="log">История</TabsTrigger>
        </TabsList>

        {/* Inventory report with filters */}
        <TabsContent value="inventory">
          <AdminInventoryReport
            locations={locations}
            products={products}
            employees={employees}
            initialData={inventoryReport}
          />
        </TabsContent>

        {/* Add movement (single entry) */}
        <TabsContent value="add">
          {locations.length > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <label className="text-sm font-medium text-slate-600">Торговая точка:</label>
              <LocationSelector locations={locations} value={locationId ?? ''} />
            </div>
          )}
          {locationId ? (
            <AdminStockMovementForm products={products} locationId={locationId} />
          ) : (
            <p className="text-sm text-slate-400">Сначала создайте торговую точку</p>
          )}
        </TabsContent>

        {/* Balances per location */}
        <TabsContent value="balance">
          {locations.length > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <label className="text-sm font-medium text-slate-600">Торговая точка:</label>
              <LocationSelector locations={locations} value={locationId ?? ''} />
            </div>
          )}
          <StockBalancesTable balances={balances} />
        </TabsContent>

        {/* Movement log */}
        <TabsContent value="log">
          {locations.length > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <label className="text-sm font-medium text-slate-600">Торговая точка:</label>
              <LocationSelector locations={locations} value={locationId ?? ''} />
            </div>
          )}
          <StockMovementsLogAdmin movements={movements} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
