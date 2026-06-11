import { getLocations } from '@/server/actions/locations'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataResetPanel } from '@/components/admin/DataResetPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function SettingsPage() {
  const locations = await getLocations()

  return (
    <div>
      <PageHeader
        title="Настройки"
        description="Управление данными системы. Только для администраторов."
      />

      <Tabs defaultValue="data">
        <TabsList className="mb-6">
          <TabsTrigger value="data">Управление данными</TabsTrigger>
        </TabsList>

        <TabsContent value="data">
          <DataResetPanel locations={locations} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
