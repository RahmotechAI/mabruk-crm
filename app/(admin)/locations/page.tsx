import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { getLocations } from '@/server/actions/locations'
import { LocationsManager } from '@/components/admin/LocationsManager'

export default async function LocationsPage() {
  const locations = await getLocations()

  return (
    <div>
      <PageHeader
        title="Торговые точки"
        description="Управление торговыми точками"
      />
      <Card>
        <CardContent className="pt-6">
          <LocationsManager initialLocations={locations} />
        </CardContent>
      </Card>
    </div>
  )
}
