/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import SchedulePage from './pages/SchedulePage';
import LeaveRequestsPage from './pages/LeaveRequestsPage';
import MasterDataPage from './pages/MasterDataPage';
import type { Page } from './components/Layout';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('schedule');

  return (
    <AppProvider>
      <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
        {currentPage === 'schedule' && <SchedulePage />}
        {currentPage === 'leaves' && <LeaveRequestsPage />}
        {currentPage === 'masterData' && <MasterDataPage />}
      </Layout>
    </AppProvider>
  );
}
