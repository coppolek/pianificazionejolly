import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { LeaveType, Employee } from '../types';
import { Trash2, Plus, CheckCircle2, XCircle, Clock, ChevronDown, Search, Edit2 } from 'lucide-react';
import { LeaveRequest } from '../types';

export default function LeaveRequestsPage() {
  const { isAdmin } = useAuth();
  const { leaveRequests, employees, addLeaveRequest, updateLeaveRequest, deleteLeaveRequest } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);

  const getTypeStyle = (type: LeaveType) => {
    switch (type) {
      case 'Ferie': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Permesso': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Malattia': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved': 
        return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-medium border border-emerald-200"><CheckCircle2 size={14} /> Approvata</span>;
      case 'rejected': 
        return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-xs font-medium border border-rose-200"><XCircle size={14} /> Rifiutata</span>;
      case 'pending':
      default:
        return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-xs font-medium border border-amber-200"><Clock size={14} /> In attesa</span>;
    }
  };

  return (
    <div className="w-full max-w-[1400px] px-4 mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Elenco Richieste</h3>
          <p className="text-sm text-slate-500 mt-1">Gestisci ferie, permessi e malattie degli operatori.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingRequest(null);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            Nuova Richiesta
          </button>
        </div>
      </div>

      {isAdding && (
        <LeaveRequestForm onComplete={() => setIsAdding(false)} />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Operatore</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Data Inizio</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Data Fine</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Note</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stato</th>
              <th scope="col" className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-50">
            {leaveRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  Nessuna richiesta registrata.
                </td>
              </tr>
            ) : (
              [...leaveRequests].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map((req) => {
                const emp = employees.find(e => e.id === req.employeeId);
                
                if (editingRequest?.id === req.id) {
                  return (
                    <tr key={req.id} className="bg-slate-50">
                      <td colSpan={7} className="p-0 border-b border-slate-200">
                        <LeaveRequestForm 
                          initialData={req} 
                          onComplete={() => setEditingRequest(null)} 
                        />
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-sm text-slate-900">{emp?.name || (req.employeeId ? 'Operatore eliminato' : '-')}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-[10px] uppercase font-bold rounded border ${getTypeStyle(req.type)}`}>
                        {req.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                      {req.startDate ? new Date(req.startDate).toLocaleDateString('it-IT') : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                      {req.endDate ? new Date(req.endDate).toLocaleDateString('it-IT') : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[250px] truncate" title={req.notes}>
                      {req.notes || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {(!req.status || req.status === 'pending') && (
                          <>
                            <button 
                              onClick={() => updateLeaveRequest(req.id, { status: 'approved' })}
                              className="text-emerald-600 hover:text-emerald-700 transition-colors p-1.5 rounded-md hover:bg-emerald-50"
                              title="Approva"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button 
                              onClick={() => updateLeaveRequest(req.id, { status: 'rejected' })}
                              className="text-amber-600 hover:text-amber-700 transition-colors p-1.5 rounded-md hover:bg-amber-50"
                              title="Rifiuta"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => {
                            setEditingRequest(req);
                            setIsAdding(false);
                          }}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-md hover:bg-indigo-50"
                          title="Modifica richiesta"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteLeaveRequest(req.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-md hover:bg-rose-50"
                          title="Elimina richiesta"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
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
}

function LeaveRequestForm({ onComplete, initialData }: { onComplete: () => void, initialData?: LeaveRequest }) {
  const { employees, addLeaveRequest, updateLeaveRequest } = useAppContext();
  const [formData, setFormData] = useState({
    employeeId: initialData?.employeeId || employees[0]?.id || '',
    type: initialData?.type || 'Ferie' as LeaveType,
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    notes: initialData?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((formData.type !== 'Annotazione' && !formData.employeeId) || (!formData.startDate && formData.type !== 'Annotazione') || (!formData.endDate && formData.type !== 'Annotazione')) return;
    
    if (initialData?.id) {
      updateLeaveRequest(initialData.id, formData);
    } else {
      addLeaveRequest(formData);
    }
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className={`p-6 bg-slate-50 grid grid-cols-1 md:grid-cols-6 gap-4 items-end ${!initialData ? 'mb-8 border border-slate-200 rounded-xl shadow-sm' : ''}`}>
      <div className="col-span-1 md:col-span-2">
        <label className="block text-xs font-medium text-slate-700 mb-1">Operatore (Opzionale per Annotazioni)</label>
        <EmployeeSelect 
          value={formData.employeeId} 
          onChange={(val) => setFormData({...formData, employeeId: val})} 
          employees={employees} 
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
        <select 
          required
          className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
          value={formData.type}
          onChange={e => setFormData({...formData, type: e.target.value as LeaveType})}
        >
          <option value="Ferie">Ferie</option>
          <option value="Permesso">Permesso</option>
          <option value="Malattia">Malattia</option>
          <option value="Annotazione">Annotazione</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Dal</label>
        <input 
          type="date"
          className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
          value={formData.startDate}
          onChange={e => setFormData({...formData, startDate: e.target.value})}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Al</label>
        <input 
          type="date"
          className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
          value={formData.endDate}
          onChange={e => setFormData({...formData, endDate: e.target.value})}
        />
      </div>
      <div className="col-span-1 md:col-span-5">
        <label className="block text-xs font-medium text-slate-700 mb-1">Note (Obbligatorie per Annotazioni)</label>
        <input 
          type="text"
          className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
          value={formData.notes || ''}
          onChange={e => setFormData({...formData, notes: e.target.value})}
        />
      </div>
      <div className="flex gap-2 h-[42px]">
        <button type="button" onClick={onComplete} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium">
          Annulla
        </button>
        <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm font-medium">
          Salva
        </button>
      </div>
    </form>
  );
}

function EmployeeSelect({ value, onChange, employees }: { value: string, onChange: (val: string) => void, employees: Employee[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedEmp = employees.find(e => e.id === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const sortedEmployees = [...employees].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sortedEmployees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedEmp ? "text-slate-900 truncate pr-2" : "text-slate-500"}>
          {selectedEmp ? selectedEmp.name : "Seleziona operatore..."}
        </span>
        <ChevronDown size={16} className="text-slate-400 shrink-0" />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-slate-100 relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              autoFocus
              placeholder="Cerca operatore..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-sm pl-8 pr-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            <div 
              className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 cursor-pointer border-b border-slate-50 italic"
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearch('');
              }}
            >
              -- Nessun operatore --
            </div>
            {filtered.map(emp => (
              <div 
                key={emp.id}
                className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                onClick={() => {
                  onChange(emp.id);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                {emp.name}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-slate-500 text-center italic">Nessun operatore trovato</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
