import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# Update imports
if "import { useEffect } from 'react';" not in content:
    content = content.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';")
    content = content.replace("import { ChevronLeft, ChevronRight, X } from 'lucide-react';", "import { ChevronLeft, ChevronRight, X, Search, Building2, Calendar as CalendarIcon, FilterX } from 'lucide-react';")

# Add filter states and logic
old_state = """  const { employees, scheduleEntries, leaveRequests, deleteScheduleEntry, updateScheduleEntry, addScheduleEntry, updateEmployee } = useAppContext();
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDays = getWeekDays(weekOffset);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);"""

new_state = """  const { employees, scheduleEntries, leaveRequests, deleteScheduleEntry, updateScheduleEntry, addScheduleEntry, updateEmployee, workSites } = useAppContext();
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterDate, setFilterDate] = useState('');
  const [filterWorkSite, setFilterWorkSite] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (filterDate) {
      const selected = new Date(filterDate);
      const today = new Date();
      const getMonday = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff)).setHours(0,0,0,0);
      };
      const diffTime = getMonday(selected) - getMonday(today);
      const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
      setWeekOffset(diffWeeks);
    }
  }, [filterDate]);

  let weekDays = getWeekDays(weekOffset);
  if (filterDate) {
    weekDays = weekDays.filter(d => d.date === filterDate);
  }

  const [isAutoScheduling, setIsAutoScheduling] = useState(false);"""

if "const [filterDate" not in content:
    content = content.replace(old_state, new_state)

# Replace the header div
old_header = """    <div className="max-w-full overflow-x-auto pb-20">
      <div className="flex justify-between items-start mb-8 min-w-[1200px]">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Planning settimanale</h2>
          <p className="text-gray-500 text-sm mt-1">Interventi per operatore, giorno e cantiere</p>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm h-10">
          <button 
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="px-3 h-full flex items-center hover:bg-gray-50 border-r border-gray-200 text-gray-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium text-sm px-6 text-gray-800">
            {startDateStr} – {endDateStr}
          </span>
          <button 
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="px-3 h-full flex items-center hover:bg-gray-50 border-l border-gray-200 text-gray-600 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>"""

new_header = """    <div className="max-w-full overflow-x-auto pb-20">
      <div className="flex flex-col gap-4 mb-8 min-w-[1200px]">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Planning settimanale</h2>
            <p className="text-gray-500 text-sm mt-1">Interventi per operatore, giorno e cantiere</p>
          </div>
          <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm h-10">
            <button 
              onClick={() => { setFilterDate(''); setWeekOffset(prev => prev - 1); }}
              className="px-3 h-full flex items-center hover:bg-gray-50 border-r border-gray-200 text-gray-600 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-medium text-sm px-6 text-gray-800">
              {startDateStr} – {endDateStr}
            </span>
            <button 
              onClick={() => { setFilterDate(''); setWeekOffset(prev => prev + 1); }}
              className="px-3 h-full flex items-center hover:bg-gray-50 border-l border-gray-200 text-gray-600 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="Cerca operatore o cantiere..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e5b99] focus:outline-none"
             />
          </div>
          <div className="relative flex-1 max-w-xs">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <select 
               value={filterWorkSite}
               onChange={e => setFilterWorkSite(e.target.value)}
               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e5b99] focus:outline-none appearance-none"
             >
                <option value="all">Tutti i cantieri</option>
                {workSites.map(ws => (
                  <option key={ws.id} value={ws.name}>{ws.name}</option>
                ))}
             </select>
          </div>
          <div className="relative flex-1 max-w-xs">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="date" 
               value={filterDate}
               onChange={e => setFilterDate(e.target.value)}
               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e5b99] focus:outline-none"
             />
          </div>
          {(searchTerm || filterWorkSite !== 'all' || filterDate) && (
            <button 
              onClick={() => { setSearchTerm(''); setFilterWorkSite('all'); setFilterDate(''); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors shrink-0"
            >
              <FilterX size={16} />
              Reset Filtri
            </button>
          )}
        </div>
      </div>"""

if "Reset Filtri" not in content:
    content = content.replace(old_header, new_header)

# Filter employees
old_employees_render = """        {employees.filter(emp => !emp.type || emp.type === 'jolly').map(emp => (
          <EmployeeRow 
            key={emp.id} """

new_employees_render = """        {employees
          .filter(emp => !emp.type || emp.type === 'jolly')
          .filter(emp => {
            if (!searchTerm && filterWorkSite === 'all') return true;
            
            const lowerSearch = searchTerm.toLowerCase();
            const matchesName = emp.name.toLowerCase().includes(lowerSearch);
            
            const empEntries = scheduleEntries.filter(e => e.employeeId === emp.id && weekDays.some(d => d.date === e.date));
            const matchesEntry = empEntries.some(e => e.taskDescription.toLowerCase().includes(lowerSearch));
            
            if (searchTerm && !matchesName && !matchesEntry) return false;
            
            if (filterWorkSite !== 'all') {
               const matchesSite = empEntries.some(e => e.taskDescription.toUpperCase() === filterWorkSite.toUpperCase());
               if (!matchesSite) return false;
            }
            
            return true;
          })
          .map(emp => (
          <EmployeeRow 
            key={emp.id} """

if "const matchesSite" not in content:
    content = content.replace(old_employees_render, new_employees_render)

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)

