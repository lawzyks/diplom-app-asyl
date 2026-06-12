import { RouterProvider, useRoute } from './lib/router.jsx';
import Layout from './components/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import InstitutionPage from './pages/InstitutionPage.jsx';
import SpecialtiesPage from './pages/SpecialtiesPage.jsx';
import QualificationsPage from './pages/QualificationsPage.jsx';
import DisciplinesPage from './pages/DisciplinesPage.jsx';
import StudentsPage from './pages/StudentsPage.jsx';
import GradesPage from './pages/GradesPage.jsx';
import DocumentPage from './pages/DocumentPage.jsx';

const ROUTES = {
  '/': DashboardPage,
  '/institution': InstitutionPage,
  '/specialties': SpecialtiesPage,
  '/qualifications': QualificationsPage,
  '/disciplines': DisciplinesPage,
  '/students': StudentsPage,
  '/grades': GradesPage,
  '/document': DocumentPage,
};

function CurrentPage() {
  const { path } = useRoute();
  const Page = ROUTES[path] || DashboardPage;
  return (
    <Layout>
      <Page />
    </Layout>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <CurrentPage />
    </RouterProvider>
  );
}
