import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# 1. Add mobileDayIndex to SchedulePage
if "const [mobileDayIndex, setMobileDayIndex]" not in content:
    content = content.replace("const [searchTerm, setSearchTerm] = useState('');", "const [searchTerm, setSearchTerm] = useState('');\n  const [mobileDayIndex, setMobileDayIndex] = useState(() => { const day = new Date().getDay(); return day === 0 ? 6 : day - 1; });")

# 2. Add the mobile navigation bar
mobile_nav = """      {/* Mobile Day Navigation */}
      <div className="md:hidden flex items-center justify-between bg-white border border-[#c2dcf3] rounded-lg shadow-sm h-12 mb-6">
        <button 
          onClick={() => setMobileDayIndex(prev => prev > 0 ? prev - 1 : 6)}
          className="px-4 h-full flex items-center hover:bg-[#f4f9ff] border-r border-[#c2dcf3] text-[#1e5b99] transition-colors rounded-l-lg"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-[#1e5b99] uppercase tracking-wide text-sm">
          {weekDays[mobileDayIndex]?.label}
        </span>
        <button 
          onClick={() => setMobileDayIndex(prev => prev < 6 ? prev + 1 : 0)}
          className="px-4 h-full flex items-center hover:bg-[#f4f9ff] border-l border-[#c2dcf3] text-[#1e5b99] transition-colors rounded-r-lg"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="space-y-8 min-w-full md:min-w-[1200px]">"""

content = content.replace('<div className="space-y-8 min-w-[1200px]">', mobile_nav)

# 3. Pass mobileDayIndex to EmployeeScheduleBlock
content = content.replace('entries={scheduleEntries.filter(e => e.employeeId === emp.id)}', 'entries={scheduleEntries.filter(e => e.employeeId === emp.id)}\n            mobileDayIndex={mobileDayIndex}')

# 4. Modify EmployeeScheduleBlock signature
func_sig = "function EmployeeScheduleBlock({ \n  isAdmin, employee, weekDays, entries, onDelete, onUpdate, onAdd, onEdit, onDropEntry, onDropNew \n}: { isAdmin?: boolean;"
new_sig = "function EmployeeScheduleBlock({ \n  isAdmin, mobileDayIndex, employee, weekDays, entries, onDelete, onUpdate, onAdd, onEdit, onDropEntry, onDropNew \n}: { isAdmin?: boolean; mobileDayIndex: number;"
content = content.replace(func_sig, new_sig)

# 5. Modify EmployeeScheduleBlock rendering to conditionally hide columns on mobile
col_render_old = """      <div className="flex flex-1">
        {weekDays.map((day, idx) => (
          <DayColumn"""
col_render_new = """      <div className="flex flex-1">
        {weekDays.map((day, idx) => (
          <div key={day.date} className={`flex-1 flex-col ${idx !== mobileDayIndex ? 'hidden md:flex' : 'flex'} ${idx !== 6 ? 'md:border-r border-gray-200' : ''}`}>
          <DayColumn"""
content = content.replace(col_render_old, col_render_new)

# 6. We also need to close the div we just wrapped DayColumn in!
# Let's find DayColumn in EmployeeScheduleBlock
day_col_block = """            onDropEntry={onDropEntry}
            onDropNew={onDropNew}
          />
        ))}
      </div>"""
day_col_block_new = """            onDropEntry={onDropEntry}
            onDropNew={onDropNew}
            isLast={true}
          />
          </div>
        ))}
      </div>"""
content = content.replace(day_col_block, day_col_block_new)

# And remove the border from DayColumn itself since we put it on the wrapper!
# In DayColumn definition:
content = content.replace("className={`flex-1 flex flex-col min-h-[140px] ${isLast ? '' : 'border-r border-gray-200'}`}", 'className={`flex-1 flex flex-col min-h-[140px]`}')


with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
