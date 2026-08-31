import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Calendar, Search, Building2, User, Clock, FileSpreadsheet } from 'lucide-react';

export default function HistoryPage() {
  const { scheduleEntries, workSites, employees } = useAppContext();
  
  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [selectedWorkSite, setSelectedWorkSite] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Group and filter data
  const reportData = useMemo(() => {
    let filtered = scheduleEntries.filter(e => e.date >= startDate && e.date <= endDate);
    
    if (selectedWorkSite !== 'all') {
      filtered = filtered.filter(e => e.taskDescription.toUpperCase() === selectedWorkSite.toUpperCase());
    }
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(e => {
        const emp = employees.find(emp => emp.id === e.employeeId);
        return (
          e.taskDescription.toLowerCase().includes(lowerSearch) || 
          (emp && emp.name.toLowerCase().includes(lowerSearch))
        );
      });
    }

    // Sort by date (descending)
    filtered.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return a.startTime.localeCompare(b.startTime);
    });

    // Group by WorkSite name (using taskDescription)
    const grouped = filtered.reduce((acc, entry) => {
      const siteName = entry.taskDescription || 'Cantiere Sconosciuto';
      if (!acc[siteName]) {
        acc[siteName] = { entries: [], totalHours: 0 };
      }
      acc[siteName].entries.push(entry);
      acc[siteName].totalHours += entry.hours || 0;
      return acc;
    }, {} as Record<string, { entries: typeof scheduleEntries, totalHours: number }>);

    // Sort workSites alphabetically
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [scheduleEntries, startDate, endDate, selectedWorkSite, searchTerm, employees]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', { 
      weekday: 'short', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const totalOverallHours = reportData.reduce((acc, [_, data]) => acc + data.totalHours, 0);

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Storico Assegnazioni</h2>
          <p className="text-gray-500 text-sm mt-1">Consulta lo storico per cantiere e periodo</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2 flex items-center gap-3">
          <Clock className="text-indigo-500" size={20} />
          <div>
            <div className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Totale Ore Periodo</div>
            <div className="text-xl font-bold text-indigo-900">{totalOverallHours.toFixed(2)}h</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Da data</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">A data</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Filtra per Cantiere</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
              value={selectedWorkSite}
              onChange={(e) => setSelectedWorkSite(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
            >
              <option value="all">Tutti i cantieri</option>
              {workSites.map(ws => (
                <option key={ws.id} value={ws.name}>{ws.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ricerca libera</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Cerca operatore o cantiere..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {reportData.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Nessuna assegnazione trovata</h3>
            <p className="text-gray-500 text-sm mt-1">Non ci sono turni pianificati per i filtri selezionati.</p>
          </div>
        ) : (
          reportData.map(([siteName, data]) => (
            <div key={siteName} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Building2 className="text-indigo-600" size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">{siteName}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Ore Totali</div>
                  <div className="text-lg font-bold text-indigo-700">{data.totalHours.toFixed(2)}h</div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Operatore</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Orario</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ore</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {data.entries.map((entry) => {
                      const emp = employees.find(e => e.id === entry.employeeId);
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(entry.date)}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User size={16} className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 uppercase">
                                {emp ? emp.name : 'Sconosciuto'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 text-center font-medium">
                            {entry.startTime} - {entry.endTime}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-indigo-600 text-right">
                            {entry.hours}h
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
