import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ScheduleEntry } from '../types';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const getWeekDays = (offsetWeeks: number = 0) => {
  const today = new Date();
  const dayOfWeek = today.getDay(); 
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + (offsetWeeks * 7);
  const monday = new Date(today.setDate(diff));

  const days = [];
  const dayNames = ['DOMENICA', 'LUNEDI', 'MARTEDI', 'MERCOLEDI', 'GIOVEDI', 'VENERDI', 'SABATO'];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const label = `${d.getDate()} ${dayNames[d.getDay()]}`;
    days.push({ date: dateStr, label });
  }
  return days;
};

const parseTime = (timeStr: string) => {
  const [h, m] = (timeStr || "0:0").split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export default function SchedulePage() {
  const { employees, scheduleEntries, deleteScheduleEntry, updateScheduleEntry, updateEmployee } = useAppContext();
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDays = getWeekDays(weekOffset);
  const [modalData, setModalData] = useState<{
    isEditing?: boolean;
    id?: string;
    employeeId: string;
    date: string;
    startTime?: string;
    endTime?: string;
    taskDescription?: string;
    hours?: number;
  } | null>(null);

  const formatHeaderDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const startDateStr = formatHeaderDate(weekDays[0].date);
  const endDateStr = formatHeaderDate(weekDays[6].date);

  return (
    <div className="max-w-full overflow-x-auto pb-20">
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
      </div>

      {modalData && (
        <AddScheduleModal 
          initialData={modalData} 
          onClose={() => setModalData(null)} 
          weekDays={weekDays} 
        />
      )}

      <div className="space-y-8 min-w-[1200px]">
        {employees.filter(emp => !emp.type || emp.type === 'jolly').map(emp => (
          <EmployeeScheduleBlock 
            key={emp.id} 
            employee={emp} 
            weekDays={weekDays} 
            entries={scheduleEntries.filter(e => e.employeeId === emp.id)}
            onDelete={deleteScheduleEntry}
            onUpdate={(id, name) => updateEmployee(id, { name })}
            onDropEntry={(entryId, date, employeeId) => updateScheduleEntry(entryId, { date, employeeId })}
            onEdit={(entry) => setModalData({ ...entry, isEditing: true })}
            onAdd={(date) => setModalData({ employeeId: emp.id, date })}
          />
        ))}
        {employees.filter(emp => !emp.type || emp.type === 'jolly').length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
            Nessun operatore Jolly in anagrafica.
          </div>
        )}
      </div>
    </div>
  );
}

function EmployeeScheduleBlock({ 
  employee, weekDays, entries, onDelete, onUpdate, onAdd, onEdit, onDropEntry 
}: { 
  key?: React.Key, employee: any, weekDays: any[], entries: ScheduleEntry[], onDelete: (id: string) => void, onUpdate: (id: string, name: string) => void, onAdd: (date: string) => void, onEdit: (entry: ScheduleEntry) => void, onDropEntry: (entryId: string, date: string, employeeId: string) => void 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(employee.name);
  const weekTotal = entries.reduce((acc, e) => acc + e.hours, 0);

  const handleSave = () => {
    if (editedName.trim() && editedName !== employee.name) {
      onUpdate(employee.id, editedName.toUpperCase());
    } else {
      setEditedName(employee.name);
    }
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white flex flex-col">
      <div className="bg-[#86d97e] text-gray-900 px-4 py-2.5 flex justify-between items-center border-b border-gray-300">
        {isEditing ? (
          <input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="text-gray-900 bg-white/80 px-2 py-0.5 rounded text-sm font-bold uppercase w-48 outline-none focus:ring-2 focus:ring-gray-400"
          />
        ) : (
          <span 
            className="font-bold tracking-wide uppercase text-sm cursor-pointer hover:bg-black/5 px-2 py-0.5 -ml-2 rounded transition-colors" 
            title="Clicca per modificare"
            onClick={() => { setIsEditing(true); setEditedName(employee.name); }}
          >
            {employee.name}
          </span>
        )}
        <span className="text-sm font-medium opacity-90">Totale settimana: {weekTotal} ore</span>
      </div>
      <div className="flex flex-1">
        {weekDays.map((day, idx) => (
          <DayColumn 
            key={day.date} 
            day={day} 
            employeeId={employee.id}
            isLast={idx === 6} 
            entries={entries.filter(e => e.date === day.date)}
            onDelete={onDelete}
            onAdd={() => onAdd(day.date)}
            onEdit={onEdit}
            onDropEntry={onDropEntry}
          />
        ))}
      </div>
    </div>
  );
}

function DayColumn({ 
  day, employeeId, isLast, entries, onDelete, onAdd, onEdit, onDropEntry
}: { 
  key?: React.Key, day: any, employeeId: string, isLast: boolean, entries: ScheduleEntry[], onDelete: (id: string) => void, onAdd: () => void, onEdit: (entry: ScheduleEntry) => void, onDropEntry: (entryId: string, date: string, employeeId: string) => void
}) {
  const { scheduleEntries } = useAppContext();
  const sortedEntries = [...entries].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
  const dayTotal = sortedEntries.reduce((acc, e) => acc + e.hours, 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const entryId = e.dataTransfer.getData('text/plain');
    if (entryId) {
      const droppedEntry = scheduleEntries.find(e => e.id === entryId);
      if (droppedEntry) {
        const existing = scheduleEntries.filter(e => e.employeeId === employeeId && e.date === day.date && e.id !== entryId);
        
        const startDrop = parseTime(droppedEntry.startTime);
        const endDrop = parseTime(droppedEntry.endTime);
        const overlap = existing.find(e => startDrop < parseTime(e.endTime) && endDrop > parseTime(e.startTime));
        
        if (overlap) {
          if (!window.confirm(`Attenzione: l'orario si accavalla con "${overlap.taskDescription}" (${overlap.startTime} - ${overlap.endTime}). Vuoi procedere comunque?`)) {
            return;
          }
        }
      }
      onDropEntry(entryId, day.date, employeeId);
    }
  };

  const hasOverlap = (entry: ScheduleEntry) => {
    const startA = parseTime(entry.startTime);
    const endA = parseTime(entry.endTime);
    return sortedEntries.some(e => {
      if (e.id === entry.id) return false;
      const startB = parseTime(e.startTime);
      const endB = parseTime(e.endTime);
      return startA < endB && endA > startB;
    });
  };

  return (
    <div 
      className={`flex-1 flex flex-col min-h-[140px] ${isLast ? '' : 'border-r border-gray-200'}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="bg-[#f59e0b] text-center py-1.5 border-b border-gray-200 font-bold text-[11px] text-gray-900 italic uppercase">
        {day.label}
      </div>
      
      <div className="flex-1 bg-white flex flex-col p-2 space-y-2">
        {sortedEntries.map(e => {
          const isOverlapping = hasOverlap(e);
          return (
            <div 
              draggable
              onDragStart={(ev) => ev.dataTransfer.setData('text/plain', e.id)}
              onClick={() => onEdit(e)}
              className={`border rounded p-2 text-[11px] relative group cursor-pointer transition-colors ${
                isOverlapping 
                  ? 'border-red-400 bg-red-50 hover:bg-red-100 hover:border-red-500' 
                  : 'border-[#c2dcf3] bg-[#f4f9ff] hover:border-[#a5d8f3]'
              }`} 
              key={e.id}
            >
              {isOverlapping && (
                <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shadow-sm z-10" title="Sovrapposizione oraria!">
                  !
                </div>
              )}
              <div className="flex justify-between font-bold mb-1">
                <span className={isOverlapping ? 'text-red-900' : 'text-gray-800'}>{e.startTime} - {e.endTime}</span>
                <span className={isOverlapping ? 'text-red-700' : 'text-[#1e5b99]'}>{e.hours}h</span>
              </div>
              <div className={`uppercase tracking-tight truncate pr-4 ${isOverlapping ? 'text-red-800' : 'text-gray-600'}`}>{e.taskDescription}</div>
              <button 
                onClick={(ev) => { ev.stopPropagation(); onDelete(e.id); }}
                className="absolute right-0 top-0 bottom-0 bg-red-100 text-red-600 w-6 hidden group-hover:flex items-center justify-center rounded-r opacity-90 hover:opacity-100"
                title="Elimina"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
        
        <button 
          onClick={onAdd}
          className="w-full border border-dashed border-[#c2dcf3] rounded py-2 text-[#7da7d9] hover:text-[#1e5b99] hover:border-[#a5d8f3] hover:bg-[#f4f9ff] text-[11px] flex items-center justify-center transition-colors"
        >
          + Aggiungi
        </button>
      </div>

      <div className="bg-[#a5d8f3] text-center py-1.5 border-t border-gray-200 font-bold text-[11px] text-gray-800">
        ORE: {dayTotal}
      </div>
    </div>
  );
}

function AddScheduleModal({ 
  initialData, onClose, weekDays 
}: { 
  initialData: {
    isEditing?: boolean;
    id?: string;
    employeeId: string;
    date: string;
    startTime?: string;
    endTime?: string;
    taskDescription?: string;
    hours?: number;
  }, onClose: () => void, weekDays: any[] 
}) {
  const { employees, scheduleEntries, addScheduleEntry, updateScheduleEntry } = useAppContext();
  const [formData, setFormData] = useState({
    employeeId: initialData.employeeId,
    date: initialData.date,
    startTime: initialData.startTime || '',
    endTime: initialData.endTime || '',
    taskDescription: initialData.taskDescription || '',
    hours: initialData.hours?.toString() || ''
  });
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (overlapWarning) setOverlapWarning(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.date || !formData.startTime || !formData.endTime || !formData.hours) return;
    
    const existing = scheduleEntries.filter(e => e.employeeId === formData.employeeId && e.date === formData.date && e.id !== initialData.id);
    const startForm = parseTime(formData.startTime);
    const endForm = parseTime(formData.endTime);
    const overlap = existing.find(e => startForm < parseTime(e.endTime) && endForm > parseTime(e.startTime));

    if (overlap && !overlapWarning) {
      setOverlapWarning(`L'orario si accavalla con "${overlap.taskDescription}" (${overlap.startTime} - ${overlap.endTime}). Clicca di nuovo su "Salva" per forzare l'inserimento.`);
      return;
    }

    if (initialData.isEditing && initialData.id) {
      updateScheduleEntry(initialData.id, {
        employeeId: formData.employeeId,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        taskDescription: formData.taskDescription,
        hours: parseFloat(formData.hours)
      });
    } else {
      addScheduleEntry({
        employeeId: formData.employeeId,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        taskDescription: formData.taskDescription,
        hours: parseFloat(formData.hours)
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-800">{initialData.isEditing ? 'Modifica Intervento' : 'Aggiungi Intervento'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Operatore</label>
              <select 
                required
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1e5b99] focus:border-[#1e5b99] bg-gray-50"
                value={formData.employeeId}
                onChange={e => handleChange('employeeId', e.target.value)}
                disabled
              >
                {employees.filter(emp => !emp.type || emp.type === 'jolly').map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data</label>
              <select 
                required
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1e5b99] focus:border-[#1e5b99] bg-white"
                value={formData.date}
                onChange={e => handleChange('date', e.target.value)}
              >
                {weekDays.map(day => <option key={day.date} value={day.date}>{day.label}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Da (Orario)</label>
              <input 
                type="time" required
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1e5b99] focus:border-[#1e5b99]"
                value={formData.startTime}
                onChange={e => handleChange('startTime', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">A (Orario)</label>
              <input 
                type="time" required
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1e5b99] focus:border-[#1e5b99]"
                value={formData.endTime}
                onChange={e => handleChange('endTime', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descrizione (Cantiere / Note)</label>
            <input 
              type="text" required placeholder="Es. INTESA GREEN x ELISA"
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1e5b99] focus:border-[#1e5b99]"
              value={formData.taskDescription}
              onChange={e => handleChange('taskDescription', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ore totali</label>
            <input 
              type="number" step="0.25" required placeholder="Es. 2.5"
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1e5b99] focus:border-[#1e5b99]"
              value={formData.hours}
              onChange={e => handleChange('hours', e.target.value)}
            />
          </div>

          {overlapWarning && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm">
              {overlapWarning}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors"
            >
              Annulla
            </button>
            <button 
              type="submit" 
              className="bg-[#1e5b99] hover:bg-[#1a4f85] text-white px-6 py-2 rounded-md shadow-sm transition-colors text-sm font-medium"
            >
              Salva Intervento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
