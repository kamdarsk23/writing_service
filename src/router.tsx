import { createHashRouter, Outlet } from 'react-router-dom';

function AuthRoutesOutlet() {
  return <Outlet />;
}
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { QTreePage } from './pages/QTreePage';
import { QTreeEditorPage } from './pages/QTreeEditorPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { AuthProvider } from './contexts/AuthContext';

function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export const router = createHashRouter([
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'auth',
        element: <AuthRoutesOutlet />,
        children: [
          { index: true, element: <AuthPage /> },
          { path: 'update-password', element: <UpdatePasswordPage /> },
        ],
      },
      {
        path: '',
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'folder/:folderId',
            element: <DashboardPage />,
          },
        ],
      },
      {
        path: 'work/:workId',
        element: (
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'qtree/:rootId',
        element: (
          <ProtectedRoute>
            <QTreePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'qtree/:rootId/node/:nodeId',
        element: (
          <ProtectedRoute>
            <QTreeEditorPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
