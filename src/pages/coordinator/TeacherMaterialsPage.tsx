import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { MaterialsLibraryPage } from '@/pages/officer/MaterialsLibraryPage';

export function TeacherMaterialsPage() {
  return <MaterialsLibraryPage />;
}
