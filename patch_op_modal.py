import re

with open('src/pages/MasterDataPage.tsx', 'r') as f:
    content = f.read()

operator_assignments_modal = """
function OperatorAssignmentsModal({ isOpen, onClose, emp }: { isOpen: boolean, onClose: () => void, emp: Employee }) {
  const { workSites, assignments, toggleAssignment } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  
  if (!isOpen) return null;

  const assignedWorkSiteIds = assignments.filter(a => a.employeeId === emp.id).map(a => a.workSiteId);
  const filteredWorkSites = workSites
    .filter(ws => ws.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="font-semibold text-slate-800">Associa Cantieri: {emp.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 flex flex-col overflow-hidden min-h-[300px]">
          <div className="relative mb-4 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cerca cantiere..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div className="overflow-y-auto flex-1 space-y-2 pr-2">
            {filteredWorkSites.length === 0 ? (
              <div className="text-center text-sm text-slate-500 mt-4">Nessun cantiere trovato.</div>
            ) : (
              filteredWorkSites.map(ws => {
                const isAssigned = assignedWorkSiteIds.includes(ws.id);
                return (
                  <div key={ws.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input 
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => toggleAssignment(emp.id, ws.id)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-800">{ws.name}</span>
                    </label>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"""

# Insert the modal after WeeklyPlanModal (around the end of it, before OperatoriSection)
# Actually, I'll insert it right before `function OperatoriSection()`
content = content.replace("function OperatoriSection() {", operator_assignments_modal + "function OperatoriSection() {")

with open('src/pages/MasterDataPage.tsx', 'w') as f:
    f.write(content)
