import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# 1. Update the outer container and header
old_header = """  return (
    <div className="max-w-full overflow-x-auto pb-20">
      <div className="flex flex-col gap-4 mb-8 min-w-[1200px]">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Planning settimanale</h2>
            <p className="text-gray-500 text-sm mt-1">Interventi per operatore, giorno e cantiere</p>
          </div>
          <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm h-10">"""

new_header = """  return (
    <div className="max-w-full pb-20">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Planning settimanale</h2>
          <p className="text-gray-500 text-sm mt-1">Interventi per operatore, giorno e cantiere</p>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm h-10 w-full md:w-auto justify-between shrink-0">"""

content = content.replace(old_header, new_header)

# 2. Update the filter bar and close the header div
old_filter = """        {/* Filter Bar */}
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

new_filter = """      </div>
      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-8">
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
        <div className="relative flex-1 md:max-w-xs">
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
        <div className="relative flex-1 md:max-w-xs">
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
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors shrink-0"
          >
            <FilterX size={16} />
            Reset Filtri
          </button>
        )}
      </div>

      <div className="overflow-x-auto pb-4">"""

content = content.replace(old_filter, new_filter)

# 3. Add closing tag for overflow-x-auto at the end of the content before modal

old_end = """      {(weeklyLeaves.length > 0 || shiftsToCover.length > 0) && (
        <div className="mt-8 min-w-[1200px] grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">"""

new_end = """      {(weeklyLeaves.length > 0 || shiftsToCover.length > 0) && (
        <div className="mt-8 min-w-[1200px] grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">"""

# Let's find the position right before modalData
old_modal_start = """      {modalData && (
        <ScheduleModal"""
new_modal_start = """      </div>
      {modalData && (
        <ScheduleModal"""

content = content.replace(old_modal_start, new_modal_start)

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
