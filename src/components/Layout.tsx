import React from 'react';
import { Calendar, Users, FileText, History, LogOut, Shield, Bell, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
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
  const { notifications } = useAppContext();
  const [showNotifs, setShowNotifs] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastRead, setLastRead] = useState<string>(() => localStorage.getItem('lastReadNotif') || new Date(0).toISOString());
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => new Date(n.createdAt) > new Date(lastRead)).length;

  const handleOpenNotifs = () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs) {
      const now = new Date().toISOString();
      setLastRead(now);
      localStorage.setItem('lastReadNotif', now);
    }
  };
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
      <header className="flex items-center px-4 md:px-6 h-16 bg-white border-b border-gray-200 shrink-0 shadow-sm z-10 justify-between relative">
        <div className="flex items-center">
          <button 
            className="md:hidden p-2 mr-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <h1 className="text-lg font-bold text-[#1e5b99] tracking-widest mr-4 md:mr-12 uppercase truncate max-w-[120px] sm:max-w-none">
            <span className="hidden sm:inline">Gestione Servizi</span>
            <span className="sm:hidden">Servizi</span>
          </h1>
          
          <nav className="hidden md:flex space-x-2 h-full items-center">
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
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleOpenNotifs}
              className="relative p-2 text-gray-600 hover:text-[#1e5b99] hover:bg-[#f4f9ff] rounded-full transition-colors"
              title="Notifiche"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 flex flex-col max-h-[400px]">
                <div className="p-3 bg-gray-50 border-b border-gray-100 font-semibold text-sm text-gray-800">
                  Notifiche
                </div>
                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Nessuna notifica</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <p className="text-sm text-gray-800">{n.message}</p>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleString('it-IT')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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

      {/* Mobile Nav Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg absolute top-16 left-0 right-0 z-40">
          <nav className="flex flex-col p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id as Page);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#e8f0fe] text-[#1e5b99]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} className="mr-3 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
