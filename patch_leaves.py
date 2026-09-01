import re

with open('src/pages/LeaveRequestsPage.tsx', 'r') as f:
    content = f.read()

if "import { useAuth }" not in content:
    content = content.replace("import { useAppContext } from '../context/AppContext';", "import { useAppContext } from '../context/AppContext';\nimport { useAuth } from '../context/AuthContext';")

content = content.replace("export default function LeaveRequestsPage() {", "export default function LeaveRequestsPage() {\n  const { isAdmin } = useAuth();")

content = content.replace('<button\n          onClick={() => setIsAdding(true)}', '{isAdmin && <button\n          onClick={() => setIsAdding(true)}')
content = content.replace('Nuova Richiesta\n        </button>', 'Nuova Richiesta\n        </button>}')

content = content.replace('<button onClick={() => { setEditingRequest(req); setIsAdding(true); }} className="text-gray-400 hover:text-[#1e5b99]">',
                          '{isAdmin && <button onClick={() => { setEditingRequest(req); setIsAdding(true); }} className="text-gray-400 hover:text-[#1e5b99]">')
content = content.replace('<Edit2 size={18} />\n                        </button>', '<Edit2 size={18} />\n                        </button>}')

content = content.replace('<button onClick={() => handleDelete(req.id)} className="text-gray-400 hover:text-rose-600">',
                          '{isAdmin && <button onClick={() => handleDelete(req.id)} className="text-gray-400 hover:text-rose-600">')
content = content.replace('<Trash2 size={18} />\n                        </button>', '<Trash2 size={18} />\n                        </button>}')

content = content.replace('<select\n                          value={req.status || \'pending\'}', '{isAdmin ? <select\n                          value={req.status || \'pending\'}')
content = content.replace('</select>', '</select> : <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(req.status || \'pending\')}`}>{getStatusLabel(req.status || \'pending\')}</span>}')


with open('src/pages/LeaveRequestsPage.tsx', 'w') as f:
    f.write(content)
