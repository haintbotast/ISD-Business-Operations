import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { CategoryTable } from '@/components/admin/CategoryTable';
import { LocationTable } from '@/components/admin/LocationTable';
import { UserTable } from '@/components/admin/UserTable';
import { ImportWizard } from '@/components/admin/ImportWizard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('admin.title')}</h1>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">{t('admin.categories')}</TabsTrigger>
          <TabsTrigger value="locations">{t('admin.locations')}</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">{t('admin.users')}</TabsTrigger>}
          <TabsTrigger value="import">{t('admin.import')}</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="pt-2">
          <CategoryTable />
        </TabsContent>

        <TabsContent value="locations" className="pt-2">
          <LocationTable />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="pt-2">
            <UserTable />
          </TabsContent>
        )}

        <TabsContent value="import" className="pt-2">
          <ImportWizard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
