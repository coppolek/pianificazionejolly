import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { Calendar, Users, FileText, History, LogOut, Shield } from 'lucide-react';", 
"import { Calendar, Users, FileText, History, LogOut, Shield, Bell } from 'lucide-react';\nimport { useState, useEffect, useRef } from 'react';\nimport { useAppContext } from '../context/AppContext';")

# 2. Add state and logic for notifications inside Layout function
state_logic = """export default function Layout({ currentPage, setCurrentPage, children }: LayoutProps) {
  const { isAdmin } = useAuth();"""
new_state_logic = """export default function Layout({ currentPage, setCurrentPage, children }: LayoutProps) {
  const { isAdmin } = useAuth();
  const { notifications } = useAppContext();
  const [showNotifs, setShowNotifs] = useState(false);
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
  };"""
content = content.replace(state_logic, new_state_logic)

# 3. Add Bell icon before Logout button
bell_icon = """        <div className="flex items-center">
          <button"""
new_bell_icon = """        <div className="flex items-center gap-4">
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

          <button"""
content = content.replace(bell_icon, new_bell_icon)

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
