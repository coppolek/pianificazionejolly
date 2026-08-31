import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# Add import
if "import toast from 'react-hot-toast';" not in content:
    content = content.replace("import { Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';", "import { Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';\nimport toast from 'react-hot-toast';")

# Update handleDrop window.confirm
old_confirm = """        if (overlap) {
          if (!window.confirm(`Attenzione: l'orario si accavalla con "${overlap.taskDescription}" (${overlap.startTime} - ${overlap.endTime}). Vuoi procedere comunque?`)) {
            return;
          }
        }
      }
      onDropEntry(entryId, day.date, employeeId);"""

new_confirm = """        if (overlap) {
          toast.error(
            (t) => (
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-sm">Attenzione: Sovrapposizione oraria!</span>
                <span className="text-xs">
                  L'orario si accavalla con "{overlap.taskDescription}" ({overlap.startTime} - {overlap.endTime}).
                </span>
                <div className="flex justify-end gap-2 mt-2">
                  <button 
                    onClick={() => toast.dismiss(t.id)}
                    className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs hover:bg-gray-300"
                  >
                    Annulla
                  </button>
                  <button 
                    onClick={() => {
                      toast.dismiss(t.id);
                      onDropEntry(entryId, day.date, employeeId);
                      toast.success("Turno assegnato", { duration: 2000 });
                    }}
                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    Assegna comunque
                  </button>
                </div>
              </div>
            ),
            { duration: 8000 }
          );
          return;
        }
      }
      onDropEntry(entryId, day.date, employeeId);"""

content = content.replace(old_confirm, new_confirm)

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
