import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# 1. Add calculating logic for shiftsToCover in SchedulePage
calc_logic = """
  // Deduplicate leaves in case of accidental double imports
  const weeklyLeaves: any[] = [];
  const seenLeaves = new Set();
  for (const leave of rawWeeklyLeaves) {
    const key = `${leave.employeeId}-${leave.startDate}-${leave.endDate}-${leave.type}-${leave.notes}`;
    if (!seenLeaves.has(key)) {
      seenLeaves.add(key);
      weeklyLeaves.push(leave);
    }
  }

  const { workSites } = useAppContext();
  const dayNamesEnglish: Record<number, string> = {
    0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday'
  };

  const shiftsToCover: Array<{
    id: string;
    date: string;
    dateLabel: string;
    workSiteName: string;
    startTime: string;
    endTime: string;
    missingReason: string;
  }> = [];

  weekDays.forEach(day => {
    const d = new Date(day.date);
    const dayOfWeek = dayNamesEnglish[d.getDay()];
    const leavesOnDate = weeklyLeaves.filter(l => l.startDate <= day.date && l.endDate >= day.date && l.type !== 'Annotazione');

    workSites.forEach(ws => {
      const dailyPlan = ws.weeklyPlan?.[dayOfWeek as keyof typeof ws.weeklyPlan];
      const shifts = dailyPlan?.shifts || [];
      
      shifts.forEach((shift, index) => {
        if (!shift.startTime || !shift.endTime) return;
        
        const assigned = shift.assignedOperators || [];
        let isMissing = false;
        let reason = '';
        
        if (assigned.length === 0) {
          isMissing = true;
          reason = 'Nessun op.';
        } else {
          const absentOperators = assigned.filter(empId => leavesOnDate.some(l => l.employeeId === empId));
          if (absentOperators.length > 0) {
            isMissing = true;
            const absentNames = absentOperators.map(empId => employees.find(e => e.id === empId)?.name || 'Sconosciuto').join(', ');
            reason = `Assente: ${absentNames}`;
          }
        }

        if (isMissing) {
          shiftsToCover.push({
            id: `${ws.id}-${day.date}-${index}`,
            date: day.date,
            dateLabel: day.label,
            workSiteName: ws.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            missingReason: reason
          });
        }
      });
    });
  });

"""

content = re.sub(r'  // Deduplicate leaves.*?      weeklyLeaves\.push\(leave\);\n    }\n  }', calc_logic, content, flags=re.DOTALL)

# 2. Add UI for Shifts to Cover
ui_logic = """
      {weeklyLeaves.length > 0 && (
        <div className="mt-8 min-w-[1200px]">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-6 bg-amber-400 rounded-sm inline-block"></span>
            Assenze e Annotazioni della Settimana
          </h3>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
"""

new_ui_logic = """
      {(weeklyLeaves.length > 0 || shiftsToCover.length > 0) && (
        <div className="mt-8 min-w-[1200px] grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-6 bg-amber-400 rounded-sm inline-block"></span>
              Assenze e Annotazioni della Settimana
            </h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full content-start">
              {weeklyLeaves.length === 0 && <span className="text-sm text-amber-600">Nessuna assenza per questa settimana</span>}
              {weeklyLeaves.map(leave => {
                const emp = employees.find(e => e.id === leave.employeeId);
                const isSingleDay = leave.startDate === leave.endDate;
                const dateStr = isSingleDay 
                  ? formatHeaderDate(leave.startDate) 
                  : `${formatHeaderDate(leave.startDate)} - ${formatHeaderDate(leave.endDate)}`;
                
                return (
                  <div key={leave.id} className="bg-white p-3 rounded-lg shadow-sm border border-amber-100 flex flex-col min-h-[100px]">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <span className="font-bold text-sm text-gray-900 truncate" title={emp?.name || 'Annotazione Generica'}>
                        {emp?.name || (leave.employeeId ? 'Operatore eliminato' : 'Annotazione Generica')}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                        {leave.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{dateStr}</div>
                    {leave.notes && (
                      <div className="text-xs text-gray-700 bg-amber-50 p-2 rounded mt-auto border border-amber-100/50">
                        {leave.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-6 bg-rose-400 rounded-sm inline-block"></span>
              Turni da Coprire (Trascina nel calendario)
            </h3>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full content-start">
              {shiftsToCover.length === 0 && <span className="text-sm text-rose-600">Nessun turno scoperto</span>}
              {shiftsToCover.map(shift => (
                <div 
                  key={shift.id} 
                  className="bg-white p-3 rounded-lg shadow-sm border border-rose-100 flex flex-col cursor-move hover:shadow-md transition-shadow active:cursor-grabbing"
                  draggable
                  onDragStart={(ev) => {
                    const data = {
                      type: 'NEW_SHIFT',
                      workSiteName: shift.workSiteName,
                      startTime: shift.startTime,
                      endTime: shift.endTime
                    };
                    ev.dataTransfer.setData('application/json', JSON.stringify(data));
                  }}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <span className="font-bold text-sm text-gray-900 truncate" title={shift.workSiteName}>
                      {shift.workSiteName}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 shrink-0">
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">{shift.dateLabel}</div>
                  <div className="text-xs text-rose-700 bg-rose-50/50 px-2 py-1.5 rounded mt-auto border border-rose-100/50 font-medium">
                    {shift.missingReason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
"""

# I need to be careful with the original `weeklyLeaves.length > 0` condition block.
# Let's completely replace the block from `{weeklyLeaves.length > 0 && (` to the end of it `)}` right before `</div>\n  );\n}`
content = re.sub(r'      \{weeklyLeaves\.length > 0 && \(\n        <div className="mt-8 min-w-\[1200px\]">.*?        </div>\n      \)}', new_ui_logic, content, flags=re.DOTALL)


with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
