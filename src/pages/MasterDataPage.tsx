import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Trash2, UserPlus, Building, Link as LinkIcon, Check, Edit2 } from 'lucide-react';

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<'operatori' | 'cantieri' | 'assegnazioni'>('operatori');

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
          <button
            onClick={() => setActiveTab('assegnazioni')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'assegnazioni'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <LinkIcon size={16} />
            Assegnazioni
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'operatori' && <OperatoriSection />}
        {activeTab === 'cantieri' && <CantieriSection />}
        {activeTab === 'assegnazioni' && <AssegnazioniSection />}
      </div>
    </div>
  );
}

function OperatoriSection() {
  const { employees, addEmployee, deleteEmployee, updateEmployee } = useAppContext();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addEmployee({ name: name.toUpperCase() });
    setName('');
  };

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
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm font-medium">
              Aggiungi
            </button>
          </form>
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {employees.length === 0 && (
                <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-500">Nessun operatore inserito.</td></tr>
              )}
              {employees.map(emp => (
                <OperatorRow 
                  key={emp.id} 
                  emp={emp} 
                  onDelete={() => deleteEmployee(emp.id)}
                  onUpdate={(newName) => updateEmployee(emp.id, newName)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OperatorRow({ emp, onDelete, onUpdate }: { key?: React.Key, emp: any, onDelete: () => void, onUpdate: (name: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(emp.name);

  const handleSave = () => {
    if (editedName.trim() && editedName !== emp.name) {
      onUpdate(editedName.toUpperCase());
    } else {
      setEditedName(emp.name);
    }
    setIsEditing(false);
  };

  return (
    <tr className="hover:bg-slate-50 group">
      <td className="px-6 py-4 whitespace-nowrap">
        {isEditing ? (
          <input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="border border-indigo-300 rounded px-2 py-1 text-sm uppercase w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        ) : (
          <span className="font-medium text-slate-900 cursor-pointer hover:bg-slate-100 px-2 py-1 -ml-2 rounded transition-colors" onClick={() => {setIsEditing(true); setEditedName(emp.name);}}>
            {emp.name}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="text-slate-400 hover:text-indigo-600 p-2 rounded-md hover:bg-indigo-50 transition-colors"
            title="Modifica"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={onDelete}
            className="text-slate-400 hover:text-rose-600 p-2 rounded-md hover:bg-rose-50 transition-colors"
            title="Elimina"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function CantieriSection() {
  const { workSites, addWorkSite, deleteWorkSite } = useAppContext();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addWorkSite({ name: name.toUpperCase() });
    setName('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2 mb-4">
            <Building size={20} className="text-indigo-500" />
            Nuovo Cantiere
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome Cantiere / Azienda</label>
              <input 
                type="text" required placeholder="Es. INTESA GREEN"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm font-medium">
              Aggiungi
            </button>
          </form>
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome Cantiere</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {workSites.length === 0 && (
                <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-500">Nessun cantiere inserito.</td></tr>
              )}
              {workSites.map(ws => (
                <tr key={ws.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{ws.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button 
                      onClick={() => deleteWorkSite(ws.id)}
                      className="text-slate-400 hover:text-rose-600 p-2 rounded-md hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AssegnazioniSection() {
  const { workSites, employees, assignments, toggleAssignment } = useAppContext();
  const [selectedSiteId, setSelectedSiteId] = useState<string>(workSites[0]?.id || '');

  const activeSite = workSites.find(ws => ws.id === selectedSiteId);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="mb-6 max-w-md">
        <label className="block text-xs font-medium text-slate-700 mb-2">Seleziona Cantiere per visualizzare/modificare assegnazioni</label>
        <select 
          className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
          value={selectedSiteId}
          onChange={e => setSelectedSiteId(e.target.value)}
        >
          {workSites.length === 0 && <option value="">Nessun cantiere disponibile</option>}
          {workSites.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
        </select>
      </div>

      {activeSite ? (
        <div>
          <h4 className="text-lg font-medium text-slate-800 mb-4 pb-2 border-b border-slate-100">Operatori assegnati a {activeSite.name}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {employees.map(emp => {
              const isAssigned = assignments.some(a => a.employeeId === emp.id && a.workSiteId === selectedSiteId);
              return (
                <div 
                  key={emp.id}
                  onClick={() => toggleAssignment(emp.id, selectedSiteId)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center justify-between shadow-sm ${
                    isAssigned 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className={`font-medium text-sm ${isAssigned ? 'text-indigo-800' : 'text-slate-700'}`}>
                    {emp.name}
                  </span>
                  {isAssigned && <Check size={18} className="text-indigo-600" />}
                </div>
              );
            })}
            {employees.length === 0 && (
              <div className="col-span-full text-slate-500 p-4 text-sm">Nessun operatore in anagrafica.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 text-sm">
          Seleziona un cantiere per gestire le assegnazioni.
        </div>
      )}
    </div>
  );
}
