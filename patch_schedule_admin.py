import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# Import useAuth
if "import { useAuth }" not in content:
    content = content.replace("import { useAppContext } from '../context/AppContext';", "import { useAppContext } from '../context/AppContext';\nimport { useAuth } from '../context/AuthContext';")

# Add isAdmin to SchedulePage
content = content.replace("export default function SchedulePage() {", "export default function SchedulePage() {\n  const { isAdmin } = useAuth();")

# Pass isAdmin to components that need it, e.g., EmployeeScheduleBlock
content = content.replace("<EmployeeScheduleBlock", "<EmployeeScheduleBlock isAdmin={isAdmin}")

# Also replace function EmployeeScheduleBlock signature
func_sig = "function EmployeeScheduleBlock({ \n  employee, weekDays, entries, onDelete, onUpdate, onAdd, onEdit, onDropEntry, onDropNew \n}: {"
new_sig = "function EmployeeScheduleBlock({ \n  isAdmin, employee, weekDays, entries, onDelete, onUpdate, onAdd, onEdit, onDropEntry, onDropNew \n}: { isAdmin?: boolean;"

content = content.replace(func_sig, new_sig)

# Block drop actions if not admin
content = content.replace("onDropEntry(draggedEntryId, date, employee.id);", "if (isAdmin) onDropEntry(draggedEntryId, date, employee.id);")
content = content.replace("onDropNew(shiftData, date, employee.id);", "if (isAdmin) onDropNew(shiftData, date, employee.id);")

# Hide edit controls in EmployeeScheduleBlock
content = content.replace('onClick={() => setIsEditing(true)}', 'onClick={() => isAdmin && setIsEditing(true)}')
content = content.replace('<button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-[#1e5b99] opacity-0 group-hover:opacity-100 transition-opacity">', 
                          '{isAdmin && <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-[#1e5b99] opacity-0 group-hover:opacity-100 transition-opacity">}')
content = content.replace('<Edit2 size={16} />\n                  </button>', '<Edit2 size={16} />\n                  </button>}')

# Hide Add button on days
content = content.replace('onClick={() => onAdd(day.date)}', 'onClick={() => isAdmin && onAdd(day.date)}')
content = content.replace('<button\n                    onClick={() => onAdd(day.date)}', '{isAdmin && <button\n                    onClick={() => onAdd(day.date)}')
content = content.replace('Aggiungi\n                  </button>', 'Aggiungi\n                  </button>}')

# Hide edit/delete on entry
content = content.replace('<button onClick={(e) => { e.stopPropagation(); onEdit(entry); }} className="text-gray-400 hover:text-[#1e5b99] p-1">',
                          '{isAdmin && <button onClick={(e) => { e.stopPropagation(); onEdit(entry); }} className="text-gray-400 hover:text-[#1e5b99] p-1">')
content = content.replace('<Edit2 size={14} />\n                      </button>', '<Edit2 size={14} />\n                      </button>}')

content = content.replace('<button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }} className="text-gray-400 hover:text-rose-600 p-1">',
                          '{isAdmin && <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }} className="text-gray-400 hover:text-rose-600 p-1">')
content = content.replace('<Trash2 size={14} />\n                      </button>', '<Trash2 size={14} />\n                      </button>}')

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
