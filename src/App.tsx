/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import SchedulePage from './pages/SchedulePage';
import LeaveRequestsPage from './pages/LeaveRequestsPage';
import MasterDataPage from './pages/MasterDataPage';
import HistoryPage from './pages/HistoryPage';
import UsersPage from './pages/UsersPage';
import type { Page } from './components/Layout';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('schedule');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Caricamento...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppProvider>
      <Toaster position="top-center" />
      <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
        {currentPage === 'schedule' && <SchedulePage />}
        {currentPage === 'leaves' && <LeaveRequestsPage />}
        {currentPage === 'masterData' && <MasterDataPage />}
        {currentPage === 'history' && <HistoryPage />}
        {currentPage === 'users' && <UsersPage />}
      </Layout>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

