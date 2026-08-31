import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

# Add History to Page type
old_type = "export type Page = 'schedule' | 'leaves' | 'masterData';"
new_type = "export type Page = 'schedule' | 'leaves' | 'masterData' | 'history';"
content = content.replace(old_type, new_type)

# Add icon import
old_import = "import { Calendar, Users, FileText } from 'lucide-react';"
new_import = "import { Calendar, Users, FileText, History } from 'lucide-react';"
content = content.replace(old_import, new_import)

# Add nav item
old_nav = """  const navItems = [
    { id: 'schedule', label: 'Planning', icon: Calendar },
    { id: 'leaves', label: 'Ferie, permessi e malattie', icon: FileText },
    { id: 'masterData', label: 'Anagrafiche', icon: Users },
  ];"""
new_nav = """  const navItems = [
    { id: 'schedule', label: 'Planning', icon: Calendar },
    { id: 'leaves', label: 'Ferie, permessi e malattie', icon: FileText },
    { id: 'masterData', label: 'Anagrafiche', icon: Users },
    { id: 'history', label: 'Storico', icon: History },
  ];"""
content = content.replace(old_nav, new_nav)

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
