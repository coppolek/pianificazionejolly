import re

with open('src/pages/MasterDataPage.tsx', 'r') as f:
    content = f.read()

# Update OperatorRow signature
old_sig = "function OperatorRow({ emp, onDelete, onUpdate }: { key?: React.Key, emp: any, onDelete: () => void, onUpdate: (updates: { name?: string, type?: 'jolly' | 'ordinario', company?: string }) => void }) {"
new_sig = "function OperatorRow({ emp, onDelete, onUpdate, onEditAssignments }: { key?: React.Key, emp: any, onDelete: () => void, onUpdate: (updates: { name?: string, type?: 'jolly' | 'ordinario', company?: string }) => void, onEditAssignments: () => void }) {"
content = content.replace(old_sig, new_sig)

# Update OperatorRow actions
old_actions = """        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => {setIsEditing(true); setEditedName(emp.name); setEditedType(emp.type || 'jolly'); setEditedCompany(emp.company || '');}}
            className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
            title="Modifica"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={onDelete}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
            title="Elimina"
          >
            <Trash2 size={16} />
          </button>
        </div>"""

new_actions = """        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEditAssignments}
            className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
            title="Associa Cantieri"
          >
            <Link size={16} />
          </button>
          <button 
            onClick={() => {setIsEditing(true); setEditedName(emp.name); setEditedType(emp.type || 'jolly'); setEditedCompany(emp.company || '');}}
            className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
            title="Modifica"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={onDelete}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
            title="Elimina"
          >
            <Trash2 size={16} />
          </button>
        </div>"""

content = content.replace(old_actions, new_actions)

with open('src/pages/MasterDataPage.tsx', 'w') as f:
    f.write(content)

