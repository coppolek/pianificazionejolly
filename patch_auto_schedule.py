import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# Add state
state_code = """  const [isAutoScheduling, setIsAutoScheduling] = useState(false);"""
if "const [isAutoScheduling" not in content:
    content = content.replace("const [modalData, setModalData] = useState<{", state_code + "\n  const [modalData, setModalData] = useState<{")

# Add handleAutoSchedule function right before return ( around line 151
auto_schedule_func = """
  const handleAutoSchedule = async () => {
    setIsAutoScheduling(true);
    try {
      const pendingShifts = [...shiftsToCover].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return parseTime(a.startTime) - parseTime(b.startTime);
      });

      const localEntries = [...scheduleEntries];
      const jollyEmployees = employees.filter(emp => !emp.type || emp.type === 'jolly');
      
      for (const shift of pendingShifts) {
        const shiftStart = parseTime(shift.startTime);
        const shiftEnd = parseTime(shift.endTime);
        let shiftHours = shiftEnd - shiftStart;
        if (shiftHours < 0) shiftHours += 24;

        const eligibleOperators = jollyEmployees.filter(emp => {
          const hasLeave = leaveRequests.some(l => 
            l.employeeId === emp.id && 
            l.startDate <= shift.date && 
            l.endDate >= shift.date && 
            l.status === 'approved'
          );
          if (hasLeave) return false;

          const empEntries = localEntries.filter(e => e.employeeId === emp.id && e.date === shift.date);
          const hasOverlap = empEntries.some(e => {
            const eStart = parseTime(e.startTime);
            const eEnd = parseTime(e.endTime);
            return (shiftStart < eEnd && shiftEnd > eStart);
          });
          return !hasOverlap;
        });

        if (eligibleOperators.length === 0) continue;

        let bestOp = null;
        let bestScore = -Infinity;

        for (const op of eligibleOperators) {
          let score = 0;
          const opDayEntries = localEntries.filter(e => e.employeeId === op.id && e.date === shift.date);
          const opWeekEntries = localEntries.filter(e => e.employeeId === op.id && e.date >= weekStart && e.date <= weekEnd);
          
          const dayHours = opDayEntries.reduce((acc, e) => acc + e.hours, 0);
          const weekHours = opWeekEntries.reduce((acc, e) => acc + e.hours, 0);

          score -= dayHours * 10;
          score -= weekHours * 2;

          if (opDayEntries.some(e => e.taskDescription.includes(shift.workSiteName))) {
             score += 50; 
          }

          if (score > bestScore) {
            bestScore = score;
            bestOp = op;
          }
        }

        if (bestOp) {
          const newEntry = {
            employeeId: bestOp.id,
            date: shift.date,
            startTime: shift.startTime,
            endTime: shift.endTime,
            taskDescription: shift.workSiteName,
            hours: shiftHours
          };
          await addScheduleEntry(newEntry);
          localEntries.push({ ...newEntry, id: Math.random().toString() });
        }
      }
    } finally {
      setIsAutoScheduling(false);
    }
  };
"""

if "const handleAutoSchedule" not in content:
    content = content.replace("  return (\n    <div className=\"max-w-full", auto_schedule_func + "\n  return (\n    <div className=\"max-w-full")

# Update header "Turni da Coprire"
old_header = """            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-6 bg-rose-400 rounded-sm inline-block"></span>
              Turni da Coprire (Trascina nel calendario)
            </h3>"""

new_header = """            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-rose-400 rounded-sm inline-block"></span>
                Turni da Coprire
              </h3>
              <button 
                onClick={handleAutoSchedule}
                disabled={isAutoScheduling || shiftsToCover.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold py-1.5 px-3 rounded shadow-sm transition-colors flex items-center gap-2"
              >
                {isAutoScheduling ? 'Pianificazione...' : 'Pianificazione Automatica'}
              </button>
            </div>"""

if "Pianificazione Automatica" not in content:
    content = content.replace(old_header, new_header)

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)

