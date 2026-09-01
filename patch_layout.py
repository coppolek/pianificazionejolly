import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

# Add imports for Auth and LogOut
import_repl = """import React from 'react';
import { Calendar, Users, FileText, History, LogOut } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
"""
content = content.replace("import React from 'react';\nimport { Calendar, Users, FileText, History } from 'lucide-react';", import_repl)

# Add logout button
header_repl = """      {/* Top Navbar */}
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
      </header>"""

# find and replace the header section
content = re.sub(r'\{\/\* Top Navbar \*\/\}.*?</header>', header_repl, content, flags=re.DOTALL)

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
