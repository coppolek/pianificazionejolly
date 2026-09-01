import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Make sure to import AuthProvider and LoginPage, useAuth
new_imports = """import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
"""

# Replace import { AppProvider } with new_imports + AppProvider
content = content.replace("import { AppProvider }", new_imports + "import { AppProvider }")

# Create an inner AppContent component
app_content = """function AppContent() {
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
"""

# Replace the existing export default function App()
content = re.sub(r'export default function App\(\) \{.*\}', app_content, content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
