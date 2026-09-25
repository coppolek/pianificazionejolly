import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Calendar as CalendarIcon, User, Trash2, Plus, 
  Search, AlertTriangle, Building2, ChevronDown, Check, Edit2 
} from 'lucide-react';
import { LeaveRequest, LeaveType, Employee, WorkSite } from '../types';

interface EditLeaveModalProps {
  isOpen: boolean;
  leave: LeaveRequest | 'new' | null;
  defaultDates?: { startDate: string; endDate: string };
  employees: Employee[];
  workSites?: WorkSite[];
  onClose: () => void;
  onSave: (data: Omit<LeaveRequest, 'id'>, id?: string) => Promise<void>;
  onDelete?: (leave: LeaveRequest) => void;
  onManageCoverage?: (leave: LeaveRequest) => void;
}

export function EditLeaveModal({
  isOpen,
  leave,
  defaultDates,
  employees,
  workSites = [],
  onClose,
  onSave,
  onDelete,
  onManageCoverage
}: EditLeaveModalProps) {
  if (!isOpen || !leave) return null;

  const isNew = leave === 'new';
  const existingLeave = isNew ? null : leave;

  const [employeeId, setEmployeeId] = useState<string>(existingLeave?.employeeId || '');
  const [type, setType] = useState<LeaveType>(existingLeave?.type || 'Ferie');
  const [startDate, setStartDate] = useState<string>(
    existingLeave?.startDate || defaultDates?.startDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    existingLeave?.endDate || defaultDates?.endDate || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>(existingLeave?.notes || '');
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>(
    existingLeave?.status || 'approved'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sincronizza stato se cambia l'assenza
  useEffect(() => {
    if (existingLeave) {
      setEmployeeId(existingLeave.employeeId || '');
      setType(existingLeave.type || 'Ferie');
      setStartDate(existingLeave.startDate || '');
      setEndDate(existingLeave.endDate || '');
      setNotes(existingLeave.notes || '');
      setStatus(existingLeave.status || 'approved');
    } else if (isNew) {
      setEmployeeId('');
      setType('Ferie');
      setStartDate(defaultDates?.startDate || new Date().toISOString().split('T')[0]);
      setEndDate(defaultDates?.endDate || new Date().toISOString().split('T')[0]);
      setNotes('');
      setStatus('approved');
    }
    setErrorMsg('');
  }, [leave, defaultDates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (type !== 'Annotazione' && !employeeId) {
      setErrorMsg('Seleziona un operatore per ferie, permessi o malattia.');
      return;
    }

    if (!startDate) {
      setErrorMsg('Specifica la data di inizio.');
      return;
    }

    if (!endDate) {
      setErrorMsg('Specifica la data di fine.');
      return;
    }

    if (endDate < startDate) {
      setErrorMsg('La data di fine non può essere precedente alla data di inizio.');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Omit<LeaveRequest, 'id'> = {
        employeeId: employeeId || undefined,
        type,
        startDate,
        endDate,
        notes: notes.trim(),
        status,
        coverageShifts: existingLeave?.coverageShifts || []
      };

      await onSave(payload, existingLeave?.id);
      onClose();
    } catch (err: any) {
      console.error('Errore salvataggio assenza:', err);
      setErrorMsg(err.message || 'Errore durante il salvataggio.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedEmployee = employees.find(e => e.id === employeeId);
  const coverageShiftsCount = existingLeave?.coverageShifts?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <CalendarIcon size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isNew ? 'Nuova Assenza / Annotazione' : (type === 'Annotazione' ? 'Modifica Annotazione' : 'Modifica Assenza')}
              </h3>
              <p className="text-xs text-amber-100 mt-0.5">
                {isNew ? 'Registra ferie, permessi, malattia o nota per la pianificazione' : 'Aggiorna operatore, periodo, motivo o coperture'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tipo Assenza */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
              Tipologia *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Ferie', 'Permesso', 'Malattia', 'Annotazione'] as LeaveType[]).map((t) => {
                const isSelected = type === t;
                const colors = {
                  Ferie: isSelected ? 'bg-sky-500 text-white border-sky-500 shadow-xs' : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100',
                  Permesso: isSelected ? 'bg-amber-500 text-white border-amber-500 shadow-xs' : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
                  Malattia: isSelected ? 'bg-rose-500 text-white border-rose-500 shadow-xs' : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100',
                  Annotazione: isSelected ? 'bg-purple-600 text-white border-purple-600 shadow-xs' : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                };
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold text-center transition-all ${colors[t]}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operatore */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Operatore {type !== 'Annotazione' && <span className="text-rose-500">*</span>}
              </label>
              {type === 'Annotazione' && (
                <span className="text-[11px] text-gray-500">Opzionale per annotazioni generiche</span>
              )}
            </div>
            <ModalEmployeeSelect
              value={employeeId}
              onChange={setEmployeeId}
              employees={employees}
              allowEmpty={type === 'Annotazione'}
              emptyLabel="Nessun operatore (Annotazione Generale)"
            />
          </div>

          {/* Date Inizio e Fine */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Data Inizio *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (!endDate || endDate < e.target.value) {
                    setEndDate(e.target.value);
                  }
                }}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Data Fine *
              </label>
              <input
                type="date"
                required
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
              />
            </div>
          </div>

          {/* Note / Dettagli */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
              Note / Dettagli {type === 'Annotazione' && !employeeId && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Es. Ferie estive approvate, visita medica ore 10:00, ecc..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white placeholder:text-gray-400"
            />
          </div>

          {/* Cantieri da Coprire Section (se assenza associata a operatore) */}
          {!isNew && existingLeave && employeeId && onManageCoverage && (
            <div className="pt-2 border-t border-gray-100">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-amber-700" />
                    <span className="font-bold text-xs text-amber-950">
                      Cantieri e Fasce Orarie da Coprire
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                    {coverageShiftsCount} {coverageShiftsCount === 1 ? 'cantiere' : 'cantieri'}
                  </span>
                </div>

                {coverageShiftsCount > 0 && (
                  <div className="space-y-1 py-1 max-h-24 overflow-y-auto">
                    {existingLeave.coverageShifts!.map((cs, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-white px-2 py-1 rounded border border-amber-200/50">
                        <span className="font-medium text-gray-800 truncate">• {cs.workSiteName}</span>
                        <span className="font-bold text-amber-900 shrink-0 ml-2">{cs.startTime}-{cs.endTime}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onManageCoverage(existingLeave);
                  }}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <Edit2 size={13} />
                  {coverageShiftsCount > 0 ? 'Modifica Cantieri da Coprire' : 'Assegna Cantieri da Coprire'}
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3 mt-4">
            {!isNew && existingLeave && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(existingLeave);
                }}
                className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-bold transition-colors border border-rose-200"
              >
                <Trash2 size={15} />
                Elimina
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {isSaving ? 'Salvataggio...' : (isNew ? 'Crea Assenza' : 'Salva Modifiche')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DeleteLeaveConfirmModal({
  isOpen,
  leave,
  employees,
  onClose,
  onConfirm
}: {
  isOpen: boolean;
  leave: LeaveRequest | null;
  employees: Employee[];
  onClose: () => void;
  onConfirm: (leave: LeaveRequest) => Promise<void>;
}) {
  if (!isOpen || !leave) return null;

  const [isDeleting, setIsDeleting] = useState(false);
  const emp = employees.find(e => e.id === leave.employeeId);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm(leave);
      onClose();
    } catch (err) {
      console.error('Errore durante cancellazione assenza:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 p-6 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="font-bold text-base text-gray-900 leading-tight">
              Elimina Assenza
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Sei sicuro di voler eliminare questa assenza? L'azione è irreversibile.
            </p>
          </div>
        </div>

        {/* Dettagli della richiesta */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-4 text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Operatore:</span>
            <span className="font-bold text-gray-900 truncate max-w-[200px]">
              {emp?.name || (leave.employeeId ? 'Operatore eliminato' : 'Annotazione Generica')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Tipologia:</span>
            <span className="font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
              {leave.type}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Periodo:</span>
            <span className="font-semibold text-gray-800">
              {formatDate(leave.startDate)} {leave.startDate !== leave.endDate && `➔ ${formatDate(leave.endDate)}`}
            </span>
          </div>
          {leave.notes && (
            <div className="pt-1.5 border-t border-slate-200 text-gray-600 italic">
              "{leave.notes}"
            </div>
          )}
          {leave.coverageShifts && leave.coverageShifts.length > 0 && (
            <div className="pt-1.5 border-t border-rose-100 text-rose-700 font-semibold text-[11px]">
              ⚠️ Verranno rimosse anche le relative {leave.coverageShifts.length} coperture cantieri impostate.
            </div>
          )}
        </div>

        {/* Bottoni */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            <Trash2 size={14} />
            {isDeleting ? 'Eliminazione...' : 'Elimina Definitivamente'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalEmployeeSelect({
  value,
  onChange,
  employees,
  allowEmpty = false,
  emptyLabel = "Nessun operatore"
}: {
  value: string;
  onChange: (val: string) => void;
  employees: Employee[];
  allowEmpty?: boolean;
  emptyLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sortedEmployees = [...employees].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sortedEmployees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    (e.city && e.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-amber-500 hover:border-gray-400 transition-colors shadow-2xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 truncate">
          <User size={15} className={selectedEmp ? "text-amber-600" : "text-gray-400"} />
          <span className={selectedEmp ? "font-bold text-gray-900 truncate" : "text-gray-400"}>
            {selectedEmp ? selectedEmp.name : (allowEmpty ? emptyLabel : "Seleziona operatore...")}
          </span>
          {selectedEmp?.type === 'jolly' && (
            <span className="text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
              Jolly
            </span>
          )}
        </div>
        <ChevronDown size={16} className="text-gray-400 shrink-0 ml-1" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-gray-100 bg-slate-50 flex items-center gap-2">
            <Search size={14} className="text-gray-400 shrink-0 ml-1" />
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Cerca operatore per nome o città..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent border-none text-xs focus:outline-none"
              onClick={e => e.stopPropagation()}
            />
          </div>

          <div className="max-h-52 overflow-y-auto p-1 divide-y divide-gray-50">
            {allowEmpty && (
              <div 
                className={`p-2 hover:bg-amber-50 cursor-pointer rounded-lg text-xs font-semibold flex items-center justify-between ${!value ? 'bg-amber-50 text-amber-900 font-bold' : 'text-gray-600'}`}
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
              >
                <span>{emptyLabel}</span>
                {!value && <Check size={14} className="text-amber-600" />}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-400">
                Nessun operatore trovato
              </div>
            ) : (
              filtered.map(emp => {
                const isSelected = emp.id === value;
                return (
                  <div 
                    key={emp.id}
                    className={`p-2 hover:bg-amber-50 cursor-pointer rounded-lg text-xs flex items-center justify-between transition-colors ${isSelected ? 'bg-amber-50 text-amber-900 font-bold' : 'text-gray-800'}`}
                    onClick={() => {
                      onChange(emp.id);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate">{emp.name}</span>
                      {emp.city && (
                        <span className="text-[10px] text-gray-400 font-normal">{emp.city}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {emp.type === 'jolly' && (
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                          Jolly
                        </span>
                      )}
                      {isSelected && <Check size={14} className="text-amber-600 shrink-0" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
