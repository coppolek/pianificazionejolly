import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, UserPlus, Building, Check, Edit2, Calendar, X, Search, Plus, Link, Users, User, UserCheck, Filter, Key, Bell, ShieldAlert, FileText, Clock, CalendarDays, CheckCircle, Info, Sparkles } from 'lucide-react';
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
  const { employees, assignments, toggleAssignment, updateWorkSite } = useAppContext();
  const [activeTab, setActiveTab] = useState<'assigned' | 'known'>('assigned');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ordinario' | 'jolly'>('all');

  if (!isOpen) return null;

  const assignedEmployeeIds = assignments.filter(a => a.workSiteId === ws.id).map(a => a.employeeId);
  const knownOperatorIds = ws.knownOperatorIds || [];
  
  // Trova anche gli operatori assegnati nei turni del piano orari settimanale
  const planOperatorIds = Object.values(ws.weeklyPlan || {}).flatMap(day => 
    day.shifts?.flatMap(s => s.assignedOperators || []) || day.assignedOperators || []
  );

  const toggleKnown = (empId: string) => {
    const next = knownOperatorIds.includes(empId)
      ? knownOperatorIds.filter(id => id !== empId)
      : [...knownOperatorIds, empId];
    updateWorkSite(ws.id, { knownOperatorIds: next });
  };

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
      const aSelected = activeTab === 'assigned' ? assignedEmployeeIds.includes(a.id) : knownOperatorIds.includes(a.id);
      const bSelected = activeTab === 'assigned' ? assignedEmployeeIds.includes(b.id) : knownOperatorIds.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-xl flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50 rounded-t-xl">
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Users size={18} className="text-indigo-600" />
              Gestione Operatori: {ws.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Associa i titolari o definisci chi conosce il cantiere oltre al titolare per il piano Jolly
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('assigned')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'assigned'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCheck size={14} />
            Titolari Assegnati ({assignedEmployeeIds.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('known')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'known'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles size={14} className="text-amber-500" />
            Conoscono il cantiere ({knownOperatorIds.length})
          </button>
        </div>

        {activeTab === 'known' && (
          <div className="mx-6 mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Variabile Piano Jolly:</strong> Gli operatori indicati qui (oltre al titolare) riceveranno <strong>massima priorità</strong> nella collocazione automatica ed equa del piano Jolly in caso di assenza del titolare.
            </span>
          </div>
        )}

        <div className="p-6 flex flex-col overflow-hidden min-h-[350px]">
          {/* Ricerca e Filtro Operatori */}
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
              <div className="text-center text-xs text-slate-400 py-8">Nessun operatore trovato.</div>
            ) : (
              filteredEmployees.map(emp => {
                const isAssigned = assignedEmployeeIds.includes(emp.id);
                const isKnown = knownOperatorIds.includes(emp.id);
                const isSelected = activeTab === 'assigned' ? isAssigned : isKnown;
                const isInWeeklyPlan = planOperatorIds.includes(emp.id);

                return (
                  <div key={emp.id} className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    isSelected 
                      ? activeTab === 'assigned' ? 'bg-indigo-50/70 border-indigo-200' : 'bg-amber-50/80 border-amber-300'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}>
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (activeTab === 'assigned') {
                            toggleAssignment(emp.id, ws.id);
                          } else {
                            toggleKnown(emp.id);
                          }
                        }}
                        className={`w-4 h-4 rounded border-slate-300 shrink-0 ${
                          activeTab === 'assigned' ? 'text-indigo-600 focus:ring-indigo-500' : 'text-amber-600 focus:ring-amber-500'
                        }`}
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-800'}`}>
                            {emp.name}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold ${
                            (!emp.type || emp.type === 'jolly') 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {(!emp.type || emp.type === 'jolly') ? 'Jolly' : 'Ordinario'}
                          </span>
                          {isAssigned && activeTab === 'known' && (
                            <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-medium">
                              Titolare
                            </span>
                          )}
                          {isKnown && activeTab === 'assigned' && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                              Conosce cantiere
                            </span>
                          )}
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
            {activeTab === 'assigned' 
              ? `${assignedEmployeeIds.length} titolari assegnati` 
              : `${knownOperatorIds.length} operatori che conoscono il cantiere`}
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

function EditWorkSiteModal({ 
  isOpen, 
  onClose, 
  ws, 
  onSave 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  ws: WorkSite, 
  onSave: (id: string, updates: Partial<WorkSite>) => Promise<void> | void 
}) {
  const { employees, assignments } = useAppContext();
  const [name, setName] = useState(ws.name);
  const [address, setAddress] = useState(ws.address || '');
  const [city, setCity] = useState(ws.city || '');
  const [province, setProvince] = useState(ws.province || '');
  const [radius, setRadius] = useState(ws.radius || '');
  const [scanType, setScanType] = useState(ws.scanType || '');

  // Variabili Piano dei Jolly
  const [hasKeys, setHasKeys] = useState<boolean>(ws.hasKeys ?? false);
  const [keysLocation, setKeysLocation] = useState(ws.keysLocation || '');
  const [hasAlarm, setHasAlarm] = useState<boolean>(ws.hasAlarm ?? false);
  const [alarmCode, setAlarmCode] = useState(ws.alarmCode || '');
  const [notes, setNotes] = useState(ws.notes || '');

  const [knownOperatorIds, setKnownOperatorIds] = useState<string[]>(ws.knownOperatorIds || []);
  const [canVaryTime, setCanVaryTime] = useState<boolean>(ws.canVaryTime ?? false);
  const [canVaryDay, setCanVaryDay] = useState<boolean>(ws.canVaryDay ?? false);
  const [flexibilityNotes, setFlexibilityNotes] = useState(ws.flexibilityNotes || '');
  
  const [opSearch, setOpSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // Titolari assegnati da assignments
  const assignedIds = assignments.filter(a => a.workSiteId === ws.id).map(a => a.employeeId);
  const titolari = employees.filter(e => assignedIds.includes(e.id));

  const toggleKnownOperator = (empId: string) => {
    setKnownOperatorIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const cleanName = name.trim().toUpperCase();
      const cleanAddress = address.trim();
      const cleanCity = city.trim().toUpperCase();
      const cleanProvince = province.trim().toUpperCase();

      const addressChanged = cleanAddress !== (ws.address || '') || cleanCity !== (ws.city || '') || cleanProvince !== (ws.province || '');
      const coords = addressChanged 
        ? await resolveCoordinates(cleanAddress, cleanCity, cleanProvince) 
        : { lat: ws.lat, lng: ws.lng };

      await onSave(ws.id, {
        name: cleanName,
        address: cleanAddress,
        city: cleanCity,
        province: cleanProvince,
        radius: radius.trim(),
        scanType: scanType.trim(),
        hasKeys,
        keysLocation: hasKeys ? keysLocation.trim() : '',
        hasAlarm,
        alarmCode: hasAlarm ? alarmCode.trim() : '',
        notes: notes.trim(),
        knownOperatorIds,
        canVaryTime,
        canVaryDay,
        flexibilityNotes: flexibilityNotes.trim(),
        ...(coords && coords.lat !== undefined ? { lat: coords.lat, lng: coords.lng } : {})
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const filteredOpList = employees
    .filter(emp => !opSearch.trim() || emp.name.toLowerCase().includes(opSearch.trim().toLowerCase()))
    .sort((a, b) => {
      const aSelected = knownOperatorIds.includes(a.id);
      const bSelected = knownOperatorIds.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Building size={18} className="text-indigo-600" />
              Scheda Cantiere: {ws.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configura dati anagrafici, accesso, chiavi, allarme e variabili per il piano dei Jolly
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Sezione 1: Dati Anagrafici Cantiere */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Building size={14} className="text-indigo-600" />
              Dati Anagrafici e Localizzazione
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Nome Cantiere / Ragione Sociale *</label>
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase font-semibold"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Indirizzo</label>
                <input 
                  type="text" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  placeholder="Es. VIA ROMA, 1"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Comune</label>
                <input 
                  type="text" 
                  value={city} 
                  onChange={e => setCity(e.target.value)} 
                  placeholder="Es. MILANO"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Provincia</label>
                <input 
                  type="text" 
                  value={province} 
                  onChange={e => setProvince(e.target.value)} 
                  placeholder="Es. MI"
                  maxLength={3}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Raggio (m)</label>
                <input 
                  type="text" 
                  value={radius} 
                  onChange={e => setRadius(e.target.value)} 
                  placeholder="Es. 100"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Scansione</label>
                <input 
                  type="text" 
                  value={scanType} 
                  onChange={e => setScanType(e.target.value)} 
                  placeholder="Es. Qualsiasi"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sezione 2: Chiavi, Allarme e Note Operative */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Key size={14} className="text-amber-600" />
              Accesso al Cantiere: Chiavi, Allarme e Note
            </h4>

            {/* CHIAVI */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-800">
                <input 
                  type="checkbox" 
                  checked={hasKeys} 
                  onChange={e => setHasKeys(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1.5">
                  🔑 <span>Ci sono le chiavi per accedere al cantiere</span>
                </span>
              </label>
              {hasKeys && (
                <div className="pl-6 pt-1">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Dove si trovano le chiavi / Note per il ritiro o codice cassetta
                  </label>
                  <input 
                    type="text"
                    value={keysLocation}
                    onChange={e => setKeysLocation(e.target.value)}
                    placeholder="Es. In bacheca in sede / Cassetta all'ingresso codice 1234 / Dal portinaio"
                    className="w-full border border-slate-200 rounded-md p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                  />
                </div>
              )}
            </div>

            {/* ALLARME */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-800">
                <input 
                  type="checkbox" 
                  checked={hasAlarm} 
                  onChange={e => setHasAlarm(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <span className="flex items-center gap-1.5">
                  🚨 <span>Impianto di allarme presente</span>
                </span>
              </label>
              {hasAlarm && (
                <div className="pl-6 pt-1">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Qual è il codice di allarme ed eventuali istruzioni
                  </label>
                  <input 
                    type="text"
                    value={alarmCode}
                    onChange={e => setAlarmCode(e.target.value)}
                    placeholder="Es. Codice: 4567# (tastierino a destra, disattivare entro 30s)"
                    className="w-full border border-rose-200 rounded-md p-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none bg-rose-50/30 font-medium text-rose-950"
                  />
                </div>
              )}
            </div>

            {/* NOTE CANTIERE */}
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <FileText size={14} className="text-slate-500" />
                Note operative / Avvertenze per chi interviene nel cantiere
              </label>
              <textarea 
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Es. Citofonare a interno 4; parcheggio dipendenti nel cortile interno; portare aspiratore specifico..."
                className="w-full border border-slate-200 rounded-md p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Sezione 3: Chi conosce il cantiere oltre al titolare */}
          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-600" />
                  Operatori che oltre al titolare conoscono il cantiere
                </h4>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  Questi operatori riceveranno massima priorità nella collocazione del cantiere nel piano dei Jolly.
                </p>
              </div>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                {knownOperatorIds.length} selezionati
              </span>
            </div>

            {/* Titolari attuali */}
            {titolari.length > 0 && (
              <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700">Titolari del cantiere: </span>
                {titolari.map(t => (
                  <span key={t.id} className="inline-block bg-slate-100 text-slate-800 font-medium px-1.5 py-0.5 rounded mr-1 text-[10.5px]">
                    {t.name}
                  </span>
                ))}
              </div>
            )}

            {/* Ricerca e lista operatori che conoscono il cantiere */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={opSearch} 
                  onChange={e => setOpSearch(e.target.value)}
                  placeholder="Cerca operatore per nome..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {filteredOpList.map(emp => {
                  const isKnown = knownOperatorIds.includes(emp.id);
                  const isTitolare = assignedIds.includes(emp.id);
                  return (
                    <label key={emp.id} className={`flex items-center justify-between p-1.5 rounded text-xs cursor-pointer border transition-colors ${
                      isKnown ? 'bg-amber-50/80 border-amber-300 font-semibold text-amber-950' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        <input 
                          type="checkbox"
                          checked={isKnown}
                          onChange={() => toggleKnownOperator(emp.id)}
                          className="w-3.5 h-3.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 shrink-0"
                        />
                        <span className="truncate">{emp.name}</span>
                        <span className={`text-[9.5px] px-1 py-0.2 rounded font-normal ${
                          (!emp.type || emp.type === 'jolly') ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {(!emp.type || emp.type === 'jolly') ? 'Jolly' : 'Ordinario'}
                        </span>
                        {isTitolare && (
                          <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1 rounded">
                            Titolare
                          </span>
                        )}
                      </div>
                      {isKnown && (
                        <span className="text-[10px] text-amber-800 font-bold shrink-0 ml-1">
                          ✓ Conosce
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sezione 4: Possibilità di Variare Orario o Giorno (Variabili Piano Jolly) */}
          <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
            <div>
              <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-purple-600" />
                Flessibilità Piano Jolly: Variazione Orario e Giorno
              </h4>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Queste variabili intervengono nella collocazione del cantiere nel piano dei Jolly per ottimizzare i giri e coprire turni altrimenti scoperti.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-purple-100">
              <label className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={canVaryTime}
                  onChange={e => setCanVaryTime(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 mt-0.5"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-800">🕒 Possibilità di variare l'orario</span>
                  <span className="block text-[10.5px] text-slate-500 mt-0.5">
                    L'orario del turno è flessibile (es. anticipabile o posticipabile per adattarsi al giro dei Jolly).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={canVaryDay}
                  onChange={e => setCanVaryDay(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 mt-0.5"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-800">📅 Possibilità di variare il giorno</span>
                  <span className="block text-[10.5px] text-slate-500 mt-0.5">
                    L'intervento può essere spostato o recuperato in un altro giorno della settimana.
                  </span>
                </div>
              </label>

              {(canVaryTime || canVaryDay) && (
                <div className="sm:col-span-2 pt-1">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Note e vincoli sulla flessibilità di orario o giorno
                  </label>
                  <input 
                    type="text"
                    value={flexibilityNotes}
                    onChange={e => setFlexibilityNotes(e.target.value)}
                    placeholder="Es. Eseguire preferibilmente prima delle 13:00 / Anticipabile di max 1 ora / Preferibile martedì o giovedì"
                    className="w-full border border-purple-200 rounded-md p-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-purple-50/20"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check size={14} />
              {isSaving ? 'Salvataggio in corso...' : 'Salva Scheda Cantiere'}
            </button>
          </div>
        </form>
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
  onEditFullSite: () => void,
  searchTerm?: string,
  selectedOperatorId?: string
}> = ({ ws, onDelete, onUpdate, onEditPlan, onManageOperators, onEditFullSite, searchTerm = '', selectedOperatorId = 'all' }) => {
  const { employees, assignments } = useAppContext();
  const [operatorSearch, setOperatorSearch] = useState('');

  // Operatori assegnati da assignments e da weeklyPlan (Titolari)
  const assignedIds = (assignments || []).filter(a => a.workSiteId === ws.id).map(a => a.employeeId);
  const planOpIds = (Object.values(ws.weeklyPlan || {}) as any[]).flatMap(day => 
    day?.shifts?.flatMap((s: any) => s.assignedOperators || []) || day?.assignedOperators || []
  );
  const allOpIds = Array.from(new Set([...assignedIds, ...planOpIds]));
  const allOperators = allOpIds.map(id => employees.find(e => e.id === id)).filter(Boolean) as Employee[];

  // Operatori che oltre al titolare conoscono il cantiere
  const knownOpIds = ws.knownOperatorIds || [];
  const knownOperators = knownOpIds.map(id => employees.find(e => e.id === id)).filter(Boolean) as Employee[];

  // Filtra operatori del cantiere con ricerca interna
  const filteredOperators = allOperators.filter(op => {
    if (!operatorSearch.trim()) return true;
    const lower = operatorSearch.toLowerCase();
    return op.name.toLowerCase().includes(lower) ||
      (op.city && op.city.toLowerCase().includes(lower)) ||
      (op.company && op.company.toLowerCase().includes(lower));
  });

  return (
    <tr className="hover:bg-slate-50 group">
      <td className="px-3 py-2.5">
        <div className="flex flex-col">
          <span 
            className="font-bold text-xs text-slate-900 block min-w-[160px] hover:text-indigo-600 cursor-pointer"
            onClick={onEditFullSite}
            title="Clicca per aprire la scheda cantiere completa"
          >
            {ws.name}
          </span>
          <button 
            type="button" 
            onClick={onEditFullSite} 
            className="text-[10px] text-indigo-600 hover:text-indigo-800 text-left font-medium mt-0.5"
          >
            Modifica scheda ➔
          </button>
        </div>
      </td>

      <td className="px-3 py-2.5">
        <div className="flex flex-col min-w-[140px]">
          <span className="text-xs text-slate-800">{ws.address || '-'}</span>
          <span className="text-[10px] text-slate-500">
            {(ws.city || ws.province) ? `${ws.city || ''}${ws.city && ws.province ? ' (' + ws.province + ')' : (ws.province || '')}` : '-'}
          </span>
        </div>
      </td>
      
      {/* Colonna Operatori Assegnati (Titolari) */}
      <td className="px-3 py-2.5 min-w-[210px] max-w-[280px]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <Users size={12} className="text-indigo-600" />
              {allOperators.length} {allOperators.length === 1 ? 'Titolare' : 'Titolari'}
            </span>
            <button 
              onClick={onManageOperators}
              className="text-[10.5px] text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
              title="Gestisci titolari o chi conosce il cantiere"
            >
              + Gestisci
            </button>
          </div>

          {/* Campo di ricerca operatore all'interno di questo specifico cantiere */}
          {allOperators.length > 2 && (
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Cerca operatore..."
                value={operatorSearch}
                onChange={(e) => setOperatorSearch(e.target.value)}
                className="w-full pl-6 pr-2 py-0.5 text-[10.5px] border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
              />
            </div>
          )}

          {/* Lista chip titolari */}
          <div className="flex flex-wrap gap-1 max-h-[75px] overflow-y-auto pr-0.5">
            {filteredOperators.length === 0 ? (
              <span className="text-[10px] text-slate-400 italic">
                {allOperators.length === 0 ? 'Nessun titolare associato' : 'Nessun titolare corrisponde'}
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
                    <span className="truncate max-w-[110px]">{op.name}</span>
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

      {/* Colonna Accesso & Variabili Piano Jolly */}
      <td className="px-3 py-2.5 min-w-[240px] max-w-[320px]">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1">
            {/* Chiavi */}
            {ws.hasKeys ? (
              <span 
                className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-bold cursor-help"
                title={ws.keysLocation ? `Chiavi presenti: ${ws.keysLocation}` : 'Chiavi presenti per accesso'}
              >
                <Key size={11} className="text-emerald-600" />
                <span>Chiavi: Sì</span>
                {ws.keysLocation && <span className="max-w-[120px] truncate font-normal opacity-90">({ws.keysLocation})</span>}
              </span>
            ) : ws.hasKeys === false ? (
              <span className="inline-flex items-center gap-1 text-[9.5px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">
                ❌ No chiavi
              </span>
            ) : (
              <span className="text-[9.5px] text-slate-400 italic">Chiavi non spec.</span>
            )}

            {/* Allarme */}
            {ws.hasAlarm ? (
              <span 
                className="inline-flex items-center gap-1 text-[10px] bg-rose-50 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded font-bold cursor-help"
                title={ws.alarmCode ? `Codice Allarme: ${ws.alarmCode}` : 'Allarme presente (nessun codice inserito)'}
              >
                <ShieldAlert size={11} className="text-rose-600" />
                <span>Allarme</span>
                {ws.alarmCode ? (
                  <span className="font-mono bg-white/90 px-1 py-0.2 rounded text-[9.5px] border border-rose-200 text-rose-950 font-bold">
                    {ws.alarmCode}
                  </span>
                ) : (
                  <span className="text-[9px] text-rose-600 font-normal">Sì</span>
                )}
              </span>
            ) : null}
          </div>

          {/* Chi conosce il cantiere oltre al titolare */}
          {knownOperators.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-amber-950 bg-amber-50/90 border border-amber-300 px-1.5 py-0.5 rounded">
              <Sparkles size={11} className="text-amber-600 shrink-0" />
              <span className="font-bold">Conoscono:</span>
              <span className="truncate max-w-[180px] font-medium" title={knownOperators.map(o => `${o.name} (${(!o.type || o.type === 'jolly') ? 'Jolly' : 'Ord.'})`).join(', ')}>
                {knownOperators.map(o => o.name).join(', ')}
              </span>
            </div>
          )}

          {/* Flessibilità orario / giorno & Note */}
          <div className="flex flex-wrap items-center gap-1 text-[9.5px]">
            {ws.canVaryTime && (
              <span className="bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.2 rounded font-medium" title={ws.flexibilityNotes || 'Orario flessibile per collocazione Jolly'}>
                🕒 Orario flessibile
              </span>
            )}
            {ws.canVaryDay && (
              <span className="bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.2 rounded font-medium" title={ws.flexibilityNotes || 'Giorno spostabile per collocazione Jolly'}>
                📅 Giorno variabile
              </span>
            )}
            {ws.notes && (
              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.2 rounded truncate max-w-[180px]" title={`Note cantiere: ${ws.notes}`}>
                📝 {ws.notes}
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="px-3 py-2.5">
        <div className="flex flex-col whitespace-nowrap">
          <span className="text-xs text-slate-800">Scansione: <span className="font-medium">{ws.scanType || '-'}</span></span>
          <span className="text-[10px] text-slate-500">Raggio: <span className="font-medium">{ws.radius ? `${ws.radius}m` : '-'}</span></span>
        </div>
      </td>

      <td className="px-3 py-2.5 whitespace-nowrap text-right align-top">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onManageOperators}
            className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
            title="Gestione Operatori (Titolari & Chi conosce il cantiere)"
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
            onClick={onEditFullSite}
            className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
            title="Modifica Scheda Cantiere Completa (Chiavi, Allarme, Flessibilità, Note)"
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
      </td>
    </tr>
  );
};

function CantieriSection() {
  const { workSites, addWorkSite, deleteWorkSite, updateWorkSite, employees, assignments } = useAppContext();
  const [editingPlanWorkSiteId, setEditingPlanWorkSiteId] = useState<string | null>(null);
  const [managingOperatorsWorkSiteId, setManagingOperatorsWorkSiteId] = useState<string | null>(null);
  const [editingWorkSite, setEditingWorkSite] = useState<WorkSite | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperatorFilter, setSelectedOperatorFilter] = useState<string>('all');
  
  // Campi form Nuovo Cantiere
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [radius, setRadius] = useState('');
  const [scanType, setScanType] = useState('');

  // Campi Accesso & Variabili Jolly nel form Nuovo Cantiere
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);
  const [keysLocation, setKeysLocation] = useState('');
  const [hasAlarm, setHasAlarm] = useState(false);
  const [alarmCode, setAlarmCode] = useState('');
  const [notes, setNotes] = useState('');
  const [canVaryTime, setCanVaryTime] = useState(false);
  const [canVaryDay, setCanVaryDay] = useState(false);
  const [flexibilityNotes, setFlexibilityNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const cleanName = name.trim().toUpperCase();
    const cleanAddress = address.trim();
    const cleanCity = city.trim().toUpperCase();
    const cleanProvince = province.trim().toUpperCase();

    // Geocodifica immediata per consentire il calcolo delle distanze con gli operatori
    const coords = await resolveCoordinates(cleanAddress, cleanCity, cleanProvince);

    await addWorkSite({ 
      name: cleanName, 
      address: cleanAddress,
      city: cleanCity,
      province: cleanProvince,
      radius: radius.trim(),
      scanType: scanType.trim(),
      hasKeys,
      keysLocation: hasKeys ? keysLocation.trim() : '',
      hasAlarm,
      alarmCode: hasAlarm ? alarmCode.trim() : '',
      notes: notes.trim(),
      knownOperatorIds: [],
      canVaryTime,
      canVaryDay,
      flexibilityNotes: flexibilityNotes.trim(),
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {})
    });

    setName('');
    setAddress('');
    setCity('');
    setProvince('');
    setRadius('');
    setScanType('');
    setHasKeys(false);
    setKeysLocation('');
    setHasAlarm(false);
    setAlarmCode('');
    setNotes('');
    setCanVaryTime(false);
    setCanVaryDay(false);
    setFlexibilityNotes('');
    setShowAdvanced(false);
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

              {/* Sezione Espandibile: Chiavi, Allarme e Variabili Piano Jolly */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 flex items-center justify-between hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Key size={13} className="text-amber-600" />
                    Chiavi, Allarme & Variabili Jolly
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold">{showAdvanced ? '▲ Chiudi' : '▼ Apri'}</span>
                </button>

                {showAdvanced && (
                  <div className="p-3 border-t border-slate-200 space-y-3 bg-white">
                    {/* Chiavi */}
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                        <input 
                          type="checkbox"
                          checked={hasKeys}
                          onChange={e => setHasKeys(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                        />
                        <span>🔑 Chiavi presenti per accesso</span>
                      </label>
                      {hasKeys && (
                        <input 
                          type="text"
                          placeholder="Note / Dove si trovano le chiavi..."
                          value={keysLocation}
                          onChange={e => setKeysLocation(e.target.value)}
                          className="w-full border border-slate-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      )}
                    </div>

                    {/* Allarme */}
                    <div className="space-y-1 border-t border-slate-100 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                        <input 
                          type="checkbox"
                          checked={hasAlarm}
                          onChange={e => setHasAlarm(e.target.checked)}
                          className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                        />
                        <span>🚨 Allarme presente</span>
                      </label>
                      {hasAlarm && (
                        <input 
                          type="text"
                          placeholder="Codice allarme / Istruzioni..."
                          value={alarmCode}
                          onChange={e => setAlarmCode(e.target.value)}
                          className="w-full border border-rose-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none font-mono"
                        />
                      )}
                    </div>

                    {/* Flessibilità Orario e Giorno */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-2">
                      <span className="block text-[11px] font-bold text-slate-700">Flessibilità Piano Jolly</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                        <input 
                          type="checkbox"
                          checked={canVaryTime}
                          onChange={e => setCanVaryTime(e.target.checked)}
                          className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                        />
                        <span>🕒 Orario flessibile (variabile)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                        <input 
                          type="checkbox"
                          checked={canVaryDay}
                          onChange={e => setCanVaryDay(e.target.checked)}
                          className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                        />
                        <span>📅 Giorno variabile (spostabile)</span>
                      </label>
                      {(canVaryTime || canVaryDay) && (
                        <input 
                          type="text"
                          placeholder="Note flessibilità orario/giorno..."
                          value={flexibilityNotes}
                          onChange={e => setFlexibilityNotes(e.target.value)}
                          className="w-full border border-slate-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                        />
                      )}
                    </div>

                    {/* Note Cantiere */}
                    <div className="space-y-1 border-t border-slate-100 pt-2">
                      <label className="block text-[11px] font-semibold text-slate-700">Note generali cantiere</label>
                      <textarea 
                        rows={2}
                        placeholder="Note o istruzioni per chi interviene..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm font-medium mt-4">
              Aggiungi Cantiere
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
                <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Accesso & Piano Jolly</th>
                <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Impostazioni App</th>
                <th scope="col" className="px-3 py-2 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {filteredWorkSites.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-xs text-slate-500">Nessun cantiere trovato con questi filtri.</td></tr>
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
                  onEditFullSite={() => setEditingWorkSite(ws)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editingWorkSite && (
        <EditWorkSiteModal
          isOpen={true}
          onClose={() => setEditingWorkSite(null)}
          ws={editingWorkSite}
          onSave={updateWorkSite}
        />
      )}
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
