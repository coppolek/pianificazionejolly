import re

with open('src/pages/MasterDataPage.tsx', 'r') as f:
    content = f.read()

if "import { useAuth }" not in content:
    content = content.replace("import { useAppContext } from '../context/AppContext';", "import { useAppContext } from '../context/AppContext';\nimport { useAuth } from '../context/AuthContext';")

content = content.replace("export default function MasterDataPage() {", "export default function MasterDataPage() {\n  const { isAdmin } = useAuth();")

content = content.replace('<button\n              onClick={() => setIsAddingEmployee(true)}', '{isAdmin && <button\n              onClick={() => setIsAddingEmployee(true)}')
content = content.replace('Aggiungi Operatore\n            </button>', 'Aggiungi Operatore\n            </button>}')

content = content.replace('<button\n              onClick={() => setIsAddingWorkSite(true)}', '{isAdmin && <button\n              onClick={() => setIsAddingWorkSite(true)}')
content = content.replace('Aggiungi Cantiere\n            </button>', 'Aggiungi Cantiere\n            </button>}')

content = content.replace('<button onClick={() => { setEditingEmployee(emp); setIsAddingEmployee(true); }} className="text-gray-400 hover:text-[#1e5b99]">',
                          '{isAdmin && <button onClick={() => { setEditingEmployee(emp); setIsAddingEmployee(true); }} className="text-gray-400 hover:text-[#1e5b99]">')
content = content.replace('<Edit2 size={18} />\n                        </button>', '<Edit2 size={18} />\n                        </button>}')

content = content.replace('<button onClick={() => handleDeleteEmployee(emp.id)} className="text-gray-400 hover:text-rose-600">',
                          '{isAdmin && <button onClick={() => handleDeleteEmployee(emp.id)} className="text-gray-400 hover:text-rose-600">')
content = content.replace('<Trash2 size={18} />\n                        </button>', '<Trash2 size={18} />\n                        </button>}')

content = content.replace('<button onClick={() => { setEditingWorkSite(ws); setIsAddingWorkSite(true); }} className="text-gray-400 hover:text-[#1e5b99]">',
                          '{isAdmin && <button onClick={() => { setEditingWorkSite(ws); setIsAddingWorkSite(true); }} className="text-gray-400 hover:text-[#1e5b99]">')
content = content.replace('<Edit2 size={18} />\n                      </button>', '<Edit2 size={18} />\n                      </button>}')

content = content.replace('<button onClick={() => handleDeleteWorkSite(ws.id)} className="text-gray-400 hover:text-rose-600">',
                          '{isAdmin && <button onClick={() => handleDeleteWorkSite(ws.id)} className="text-gray-400 hover:text-rose-600">')
content = content.replace('<Trash2 size={18} />\n                      </button>', '<Trash2 size={18} />\n                      </button>}')

# Fix duplicate button closing tag for edits
content = content.replace('<Edit2 size={18} />\n                        </button>}', '<Edit2 size={18} />\n                        </button>}')

with open('src/pages/MasterDataPage.tsx', 'w') as f:
    f.write(content)
