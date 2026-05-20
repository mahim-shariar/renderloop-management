import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProtectedRoute from '@/routes/ProtectedRoute.jsx';
import AppLayout from '@/components/layout/AppLayout.jsx';
import LoginPage from '@/features/auth/LoginPage.jsx';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { selectAuthUser } from '@/features/auth/authSlice.js';

// Code-split each page into its own chunk to keep the initial bundle small.
const DashboardPage = lazy(() => import('@/pages/DashboardPage.jsx'));
const EditorDashboardPage = lazy(() => import('@/pages/EditorDashboardPage.jsx'));
const ClientsPage = lazy(() => import('@/pages/ClientsPage.jsx'));
const ClientDetailPage = lazy(() => import('@/pages/ClientDetailPage.jsx'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage.jsx'));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage.jsx'));
const TeamPage = lazy(() => import('@/pages/TeamPage.jsx'));
const TeamDetailPage = lazy(() => import('@/pages/TeamDetailPage.jsx'));
const FinancePage = lazy(() => import('@/pages/FinancePage.jsx'));
const InvoicePage = lazy(() => import('@/pages/InvoicePage.jsx'));
const TasksPage = lazy(() => import('@/pages/TasksPage.jsx'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage.jsx'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage.jsx'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage.jsx'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'));

function PageFallback() {
  return (
    <div className="space-y-4 p-2">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

function useIsStaff() {
  const user = useSelector(selectAuthUser);
  return user?.role === 'admin' || user?.role === 'manager';
}

// Routes only admins/managers may open; editors/clients are bounced to Projects.
function StaffRoute({ children }) {
  return useIsStaff() ? children : <Navigate to="/projects" replace />;
}

// The "/" landing: staff see the agency dashboard, editors see their own.
function HomeIndex() {
  return useIsStaff() ? <DashboardPage /> : <EditorDashboardPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<HomeIndex />} />

              {/* Staff-only */}
              <Route path="/clients" element={<StaffRoute><ClientsPage /></StaffRoute>} />
              <Route path="/clients/:id" element={<StaffRoute><ClientDetailPage /></StaffRoute>} />
              <Route path="/team" element={<StaffRoute><TeamPage /></StaffRoute>} />
              <Route path="/team/:id" element={<StaffRoute><TeamDetailPage /></StaffRoute>} />
              <Route path="/finance" element={<StaffRoute><FinancePage /></StaffRoute>} />
              <Route
                path="/finance/invoice/:projectId"
                element={<StaffRoute><InvoicePage /></StaffRoute>}
              />
              <Route path="/analytics" element={<StaffRoute><AnalyticsPage /></StaffRoute>} />

              {/* Available to every signed-in user */}
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
