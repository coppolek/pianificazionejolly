import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Trash2, UserPlus, Building, Link as LinkIcon, Check, Edit2, Calendar, X, Search } from 'lucide-react';
import { WorkSite, Employee, WeeklyPlan } from '../types';

function WeeklyPlanModal({ isOpen, onClose, ws, onUpdate }: { isOpen: boolean, onClose: () => void, ws: WorkSite, onUpdate: (id: string, updates: Partial<WorkSite>) => void }) {
  const { employees } = useAppContext();
  
  if (!isOpen) return null;

  const [plan, setPlan] = useState<WeeklyPlan>(ws.weeklyPlan || {});

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

  const updateDailyPlan = (day: keyof WeeklyPlan, field: keyof NonNullable<WeeklyPlan[keyof WeeklyPlan]>, value: any) => {
    setPlan(prev => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [field]: value
      }
    }));
  };

  const toggleOperator = (day: keyof WeeklyPlan, employeeId: string) => {
    const currentDayPlan = plan[day] || {};
    const assigned = currentDayPlan.assignedOperators || [];
    
    if (assigned.includes(employeeId)) {
      updateDailyPlan(day, 'assignedOperators', assigned.filter(id => id !== employeeId));
    } else {
      updateDailyPlan(day, 'assignedOperators', [...assigned, employeeId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="font-semibold text-slate-800">Piano Settimanale: {ws.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          {(Object.keys(daysMap) as Array<keyof WeeklyPlan>).map(day => (
            <div key={day} className="flex flex-col xl:flex-row gap-4 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
              <label className="w-24 text-sm font-semibold text-slate-800 pt-2 shrink-0">
                {daysMap[day]}
              </label>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Ingresso</label>
                    <input 
                      type="time"
                      value={plan[day]?.startTime || ''}
                      onChange={e => updateDailyPlan(day, 'startTime', e.target.value)}
                      className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Uscita</label>
                    <input 
                      type="time"
                      value={plan[day]?.endTime || ''}
                      onChange={e => updateDailyPlan(day, 'endTime', e.target.value)}
                      className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">N. Operatori</label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="Es. 2"
                    value={plan[day]?.operatorsCount || ''}
                    onChange={e => updateDailyPlan(day, 'operatorsCount', e.target.value)}
                    className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div className="md:col-span-3 lg:col-span-1">
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Operatori Assegnati</label>
                  <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto p-1 border border-slate-100 rounded bg-slate-50">
                    {employees.map(emp => (
                      <label key={emp.id} className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded text-xs cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={(plan[day]?.assignedOperators || []).includes(emp.id)}
                          onChange={() => toggleOperator(day, emp.id)}
                        />
                        <span className="truncate max-w-[100px]" title={emp.name}>{emp.name}</span>
                      </label>
                    ))}
                    {employees.length === 0 && (
                      <span className="text-xs text-slate-400 italic py-1 px-2">Nessun operatore disponibile</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'jolly' | 'ordinario'>('jolly');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addEmployee({ name: name.toUpperCase(), type });
    setName('');
    setType('jolly');
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-3 py-2 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {filteredEmployees.length === 0 && (
                <tr><td colSpan={2} className="px-3 py-6 text-center text-xs text-slate-500">Nessun operatore trovato.</td></tr>
              )}
              {filteredEmployees.map(emp => (
                <OperatorRow 
                  key={emp.id} 
                  emp={emp} 
                  onDelete={() => deleteEmployee(emp.id)}
                  onUpdate={(updates) => updateEmployee(emp.id, updates)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OperatorRow({ emp, onDelete, onUpdate }: { key?: React.Key, emp: any, onDelete: () => void, onUpdate: (updates: { name?: string, type?: 'jolly' | 'ordinario' }) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(emp.name);
  const [editedType, setEditedType] = useState<'jolly' | 'ordinario'>(emp.type || 'jolly');

  const handleSave = () => {
    if ((editedName.trim() && editedName !== emp.name) || editedType !== (emp.type || 'jolly')) {
      onUpdate({ name: editedName.toUpperCase(), type: editedType });
    } else {
      setEditedName(emp.name);
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
              className="border border-indigo-300 rounded px-2 py-1 text-sm uppercase w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <select
              value={editedType}
              onChange={(e) => setEditedType(e.target.value as 'jolly' | 'ordinario')}
              className="border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="jolly">Jolly</option>
              <option value="ordinario">Ordinario</option>
            </select>
            <button onClick={handleSave} className="bg-indigo-600 text-white rounded p-1 hover:bg-indigo-700">
              <Check size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="font-medium text-xs text-slate-900 cursor-pointer hover:bg-slate-100 px-2 py-1 -ml-2 rounded transition-colors" onClick={() => {setIsEditing(true); setEditedName(emp.name); setEditedType(emp.type || 'jolly');}}>
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
      <td className="px-3 py-2 whitespace-nowrap text-right">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
      </td>
    </tr>
  );
}

const WorkSiteRow: React.FC<{ ws: WorkSite, onDelete: () => void, onUpdate: (id: string, updates: Partial<WorkSite>) => void, onEditPlan: () => void }> = ({ ws, onDelete, onUpdate, onEditPlan }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(ws.name);
  const [editedAddress, setEditedAddress] = useState(ws.address || '');
  const [editedCity, setEditedCity] = useState(ws.city || '');
  const [editedProvince, setEditedProvince] = useState(ws.province || '');
  const [editedRadius, setEditedRadius] = useState(ws.radius || '');
  const [editedScanType, setEditedScanType] = useState(ws.scanType || '');

  const handleSave = () => {
    if (editedName.trim() !== '') {
      onUpdate(ws.id, { 
        name: editedName.trim().toUpperCase(), 
        address: editedAddress.trim(),
        city: editedCity.trim().toUpperCase(),
        province: editedProvince.trim().toUpperCase(),
        radius: editedRadius.trim(),
        scanType: editedScanType.trim()
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
            <span className="font-medium text-xs text-slate-900 block min-w-[200px]">{ws.name}</span>
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
            <div className="flex flex-col min-w-[200px]">
              <span className="text-xs text-slate-800">{ws.address || '-'}</span>
              <span className="text-[10px] text-slate-500">{(ws.city || ws.province) ? `${ws.city || ''}${ws.city && ws.province ? ' (' + ws.province + ')' : (ws.province || '')}` : '-'}</span>
            </div>
          )}
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
                onClick={onEditPlan}
                className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                title="Piano Settimanale"
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
}

function CantieriSection() {
  const { workSites, addWorkSite, deleteWorkSite, updateWorkSite } = useAppContext();
  const [editingPlanWorkSiteId, setEditingPlanWorkSiteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [radius, setRadius] = useState('');
  const [scanType, setScanType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addWorkSite({ 
      name: name.toUpperCase(), 
      address: address.trim(),
      city: city.trim().toUpperCase(),
      province: province.trim().toUpperCase(),
      radius: radius.trim(),
      scanType: scanType.trim()
    });
    setName('');
    setAddress('');
    setCity('');
    setProvince('');
    setRadius('');
    setScanType('');
  };

  const filteredWorkSites = workSites.filter(ws => 
    ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ws.address && ws.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (ws.city && ws.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (ws.province && ws.province.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cerca cantiere..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nome Cantiere</th>
                <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Indirizzo / Luogo</th>
                <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Impostazioni App</th>
                <th scope="col" className="px-3 py-2 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {filteredWorkSites.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-500">Nessun cantiere trovato.</td></tr>
              )}
              {filteredWorkSites.map(ws => (
                <WorkSiteRow key={ws.id} ws={ws} onDelete={() => deleteWorkSite(ws.id)} onUpdate={updateWorkSite} onEditPlan={() => setEditingPlanWorkSiteId(ws.id)} />
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
