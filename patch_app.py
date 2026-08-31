import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import
old_import = "import MasterDataPage from './pages/MasterDataPage';"
new_import = "import MasterDataPage from './pages/MasterDataPage';\nimport HistoryPage from './pages/HistoryPage';"
content = content.replace(old_import, new_import)

# Add page route
old_route = "        {currentPage === 'masterData' && <MasterDataPage />}"
new_route = "        {currentPage === 'masterData' && <MasterDataPage />}\n        {currentPage === 'history' && <HistoryPage />}"
content = content.replace(old_route, new_route)

with open('src/App.tsx', 'w') as f:
    f.write(content)
