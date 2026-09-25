import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Calendar, Search, Building2, User, Clock, FileSpreadsheet, MapPin, UserCheck, X, Users, Filter } from 'lucide-react';
import { getWorkSiteLocationDetails } from '../lib/cantieriMap';

export default function HistoryPage() {
  const { scheduleEntries, workSites, employees } = useAppContext();
  
  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [selectedWorkSite, setSelectedWorkSite] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [siteOperatorSearch, setSiteOperatorSearch] = useState<Record<string, string>>({});

  // Helper per ottenere informazioni pulite sull'operatore di ogni intervento
  const getOperatorDetails = (entry: any) => {
    const emp = employees.find(e => e.id === entry.employeeId);
    let displayName = emp?.name;
    let isVirtual = false;

    if (!displayName) {
      if (entry.employeeId === 'ordinari') {
        displayName = entry.coveredEmployeeName ? `COPERTURE ORDINARIE (${entry.coveredEmployeeName})` : 'COPERTURE ORDINARIE';
        isVirtual = true;
      } else if (entry.coveredEmployeeName) {
        displayName = entry.coveredEmployeeName;
      } else {
        displayName = 'Operatore';
      }
    }

    return {
      emp,
      name: displayName,
      isVirtual,
      coveredName: entry.coveredEmployeeName || (entry.coveredEmployeeId ? employees.find(e => e.id === entry.coveredEmployeeId)?.name : undefined),
      isJolly: emp?.type === 'jolly'
    };
  };

  // Group and filter data
  const reportData = useMemo(() => {
    let filtered = scheduleEntries.filter(e => e.date >= startDate && e.date <= endDate);
    
    if (selectedWorkSite !== 'all') {
      filtered = filtered.filter(e => e.taskDescription.toUpperCase() === selectedWorkSite.toUpperCase());
    }

    if (selectedEmployee !== 'all') {
      filtered = filtered.filter(e => {
        if (e.employeeId === selectedEmployee) return true;
        if (e.coveredEmployeeId === selectedEmployee) return true;
        const targetEmp = employees.find(em => em.id === selectedEmployee);
        if (targetEmp && e.coveredEmployeeName && e.coveredEmployeeName.toUpperCase().includes(targetEmp.name.toUpperCase())) {
          return true;
        }
        return false;
      });
    }
    
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(e => {
        const opDetails = getOperatorDetails(e);
        const siteName = (e.taskDescription || '').toLowerCase();
        const opName = (opDetails.name || '').toLowerCase();
        const coveredName = (opDetails.coveredName || '').toLowerCase();
        return (
          siteName.includes(lowerSearch) || 
          opName.includes(lowerSearch) ||
          coveredName.includes(lowerSearch)
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
      acc[siteName].totalHours = Math.round(((acc[siteName].totalHours || 0) + (Number(entry.hours) || 0)) * 100) / 100;
      return acc;
    }, {} as Record<string, { entries: typeof scheduleEntries, totalHours: number }>);

    // Sort workSites alphabetically
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [scheduleEntries, startDate, endDate, selectedWorkSite, selectedEmployee, searchTerm, employees]);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Storico Assegnazioni</h2>
          <p className="text-gray-500 text-sm mt-1">Consulta e cerca le presenze per cantiere, operatore e periodo</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2 flex items-center gap-3 shrink-0">
          <Clock className="text-indigo-500" size={20} />
          <div>
            <div className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Totale Ore Periodo</div>
            <div className="text-xl font-bold text-indigo-900">{totalOverallHours.toFixed(2)}h</div>
          </div>
        </div>
      </div>

      {/* Barra Filtri Principale */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Da data</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
            <span>Filtra per Cantiere</span>
            {selectedWorkSite !== 'all' && (
              <button 
                onClick={() => setSelectedWorkSite('all')} 
                className="text-[10px] text-indigo-600 hover:underline font-normal cursor-pointer"
              >
                Tutti
              </button>
            )}
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
              value={selectedWorkSite}
              onChange={(e) => setSelectedWorkSite(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none bg-white font-medium text-slate-800"
            >
              <option value="all">Tutti i cantieri</option>
              {workSites.map(ws => (
                <option key={ws.id} value={ws.name}>{ws.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
            <span>Filtra per Operatore</span>
            {selectedEmployee !== 'all' && (
              <button 
                onClick={() => setSelectedEmployee('all')} 
                className="text-[10px] text-indigo-600 hover:underline font-normal cursor-pointer"
              >
                Tutti
              </button>
            )}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
            <select 
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-indigo-200 bg-indigo-50/40 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none font-medium text-slate-800"
            >
              <option value="all">Tutti gli operatori</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.type ? `(${emp.type})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center justify-between">
            <span>Cerca operatore o cantiere</span>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="text-[10px] text-indigo-600 hover:underline font-normal cursor-pointer"
              >
                Cancella
              </button>
            )}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Cerca nome, cantiere o sostituzione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
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
          reportData.map(([siteName, data]) => {
            const loc = getWorkSiteLocationDetails(siteName, workSites);
            const siteFilter = (siteOperatorSearch[siteName] || '').trim().toLowerCase();

            // Calcolo operatori unici che hanno lavorato in questo cantiere nel periodo
            const operatorStats = (() => {
              const map = new Map<string, { id: string; name: string; count: number; hours: number; isJolly?: boolean }>();
              data.entries.forEach(entry => {
                const op = getOperatorDetails(entry);
                const opKey = op.name;
                const existing = map.get(opKey) || { 
                  id: op.emp?.id || opKey, 
                  name: op.name, 
                  count: 0, 
                  hours: 0,
                  isJolly: op.isJolly 
                };
                existing.count += 1;
                existing.hours = Math.round((existing.hours + (Number(entry.hours) || 0)) * 100) / 100;
                map.set(opKey, existing);
              });
              return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
            })();

            // Voci filtrate all'interno di questo specifico cantiere
            const displayedEntries = siteFilter
              ? data.entries.filter(entry => {
                  const op = getOperatorDetails(entry);
                  const nameMatch = (op.name || '').toLowerCase().includes(siteFilter);
                  const coveredMatch = (op.coveredName || '').toLowerCase().includes(siteFilter);
                  return nameMatch || coveredMatch;
                })
              : data.entries;

            const displayedHours = Math.round(
              displayedEntries.reduce((acc, e) => acc + (Number(e.hours) || 0), 0) * 100
            ) / 100;

            return (
              <div key={siteName} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all">
                {/* Header Cantiere con Barra Ricerca Operatore Integrata */}
                <div className="bg-slate-50 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2.5 rounded-lg shrink-0">
                      <Building2 className="text-indigo-600" size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">{siteName}</h3>
                      {loc.address && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-normal">
                          <MapPin size={12} className="text-rose-500 shrink-0" />
                          <span>{loc.address}{loc.city ? ` (${loc.city})` : ''}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Campo ricerca operatore all'interno di questo cantiere */}
                    <div className="relative">
                      <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Cerca operatore nel cantiere..."
                        value={siteOperatorSearch[siteName] || ''}
                        onChange={(e) => setSiteOperatorSearch(prev => ({ ...prev, [siteName]: e.target.value }))}
                        className="pl-8 pr-7 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none w-56 font-medium placeholder:font-normal"
                      />
                      {siteOperatorSearch[siteName] && (
                        <button
                          type="button"
                          onClick={() => setSiteOperatorSearch(prev => ({ ...prev, [siteName]: '' }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                          title="Azzera ricerca operatore nel cantiere"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {/* Totale Ore Cantiere (e ore filtrate) */}
                    <div className="text-right pl-3 border-l border-gray-200 shrink-0">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        {siteFilter ? 'Ore Filtrate' : 'Ore Totali'}
                      </div>
                      <div className="text-lg font-bold text-indigo-700">
                        {displayedHours.toFixed(2)}h
                        {siteFilter && (
                          <span className="text-xs font-normal text-gray-400 ml-1.5">
                            / {data.totalHours.toFixed(2)}h
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filtro Rapido per Operatore (Pillole/Chip dei lavoratori del cantiere) */}
                {operatorStats.length > 1 && (
                  <div className="bg-slate-100/60 px-6 py-2 border-b border-gray-200/70 flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-slate-500 font-semibold text-[11px] flex items-center gap-1 mr-1">
                      <Users size={12} className="text-slate-400" />
                      Operatori ({operatorStats.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() => setSiteOperatorSearch(prev => ({ ...prev, [siteName]: '' }))}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        !siteFilter 
                          ? 'bg-indigo-600 text-white shadow-2xs' 
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      Tutti ({data.entries.length})
                    </button>
                    {operatorStats.map(op => {
                      const isSelected = siteFilter === op.name.toLowerCase();
                      return (
                        <button
                          key={op.id}
                          type="button"
                          onClick={() => setSiteOperatorSearch(prev => ({ 
                            ...prev, 
                            [siteName]: isSelected ? '' : op.name 
                          }))}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected 
                              ? 'bg-indigo-600 text-white shadow-2xs' 
                              : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          <span className="uppercase">{op.name}</span>
                          <span className={isSelected ? 'text-indigo-200 text-[10px]' : 'text-slate-400 text-[10px]'}>
                            ({op.count} • {op.hours}h)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tabella Assegnazioni */}
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
                      {displayedEntries.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-xs text-gray-500">
                            Nessun turno corrisponde all'operatore cercato <strong>"{siteOperatorSearch[siteName]}"</strong> per questo cantiere.
                          </td>
                        </tr>
                      ) : (
                        displayedEntries.map((entry) => {
                          const op = getOperatorDetails(entry);
                          return (
                            <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(entry.date)}
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <User size={15} className={op.isJolly ? "text-amber-600" : "text-indigo-600"} />
                                    <span className="text-sm font-bold text-gray-900 uppercase">
                                      {op.name}
                                    </span>
                                    {op.isJolly && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                        Jolly
                                      </span>
                                    )}
                                  </div>
                                  {op.coveredName && (
                                    <div className="text-[11px] text-amber-900 font-semibold flex items-center gap-1 mt-0.5 ml-5">
                                      <UserCheck size={12} className="text-amber-700 shrink-0" />
                                      <span>
                                        Sostituisce: <strong className="text-amber-950 uppercase">{op.coveredName}</strong>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap text-sm text-gray-600 text-center font-medium">
                                {entry.startTime} - {entry.endTime}
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap text-sm font-bold text-indigo-600 text-right">
                                {entry.hours}h
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
