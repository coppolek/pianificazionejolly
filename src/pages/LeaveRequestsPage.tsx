import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { LeaveType } from '../types';
import { Trash2, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function LeaveRequestsPage() {
  const { leaveRequests, employees, addLeaveRequest, updateLeaveRequest, deleteLeaveRequest } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);

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
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Elenco Richieste</h3>
          <p className="text-sm text-slate-500 mt-1">Gestisci ferie, permessi e malattie degli operatori.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Nuova Richiesta
        </button>
      </div>

      {isAdding && (
        <AddLeaveForm onComplete={() => setIsAdding(false)} />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Operatore</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data Inizio</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data Fine</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stato</th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-50">
            {leaveRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  Nessuna richiesta registrata.
                </td>
              </tr>
            ) : (
              leaveRequests.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((req) => {
                const emp = employees.find(e => e.id === req.employeeId);
                return (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{emp?.name || 'Operatore eliminato'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-[10px] uppercase font-bold rounded border ${getTypeStyle(req.type)}`}>
                        {req.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(req.startDate).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(req.endDate).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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

function AddLeaveForm({ onComplete }: { onComplete: () => void }) {
  const { employees, addLeaveRequest } = useAppContext();
  const [formData, setFormData] = useState({
    employeeId: employees[0]?.id || '',
    type: 'Ferie' as LeaveType,
    startDate: '',
    endDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.startDate || !formData.endDate) return;
    
    addLeaveRequest(formData);
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-5 gap-4 items-end shadow-sm">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Operatore</label>
        <select 
          required
          className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
          value={formData.employeeId}
          onChange={e => setFormData({...formData, employeeId: e.target.value})}
        >
          <option value="">Seleziona...</option>
          {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </select>
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
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Dal</label>
        <input 
          type="date" required
          className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
          value={formData.startDate}
          onChange={e => setFormData({...formData, startDate: e.target.value})}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Al</label>
        <input 
          type="date" required
          className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
          value={formData.endDate}
          onChange={e => setFormData({...formData, endDate: e.target.value})}
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
