import React from 'react';
import { Calendar, Users, FileText, History } from 'lucide-react';

export type Page = 'schedule' | 'leaves' | 'masterData' | 'history';

interface LayoutProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  children: React.ReactNode;
}

export default function Layout({ currentPage, setCurrentPage, children }: LayoutProps) {
  const navItems = [
    { id: 'schedule', label: 'Planning', icon: Calendar },
    { id: 'leaves', label: 'Ferie, permessi e malattie', icon: FileText },
    { id: 'masterData', label: 'Anagrafiche', icon: Users },
    { id: 'history', label: 'Storico', icon: History },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa] text-gray-900 font-sans overflow-hidden">
      {/* Top Navbar */}
      <header className="flex items-center px-6 h-16 bg-white border-b border-gray-200 shrink-0 shadow-sm z-10">
        <h1 className="text-lg font-bold text-[#1e5b99] tracking-widest mr-12 uppercase">Gestione Servizi</h1>
        <nav className="flex space-x-2 h-full items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as Page)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-md transition-colors text-sm font-medium ${
                  isActive 
                    ? 'bg-[#1e5b99] text-white shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
