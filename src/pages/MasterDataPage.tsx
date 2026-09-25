import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, UserPlus, Building, Check, Edit2, Calendar, X, Search, Plus, Link, Users, User, UserCheck, Filter } from 'lucide-react';
import { WorkSite, Employee, WeeklyPlan } from '../types';
import { resolveCoordinates } from '../lib/geoUtils';

function WeeklyPlanModal({ isOpen, onClose, ws, onUpdate }: { isOpen: boolean, onClose: () => void, ws: WorkSite, onUpdate: (id: string, updates: Partial<WorkSite>) => void }) {
  const { employees, assignments } = useAppContext();
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [operatorSearchInModal, setOperatorSearchInModal] = useState('');
  
  if (!isOpen) return null;

  const [plan, setPlan] = useState<WeeklyPlan>(() => {
    const initial = ws.weeklyPlan || {};
    const normalized: WeeklyPlan = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    days.forEach(day => {
      const d = initial[day];
      if (d) {
        normalized[day] = { ...d };
        if (!normalized[day]?.shifts) {
           if (d.startTime || d.endTime || (d.assignedOperators && d.assignedOperators.length > 0)) {
             normalized[day]!.shifts = [{
               id: Math.random().toString(36).substr(2, 9),
               startTime: d.startTime || '',
               endTime: d.endTime || '',
               assignedOperators: d.assignedOperators || []
             }];
           } else {
             normalized[day]!.shifts = [];
           }
        }
      } else {
        normalized[day] = { shifts: [] };
      }
    });
    return normalized;
  });

  const assignedEmployeeIds = assignments.filter(a => a.workSiteId === ws.id).map(a => a.employeeId);
  const assignedEmployees = [...employees]
    .filter(emp => assignedEmployeeIds.includes(emp.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const availableEmployees = [...employees]
    .filter(emp => !assignedEmployeeIds.includes(emp.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleSave = () => {
    onUpdate(ws.id, { weeklyPlan: plan });
    onClose();
  };

  const daysMap: Record<keyof WeeklyPlan, string> = {
    monday: 'Lunedì',
    tuesday: 'Martedì',
    wednesday: 'Mercoledì',
    thursday: 'Giovedì',
    friday: 'Venerdì',
    saturday: 'Sabato',
    sunday: 'Domenica'
  };

  const updateShift = (day: keyof WeeklyPlan, shiftId: string, field: 'startTime' | 'endTime', value: string) => {
    setPlan(prev => {
      const dayPlan = prev[day] || { shifts: [] };
      const shifts = dayPlan.shifts || [];
      return {
        ...prev,
        [day]: {
          ...dayPlan,
          shifts: shifts.map(s => s.id === shiftId ? { ...s, [field]: value } : s)
        }
      };
    });
  };

  const addShift = (day: keyof WeeklyPlan) => {
    setPlan(prev => {
      const dayPlan = prev[day] || { shifts: [] };
      const shifts = dayPlan.shifts || [];
      return {
        ...prev,
        [day]: {
          ...dayPlan,
          shifts: [...shifts, { id: Math.random().toString(36).substr(2, 9), startTime: '', endTime: '', assignedOperators: [] }]
        }
      };
    });
  };

  const removeShift = (day: keyof WeeklyPlan, shiftId: string) => {
    setPlan(prev => {
      const dayPlan = prev[day] || { shifts: [] };
      const shifts = dayPlan.shifts || [];
      return {
        ...prev,
        [day]: {
          ...dayPlan,
          shifts: shifts.filter(s => s.id !== shiftId)
        }
      };
    });
  };

  const toggleShiftOperator = (day: keyof WeeklyPlan, shiftId: string, employeeId: string) => {
    setPlan(prev => {
      const dayPlan = prev[day] || { shifts: [] };
      const shifts = dayPlan.shifts || [];
      return {
        ...prev,
        [day]: {
          ...dayPlan,
          shifts: shifts.map(s => {
            if (s.id !== shiftId) return s;
            const assigned = s.assignedOperators || [];
            if (assigned.includes(employeeId)) {
              return { ...s, assignedOperators: assigned.filter(id => id !== employeeId) };
            } else {
              return { ...s, assignedOperators: [...assigned, employeeId] };
            }
          })
        }
      };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="font-semibold text-slate-800">Associazione e Piano Orari: {ws.name}</h3>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const mondayPlan = plan.monday || { shifts: [] };
                const newPlan = { ...plan };
                (Object.keys(daysMap) as Array<keyof WeeklyPlan>).forEach(d => {
                  if (d !== 'monday') {
                     // Create new copies of shifts for the other days
                     const clonedShifts = (mondayPlan.shifts || []).map(s => ({
                       ...s,
                       id: Math.random().toString(36).substr(2, 9),
                       assignedOperators: [...(s.assignedOperators || [])]
                     }));
                     newPlan[d] = { ...mondayPlan, shifts: clonedShifts };
                  }
                });
                setPlan(newPlan);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-100 transition-colors"
            >
              Copia Lunedì su tutta la settimana
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Barra Ricerca Operatore nel Cantiere (all'interno del piano orari) */}
        <div className="px-6 py-2.5 bg-indigo-50/80 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search size={15} className="text-indigo-600 shrink-0" />
            <input 
              type="text"
              placeholder="Cerca operatore nel cantiere per evidenziare i suoi turni..."
              value={operatorSearchInModal}
              onChange={(e) => setOperatorSearchInModal(e.target.value)}
              className="w-full text-xs border border-indigo-200 rounded-md px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {operatorSearchInModal && (
              <button 
                onClick={() => setOperatorSearchInModal('')}
                className="text-slate-400 hover:text-slate-600 text-xs px-1"
                title="Azzera ricerca operatore"
              >
                ✕
              </button>
            )}
          </div>
          {operatorSearchInModal.trim() && (() => {
            const lowerSearch = operatorSearchInModal.trim().toLowerCase();
            const matchedOps = employees.filter(e => e.name.toLowerCase().includes(lowerSearch));
            const assignedDays: string[] = [];
            (Object.keys(daysMap) as Array<keyof WeeklyPlan>).forEach(d => {
              const shifts = plan[d]?.shifts || [];
              const hasOp = shifts.some(s => 
                (s.assignedOperators || []).some(id => matchedOps.some(mo => mo.id === id))
              );
              if (hasOp) assignedDays.push(daysMap[d]);
            });

            return (
              <div className="text-xs font-semibold text-indigo-950 bg-white px-3 py-1 rounded-md border border-indigo-200 shadow-2xs">
                {assignedDays.length > 0 ? (
                  <span>Operatore presente in: <strong className="text-indigo-700">{assignedDays.join(', ')}</strong></span>
                ) : (
                  <span className="text-amber-800">Non assegnato ad alcuna fascia oraria</span>
                )}
              </div>
            );
          })()}
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          {(Object.keys(daysMap) as Array<keyof WeeklyPlan>).map(day => {
            const shifts = plan[day]?.shifts || [];
            return (
              <div key={day} className="flex flex-col xl:flex-row gap-6 pb-8 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="w-24 shrink-0 flex flex-col gap-2 pt-2">
                  <label className="text-sm font-bold text-slate-800">
                    {daysMap[day]}
                  </label>
                  <button
                    onClick={() => addShift(day)}
                    className="flex items-center justify-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 rounded border border-indigo-100 transition-colors"
                  >
                    <Plus size={14} /> Fascia oraria
                  </button>
                </div>
                
                <div className="flex-1 flex flex-col gap-4">
                  {shifts.length === 0 ? (
                    <div className="text-sm text-slate-500 italic py-4">Nessuna fascia oraria per questo giorno.</div>
                  ) : (
                    shifts.map((shift, index) => (
                      <div key={shift.id} className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100 relative group">
                        
                        <div className="flex flex-col gap-3">
                           <div className="flex justify-between items-center">
                             <span className="text-[10px] font-bold text-slate-500 uppercase">Fascia {index + 1}</span>
                             <button 
                               onClick={() => removeShift(day, shift.id)}
                               className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                               title="Elimina fascia oraria"
                             >
                               <Trash2 size={14} />
                             </button>
                           </div>
                           <div className="flex gap-2">
                             <div className="flex-1">
                               <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Ingresso</label>
                               <input 
                                 type="time"
                                 value={shift.startTime || ''}
                                 onChange={e => updateShift(day, shift.id, 'startTime', e.target.value)}
                                 className="w-full border border-slate-200 rounded p-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                               />
                             </div>
                             <div className="flex-1">
                               <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Uscita</label>
                               <input 
                                 type="time"
                                 value={shift.endTime || ''}
                                 onChange={e => updateShift(day, shift.id, 'endTime', e.target.value)}
                                 className="w-full border border-slate-200 rounded p-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                               />
                             </div>
                           </div>
                        </div>

                        <div className="flex flex-col border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                          <div className="flex justify-between items-end mb-2">
                            <label className="block text-[10px] text-slate-500 uppercase font-semibold">Operatori Assegnati ({shift.assignedOperators?.length || 0})</label>
                            <div className="relative w-48">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <Search size={12} className="text-slate-400" />
                              </div>
                              <input 
                                type="text" 
                                placeholder="Cerca..."
                                value={searchTerms[`${day}_${shift.id}`] || ''}
                                onChange={e => setSearchTerms(prev => ({ ...prev, [`${day}_${shift.id}`]: e.target.value }))}
                                className="w-full pl-7 pr-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                              />
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-3 max-h-[140px] overflow-y-auto pr-1">
                            {(() => {
                              const search = (searchTerms[`${day}_${shift.id}`] || '').toLowerCase();
                              const filteredAssigned = assignedEmployees.filter(emp => emp.name.toLowerCase().includes(search));
                              const filteredAvailable = availableEmployees.filter(emp => emp.name.toLowerCase().includes(search));
                              const currentAssigned = shift.assignedOperators || [];
                              
                              return (
                                <>
                                  {filteredAssigned.length > 0 && (
                                    <div>
                                      <div className="text-[9px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1">Da Sostituire (Assegnati al cantiere)</div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {filteredAssigned.map(emp => {
                                          const isModalSearchMatch = operatorSearchInModal.trim() && emp.name.toLowerCase().includes(operatorSearchInModal.trim().toLowerCase());
                                          return (
                                            <label key={emp.id} className={`flex items-center gap-1 border px-2 py-1 rounded text-xs cursor-pointer shadow-sm transition-all ${
                                              isModalSearchMatch
                                                ? 'bg-amber-100 border-amber-400 font-bold ring-2 ring-amber-300'
                                                : currentAssigned.includes(emp.id)
                                                  ? 'bg-indigo-50 border-indigo-200' 
                                                  : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }`}>
                                              <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={currentAssigned.includes(emp.id)}
                                                onChange={() => toggleShiftOperator(day, shift.id, emp.id)}
                                              />
                                              <span className="truncate max-w-[120px] font-medium" title={emp.name}>{emp.name}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {filteredAvailable.length > 0 && (
                                    <div>
                                      <div className="text-[9px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1">Sostituti (Disponibili / Jolly)</div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {filteredAvailable.map(emp => {
                                          const isModalSearchMatch = operatorSearchInModal.trim() && emp.name.toLowerCase().includes(operatorSearchInModal.trim().toLowerCase());
                                          return (
                                            <label key={emp.id} className={`flex items-center gap-1 border px-2 py-1 rounded text-xs cursor-pointer shadow-sm transition-all ${
                                              isModalSearchMatch
                                                ? 'bg-amber-100 border-amber-400 font-bold ring-2 ring-amber-300'
                                                : currentAssigned.includes(emp.id)
                                                  ? 'bg-indigo-50 border-indigo-200' 
                                                  : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }`}>
                                              <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={currentAssigned.includes(emp.id)}
                                                onChange={() => toggleShiftOperator(day, shift.id, emp.id)}
                                              />
                                              <span className="truncate max-w-[120px]" title={emp.name}>{emp.name}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {filteredAssigned.length === 0 && filteredAvailable.length === 0 && (
                                    <span className="text-xs text-slate-400 italic py-1 px-2">Nessun operatore trovato</span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Annulla</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700">Salva Piano</button>
        </div>
      </div>
    </div>
  );
}

export default function MasterDataPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'operatori' | 'cantieri'>('operatori');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="border-b border-slate-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('operatori')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'operatori'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Operatori
          </button>
          <button
            onClick={() => setActiveTab('cantieri')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'cantieri'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Cantieri
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'operatori' && <OperatoriSection />}
        {activeTab === 'cantieri' && <CantieriSection />}
      </div>
    </div>
  );
}


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

function WorkSiteOperatorsModal({ isOpen, onClose, ws }: { isOpen: boolean, onClose: () => void, ws: WorkSite }) {
  const { employees, assignments, toggleAssignment } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ordinario' | 'jolly'>('all');

  if (!isOpen) return null;

  const assignedEmployeeIds = assignments.filter(a => a.workSiteId === ws.id).map(a => a.employeeId);
  
  // Trova anche gli operatori assegnati nei turni del piano orari settimanale
  const planOperatorIds = Object.values(ws.weeklyPlan || {}).flatMap(day => 
    day.shifts?.flatMap(s => s.assignedOperators || []) || day.assignedOperators || []
  );

  const filteredEmployees = employees
    .filter(emp => {
      if (filterType !== 'all' && (emp.type || 'jolly') !== filterType) return false;
      if (!searchTerm.trim()) return true;
      const lower = searchTerm.toLowerCase();
      return (
        emp.name.toLowerCase().includes(lower) ||
        (emp.city && emp.city.toLowerCase().includes(lower)) ||
        (emp.company && emp.company.toLowerCase().includes(lower))
      );
    })
    .sort((a, b) => {
      const aAssigned = assignedEmployeeIds.includes(a.id);
      const bAssigned = assignedEmployeeIds.includes(b.id);
      if (aAssigned && !bAssigned) return -1;
      if (!aAssigned && bAssigned) return 1;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50 rounded-t-xl">
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Users size={18} className="text-indigo-600" />
              Operatori Assegnati: {ws.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {assignedEmployeeIds.length} {assignedEmployeeIds.length === 1 ? 'operatore associato' : 'operatori associati'} a questo cantiere
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col overflow-hidden min-h-[350px]">
          {/* Ricerca e Filtro Operatori nel cantiere */}
          <div className="flex gap-2 mb-4 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cerca operatore per nome, comune o azienda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="border border-slate-200 rounded-lg text-xs px-2.5 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
            >
              <option value="all">Tutti ({employees.length})</option>
              <option value="ordinario">Ordinari</option>
              <option value="jolly">Jolly</option>
            </select>
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {filteredEmployees.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8">Nessun operatore trovato con questo nome.</div>
            ) : (
              filteredEmployees.map(emp => {
                const isAssigned = assignedEmployeeIds.includes(emp.id);
                const isInWeeklyPlan = planOperatorIds.includes(emp.id);
                return (
                  <div key={emp.id} className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    isAssigned ? 'bg-indigo-50/70 border-indigo-200' : 'border-slate-100 hover:bg-slate-50'
                  }`}>
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                      <input 
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => toggleAssignment(emp.id, ws.id)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 shrink-0"
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${isAssigned ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                            {emp.name}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold ${
                            (!emp.type || emp.type === 'jolly') 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {(!emp.type || emp.type === 'jolly') ? 'Jolly' : 'Ordinario'}
                          </span>
                          {isInWeeklyPlan && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                              Nel piano orari
                            </span>
                          )}
                        </div>
                        {(emp.city || emp.company) && (
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {emp.company && <span>{emp.company} • </span>}
                            {emp.city}{emp.province ? ` (${emp.province})` : ''}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center rounded-b-xl shrink-0">
          <span className="text-xs text-slate-500">
            {assignedEmployeeIds.length} {assignedEmployeeIds.length === 1 ? 'operatore selezionato' : 'operatori selezionati'}
          </span>
          <button 
            onClick={onClose} 
            className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Fatto
          </button>
        </div>
      </div>
    </div>
  );
}

function OperatoriSection() {
  const { employees, addEmployee, deleteEmployee, updateEmployee } = useAppContext();
  const [editingAssignmentsEmpId, setEditingAssignmentsEmpId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [type, setType] = useState<'jolly' | 'ordinario'>('jolly');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const cleanAddress = address.trim();
    const cleanCity = city.trim().toUpperCase();
    const cleanProvince = province.trim().toUpperCase();

    // Geocodifica automatica immediata per consentire il calcolo chilometrico
    const coords = await resolveCoordinates(cleanAddress, cleanCity, cleanProvince);

    addEmployee({ 
      name: name.toUpperCase(), 
      type, 
      company: company.trim(),
      address: cleanAddress,
      city: cleanCity,
      province: cleanProvince,
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {})
    });
    setName('');
    setCompany('');
    setAddress('');
    setCity('');
    setProvince('');
    setType('jolly');
  };

  const filteredEmployees = employees
    .filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2 mb-4">
            <UserPlus size={20} className="text-indigo-500" />
            Nuovo Operatore
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome Cognome</label>
              <input 
                type="text" required placeholder="Es. MARIO ROSSI"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              
              <label className="block text-xs font-medium text-slate-700 mb-1">Azienda</label>
              <input 
                type="text" placeholder="Es. Azienda Srl (opzionale)"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
                value={company}
                onChange={e => setCompany(e.target.value)}
              />

              <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="block text-xs font-semibold text-slate-700 mb-2">📍 Domicilio / Partenza (per calcolo distanze)</span>
                <input 
                  type="text" placeholder="Indirizzo (es. Via Roma 10)"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2 bg-white"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
                <div className="flex gap-2">
                  <input 
                    type="text" placeholder="Comune (es. Milano)"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                  />
                  <input 
                    type="text" placeholder="Prov. (es. MI)"
                    maxLength={3}
                    className="w-20 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white uppercase"
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                  />
                </div>
              </div>
              
              <label className="block text-xs font-medium text-slate-700 mb-1">Ruolo</label>
              <select
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={type}
                onChange={e => setType(e.target.value as 'jolly' | 'ordinario')}
              >
                <option value="jolly">Jolly (Visibile nel Planning)</option>
                <option value="ordinario">Ordinario (Sostituzioni/Ferie)</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm font-medium">
              Aggiungi
            </button>
          </form>
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cerca operatore..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nome e Ruolo</th>
                <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Azienda</th>
                <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Domicilio / Partenza</th>
                <th scope="col" className="px-3 py-2 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {filteredEmployees.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-500">Nessun operatore trovato.</td></tr>
              )}
              {filteredEmployees.map(emp => (
                <OperatorRow 
                  key={emp.id} 
                  emp={emp} 
                  onDelete={() => deleteEmployee(emp.id)}
                  onUpdate={(updates) => updateEmployee(emp.id, updates)}
                  onEditAssignments={() => setEditingAssignmentsEmpId(emp.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editingAssignmentsEmpId && (
        <OperatorAssignmentsModal 
          isOpen={true} 
          onClose={() => setEditingAssignmentsEmpId(null)} 
          emp={employees.find(e => e.id === editingAssignmentsEmpId)!} 
        />
      )}
    </div>
  );
}

function OperatorRow({ emp, onDelete, onUpdate, onEditAssignments }: { key?: React.Key, emp: any, onDelete: () => void, onUpdate: (updates: { name?: string, type?: 'jolly' | 'ordinario', company?: string, address?: string, city?: string, province?: string }) => void, onEditAssignments: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(emp.name);
  const [editedCompany, setEditedCompany] = useState(emp.company || '');
  const [editedAddress, setEditedAddress] = useState(emp.address || '');
  const [editedCity, setEditedCity] = useState(emp.city || '');
  const [editedProvince, setEditedProvince] = useState(emp.province || '');
  const [editedType, setEditedType] = useState<'jolly' | 'ordinario'>(emp.type || 'jolly');

  const handleSave = async () => {
    if (
      (editedName.trim() && editedName !== emp.name) || 
      editedType !== (emp.type || 'jolly') || 
      editedCompany !== (emp.company || '') ||
      editedAddress !== (emp.address || '') ||
      editedCity !== (emp.city || '') ||
      editedProvince !== (emp.province || '')
    ) {
      const cleanAddress = editedAddress.trim();
      const cleanCity = editedCity.trim().toUpperCase();
      const cleanProvince = editedProvince.trim().toUpperCase();

      // Ricalcola coordinate se l'indirizzo/comune/provincia è cambiato
      const addressChanged = cleanAddress !== (emp.address || '') || cleanCity !== (emp.city || '') || cleanProvince !== (emp.province || '');
      const coords = addressChanged 
        ? await resolveCoordinates(cleanAddress, cleanCity, cleanProvince) 
        : { lat: emp.lat, lng: emp.lng };

      onUpdate({ 
        name: editedName.toUpperCase(), 
        type: editedType, 
        company: editedCompany.trim(),
        address: cleanAddress,
        city: cleanCity,
        province: cleanProvince,
        ...(coords && coords.lat !== undefined ? { lat: coords.lat, lng: coords.lng } : {})
      });
    } else {
      setEditedName(emp.name);
      setEditedCompany(emp.company || '');
      setEditedAddress(emp.address || '');
      setEditedCity(emp.city || '');
      setEditedProvince(emp.province || '');
      setEditedType(emp.type || 'jolly');
    }
    setIsEditing(false);
  };

  return (
    <tr className="hover:bg-slate-50 group">
      <td className="px-3 py-2 whitespace-nowrap">
        {isEditing ? (
          <div className="flex gap-2 items-center">
            <input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Nome"
              className="border border-indigo-300 rounded px-2 py-1 text-sm uppercase w-full max-w-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <select
              value={editedType}
              onChange={(e) => setEditedType(e.target.value as 'jolly' | 'ordinario')}
              className="border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="jolly">Jolly</option>
              <option value="ordinario">Ordinario</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="font-medium text-xs text-slate-900 cursor-pointer hover:bg-slate-100 px-2 py-1 -ml-2 rounded transition-colors" onClick={() => {setIsEditing(true); setEditedName(emp.name); setEditedType(emp.type || 'jolly'); setEditedCompany(emp.company || ''); setEditedAddress(emp.address || ''); setEditedCity(emp.city || ''); setEditedProvince(emp.province || '');}}>
              {emp.name}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              (!emp.type || emp.type === 'jolly') 
                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {(!emp.type || emp.type === 'jolly') ? 'Jolly' : 'Ordinario'}
            </span>
          </div>
        )}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {isEditing ? (
          <input
            value={editedCompany}
            onChange={(e) => setEditedCompany(e.target.value)}
            placeholder="Azienda"
            className="border border-indigo-300 rounded px-2 py-1 text-sm w-full max-w-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        ) : (
          <span className="text-xs text-slate-600 cursor-pointer hover:bg-slate-100 px-2 py-1 -ml-2 rounded transition-colors" onClick={() => {setIsEditing(true); setEditedName(emp.name); setEditedType(emp.type || 'jolly'); setEditedCompany(emp.company || ''); setEditedAddress(emp.address || ''); setEditedCity(emp.city || ''); setEditedProvince(emp.province || '');}}>
            {emp.company || <span className="text-slate-400 italic">Non specificata</span>}
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        {isEditing ? (
          <div className="flex flex-col gap-1 min-w-[200px]">
            <input
              value={editedAddress}
              onChange={(e) => setEditedAddress(e.target.value)}
              placeholder="Indirizzo"
              className="border border-indigo-300 rounded px-2 py-0.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <div className="flex gap-1">
              <input
                value={editedCity}
                onChange={(e) => setEditedCity(e.target.value)}
                placeholder="Comune"
                className="border border-indigo-300 rounded px-2 py-0.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <input
                value={editedProvince}
                onChange={(e) => setEditedProvince(e.target.value)}
                placeholder="Prov"
                maxLength={3}
                className="border border-indigo-300 rounded px-1 py-0.5 text-xs w-12 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col text-xs cursor-pointer hover:bg-slate-100 px-2 py-1 -ml-2 rounded transition-colors" onClick={() => {setIsEditing(true); setEditedName(emp.name); setEditedType(emp.type || 'jolly'); setEditedCompany(emp.company || ''); setEditedAddress(emp.address || ''); setEditedCity(emp.city || ''); setEditedProvince(emp.province || '');}}>
            {emp.city || emp.province || emp.address ? (
              <>
                <span className="font-medium text-slate-800">
                  {emp.city ? emp.city : ''}{emp.province ? ` (${emp.province})` : ''}
                </span>
                {emp.address && <span className="text-[10px] text-slate-500 truncate max-w-[180px]">{emp.address}</span>}
              </>
            ) : (
              <span className="text-slate-400 italic">Non specificato</span>
            )}
          </div>
        )}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-right">
        <div className="flex justify-end gap-1">
          {isEditing ? (
            <button onClick={handleSave} className="bg-indigo-600 text-white rounded p-1 hover:bg-indigo-700" title="Salva modifiche">
              <Check size={16} />
            </button>
          ) : (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
              <button 
                onClick={onEditAssignments}
                className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                title="Associa Cantieri"
              >
                <Link size={16} />
              </button>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                title="Modifica"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={onDelete}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                title="Elimina"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

const WorkSiteRow: React.FC<{ 
  ws: WorkSite, 
  onDelete: () => void, 
  onUpdate: (id: string, updates: Partial<WorkSite>) => void, 
  onEditPlan: () => void,
  onManageOperators: () => void,
  searchTerm?: string,
  selectedOperatorId?: string
}> = ({ ws, onDelete, onUpdate, onEditPlan, onManageOperators, searchTerm = '', selectedOperatorId = 'all' }) => {
  const { employees, assignments } = useAppContext();
  const [operatorSearch, setOperatorSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(ws.name);
  const [editedAddress, setEditedAddress] = useState(ws.address || '');
  const [editedCity, setEditedCity] = useState(ws.city || '');
  const [editedProvince, setEditedProvince] = useState(ws.province || '');
  const [editedRadius, setEditedRadius] = useState(ws.radius || '');
  const [editedScanType, setEditedScanType] = useState(ws.scanType || '');

  // Operatori assegnati da assignments e da weeklyPlan
  const assignedIds = (assignments || []).filter(a => a.workSiteId === ws.id).map(a => a.employeeId);
  const planOpIds = (Object.values(ws.weeklyPlan || {}) as any[]).flatMap(day => 
    day?.shifts?.flatMap((s: any) => s.assignedOperators || []) || day?.assignedOperators || []
  );
  const allOpIds = Array.from(new Set([...assignedIds, ...planOpIds]));
  const allOperators = allOpIds.map(id => employees.find(e => e.id === id)).filter(Boolean) as Employee[];

  // Filtra operatori del cantiere con ricerca interna
  const filteredOperators = allOperators.filter(op => {
    if (!operatorSearch.trim()) return true;
    const lower = operatorSearch.toLowerCase();
    return op.name.toLowerCase().includes(lower) ||
      (op.city && op.city.toLowerCase().includes(lower)) ||
      (op.company && op.company.toLowerCase().includes(lower));
  });

  const handleSave = async () => {
    if (editedName.trim() !== '') {
      const cleanAddress = editedAddress.trim();
      const cleanCity = editedCity.trim().toUpperCase();
      const cleanProvince = editedProvince.trim().toUpperCase();

      // Ricalcola coordinate se l'indirizzo/comune/provincia è cambiato
      const addressChanged = cleanAddress !== (ws.address || '') || cleanCity !== (ws.city || '') || cleanProvince !== (ws.province || '');
      const coords = addressChanged 
        ? await resolveCoordinates(cleanAddress, cleanCity, cleanProvince) 
        : { lat: ws.lat, lng: ws.lng };

      onUpdate(ws.id, { 
        name: editedName.trim().toUpperCase(), 
        address: cleanAddress,
        city: cleanCity,
        province: cleanProvince,
        radius: editedRadius.trim(),
        scanType: editedScanType.trim(),
        ...(coords && coords.lat !== undefined ? { lat: coords.lat, lng: coords.lng } : {})
      });
    } else {
      setEditedName(ws.name);
      setEditedAddress(ws.address || '');
      setEditedCity(ws.city || '');
      setEditedProvince(ws.province || '');
      setEditedRadius(ws.radius || '');
      setEditedScanType(ws.scanType || '');
    }
    setIsEditing(false);
  };

  return (
    <tr className="hover:bg-slate-50 group">
      <td className="px-3 py-2">
        {isEditing ? (
          <input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="border border-indigo-300 rounded px-2 py-1 text-sm uppercase w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        ) : (
          <span className="font-medium text-xs text-slate-900 block min-w-[170px]">{ws.name}</span>
        )}
      </td>
      <td className="px-3 py-2">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <input
              value={editedAddress}
              onChange={(e) => setEditedAddress(e.target.value)}
              placeholder="Indirizzo"
              className="border border-indigo-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <div className="flex gap-2">
              <input
                value={editedCity}
                onChange={(e) => setEditedCity(e.target.value)}
                placeholder="Comune"
                className="border border-indigo-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <input
                value={editedProvince}
                onChange={(e) => setEditedProvince(e.target.value)}
                placeholder="Provincia"
                className="border border-indigo-300 rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col min-w-[150px]">
            <span className="text-xs text-slate-800">{ws.address || '-'}</span>
            <span className="text-[10px] text-slate-500">{(ws.city || ws.province) ? `${ws.city || ''}${ws.city && ws.province ? ' (' + ws.province + ')' : (ws.province || '')}` : '-'}</span>
          </div>
        )}
      </td>
      
      {/* Colonna Operatori Assegnati con ricerca operatore all'interno del cantiere */}
      <td className="px-3 py-2 min-w-[240px] max-w-[340px]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <Users size={12} className="text-indigo-600" />
              {allOperators.length} {allOperators.length === 1 ? 'Operatore' : 'Operatori'}
            </span>
            <button 
              onClick={onManageOperators}
              className="text-[10.5px] text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
              title="Associa o cerca operatori in questo cantiere"
            >
              + Associa
            </button>
          </div>

          {/* Campo di ricerca operatore all'interno di questo specifico cantiere */}
          {allOperators.length > 2 && (
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Cerca operatore nel cantiere..."
                value={operatorSearch}
                onChange={(e) => setOperatorSearch(e.target.value)}
                className="w-full pl-6 pr-2 py-0.5 text-[10.5px] border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
              />
              {operatorSearch && (
                <button 
                  onClick={() => setOperatorSearch('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Lista chip operatori con evidenziazione */}
          <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto pr-0.5">
            {filteredOperators.length === 0 ? (
              <span className="text-[10.5px] text-slate-400 italic">
                {allOperators.length === 0 ? 'Nessun operatore assegnato' : 'Nessun operatore corrisponde'}
              </span>
            ) : (
              filteredOperators.map(op => {
                const isHighlighted = (searchTerm && op.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (selectedOperatorId !== 'all' && op.id === selectedOperatorId) ||
                  (operatorSearch && op.name.toLowerCase().includes(operatorSearch.toLowerCase()));

                return (
                  <span 
                    key={op.id}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                      isHighlighted 
                        ? 'bg-amber-100 text-amber-900 border border-amber-400 font-bold ring-2 ring-amber-300'
                        : (!op.type || op.type === 'jolly')
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                    title={`${op.name} (${(!op.type || op.type === 'jolly') ? 'Jolly' : 'Ordinario'})${op.city ? ` - ${op.city}` : ''}`}
                  >
                    <span className="truncate max-w-[130px]">{op.name}</span>
                    <span className="text-[8.5px] opacity-75">
                      {(!op.type || op.type === 'jolly') ? 'J' : 'O'}
                    </span>
                  </span>
                );
              })
            )}
          </div>
        </div>
      </td>

      <td className="px-3 py-2">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <input
              value={editedScanType}
              onChange={(e) => setEditedScanType(e.target.value)}
              placeholder="Scansione"
              className="border border-indigo-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <input
              value={editedRadius}
              onChange={(e) => setEditedRadius(e.target.value)}
              placeholder="Raggio (m)"
              className="border border-indigo-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        ) : (
          <div className="flex flex-col whitespace-nowrap">
            <span className="text-xs text-slate-800">Scansione: <span className="font-medium">{ws.scanType || '-'}</span></span>
            <span className="text-[10px] text-slate-500">Raggio: <span className="font-medium">{ws.radius ? `${ws.radius}m` : '-'}</span></span>
          </div>
        )}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-right align-top">
        {isEditing ? (
          <button onClick={handleSave} className="bg-indigo-600 text-white rounded p-1.5 hover:bg-indigo-700 inline-block mr-1">
            <Check size={16} />
          </button>
        ) : (
          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={onManageOperators}
              className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
              title="Associa / Cerca Operatori per questo cantiere"
            >
              <Users size={16} />
            </button>
            <button 
              onClick={onEditPlan}
              className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
              title="Associazione e Piano Orari"
            >
              <Calendar size={16} />
            </button>
            <button 
              onClick={() => setIsEditing(true)}
              className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
              title="Modifica"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={onDelete}
              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
              title="Elimina"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

function CantieriSection() {
  const { workSites, addWorkSite, deleteWorkSite, updateWorkSite, employees, assignments } = useAppContext();
  const [editingPlanWorkSiteId, setEditingPlanWorkSiteId] = useState<string | null>(null);
  const [managingOperatorsWorkSiteId, setManagingOperatorsWorkSiteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperatorFilter, setSelectedOperatorFilter] = useState<string>('all');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [radius, setRadius] = useState('');
  const [scanType, setScanType] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const cleanName = name.trim().toUpperCase();
    const cleanAddress = address.trim();
    const cleanCity = city.trim().toUpperCase();
    const cleanProvince = province.trim().toUpperCase();

    // Geocodifica immediata per consentire il calcolo delle distanze con gli operatori
    const coords = await resolveCoordinates(cleanAddress, cleanCity, cleanProvince);

    addWorkSite({ 
      name: cleanName, 
      address: cleanAddress,
      city: cleanCity,
      province: cleanProvince,
      radius: radius.trim(),
      scanType: scanType.trim(),
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {})
    });
    setName('');
    setAddress('');
    setCity('');
    setProvince('');
    setRadius('');
    setScanType('');
  };

  const filteredWorkSites = workSites.filter(ws => {
    // Calcola operatori assegnati
    const assignedIds = (assignments || []).filter(a => a.workSiteId === ws.id).map(a => a.employeeId);
    const planOpIds = (Object.values(ws.weeklyPlan || {}) as any[]).flatMap(day => 
      day?.shifts?.flatMap((s: any) => s.assignedOperators || []) || day?.assignedOperators || []
    );
    const allOpIds = Array.from(new Set([...assignedIds, ...planOpIds]));
    const opNames = allOpIds.map(id => employees.find(e => e.id === id)?.name || '');

    // Filtro per operatore specifico selezionato nel dropdown
    if (selectedOperatorFilter !== 'all' && !allOpIds.includes(selectedOperatorFilter)) {
      return false;
    }

    // Ricerca testuale: cantiere, indirizzo, comune, provincia O NOME OPERATORE
    if (!searchTerm.trim()) return true;
    const lower = searchTerm.toLowerCase();
    return (
      ws.name.toLowerCase().includes(lower) ||
      (ws.address && ws.address.toLowerCase().includes(lower)) ||
      (ws.city && ws.city.toLowerCase().includes(lower)) ||
      (ws.province && ws.province.toLowerCase().includes(lower)) ||
      opNames.some(name => name.toLowerCase().includes(lower))
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2 mb-4">
            <Building size={20} className="text-indigo-500" />
            Nuovo Cantiere
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nome Cantiere / Azienda</label>
                <input 
                  type="text" required placeholder="Es. INTESA GREEN"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Indirizzo (opzionale)</label>
                <input 
                  type="text" placeholder="Es. VIA ROMA, 1"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Comune</label>
                  <input 
                    type="text" placeholder="Es. MILANO"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Provincia</label>
                  <input 
                    type="text" placeholder="Es. MI"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Raggio (m)</label>
                  <input 
                    type="text" placeholder="Es. 100"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={radius}
                    onChange={e => setRadius(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Scansione</label>
                  <input 
                    type="text" placeholder="Es. Qualsiasi"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={scanType}
                    onChange={e => setScanType(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm font-medium mt-4">
              Aggiungi
            </button>
          </form>
        </div>
      </div>
      <div className="lg:col-span-3">
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cerca cantiere o cerca operatore (es. INTESA, Mario)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                title="Azzera ricerca"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Dropdown Filtra per Operatore all'interno dei cantieri */}
          <div className="relative sm:w-64">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
            <select
              value={selectedOperatorFilter}
              onChange={(e) => setSelectedOperatorFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
            >
              <option value="all">Tutti gli operatori</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.type ? `(${emp.type})` : ''}
                </option>
              ))}
            </select>
            {selectedOperatorFilter !== 'all' && (
              <button
                onClick={() => setSelectedOperatorFilter('all')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-indigo-600 hover:underline px-1 font-medium"
                title="Azzera filtro operatore"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Banner stato filtro operatore se attivo */}
        {(selectedOperatorFilter !== 'all' || (searchTerm && employees.some(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())))) && (
          <div className="mb-3 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs flex items-center justify-between text-indigo-900">
            <span className="flex items-center gap-1.5 font-medium">
              <Users size={14} className="text-indigo-600 shrink-0" />
              <span>
                Filtro operatore attivo: trovati <strong>{filteredWorkSites.length}</strong> {filteredWorkSites.length === 1 ? 'cantiere associato' : 'cantieri associati'}
              </span>
            </span>
            <button
              onClick={() => { setSelectedOperatorFilter('all'); setSearchTerm(''); }}
              className="text-xs text-indigo-700 hover:underline font-semibold"
            >
              Mostra tutti i cantieri
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nome Cantiere</th>
                <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Indirizzo / Luogo</th>
                <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Operatori Assegnati</th>
                <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Impostazioni App</th>
                <th scope="col" className="px-3 py-2 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {filteredWorkSites.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-xs text-slate-500">Nessun cantiere trovato con questi filtri.</td></tr>
              )}
              {filteredWorkSites.map(ws => (
                <WorkSiteRow 
                  key={ws.id} 
                  ws={ws} 
                  searchTerm={searchTerm}
                  selectedOperatorId={selectedOperatorFilter}
                  onDelete={() => deleteWorkSite(ws.id)} 
                  onUpdate={updateWorkSite} 
                  onEditPlan={() => setEditingPlanWorkSiteId(ws.id)} 
                  onManageOperators={() => setManagingOperatorsWorkSiteId(ws.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editingPlanWorkSiteId && (
        <WeeklyPlanModal 
          isOpen={true} 
          onClose={() => setEditingPlanWorkSiteId(null)} 
          ws={workSites.find(w => w.id === editingPlanWorkSiteId)!} 
          onUpdate={updateWorkSite} 
        />
      )}
      {managingOperatorsWorkSiteId && (
        <WorkSiteOperatorsModal
          isOpen={true}
          onClose={() => setManagingOperatorsWorkSiteId(null)}
          ws={workSites.find(w => w.id === managingOperatorsWorkSiteId)!}
        />
      )}
    </div>
  );
}
