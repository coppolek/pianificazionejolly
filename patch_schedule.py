import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# 1. Add "Operatori Ordinari" block in the schedule grid
# The schedule grid maps over employees
employee_loop = """        {employees.filter(emp => !emp.type || emp.type === 'jolly').map(emp => (
          <EmployeeScheduleBlock """
new_employee_loop = """        {employees.filter(emp => !emp.type || emp.type === 'jolly').map(emp => (
          <EmployeeScheduleBlock """

# I'll just append it after the map ends.
loop_end = """            onEdit={(entry) => setModalData({ ...entry, isEditing: true })}
            onAdd={(date) => setModalData({ employeeId: emp.id, date })}
          />
        ))}"""
new_loop_end = """            onEdit={(entry) => setModalData({ ...entry, isEditing: true })}
            onAdd={(date) => setModalData({ employeeId: emp.id, date })}
          />
        ))}

        {/* Blocco Virtuale Coperture Operatori Ordinari */}
        <EmployeeScheduleBlock 
          isAdmin={isAdmin}
          mobileDayIndex={mobileDayIndex}
          employee={{ id: 'ordinari', name: 'COPERTURE OPERATORI ORDINARI', isVirtual: true }}
          weekDays={weekDays}
          entries={scheduleEntries.filter(e => e.employeeId === 'ordinari' && weekDays.some(d => d.date === e.date))}
          onDelete={deleteScheduleEntry}
          onUpdate={() => {}}
          onDropEntry={(entryId, date) => updateScheduleEntry(entryId, { date, employeeId: 'ordinari' })}
          onDropNew={(shiftData, date) => {
            let hours = 0;
            const start = parseTime(shiftData.startTime);
            const end = parseTime(shiftData.endTime);
            if (start !== null && end !== null) {
              hours = (end - start) / 60;
              if (hours < 0) hours += 24;
            }
            setModalData({
              employeeId: 'ordinari',
              date,
              startTime: shiftData.startTime,
              endTime: shiftData.endTime,
              taskDescription: shiftData.workSiteName,
              hours: hours > 0 ? hours : undefined
            });
          }}
          onEdit={(entry) => setModalData({ ...entry, isEditing: true })}
          onAdd={(date) => setModalData({ employeeId: 'ordinari', date })}
        />"""
content = content.replace(loop_end, new_loop_end)

# 2. Modify EmployeeScheduleBlock to support isVirtual
employee_editing = """        {isEditing ? (
          <input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="text-gray-900 bg-white/80 px-2 py-0.5 rounded text-sm font-bold uppercase w-48 outline-none focus:ring-2 focus:ring-gray-400"
          />
        ) : (
          <span 
            className="font-bold tracking-wide uppercase text-sm cursor-pointer hover:bg-black/5 px-2 py-0.5 -ml-2 rounded transition-colors" 
            title="Clicca per modificare"
            onClick={() => { setIsEditing(true); setEditedName(employee.name); }}
          >
            {employee.name}
          </span>
        )}"""
new_employee_editing = """        {isEditing && !employee.isVirtual ? (
          <input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="text-gray-900 bg-white/80 px-2 py-0.5 rounded text-sm font-bold uppercase w-48 outline-none focus:ring-2 focus:ring-gray-400"
          />
        ) : (
          <span 
            className={`font-bold tracking-wide uppercase text-sm ${employee.isVirtual ? '' : 'cursor-pointer hover:bg-black/5'} px-2 py-0.5 -ml-2 rounded transition-colors`} 
            title={employee.isVirtual ? '' : "Clicca per modificare"}
            onClick={() => { if (!employee.isVirtual) { setIsEditing(true); setEditedName(employee.name); } }}
          >
            {employee.name}
          </span>
        )}"""
content = content.replace(employee_editing, new_employee_editing)

# Color difference for virtual block? 
# bg-[#86d97e] is used for regular employees.
header_color = """      <div className="bg-[#86d97e] text-gray-900 px-4 py-2.5 flex justify-between items-center border-b border-gray-300">"""
new_header_color = """      <div className={`${employee.isVirtual ? 'bg-indigo-300 text-indigo-950' : 'bg-[#86d97e] text-gray-900'} px-4 py-2.5 flex justify-between items-center border-b border-gray-300`}>"""
content = content.replace(header_color, new_header_color)


with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
