import React from 'react';
import { Calendar, Users, FileText, History, LogOut, Shield } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';


export type Page = 'schedule' | 'leaves' | 'masterData' | 'history' | 'users';

interface LayoutProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  children: React.ReactNode;
}

export default function Layout({ currentPage, setCurrentPage, children }: LayoutProps) {
  const { isAdmin } = useAuth();
  const navItems = [
    { id: 'schedule', label: 'Planning', icon: Calendar },
    { id: 'leaves', label: 'Ferie, permessi e malattie', icon: FileText },
    { id: 'masterData', label: 'Anagrafiche', icon: Users },
    { id: 'history', label: 'Storico', icon: History },
  ];
  if (isAdmin) {
    navItems.push({ id: 'users', label: 'Gestione Utenti', icon: Shield });
  }

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa] text-gray-900 font-sans overflow-hidden">
            {/* Top Navbar */}
      <header className="flex items-center px-6 h-16 bg-white border-b border-gray-200 shrink-0 shadow-sm z-10 justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-bold text-[#1e5b99] tracking-widest mr-12 uppercase">Gestione Servizi</h1>
          <nav className="flex space-x-2 h-full items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id as Page)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#e8f0fe] text-[#1e5b99]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} className="mr-2" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 text-gray-600 hover:text-rose-600 px-3 py-2 rounded-md hover:bg-rose-50 transition-colors text-sm font-medium"
            title="Esci"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Esci</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
