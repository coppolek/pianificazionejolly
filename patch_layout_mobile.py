import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

# Imports
content = content.replace("import { Calendar, Users, FileText, History, LogOut, Shield, Bell } from 'lucide-react';", 
"import { Calendar, Users, FileText, History, LogOut, Shield, Bell, Menu, X } from 'lucide-react';")

# State
state_hook = "const [showNotifs, setShowNotifs] = useState(false);"
new_state_hook = "const [showNotifs, setShowNotifs] = useState(false);\n  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);"
content = content.replace(state_hook, new_state_hook)

# Header
old_header = """      <header className="flex items-center px-6 h-16 bg-white border-b border-gray-200 shrink-0 shadow-sm z-10 justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-bold text-[#1e5b99] tracking-widest mr-12 uppercase">Gestione Servizi</h1>
          <nav className="flex space-x-2 h-full items-center">"""

new_header = """      <header className="flex items-center px-4 md:px-6 h-16 bg-white border-b border-gray-200 shrink-0 shadow-sm z-10 justify-between relative">
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
          
          <nav className="hidden md:flex space-x-2 h-full items-center">"""
content = content.replace(old_header, new_header)

# Right section gap
content = content.replace('<div className="flex items-center gap-4">', '<div className="flex items-center gap-2 md:gap-4">')

# Main content and mobile menu
old_main = """      </header>
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 lg:p-8">"""

new_main = """      </header>

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
      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">"""
content = content.replace(old_main, new_main)

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
