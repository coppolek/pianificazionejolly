import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import for UsersPage
content = content.replace("import HistoryPage from './pages/HistoryPage';", "import HistoryPage from './pages/HistoryPage';\nimport UsersPage from './pages/UsersPage';")

# Add the route for 'users'
content = content.replace("{currentPage === 'history' && <HistoryPage />}", "{currentPage === 'history' && <HistoryPage />}\n        {currentPage === 'users' && <UsersPage />}")

with open('src/App.tsx', 'w') as f:
    f.write(content)

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

# Add import for Shield, useAuth
content = content.replace("import { Calendar, Users, FileText, History, LogOut } from 'lucide-react';", "import { Calendar, Users, FileText, History, LogOut, Shield } from 'lucide-react';")
content = content.replace("import { signOut } from 'firebase/auth';", "import { signOut } from 'firebase/auth';\nimport { useAuth } from '../context/AuthContext';")

# Add 'users' to Page type
content = content.replace("export type Page = 'schedule' | 'leaves' | 'masterData' | 'history';", "export type Page = 'schedule' | 'leaves' | 'masterData' | 'history' | 'users';")

# Add useAuth hook to component
content = content.replace("export default function Layout({ currentPage, setCurrentPage, children }: LayoutProps) {", "export default function Layout({ currentPage, setCurrentPage, children }: LayoutProps) {\n  const { isAdmin } = useAuth();")

# Modify navItems
nav_items = """  const navItems = [
    { id: 'schedule', label: 'Planning', icon: Calendar },
    { id: 'leaves', label: 'Ferie, permessi e malattie', icon: FileText },
    { id: 'masterData', label: 'Anagrafiche', icon: Users },
    { id: 'history', label: 'Storico', icon: History },
  ];
  if (isAdmin) {
    navItems.push({ id: 'users', label: 'Gestione Utenti', icon: Shield });
  }"""
content = re.sub(r"  const navItems = \[.*?\];", nav_items, content, flags=re.DOTALL)

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
