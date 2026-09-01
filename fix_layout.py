import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

# Make sure we add the mobile menu
menu_code = """      </header>

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

# We search for `      </header>` and replace it along with the main tag.
old_str = "      </header>\n      {/* Main Content */}\n      <main className=\"flex-1 overflow-auto p-6 lg:p-8\">"
if old_str in content:
    content = content.replace(old_str, menu_code)
else:
    print("Not found exactly, using regex")
    content = re.sub(r'</header>\s*\{\/\*\s*Main Content\s*\*\/\}\s*<main[^>]*>', menu_code, content)

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
