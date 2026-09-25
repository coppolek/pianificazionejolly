import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ScheduleEntry, LeaveRequest, CoverageShift, WorkSite } from '../types';
import { ChevronLeft, ChevronRight, X, Search, Building2, Calendar as CalendarIcon, FilterX, Scale, Route, Car, Info, MapPin, Clock, Plus, Trash2, Sparkles, Check, UserCheck } from 'lucide-react';
import { resolveCoordinates, calculateDrivingDistanceKm, estimateTravelMinutes, formatLocationName, calculateTripKmAndMinutes, getTripEstimateSync } from '../lib/geoUtils';
import { getWorkSiteLocationDetails } from '../lib/cantieriMap';

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
  const { isAdmin } = useAuth();
  const { employees, scheduleEntries, leaveRequests, deleteScheduleEntry, updateScheduleEntry, addScheduleEntry, updateEmployee, workSites, updateLeaveRequest, addLeaveRequest, assignments } = useAppContext();
  const [selectedLeaveForCoverage, setSelectedLeaveForCoverage] = useState<LeaveRequest | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterDate, setFilterDate] = useState('');
  const [filterWorkSite, setFilterWorkSite] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileDayIndex, setMobileDayIndex] = useState(() => { const day = new Date().getDay(); return day === 0 ? 6 : day - 1; });
  
  useEffect(() => {
    if (filterDate) {
      const selected = new Date(filterDate);
      const today = new Date();
      const getMonday = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff)).setHours(0,0,0,0);
      };
      const diffTime = getMonday(selected) - getMonday(today);
      const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
      setWeekOffset(diffWeeks);
    }
  }, [filterDate]);

  let weekDays = getWeekDays(weekOffset);
  if (filterDate) {
    weekDays = weekDays.filter(d => d.date === filterDate);
  }

  // Sincronizza in background eventuali interventi privi di chilometraggio per salvarli su database
  useEffect(() => {
    const missingKmEntries = scheduleEntries.filter(e => (!e.travelKm || e.travelKm === 0) && e.employeeId && e.taskDescription);
    if (missingKmEntries.length === 0) return;

    const timer = setTimeout(async () => {
      for (const entry of missingKmEntries.slice(0, 8)) {
        const emp = employees.find(em => em.id === entry.employeeId);
        if (!emp) continue;
        const matchedWs = workSites.find(ws => 
          ws.name.toUpperCase() === entry.taskDescription.toUpperCase() ||
          entry.taskDescription.toUpperCase().includes(ws.name.toUpperCase()) ||
          ws.name.toUpperCase().includes(entry.taskDescription.toUpperCase())
        );
        const trip = await calculateTripKmAndMinutes(emp, matchedWs || { name: entry.taskDescription });
        if (trip.travelKm > 0) {
          updateScheduleEntry(entry.id, {
            travelKm: trip.travelKm,
            travelTimeMinutes: trip.travelTimeMinutes,
            fromLocation: trip.fromLocation
          });
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [scheduleEntries, employees, workSites]);

  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [showFairnessModal, setShowFairnessModal] = useState(false);
  const [autoScheduleReport, setAutoScheduleReport] = useState<{
    assignedCount: number;
    totalKm: number;
    details: Array<{
      opName: string;
      shiftName: string;
      date: string;
      time: string;
      km: number;
      fromLocation: string;
      coveredOpName?: string;
    }>;
  } | null>(null);

  const [modalData, setModalData] = useState<{
    isEditing?: boolean;
    id?: string;
    employeeId: string;
    date: string;
    startTime?: string;
    endTime?: string;
    taskDescription?: string;
    hours?: number;
    travelKm?: number;
    travelTimeMinutes?: number;
    fromLocation?: string;
    coveredEmployeeId?: string;
    coveredEmployeeName?: string;
  } | null>(null);

  const formatHeaderDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const startDateStr = formatHeaderDate(weekDays[0].date);
  const endDateStr = formatHeaderDate(weekDays[weekDays.length - 1].date);
  
  const weekStart = weekDays[0].date;
  const weekEnd = weekDays[weekDays.length - 1].date;
  const rawWeeklyLeaves = (leaveRequests || []).filter(req => 
    req.startDate && req.endDate && req.startDate <= weekEnd && req.endDate >= weekStart
  ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());


  // Deduplicate leaves in case of accidental double imports
  const weeklyLeaves: any[] = [];
  const seenLeaves = new Set();
  for (const leave of rawWeeklyLeaves) {
    const key = `${leave.employeeId}-${leave.startDate}-${leave.endDate}-${leave.type}-${leave.notes}`;
    if (!seenLeaves.has(key)) {
      seenLeaves.add(key);
      weeklyLeaves.push(leave);
    }
  }

  const dayNamesEnglish: Record<number, string> = {
    0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday'
  };

  const shiftsToCover: Array<{
    id: string;
    date: string;
    dateLabel: string;
    workSiteName: string;
    startTime: string;
    endTime: string;
    missingReason: string;
    coveredEmployeeId?: string;
    coveredEmployeeName?: string;
  }> = [];

  weekDays.forEach(day => {
    const d = new Date(day.date);
    const dayOfWeek = dayNamesEnglish[d.getDay()];
    const leavesOnDate = weeklyLeaves.filter(l => l.startDate <= day.date && l.endDate >= day.date && l.type !== 'Annotazione');

    workSites.forEach(ws => {
      const dailyPlan = ws.weeklyPlan?.[dayOfWeek as keyof typeof ws.weeklyPlan];
      const shifts = dailyPlan?.shifts || [];
      
      shifts.forEach((shift, index) => {
        if (!shift.startTime || !shift.endTime) return;
        
        const assigned = shift.assignedOperators || [];
        let isMissing = false;
        let reason = '';
        let absentOpId: string | undefined = undefined;
        let absentOpName: string | undefined = undefined;
        
        if (assigned.length === 0) {
          isMissing = true;
          // Controlla se il cantiere ha operatori assegnati in assignments
          const genAssigned = (assignments || []).filter(a => a.workSiteId === ws.id).map(a => a.employeeId);
          const absentFromGen = genAssigned.map(id => employees.find(e => e.id === id)).filter(em => {
            if (!em) return false;
            return leavesOnDate.some(l => l.employeeId === em.id);
          });
          if (absentFromGen.length > 0) {
            absentOpName = absentFromGen.map(e => e!.name).join(', ');
            absentOpId = absentFromGen[0]!.id;
            reason = `Assente: ${absentOpName}`;
          } else if (genAssigned.length > 0) {
            const titolari = genAssigned.map(id => employees.find(e => e.id === id)).filter(Boolean);
            if (titolari.length > 0) {
              absentOpName = titolari.map(t => t!.name).join(', ');
              reason = `Titolari cantiere: ${absentOpName}`;
            } else {
              reason = 'Nessun op.';
            }
          } else {
            reason = 'Nessun op.';
          }
        } else {
          const absentOperators = assigned.filter(empId => leavesOnDate.some(l => l.employeeId === empId));
          if (absentOperators.length > 0) {
            isMissing = true;
            const absentEmps = absentOperators.map(empId => employees.find(e => e.id === empId)).filter(Boolean);
            absentOpName = absentEmps.map(e => e?.name).join(', ') || 'Sconosciuto';
            absentOpId = absentOperators[0];
            reason = `Assente: ${absentOpName}`;
          }
        }

        if (isMissing) {
          // Controlla se il turno è già stato coperto da un intervento (ScheduleEntry)
          // Consideriamo coperto se esiste un intervento nella stessa data, con lo stesso nome cantiere,
          // che copre approssimativamente quegli orari (margine di 30 minuti).
          const isCovered = scheduleEntries.some(entry => {
             if (entry.date !== day.date) return false;
             // Match del nome cantiere
             if (!entry.taskDescription.toUpperCase().includes(ws.name.toUpperCase())) return false;
             
             // Check orari
             const eStart = parseTime(entry.startTime);
             const eEnd = parseTime(entry.endTime);
             const sStart = parseTime(shift.startTime);
             const sEnd = parseTime(shift.endTime);
             
             // Considerato coperto se c'è un minimo di sovrapposizione o corrispondenza
             return (eStart <= sStart + 60 && eEnd >= sEnd - 60);
          });

          if (!isCovered) {
            shiftsToCover.push({
            id: `${ws.id}-${day.date}-${index}`,
            date: day.date,
            dateLabel: day.label,
            workSiteName: ws.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            missingReason: reason,
            coveredEmployeeId: absentOpId,
            coveredEmployeeName: absentOpName
          });
          }
        }
      });
    });

    // Aggiungi turni e cantieri configurati esplicitamente da coprire per le assenze di questa giornata
    leavesOnDate.forEach(leave => {
      if (leave.coverageShifts && leave.coverageShifts.length > 0) {
        const emp = employees.find(e => e.id === leave.employeeId);
        leave.coverageShifts.forEach((cs, cIdx) => {
          if (!cs.startTime || !cs.endTime || !cs.workSiteName) return;
          if (cs.date && cs.date !== day.date) return;
          if (cs.daysOfWeek && cs.daysOfWeek.length > 0 && !cs.daysOfWeek.includes(dayOfWeek)) return;

          // Verifica se è già coperto da un intervento ScheduleEntry
          const isCovered = scheduleEntries.some(entry => {
            if (entry.date !== day.date) return false;
            if (!entry.taskDescription.toUpperCase().includes(cs.workSiteName.toUpperCase()) &&
                !cs.workSiteName.toUpperCase().includes(entry.taskDescription.toUpperCase())) return false;
            const eStart = parseTime(entry.startTime);
            const eEnd = parseTime(entry.endTime);
            const sStart = parseTime(cs.startTime);
            const sEnd = parseTime(cs.endTime);
            return (eStart <= sStart + 60 && eEnd >= sEnd - 60);
          });

          // Evita duplicati con turni già in lista
          const alreadyInList = shiftsToCover.some(stc => 
            stc.date === day.date && 
            stc.workSiteName.toUpperCase() === cs.workSiteName.toUpperCase() &&
            stc.startTime === cs.startTime &&
            stc.endTime === cs.endTime
          );

          if (!isCovered && !alreadyInList) {
            shiftsToCover.push({
              id: `coverage-${leave.id}-${cs.id || cIdx}-${day.date}`,
              date: day.date,
              dateLabel: day.label,
              workSiteName: cs.workSiteName,
              startTime: cs.startTime,
              endTime: cs.endTime,
              missingReason: `Copertura: ${emp?.name || 'Operatore'} (${leave.type})`,
              coveredEmployeeId: leave.employeeId,
              coveredEmployeeName: emp?.name
            });
          }
        });
      }
    });
  });




  const handleAutoSchedule = async () => {
    if (shiftsToCover.length === 0) {
      toast.error("Nessun turno scoperto da pianificare");
      return;
    }

    const jollyEmployees = employees.filter(emp => !emp.type || emp.type === 'jolly');
    if (jollyEmployees.length === 0) {
      toast.error("Nessun operatore Jolly configurato");
      return;
    }

    setIsAutoScheduling(true);
    const assignedLog: Array<{
      opName: string;
      shiftName: string;
      date: string;
      time: string;
      km: number;
      fromLocation: string;
      coveredOpName?: string;
    }> = [];

    try {
      // 1. Pre-calcolo o geocoding delle basi degli operatori e dei cantieri
      const opBaseCoords: Record<string, { lat: number; lng: number } | null> = {};
      for (const op of jollyEmployees) {
        opBaseCoords[op.id] = await resolveCoordinates(op.address, op.city, op.province, op.lat, op.lng);
      }

      const siteCoordsCache: Record<string, { lat: number; lng: number } | null> = {};
      for (const ws of workSites) {
        siteCoordsCache[ws.id] = await resolveCoordinates(ws.address, ws.city, ws.province, ws.lat, ws.lng);
      }

      // 2. Ordinamento cronologico turni da coprire
      const pendingShifts = [...shiftsToCover].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return parseTime(a.startTime) - parseTime(b.startTime);
      });

      const localEntries = [...scheduleEntries];

      // 3. Monitoraggio dinamico del carico settimanale per garantire EQUITÀ tra i Jolly
      const opCumulativeKm: Record<string, number> = {};
      const opCumulativeHours: Record<string, number> = {};

      for (const op of jollyEmployees) {
        const thisWeekEntries = localEntries.filter(
          e => e.employeeId === op.id && e.date >= weekStart && e.date <= weekEnd
        );
        opCumulativeKm[op.id] = thisWeekEntries.reduce((sum, e) => sum + (e.travelKm || 0), 0);
        opCumulativeHours[op.id] = thisWeekEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
      }

      let totalAssignedKm = 0;

      for (const shift of pendingShifts) {
        const shiftStart = parseTime(shift.startTime);
        const shiftEnd = parseTime(shift.endTime);
        let shiftHours = (shiftEnd - shiftStart) / 60;
        if (shiftHours < 0) shiftHours += 24;

        // Cantiere target
        const targetWs = workSites.find(
          ws => ws.name.trim().toUpperCase() === shift.workSiteName.trim().toUpperCase()
        ) || workSites.find(
          ws => shift.workSiteName.toUpperCase().includes(ws.name.toUpperCase()) || ws.name.toUpperCase().includes(shift.workSiteName.toUpperCase())
        );

        let targetCoords: { lat: number; lng: number } | null = null;
        if (targetWs) {
          targetCoords = siteCoordsCache[targetWs.id] || null;
        }
        if (!targetCoords) {
          targetCoords = await resolveCoordinates(undefined, shift.workSiteName);
        }

        // Filtra operatori disponibili (nessuna assenza approvata)
        const eligibleOperators = jollyEmployees.filter(emp => {
          const hasLeave = leaveRequests.some(l => 
            l.employeeId === emp.id && 
            l.startDate <= shift.date && 
            l.endDate >= shift.date && 
            l.status === 'approved'
          );
          if (hasLeave) return false;

          const empDayEntries = localEntries.filter(e => e.employeeId === emp.id && e.date === shift.date);
          const hasDirectOverlap = empDayEntries.some(e => {
            const eStart = parseTime(e.startTime);
            const eEnd = parseTime(e.endTime);
            return (shiftStart < eEnd && shiftEnd > eStart);
          });
          return !hasDirectOverlap;
        });

        if (eligibleOperators.length === 0) continue;

        let bestOp: any = null;
        let bestScore = -Infinity;
        let bestTravelKm = 0;
        let bestFromLocation = 'Domicilio';
        let bestTravelMinutes = 0;

        for (const op of eligibleOperators) {
          const opDayEntries = localEntries
            .filter(e => e.employeeId === op.id && e.date === shift.date)
            .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

          // Trova il turno precedente e successivo nello stesso giorno
          const prevEntry = [...opDayEntries].reverse().find(e => parseTime(e.endTime) <= shiftStart);
          const succEntry = opDayEntries.find(e => parseTime(e.startTime) >= shiftEnd);

          let distanceKm = 0;
          let fromLoc = '';
          let travelTimeMin = 0;
          let travelFeasible = true;

          // Se l'operatore è già sul posto per un turno contiguo o nello stesso cantiere
          const isSameSite = opDayEntries.some(e => e.taskDescription.toUpperCase().includes(shift.workSiteName.toUpperCase()));

          if (isSameSite) {
            distanceKm = 0;
            fromLoc = 'Stesso Cantiere';
            travelTimeMin = 0;
          } else if (prevEntry) {
            // Arriva dal cantiere precedente
            const prevWs = workSites.find(ws => prevEntry.taskDescription.toUpperCase().includes(ws.name.toUpperCase()));
            const prevCoords = prevWs ? siteCoordsCache[prevWs.id] : null;

            if (prevCoords && targetCoords) {
              distanceKm = calculateDrivingDistanceKm(prevCoords, targetCoords);
            } else {
              distanceKm = 12; // Stima media urbana in assenza di coordinate
            }
            fromLoc = prevWs ? prevWs.name : prevEntry.taskDescription;
            travelTimeMin = estimateTravelMinutes(distanceKm);

            // Verifica tempo di viaggio tra fine turno precedente e inizio nuovo turno
            const availableGapMin = shiftStart - parseTime(prevEntry.endTime);
            if (availableGapMin < travelTimeMin) {
              travelFeasible = false;
            }
          } else {
            // Primo turno del giorno: parte dal domicilio/base
            const baseCoords = opBaseCoords[op.id];
            if (baseCoords && targetCoords) {
              distanceKm = calculateDrivingDistanceKm(baseCoords, targetCoords);
            } else {
              distanceKm = 15; // Stima media di percorrenza
            }
            fromLoc = op.city ? `${op.city} (Domicilio)` : 'Domicilio';
            travelTimeMin = estimateTravelMinutes(distanceKm);
          }

          // Se c'è un turno successivo, verifica che abbia tempo per raggiungerlo
          if (succEntry && travelFeasible) {
            const succWs = workSites.find(ws => succEntry.taskDescription.toUpperCase().includes(ws.name.toUpperCase()));
            const succCoords = succWs ? siteCoordsCache[succWs.id] : null;
            let toSuccKm = 12;
            if (targetCoords && succCoords) {
              toSuccKm = calculateDrivingDistanceKm(targetCoords, succCoords);
            }
            const timeToSuccMin = estimateTravelMinutes(toSuccKm);
            const gapToSucc = parseTime(succEntry.startTime) - shiftEnd;
            if (gapToSucc < timeToSuccMin) {
              travelFeasible = false;
            }
          }

          // Se non è fisicamente raggiungibile con i tempi di viaggio, salta
          if (!travelFeasible) {
            continue;
          }

          // ----------------------------------------------------
          // ALGORITMO DI ASSEGNAZIONE EQUA DEL CARICO E DELLE DISTANZE
          // ----------------------------------------------------
          let score = 1000;

          // 1. Preferenza per tragitto più breve per questo turno (efficienza chilometrica)
          score -= (distanceKm * 1.5);

          // 2. EQUITÀ CHILOMETRICA (FONDAMENTALE):
          // Penalizza fortemente gli operatori che hanno già percorso più km nella settimana corrente,
          // favorendo automaticamente chi ha percorso meno chilometri per equilibrare il carico!
          const currentWeekKm = opCumulativeKm[op.id] || 0;
          score -= (currentWeekKm * 4.0);

          // 3. EQUITÀ DELLE ORE DI LAVORO SETTIMANALI:
          const currentWeekHours = opCumulativeHours[op.id] || 0;
          score -= (currentWeekHours * 8.0);

          // 4. EQUITÀ DEL CARICO GIORNALIERO:
          const dayHours = opDayEntries.reduce((sum, e) => sum + e.hours, 0);
          score -= (dayHours * 20.0);

          // 5. BONUS CONTINUITÀ STESSO CANTIERE (evita spostamenti inutili)
          if (isSameSite) {
            score += 150;
          }

          if (score > bestScore) {
            bestScore = score;
            bestOp = op;
            bestTravelKm = distanceKm;
            bestFromLocation = fromLoc;
            bestTravelMinutes = travelTimeMin;
          }
        }

        if (bestOp) {
          const newEntry: Omit<ScheduleEntry, 'id'> = {
            employeeId: bestOp.id,
            date: shift.date,
            startTime: shift.startTime,
            endTime: shift.endTime,
            taskDescription: shift.workSiteName,
            hours: shiftHours,
            travelKm: bestTravelKm,
            fromLocation: bestFromLocation,
            travelTimeMinutes: bestTravelMinutes,
            ...(shift.coveredEmployeeId ? { coveredEmployeeId: shift.coveredEmployeeId } : {}),
            ...(shift.coveredEmployeeName ? { coveredEmployeeName: shift.coveredEmployeeName } : {})
          };

          await addScheduleEntry(newEntry);
          localEntries.push({ ...newEntry, id: Math.random().toString() });

          opCumulativeKm[bestOp.id] = (opCumulativeKm[bestOp.id] || 0) + bestTravelKm;
          opCumulativeHours[bestOp.id] = (opCumulativeHours[bestOp.id] || 0) + shiftHours;
          totalAssignedKm += bestTravelKm;

          assignedLog.push({
            opName: bestOp.name,
            shiftName: shift.workSiteName,
            date: shift.date,
            time: `${shift.startTime} - ${shift.endTime}`,
            km: bestTravelKm,
            fromLocation: bestFromLocation,
            coveredOpName: shift.coveredEmployeeName
          });
        }
      }

      if (assignedLog.length > 0) {
        setAutoScheduleReport({
          assignedCount: assignedLog.length,
          totalKm: Math.round(totalAssignedKm * 10) / 10,
          details: assignedLog
        });
        toast.success(
          `Pianificazione equa completata: ${assignedLog.length} turni assegnati (~${Math.round(totalAssignedKm)} km totali distribuiti equamente).`,
          { duration: 5000 }
        );
      } else {
        toast("Nessun turno scoperto è stato possibile assegnare (conflitti orari o assenze).", { icon: 'ℹ️' });
      }
    } catch (err: any) {
      toast.error("Errore durante l'elaborazione dei piani: " + (err.message || 'Errore imprevisto'));
    } finally {
      setIsAutoScheduling(false);
    }
  };

  return (
    <div className="max-w-full pb-20">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Planning settimanale</h2>
          <p className="text-gray-500 text-sm mt-1">Interventi per operatore, giorno e cantiere</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFairnessModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200 transition-colors shadow-sm"
            title="Analisi percorsi e bilanciamento equo tra i Jolly"
          >
            <Scale size={16} />
            <span>Bilanciamento Percorsi & Equità</span>
          </button>
          <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm h-10 w-full md:w-auto justify-between shrink-0">
            <button 
              onClick={() => { setFilterDate(''); setWeekOffset(prev => prev - 1); }}
              className="px-3 h-full flex items-center hover:bg-gray-50 border-r border-gray-200 text-gray-600 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-medium text-sm px-6 text-gray-800">
              {startDateStr} – {endDateStr}
            </span>
            <button 
              onClick={() => { setFilterDate(''); setWeekOffset(prev => prev + 1); }}
              className="px-3 h-full flex items-center hover:bg-gray-50 border-l border-gray-200 text-gray-600 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-8">
        <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input 
             type="text" 
             placeholder="Cerca operatore o cantiere..." 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e5b99] focus:outline-none"
           />
        </div>
        <div className="relative flex-1 md:max-w-xs">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <select 
             value={filterWorkSite}
             onChange={e => setFilterWorkSite(e.target.value)}
             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e5b99] focus:outline-none appearance-none"
           >
              <option value="all">Tutti i cantieri</option>
              {workSites.map(ws => (
                <option key={ws.id} value={ws.name}>{ws.name}</option>
              ))}
           </select>
        </div>
        <div className="relative flex-1 md:max-w-xs">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input 
             type="date" 
             value={filterDate}
             onChange={e => setFilterDate(e.target.value)}
             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e5b99] focus:outline-none"
           />
        </div>
        {(searchTerm || filterWorkSite !== 'all' || filterDate) && (
          <button 
            onClick={() => { setSearchTerm(''); setFilterWorkSite('all'); setFilterDate(''); }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors shrink-0"
          >
            <FilterX size={16} />
            Reset Filtri
          </button>
        )}
      </div>

      <div className="overflow-x-auto pb-4">

      {modalData && (
        <AddScheduleModal 
          initialData={modalData} 
          onClose={() => setModalData(null)} 
          weekDays={weekDays} 
        />
      )}

      {showFairnessModal && (
        <FairnessModal 
          isOpen={showFairnessModal}
          onClose={() => setShowFairnessModal(false)}
          jollyEmployees={employees.filter(emp => !emp.type || emp.type === 'jolly')}
          entriesThisWeek={scheduleEntries.filter(e => e.date >= weekStart && e.date <= weekEnd)}
          workSites={workSites}
          onRunAutoSchedule={() => {
            setShowFairnessModal(false);
            handleAutoSchedule();
          }}
          isAutoScheduling={isAutoScheduling}
          shiftsToCoverCount={shiftsToCover.length}
        />
      )}

      {autoScheduleReport && (
        <AutoScheduleReportModal 
          report={autoScheduleReport}
          onClose={() => setAutoScheduleReport(null)}
        />
      )}

      {selectedLeaveForCoverage && (
        <AssignLeaveCoverageModal
          leave={selectedLeaveForCoverage}
          employee={employees.find(e => e.id === selectedLeaveForCoverage.employeeId)}
          workSites={workSites}
          assignments={assignments || []}
          weekDays={weekDays}
          onClose={() => setSelectedLeaveForCoverage(null)}
          onSave={async (shifts) => {
            if (selectedLeaveForCoverage.id) {
              await updateLeaveRequest(selectedLeaveForCoverage.id, { coverageShifts: shifts });
            } else {
              await addLeaveRequest({
                employeeId: selectedLeaveForCoverage.employeeId,
                type: selectedLeaveForCoverage.type || 'Ferie',
                startDate: selectedLeaveForCoverage.startDate,
                endDate: selectedLeaveForCoverage.endDate,
                status: 'approved',
                coverageShifts: shifts
              });
            }
          }}
        />
      )}

            {/* Mobile Day Navigation */}
      <div className="md:hidden flex items-center justify-between bg-white border border-[#c2dcf3] rounded-lg shadow-sm h-12 mb-6">
        <button 
          onClick={() => setMobileDayIndex(prev => prev > 0 ? prev - 1 : 6)}
          className="px-4 h-full flex items-center hover:bg-[#f4f9ff] border-r border-[#c2dcf3] text-[#1e5b99] transition-colors rounded-l-lg"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-[#1e5b99] uppercase tracking-wide text-sm">
          {weekDays[mobileDayIndex]?.label}
        </span>
        <button 
          onClick={() => setMobileDayIndex(prev => prev < 6 ? prev + 1 : 0)}
          className="px-4 h-full flex items-center hover:bg-[#f4f9ff] border-l border-[#c2dcf3] text-[#1e5b99] transition-colors rounded-r-lg"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="space-y-8 min-w-full md:min-w-[1200px]">
        {employees.filter(emp => !emp.type || emp.type === 'jolly').filter(emp => {
          if (!searchTerm.trim() && filterWorkSite === 'all') return true;
          const searchLower = searchTerm.trim().toLowerCase();
          const matchNameOrCity = !searchLower || 
            emp.name.toLowerCase().includes(searchLower) || 
            (emp.city && emp.city.toLowerCase().includes(searchLower));
          
          const thisWeekEntries = scheduleEntries.filter(e => 
            e.employeeId === emp.id && weekDays.some(d => d.date === e.date)
          );
          const matchEntries = thisWeekEntries.some(e => {
            const matchSite = filterWorkSite === 'all' || e.taskDescription.toUpperCase().includes(filterWorkSite.toUpperCase());
            const matchSearch = !searchLower || e.taskDescription.toLowerCase().includes(searchLower);
            return matchSite && matchSearch;
          });

          if (filterWorkSite !== 'all') return matchEntries;
          return matchNameOrCity || matchEntries;
        }).map(emp => (
          <EmployeeScheduleBlock isAdmin={isAdmin} 
            key={emp.id} 
            employee={emp} 
            weekDays={weekDays} 
            entries={scheduleEntries.filter(e => 
              e.employeeId === emp.id && 
              weekDays.some(d => d.date === e.date) &&
              (filterWorkSite === 'all' || e.taskDescription.toUpperCase().includes(filterWorkSite.toUpperCase()))
            )}
            mobileDayIndex={mobileDayIndex}
            onDelete={deleteScheduleEntry}
            onUpdate={(id, name) => updateEmployee(id, { name })}
            onDropEntry={async (entryId, date, targetEmployeeId) => {
              const currentEntry = scheduleEntries.find(e => e.id === entryId);
              if (!currentEntry) return;

              // Se l'operatore cambia, ricalcoliamo la distanza e tempo di guida
              if (targetEmployeeId && targetEmployeeId !== currentEntry.employeeId) {
                const targetEmp = employees.find(e => e.id === targetEmployeeId);
                const matchedWs = workSites.find(ws => 
                  ws.name.toUpperCase() === currentEntry.taskDescription.toUpperCase() ||
                  currentEntry.taskDescription.toUpperCase().includes(ws.name.toUpperCase()) ||
                  ws.name.toUpperCase().includes(currentEntry.taskDescription.toUpperCase())
                );
                
                if (targetEmp && matchedWs) {
                  const { travelKm, travelTimeMinutes, fromLocation } = await calculateTripKmAndMinutes(targetEmp, matchedWs);
                  updateScheduleEntry(entryId, { 
                    date, 
                    employeeId: targetEmployeeId,
                    travelKm,
                    travelTimeMinutes,
                    fromLocation
                  });
                  return;
                }
              }

              updateScheduleEntry(entryId, { date, employeeId: targetEmployeeId });
            }}
            onDropNew={async (shiftData, date, employeeId) => {
              let hours = 0;
              const start = parseTime(shiftData.startTime);
              const end = parseTime(shiftData.endTime);
              if (start !== null && end !== null) {
                hours = (end - start) / 60;
                if (hours < 0) hours += 24;
              }
              hours = Math.round(hours * 100) / 100;

              // Calcola km per il turno trascinato sul jolly
              const targetEmp = employees.find(e => e.id === employeeId);
              const matchedWs = workSites.find(ws => 
                ws.name.toUpperCase() === (shiftData.workSiteName || '').toUpperCase() ||
                (shiftData.workSiteName || '').toUpperCase().includes(ws.name.toUpperCase()) ||
                ws.name.toUpperCase().includes((shiftData.workSiteName || '').toUpperCase())
              );

              let travelKm = 0;
              let travelTimeMinutes = 0;
              let fromLocation = '';
              if (targetEmp && matchedWs) {
                const trip = await calculateTripKmAndMinutes(targetEmp, matchedWs);
                travelKm = trip.travelKm;
                travelTimeMinutes = trip.travelTimeMinutes;
                fromLocation = trip.fromLocation;
              }

              setModalData({
                employeeId,
                date,
                startTime: shiftData.startTime,
                endTime: shiftData.endTime,
                taskDescription: shiftData.workSiteName,
                hours: hours > 0 ? hours : undefined,
                travelKm: travelKm > 0 ? travelKm : undefined,
                travelTimeMinutes: travelTimeMinutes > 0 ? travelTimeMinutes : undefined,
                fromLocation: fromLocation || undefined,
                coveredEmployeeId: shiftData.coveredEmployeeId || undefined,
                coveredEmployeeName: shiftData.coveredEmployeeName || undefined
              });
            }}
            onEdit={(entry) => {
              const coveredName = entry.coveredEmployeeName || (
                entry.coveredEmployeeId ? employees.find(em => em.id === entry.coveredEmployeeId)?.name : undefined
              );
              setModalData({ 
                ...entry, 
                coveredEmployeeName: coveredName || entry.coveredEmployeeName,
                isEditing: true 
              });
            }}
            onAdd={(date) => setModalData({ employeeId: emp.id, date })}
            onAssignCoverage={(leave) => {
              if (leave) {
                setSelectedLeaveForCoverage(leave);
              } else {
                setSelectedLeaveForCoverage({
                  id: '',
                  employeeId: emp.id,
                  type: 'Ferie',
                  startDate: weekDays[0].date,
                  endDate: weekDays[weekDays.length - 1].date,
                  status: 'approved',
                  coverageShifts: []
                });
              }
            }}
          />
        ))}

        {/* Blocco Virtuale Coperture Operatori Ordinari */}
        <EmployeeScheduleBlock 
          isAdmin={isAdmin}
          mobileDayIndex={mobileDayIndex}
          employee={{ id: 'ordinari', name: 'COPERTURE OPERATORI ORDINARI', isVirtual: true }}
          weekDays={weekDays}
          entries={scheduleEntries.filter(e => 
            e.employeeId === 'ordinari' && 
            weekDays.some(d => d.date === e.date) &&
            (filterWorkSite === 'all' || e.taskDescription.toUpperCase().includes(filterWorkSite.toUpperCase()))
          )}
          onDelete={deleteScheduleEntry}
          onUpdate={() => {}}
          onDropEntry={(entryId, date) => updateScheduleEntry(entryId, { date, employeeId: 'ordinari' })}
          onDropNew={(shiftData, date) => {
            let hours = 0;
            const start = parseTime(shiftData.startTime);
            const end = parseTime(shiftData.endTime);
            if (start !== null && end !== null) {
              hours = (end - start) / 60;
              if (hours < 0) hours += 24;
            }
            hours = Math.round(hours * 100) / 100;
            setModalData({
              employeeId: 'ordinari',
              date,
              startTime: shiftData.startTime,
              endTime: shiftData.endTime,
              taskDescription: shiftData.workSiteName,
              hours: hours > 0 ? hours : undefined,
              coveredEmployeeId: shiftData.coveredEmployeeId || undefined,
              coveredEmployeeName: shiftData.coveredEmployeeName || undefined
            });
          }}
          onEdit={(entry) => {
            const coveredName = entry.coveredEmployeeName || (
              entry.coveredEmployeeId ? employees.find(em => em.id === entry.coveredEmployeeId)?.name : undefined
            );
            setModalData({ 
              ...entry, 
              coveredEmployeeName: coveredName || entry.coveredEmployeeName,
              isEditing: true 
            });
          }}
          onAdd={(date) => setModalData({ employeeId: 'ordinari', date })}
        />
        {employees.filter(emp => !emp.type || emp.type === 'jolly').length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
            Nessun operatore Jolly in anagrafica.
          </div>
        )}
      </div>

      </div>
      </div>

      {(weeklyLeaves.length > 0 || shiftsToCover.length > 0) && (
        <div className="mt-8 flex flex-col gap-8 w-full">
          
          <div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-rose-400 rounded-sm inline-block"></span>
                Turni da Coprire ({shiftsToCover.length})
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowFairnessModal(true)}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold py-1.5 px-3 rounded shadow-sm transition-colors flex items-center gap-1.5"
                  title="Analisi percorsi e bilanciamento equo tra i Jolly"
                >
                  <Scale size={14} className="text-indigo-600" />
                  Bilanciamento Equo
                </button>
                <button 
                  onClick={handleAutoSchedule}
                  disabled={isAutoScheduling || shiftsToCover.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold py-1.5 px-3 rounded shadow-sm transition-colors flex items-center gap-2"
                >
                  <Route size={14} />
                  {isAutoScheduling ? 'Calcolo Distanze & Equità...' : 'Pianificazione Automatica Equa'}
                </button>
              </div>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full content-start">
              {shiftsToCover.length === 0 && <span className="text-sm text-rose-600">Nessun turno scoperto</span>}
              {shiftsToCover.map(shift => (
                <div 
                  key={shift.id} 
                  className="bg-white p-3 rounded-lg shadow-sm border border-rose-100 flex flex-col cursor-move hover:shadow-md transition-shadow active:cursor-grabbing"
                  draggable
                  onDragStart={(ev) => {
                    const data = {
                      type: 'NEW_SHIFT',
                      workSiteName: shift.workSiteName,
                      startTime: shift.startTime,
                      endTime: shift.endTime,
                      coveredEmployeeId: shift.coveredEmployeeId,
                      coveredEmployeeName: shift.coveredEmployeeName
                    };
                    ev.dataTransfer.setData('application/json', JSON.stringify(data));
                  }}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <span className="font-bold text-sm text-gray-900 truncate min-w-0 flex-1" title={shift.workSiteName}>
                      {shift.workSiteName}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 shrink-0">
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-700 mb-1 truncate min-w-0">{shift.dateLabel}</div>
                  {(() => {
                    const loc = getWorkSiteLocationDetails(shift.workSiteName, workSites);
                    if (!loc.address) return null;
                    return (
                      <div className="text-[11px] text-gray-500 mb-1.5 truncate flex items-center gap-1" title={`Indirizzo: ${loc.fullLocation}`}>
                        <MapPin size={11} className="shrink-0 text-rose-400" />
                        <span className="truncate">{loc.address} {loc.city ? `(${loc.city})` : ''}</span>
                      </div>
                    );
                  })()}
                  {shift.coveredEmployeeName && (
                    <div className="text-[11px] font-bold text-amber-950 bg-amber-100/90 px-2 py-1 rounded mb-1.5 border border-amber-300 flex items-center gap-1">
                      <UserCheck size={12} className="text-amber-800 shrink-0" />
                      <span className="truncate">Copre: <strong className="uppercase text-amber-900">{shift.coveredEmployeeName}</strong></span>
                    </div>
                  )}
                  <div className="text-xs text-rose-700 bg-rose-50/50 px-2 py-1.5 rounded mt-auto border border-rose-100/50 font-medium break-words whitespace-normal">
                    {shift.missingReason}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-6 bg-amber-400 rounded-sm inline-block"></span>
              Assenze e Annotazioni della Settimana
            </h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full content-start">
              {weeklyLeaves.length === 0 && <span className="text-sm text-amber-600">Nessuna assenza per questa settimana</span>}
              {weeklyLeaves.map(leave => {
                const emp = employees.find(e => e.id === leave.employeeId);
                const isSingleDay = leave.startDate === leave.endDate;
                const dateStr = isSingleDay 
                  ? formatHeaderDate(leave.startDate) 
                  : `${formatHeaderDate(leave.startDate)} - ${formatHeaderDate(leave.endDate)}`;
                const hasCoverage = leave.coverageShifts && leave.coverageShifts.length > 0;
                
                return (
                  <div 
                    key={leave.id} 
                    onClick={() => {
                      if (leave.employeeId) {
                        setSelectedLeaveForCoverage(leave);
                      }
                    }}
                    className="bg-white p-3.5 rounded-xl shadow-xs border border-amber-200/90 hover:border-amber-400 flex flex-col min-h-[110px] cursor-pointer hover:shadow-md transition-all group relative"
                    title="Clicca sull'operatore per assegnare i cantieri e le fasce orarie da coprire"
                    draggable
                    onDragStart={(ev) => {
                      const data = {
                        type: 'NEW_SHIFT',
                        workSiteName: leave.notes ? `${leave.type}: ${leave.notes}` : leave.type,
                        startTime: '',
                        endTime: ''
                      };
                      ev.dataTransfer.setData('application/json', JSON.stringify(data));
                    }}
                  >
                    <div className="flex justify-between items-start mb-1.5 gap-2">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-sm text-gray-900 truncate group-hover:text-amber-900 transition-colors" title={emp?.name || 'Annotazione Generica'}>
                          {emp?.name || (leave.employeeId ? 'Operatore eliminato' : 'Annotazione Generica')}
                        </span>
                        {emp?.city && (
                          <span className="text-[11px] text-gray-500 font-normal flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-gray-400" />
                            {emp.city}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                        {leave.type}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 mb-2 truncate font-medium flex items-center gap-1.5">
                      <CalendarIcon size={12} className="text-amber-500 shrink-0" />
                      <span>{dateStr}</span>
                    </div>

                    {/* Badge e Anteprima Cantieri e Orari Assegnati da Coprire */}
                    {leave.employeeId && (
                      <div className="mt-auto pt-2 border-t border-amber-100/70">
                        {hasCoverage ? (
                          <div className="space-y-1 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60">
                            <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
                              <span className="flex items-center gap-1">
                                <Building2 size={12} className="text-amber-700 shrink-0" />
                                {leave.coverageShifts!.length} {leave.coverageShifts!.length === 1 ? 'cantiere da coprire' : 'cantieri da coprire'}
                              </span>
                              <span className="text-[10px] text-indigo-700 font-semibold group-hover:underline">Modifica ➔</span>
                            </div>
                            <div className="space-y-0.5 pt-0.5">
                              {leave.coverageShifts!.slice(0, 2).map((cs: CoverageShift, idx: number) => (
                                <div key={idx} className="text-[10px] text-gray-700 flex items-center justify-between font-medium">
                                  <span className="truncate pr-1">• {cs.workSiteName}</span>
                                  <span className="text-gray-900 font-semibold shrink-0">{cs.startTime}-{cs.endTime}</span>
                                </div>
                              ))}
                              {leave.coverageShifts!.length > 2 && (
                                <div className="text-[9.5px] text-amber-800 font-semibold italic">
                                  +{leave.coverageShifts!.length - 2} altri cantieri...
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-amber-50 hover:bg-amber-100/80 p-2 rounded-lg border border-dashed border-amber-300 text-amber-900 text-xs font-semibold transition-colors">
                            <span className="flex items-center gap-1.5">
                              <Plus size={13} className="text-amber-600" />
                              Assegna cantieri e orari da coprire
                            </span>
                            <span className="text-amber-700 text-[10px]">➔</span>
                          </div>
                        )}
                      </div>
                    )}

                    {leave.notes && (
                      <div className="text-[11px] text-gray-700 bg-white/80 p-1.5 rounded mt-2 border border-amber-200/40 break-words whitespace-normal">
                        {leave.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function EmployeeScheduleBlock({ 
  isAdmin, mobileDayIndex, employee, weekDays, entries, onDelete, onUpdate, onAdd, onEdit, onDropEntry, onDropNew, onAssignCoverage 
}: { isAdmin?: boolean; mobileDayIndex: number; 
  key?: React.Key, employee: any, weekDays: any[], entries: ScheduleEntry[], onDelete: (id: string) => void, onUpdate: (id: string, name: string) => void, onAdd: (date: string) => void, onEdit: (entry: ScheduleEntry) => void, onDropEntry: (entryId: string, date: string, employeeId: string) => void, onDropNew: (shiftData: any, date: string, employeeId: string) => void, onAssignCoverage?: (leave: any) => void
}) {
  const { workSites, leaveRequests } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(employee.name);

  const activeLeave = !employee.isVirtual ? (leaveRequests || []).find(l => 
    l.employeeId === employee.id && 
    l.startDate <= weekDays[weekDays.length - 1].date && 
    l.endDate >= weekDays[0].date &&
    l.type !== 'Annotazione'
  ) : null;

  const getEntryKm = (e: ScheduleEntry) => {
    if (e.travelKm !== undefined && e.travelKm > 0) return e.travelKm;
    const matchedWs = workSites.find(ws => 
      ws.name.toUpperCase() === e.taskDescription.toUpperCase() ||
      e.taskDescription.toUpperCase().includes(ws.name.toUpperCase()) ||
      ws.name.toUpperCase().includes(e.taskDescription.toUpperCase())
    );
    const est = getTripEstimateSync(employee, matchedWs || { name: e.taskDescription });
    return est.travelKm;
  };

  const weekTotal = Math.round(entries.reduce((acc, e) => acc + (Number(e.hours) || 0), 0) * 100) / 100;
  const weekKm = Math.round(entries.reduce((acc, e) => acc + (getEntryKm(e) || 0), 0) * 10) / 10;

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
      <div className={`${employee.isVirtual ? 'bg-indigo-300 text-indigo-950' : 'bg-[#86d97e] text-gray-900'} px-4 py-2.5 flex justify-between items-center border-b border-gray-300`}>
        {isEditing && !employee.isVirtual ? (
          <input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="text-gray-900 bg-white/80 px-2 py-0.5 rounded text-sm font-bold uppercase w-48 outline-none focus:ring-2 focus:ring-gray-400"
          />
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              className={`font-bold tracking-wide uppercase text-sm ${employee.isVirtual ? '' : 'cursor-pointer hover:bg-black/5'} px-2 py-0.5 -ml-2 rounded transition-colors`} 
              title={employee.isVirtual ? '' : "Clicca per modificare nome"}
              onClick={() => { if (!employee.isVirtual) { setIsEditing(true); setEditedName(employee.name); } }}
            >
              {employee.name}
            </span>
            {employee.city && (
              <span className="text-[11px] font-normal text-gray-700 bg-black/5 px-2 py-0.5 rounded-full flex items-center gap-1" title={`Domicilio: ${employee.address || ''} ${employee.city} (${employee.province || ''})`}>
                <MapPin size={11} className="text-gray-500" />
                {employee.city}
              </span>
            )}
            {activeLeave && onAssignCoverage && (
              <button
                type="button"
                onClick={() => onAssignCoverage(activeLeave)}
                className="text-[11px] font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer shadow-2xs ml-1"
                title={`Assenza attiva (${activeLeave.type}): Clicca per assegnare i cantieri e le fasce orarie da coprire`}
              >
                <CalendarIcon size={11} className="text-amber-700" />
                <span>Assenza: {activeLeave.type}</span>
                <span className="text-[9.5px] bg-amber-600 text-white px-1.5 py-0.2 rounded-full font-bold">Coperture ➔</span>
              </button>
            )}
            {!employee.isVirtual && !activeLeave && onAssignCoverage && (
              <button
                type="button"
                onClick={() => onAssignCoverage(null)}
                className="text-[10.5px] font-medium text-gray-700 hover:text-gray-900 bg-black/5 hover:bg-black/10 px-2 py-0.5 rounded transition-colors hidden sm:flex items-center gap-1 cursor-pointer"
                title="Assegna cantieri e orari che dovranno essere coperti per questo operatore"
              >
                <Building2 size={11} className="text-gray-600" />
                <span>Assegna Coperture</span>
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-3">
          {weekKm > 0 && (
            <span className="text-xs bg-black/10 text-gray-900 px-2.5 py-0.5 rounded font-semibold flex items-center gap-1" title="Chilometri di trasferimento stimati nella settimana">
              <Car size={13} className="text-gray-700" />
              ~{Math.round(weekKm * 10) / 10} km
            </span>
          )}
          <span className="text-sm font-medium opacity-90">Totale: {weekTotal} ore</span>
        </div>
      </div>
      <div className="flex flex-1">
        {weekDays.map((day, idx) => (
          <div key={day.date} className={`flex-1 flex-col ${idx !== mobileDayIndex ? 'hidden md:flex' : 'flex'} ${idx !== 6 ? 'md:border-r border-gray-200' : ''}`}>
          <DayColumn 
            key={day.date} 
            day={day} 
            employeeId={employee.id}
            entries={entries.filter(e => e.date === day.date)}
            onDelete={onDelete}
            onAdd={() => onAdd(day.date)}
            onEdit={onEdit}
            onDropEntry={onDropEntry}
            onDropNew={onDropNew}
            isLast={true}
          />
          </div>
        ))}
      </div>
    </div>
  );
}

function DayColumn({ 
  day, employeeId, isLast, entries, onDelete, onAdd, onEdit, onDropEntry, onDropNew
}: { 
  key?: React.Key, day: any, employeeId: string, isLast: boolean, entries: ScheduleEntry[], onDelete: (id: string) => void, onAdd: () => void, onEdit: (entry: ScheduleEntry) => void, onDropEntry: (entryId: string, date: string, employeeId: string) => void, onDropNew: (shiftData: any, date: string, employeeId: string) => void
}) {
  const { scheduleEntries, workSites, employees, assignments, leaveRequests } = useAppContext();
  const currentEmp = employees.find(emp => emp.id === employeeId);

  const getCoveredOperatorName = (e: ScheduleEntry) => {
    // 1. Se già salvato esplicitamente nell'intervento
    if (e.coveredEmployeeName) return e.coveredEmployeeName;
    if (e.coveredEmployeeId) {
      const emp = employees.find(em => em.id === e.coveredEmployeeId);
      if (emp) return emp.name;
    }

    // 2. Risoluzione intelligente per cantiere e assenza/assegnazione
    const cleanSite = (e.taskDescription || '').trim().toUpperCase();
    if (!cleanSite) return null;

    // Cerca se esiste un'assenza registrata in questa data per un cantiere che corrisponde
    const matchingLeave = (leaveRequests || []).find(l => 
      l.startDate <= day.date && 
      l.endDate >= day.date && 
      l.type !== 'Annotazione' &&
      l.employeeId !== employeeId &&
      l.coverageShifts?.some(cs => 
        cs.workSiteName.toUpperCase() === cleanSite ||
        cleanSite.includes(cs.workSiteName.toUpperCase()) ||
        cs.workSiteName.toUpperCase().includes(cleanSite)
      )
    );
    if (matchingLeave?.employeeId) {
      const emp = employees.find(em => em.id === matchingLeave.employeeId);
      if (emp) return emp.name;
    }

    // Cerca nell'anagrafica del cantiere
    const matchedWs = workSites.find(ws => 
      ws.name.toUpperCase() === cleanSite ||
      cleanSite.includes(ws.name.toUpperCase()) ||
      ws.name.toUpperCase().includes(cleanSite)
    );

    if (matchedWs) {
      const d = new Date(day.date);
      const dayNamesEnglish: Record<number, string> = {
        0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday'
      };
      const dayOfWeek = dayNamesEnglish[d.getDay()];
      const dailyPlan = matchedWs.weeklyPlan?.[dayOfWeek as keyof typeof matchedWs.weeklyPlan];

      const sStart = parseTime(e.startTime);
      const sEnd = parseTime(e.endTime);

      const shift = dailyPlan?.shifts?.find(s => {
        const start = parseTime(s.startTime);
        const end = parseTime(s.endTime);
        return Math.abs(start - sStart) <= 120 && Math.abs(end - sEnd) <= 120;
      });

      // Raccogli TUTTI gli ID operatori associati al cantiere (turni del giorno, turni della settimana e assegnazioni generali)
      const allCantiereOpIds = Array.from(new Set([
        ...(shift?.assignedOperators || []),
        ...(dailyPlan?.assignedOperators || []),
        ...(assignments || []).filter(a => a.workSiteId === matchedWs.id).map(a => a.employeeId),
        ...((Object.values(matchedWs.weeklyPlan || {}) as any[]).flatMap(dp => 
          dp?.shifts?.flatMap((s: any) => s.assignedOperators || []) || dp?.assignedOperators || []
        ))
      ]));

      // Trova operatore assente tra quelli associati a questo cantiere
      const absentOp = allCantiereOpIds
        .filter(id => id !== employeeId)
        .map(id => employees.find(em => em.id === id))
        .find(em => {
          if (!em) return false;
          return (leaveRequests || []).some(l => 
            l.employeeId === em.id && 
            l.startDate <= day.date && 
            l.endDate >= day.date && 
            l.type !== 'Annotazione'
          );
        });

      if (absentOp) return absentOp.name;

      // Se questo operatore è un Jolly (o blocco coperture ordinarie), mostra gli operatori titolari
      if (!currentEmp?.type || currentEmp.type === 'jolly' || employeeId === 'ordinari') {
        const otherAssigned = allCantiereOpIds
          .filter(id => id !== employeeId)
          .map(id => employees.find(em => em.id === id))
          .filter(Boolean);

        if (otherAssigned.length > 0) {
          return otherAssigned.map(o => o!.name).join(', ');
        }
      }
    }

    // Se non troviamo il cantiere o non ha operatori associati, controlla se c'è un operatore assente nella data
    if (!currentEmp?.type || currentEmp.type === 'jolly' || employeeId === 'ordinari') {
      const companyAbsents = (leaveRequests || []).filter(l => 
        l.startDate <= day.date && 
        l.endDate >= day.date && 
        l.type !== 'Annotazione' && 
        l.employeeId !== employeeId
      ).map(l => employees.find(em => em.id === l.employeeId)).filter(Boolean);

      if (companyAbsents.length === 1 && companyAbsents[0]?.name) {
        return companyAbsents[0].name;
      }
    }

    return null;
  };

  const getEntryTrip = (e: ScheduleEntry) => {
    if (e.travelKm !== undefined && e.travelKm > 0) {
      return {
        travelKm: e.travelKm,
        travelTimeMinutes: e.travelTimeMinutes || estimateTravelMinutes(e.travelKm),
        fromLocation: e.fromLocation || currentEmp?.city || currentEmp?.name || 'Domicilio'
      };
    }
    const matchedWs = workSites.find(ws => 
      ws.name.toUpperCase() === e.taskDescription.toUpperCase() ||
      e.taskDescription.toUpperCase().includes(ws.name.toUpperCase()) ||
      ws.name.toUpperCase().includes(e.taskDescription.toUpperCase())
    );
    const est = getTripEstimateSync(currentEmp, matchedWs || { name: e.taskDescription });
    return est;
  };

  const sortedEntries = [...entries].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
  const dayTotal = Math.round(sortedEntries.reduce((acc, e) => acc + (Number(e.hours) || 0), 0) * 100) / 100;
  const dayKm = Math.round(sortedEntries.reduce((acc, e) => acc + (getEntryTrip(e).travelKm || 0), 0) * 10) / 10;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Check for JSON data first (Turno da coprire)
    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (jsonData) {
        const data = JSON.parse(jsonData);
        if (data.type === 'NEW_SHIFT') {
          onDropNew(data, day.date, employeeId);
          return;
        }
      }
    } catch (err) {}

    const entryId = e.dataTransfer.getData('text/plain');
    if (entryId) {
      const droppedEntry = scheduleEntries.find(e => e.id === entryId);
      if (droppedEntry) {
        const existing = scheduleEntries.filter(e => e.employeeId === employeeId && e.date === day.date && e.id !== entryId);
        
        const startDrop = parseTime(droppedEntry.startTime);
        const endDrop = parseTime(droppedEntry.endTime);
        const overlap = existing.find(e => startDrop < parseTime(e.endTime) && endDrop > parseTime(e.startTime));
        
        if (overlap) {
          toast.error(
            (t) => (
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-sm">Attenzione: Sovrapposizione oraria!</span>
                <span className="text-xs">
                  L'orario si accavalla con "{overlap.taskDescription}" ({overlap.startTime} - {overlap.endTime}).
                </span>
                <div className="flex justify-end gap-2 mt-2">
                  <button 
                    onClick={() => toast.dismiss(t.id)}
                    className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs hover:bg-gray-300"
                  >
                    Annulla
                  </button>
                  <button 
                    onClick={() => {
                      toast.dismiss(t.id);
                      onDropEntry(entryId, day.date, employeeId);
                      toast.success("Turno assegnato", { duration: 2000 });
                    }}
                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    Assegna comunque
                  </button>
                </div>
              </div>
            ),
            { duration: 8000 }
          );
          return;
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
      className={`flex-1 flex flex-col min-h-[140px]`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="bg-[#f59e0b] text-center py-1.5 border-b border-gray-200 font-bold text-[11px] text-gray-900 italic uppercase">
        {day.label}
      </div>
      
      <div className="flex-1 bg-white flex flex-col p-2 space-y-2">
        {sortedEntries.map(e => {
          const isOverlapping = hasOverlap(e);
          const trip = getEntryTrip(e);
          const siteLoc = getWorkSiteLocationDetails(e.taskDescription, workSites);
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
              <div className={`uppercase tracking-tight truncate pr-4 font-semibold ${isOverlapping ? 'text-red-800' : 'text-gray-800'}`} title={e.taskDescription}>
                {e.taskDescription}
              </div>
              
              {siteLoc.address && (
                <div 
                  className="text-[10px] text-gray-600 truncate flex items-center gap-1 font-medium mt-0.5" 
                  title={`Via / Indirizzo: ${siteLoc.fullLocation}`}
                >
                  <MapPin size={10} className="shrink-0 text-rose-500" />
                  <span className="truncate">{siteLoc.address}{siteLoc.city ? ` (${siteLoc.city})` : ''}</span>
                </div>
              )}

              {/* Indicazione SEMPRE visibile dell'operatore che vanno a coprire i Jolly */}
              {(() => {
                const isJollyOrVirtual = !currentEmp?.type || currentEmp.type === 'jolly' || employeeId === 'ordinari';
                const coveredOp = getCoveredOperatorName(e);
                if (!isJollyOrVirtual && !coveredOp) return null;
                return (
                  <div 
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onEdit(e);
                    }}
                    className={`mt-1.5 flex items-center gap-1.5 text-[10.5px] px-2 py-1 rounded shadow-2xs cursor-pointer transition-colors ${
                      coveredOp 
                        ? 'font-bold text-amber-950 bg-amber-100/95 border border-amber-300/90 hover:bg-amber-200/90' 
                        : 'font-semibold text-amber-900 bg-amber-50/90 border border-dashed border-amber-300 hover:bg-amber-100'
                    }`}
                    title={coveredOp ? `Copertura turno di: ${coveredOp} (Clicca per modificare)` : 'Clicca per specificare chi viene coperto da questo Jolly'}
                  >
                    <UserCheck size={12} className="text-amber-800 shrink-0" />
                    <span className="truncate">
                      Copre: <strong className="font-extrabold uppercase text-amber-950">{coveredOp || 'Da assegnare (clicca)'}</strong>
                    </span>
                  </div>
                );
              })()}
              
              {trip && trip.travelKm > 0 && (
                <div 
                  className="mt-2 flex flex-col gap-1 text-[10px] text-indigo-950 bg-indigo-50/95 hover:bg-indigo-100/90 p-1.5 rounded border border-indigo-200/90 transition-colors shadow-2xs"
                  title={`Distanza percorsa per il cantiere: ~${trip.travelKm} km (${trip.travelTimeMinutes} min).\nPartenza: ${trip.fromLocation || 'Domicilio'}\nArrivo: ${siteLoc.fullLocation || e.taskDescription}`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-indigo-950">
                      <Car size={13} className="text-indigo-600 shrink-0" />
                      <span className="font-extrabold text-[11px]">~{trip.travelKm} km</span>
                    </span>
                    <span className="text-indigo-700 font-semibold text-[10px] bg-white/80 px-1.5 py-0.5 rounded border border-indigo-100">
                      ⏱ {trip.travelTimeMinutes} min
                    </span>
                  </div>
                  {trip.fromLocation && (
                    <div className="text-[9.5px] text-indigo-700 truncate flex items-center gap-1 font-medium" title={`Partenza da: ${trip.fromLocation}`}>
                      <span className="text-indigo-400 font-bold shrink-0">Da:</span>
                      <span className="truncate">{trip.fromLocation}</span>
                    </div>
                  )}
                  {siteLoc.address && (
                    <div className="text-[9.5px] text-emerald-800 truncate flex items-center gap-1 font-medium border-t border-indigo-100/60 pt-0.5" title={`Arrivo a: ${siteLoc.fullLocation}`}>
                      <span className="text-emerald-600 font-bold shrink-0">A:</span>
                      <span className="truncate font-semibold">{siteLoc.address} {siteLoc.city ? `(${siteLoc.city})` : ''}</span>
                    </div>
                  )}
                </div>
              )}

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

      <div className="bg-[#a5d8f3] text-center py-1.5 border-t border-gray-200 font-bold text-[11px] text-gray-800 flex justify-center items-center gap-2">
        <span>ORE: {dayTotal}</span>
        {dayKm > 0 && (
          <span className="text-indigo-950 font-bold text-[10.5px] bg-white/60 px-2 py-0.5 rounded shadow-2xs flex items-center gap-1" title="Chilometri totali percorsi nella giornata per raggiungere i cantieri">
            <Car size={11} className="text-indigo-700 shrink-0" />
            ~{dayKm} km
          </span>
        )}
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
    travelKm?: number;
    travelTimeMinutes?: number;
    fromLocation?: string;
    coveredEmployeeId?: string;
    coveredEmployeeName?: string;
  }, onClose: () => void, weekDays: any[] 
}) {
  const { employees, workSites, scheduleEntries, addScheduleEntry, updateScheduleEntry, assignments, leaveRequests } = useAppContext();
  
  const getInitialHours = () => {
    if (initialData.hours !== undefined && initialData.hours !== null && !isNaN(Number(initialData.hours)) && Number(initialData.hours) > 0) {
      return (Math.round(Number(initialData.hours) * 100) / 100).toString();
    }
    if (initialData.startTime && initialData.endTime) {
      const s = parseTime(initialData.startTime);
      const e = parseTime(initialData.endTime);
      if (s !== null && e !== null) {
        let diff = (e - s) / 60;
        if (diff < 0) diff += 24;
        return (Math.round(diff * 100) / 100).toString();
      }
    }
    return '';
  };

  const [formData, setFormData] = useState({
    employeeId: initialData.employeeId,
    date: initialData.date,
    startTime: initialData.startTime || '',
    endTime: initialData.endTime || '',
    taskDescription: initialData.taskDescription || '',
    hours: getInitialHours(),
    travelKm: initialData.travelKm !== undefined ? initialData.travelKm.toString() : '',
    travelTimeMinutes: initialData.travelTimeMinutes !== undefined ? initialData.travelTimeMinutes.toString() : '',
    fromLocation: initialData.fromLocation || '',
    coveredEmployeeId: initialData.coveredEmployeeId || '',
    coveredEmployeeName: initialData.coveredEmployeeName || ''
  });
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  // Trova l'operatore attualmente selezionato
  const selectedEmployee = employees.find(e => e.id === formData.employeeId);

  // Auto-calcolo ore quando cambiano startTime o endTime
  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const updated = { ...formData, [field]: value };
    if (updated.startTime && updated.endTime) {
      const s = parseTime(updated.startTime);
      const e = parseTime(updated.endTime);
      if (s !== null && e !== null) {
        let diff = (e - s) / 60;
        if (diff < 0) diff += 24;
        updated.hours = (Math.round(diff * 100) / 100).toString();
      }
    }
    setFormData(updated);
    if (overlapWarning) setOverlapWarning(null);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (overlapWarning) setOverlapWarning(null);
  };

  // Seleziona un cantiere da elenco o calcola distanza per un cantiere inserito
  const handleSelectWorkSite = async (wsName: string) => {
    const matchedWs = workSites.find(ws => ws.name.toUpperCase() === wsName.trim().toUpperCase());
    
    // Suggerisci automaticamente l'operatore coperto se non ancora impostato
    let suggestedCoveredName = formData.coveredEmployeeName;
    let suggestedCoveredId = formData.coveredEmployeeId;

    if (!suggestedCoveredName && matchedWs) {
      const assigned = (assignments || []).filter(a => a.workSiteId === matchedWs.id).map(a => a.employeeId);
      const absentOp = assigned.map(id => employees.find(em => em.id === id)).find(em => {
        if (!em || em.id === formData.employeeId) return false;
        return (leaveRequests || []).some(l => 
          l.employeeId === em.id && 
          l.startDate <= formData.date && 
          l.endDate >= formData.date && 
          l.type !== 'Annotazione'
        );
      });
      if (absentOp) {
        suggestedCoveredName = absentOp.name;
        suggestedCoveredId = absentOp.id;
      }
    }

    setFormData(prev => ({ 
      ...prev, 
      taskDescription: wsName,
      coveredEmployeeName: suggestedCoveredName,
      coveredEmployeeId: suggestedCoveredId
    }));

    if (selectedEmployee && wsName.trim()) {
      setIsCalculatingDistance(true);
      try {
        const trip = await calculateTripKmAndMinutes(
          selectedEmployee,
          matchedWs || { name: wsName.trim() }
        );
        if (trip.travelKm > 0) {
          setFormData(prev => ({
            ...prev,
            taskDescription: wsName,
            travelKm: trip.travelKm.toString(),
            travelTimeMinutes: trip.travelTimeMinutes.toString(),
            fromLocation: trip.fromLocation || prev.fromLocation
          }));
        }
      } catch (err) {
        console.error("Errore calcolo distanza:", err);
      } finally {
        setIsCalculatingDistance(false);
      }
    }
  };

  // Ricalcola distanza on demand
  const handleRecalculateDistance = async () => {
    if (!selectedEmployee || !formData.taskDescription.trim()) return;
    setIsCalculatingDistance(true);
    try {
      const matchedWs = workSites.find(ws => 
        ws.name.toUpperCase() === formData.taskDescription.trim().toUpperCase() ||
        formData.taskDescription.toUpperCase().includes(ws.name.toUpperCase()) ||
        ws.name.toUpperCase().includes(formData.taskDescription.toUpperCase())
      );
      const trip = await calculateTripKmAndMinutes(
        selectedEmployee,
        matchedWs || { name: formData.taskDescription.trim() }
      );
      if (trip.travelKm > 0) {
        setFormData(prev => ({
          ...prev,
          travelKm: trip.travelKm.toString(),
          travelTimeMinutes: trip.travelTimeMinutes.toString(),
          fromLocation: trip.fromLocation || prev.fromLocation
        }));
        toast.success(`Distanza calcolata: ~${trip.travelKm} km (${trip.travelTimeMinutes} min)`);
      } else {
        toast.error("Impossibile calcolare le coordinate. Verifica comune/indirizzo dell'operatore o del cantiere.");
      }
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.date || !formData.startTime || !formData.endTime || !formData.hours) return;
    
    const existing = scheduleEntries.filter(e => e.employeeId === formData.employeeId && e.date === formData.date && e.id !== initialData.id);
    const startForm = parseTime(formData.startTime);
    const endForm = parseTime(formData.endTime);
    const overlap = existing.find(e => startForm < parseTime(e.endTime) && endForm > parseTime(e.startTime));

    if (overlap && !overlapWarning) {
      setOverlapWarning(`L'orario si accavalla con "${overlap.taskDescription}" (${overlap.startTime} - ${overlap.endTime}). Clicca di nuovo su "Salva" per forzare l'inserimento.`);
      toast.error(`Sovrapposizione con "${overlap.taskDescription}" (${overlap.startTime} - ${overlap.endTime})`);
      return;
    }

    // Se i km non sono ancora impostati e abbiamo un operatore e una descrizione, tenta un ultimo calcolo automatico
    let kmValue = parseFloat(formData.travelKm);
    let timeMinutesValue = parseInt(formData.travelTimeMinutes);
    let fromLocValue = formData.fromLocation;

    if ((isNaN(kmValue) || kmValue === 0) && selectedEmployee && formData.taskDescription.trim()) {
      const matchedWs = workSites.find(ws => 
        ws.name.toUpperCase() === formData.taskDescription.trim().toUpperCase() ||
        formData.taskDescription.toUpperCase().includes(ws.name.toUpperCase()) ||
        ws.name.toUpperCase().includes(formData.taskDescription.toUpperCase())
      );
      const trip = await calculateTripKmAndMinutes(
        selectedEmployee,
        matchedWs || { name: formData.taskDescription.trim() }
      );
      if (trip.travelKm > 0) {
        kmValue = trip.travelKm;
        timeMinutesValue = trip.travelTimeMinutes;
        fromLocValue = trip.fromLocation;
      }
    }

    let hoursVal = parseFloat(formData.hours);
    if (isNaN(hoursVal) || hoursVal <= 0) {
      const s = parseTime(formData.startTime);
      const e = parseTime(formData.endTime);
      if (s !== null && e !== null) {
        let diff = (e - s) / 60;
        if (diff < 0) diff += 24;
        hoursVal = Math.round(diff * 100) / 100;
      }
    }
    hoursVal = Math.round(hoursVal * 100) / 100;

    const payload = {
      employeeId: formData.employeeId,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      taskDescription: formData.taskDescription.trim(),
      hours: hoursVal,
      ...(kmValue > 0 ? { travelKm: kmValue } : {}),
      ...(timeMinutesValue > 0 ? { travelTimeMinutes: timeMinutesValue } : {}),
      ...(fromLocValue ? { fromLocation: fromLocValue } : {}),
      ...(formData.coveredEmployeeName ? { 
        coveredEmployeeName: formData.coveredEmployeeName,
        coveredEmployeeId: formData.coveredEmployeeId || undefined
      } : {
        coveredEmployeeName: undefined,
        coveredEmployeeId: undefined
      })
    };

    if (initialData.isEditing && initialData.id) {
      await updateScheduleEntry(initialData.id, payload);
    } else {
      await addScheduleEntry(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-semibold text-gray-800">{initialData.isEditing ? 'Modifica Intervento' : 'Aggiungi Intervento'}</h3>
            {selectedEmployee && (
              <p className="text-xs text-slate-500">
                Operatore: <span className="font-medium text-slate-700">{selectedEmployee.name}</span>
                {selectedEmployee.city && <span> ({selectedEmployee.city})</span>}
              </p>
            )}
          </div>
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
                onChange={async (e) => {
                  const newEmpId = e.target.value;
                  handleChange('employeeId', newEmpId);
                  const newEmp = employees.find(emp => emp.id === newEmpId);
                  if (newEmp && formData.taskDescription) {
                    const matchedWs = workSites.find(ws => ws.name.toUpperCase() === formData.taskDescription.toUpperCase());
                    const trip = await calculateTripKmAndMinutes(newEmp, matchedWs || { name: formData.taskDescription });
                    if (trip.travelKm > 0) {
                      setFormData(prev => ({
                        ...prev,
                        employeeId: newEmpId,
                        travelKm: trip.travelKm.toString(),
                        travelTimeMinutes: trip.travelTimeMinutes.toString(),
                        fromLocation: trip.fromLocation
                      }));
                    }
                  }
                }}
              >
                {employees.filter(emp => !emp.type || emp.type === 'jolly').map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
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
                onChange={e => handleTimeChange('startTime', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">A (Orario)</label>
              <input 
                type="time" required
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1e5b99] focus:border-[#1e5b99]"
                value={formData.endTime}
                onChange={e => handleTimeChange('endTime', e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-gray-700">Cantiere / Intervento</label>
              <span className="text-[11px] text-indigo-600 font-medium">Seleziona o digita</span>
            </div>
            
            {/* Selettore rapido cantieri da anagrafica */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  list="worksites-datalist"
                  required 
                  placeholder="Es. INTESA GREEN o seleziona dal menu..."
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1e5b99] focus:border-[#1e5b99]"
                  value={formData.taskDescription}
                  onChange={e => handleSelectWorkSite(e.target.value)}
                />
                <datalist id="worksites-datalist">
                  {workSites.map(ws => (
                    <option key={ws.id} value={ws.name}>
                      {ws.name} {ws.city ? `(${ws.city})` : ''}
                    </option>
                  ))}
                </datalist>
              </div>

              <select 
                aria-label="Scegli Cantiere da anagrafica"
                className="w-32 border border-gray-300 rounded-md px-2 py-1 text-xs bg-slate-50 text-slate-700 focus:ring-2 focus:ring-[#1e5b99]"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleSelectWorkSite(e.target.value);
                  }
                }}
              >
                <option value="">Scegli...</option>
                {workSites.map(ws => (
                  <option key={ws.id} value={ws.name}>{ws.name}</option>
                ))}
              </select>
            </div>
            {(() => {
              const loc = getWorkSiteLocationDetails(formData.taskDescription, workSites);
              if (!loc.address) return null;
              return (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                  <MapPin size={13} className="text-rose-500 shrink-0" />
                  <span>Via / Indirizzo: <strong className="text-slate-800">{loc.address}</strong> {loc.city ? `(${loc.city})` : ''}</span>
                </div>
              );
            })()}
          </div>

          {/* Operatore coperto dal Jolly */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-gray-700 flex items-center gap-1.5">
                <UserCheck size={13} className="text-amber-600" />
                Operatore sostituito / coperto dal Jolly
              </label>
              {formData.coveredEmployeeName && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, coveredEmployeeName: '', coveredEmployeeId: '' }))}
                  className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                >
                  Rimuovi copertura
                </button>
              )}
            </div>
            <select
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1e5b99] focus:border-[#1e5b99] bg-white font-medium"
              value={formData.coveredEmployeeName || ''}
              onChange={(e) => {
                const name = e.target.value;
                const emp = employees.find(em => em.name === name);
                setFormData(prev => ({
                  ...prev,
                  coveredEmployeeName: name,
                  coveredEmployeeId: emp?.id || ''
                }));
              }}
            >
              <option value="">Nessuno (Turno autonomo / non sostitutivo)</option>
              {employees.filter(emp => emp.id !== formData.employeeId).map(emp => (
                <option key={emp.id} value={emp.name}>
                  {emp.name} {emp.type ? `(${emp.type})` : ''} {emp.city ? `• ${emp.city}` : ''}
                </option>
              ))}
            </select>
            {formData.coveredEmployeeName ? (
              <p className="text-[11px] text-amber-800 font-semibold mt-1 flex items-center gap-1">
                <UserCheck size={12} className="text-amber-600" />
                Il Jolly compare in sostituzione di: <strong>{formData.coveredEmployeeName}</strong>
              </p>
            ) : (
              <p className="text-[11px] text-gray-400 mt-1">
                Specifica quale operatore viene coperto per mostrarlo chiaramente nella scheda del turno.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ore totali</label>
              <input 
                type="number" step="0.25" required placeholder="Es. 2.5"
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1e5b99] focus:border-[#1e5b99]"
                value={formData.hours}
                onChange={e => handleChange('hours', e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Car size={13} className="text-indigo-600" />
                  Distanza percorso (km)
                </label>
                <button
                  type="button"
                  onClick={handleRecalculateDistance}
                  disabled={isCalculatingDistance || !formData.taskDescription.trim()}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 disabled:opacity-50 font-medium"
                >
                  {isCalculatingDistance ? 'Calcolo...' : 'Ricalcola'}
                </button>
              </div>
              <input 
                type="number" step="0.1" placeholder="Auto-calcolata"
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1e5b99] focus:border-[#1e5b99] bg-indigo-50/30"
                value={formData.travelKm}
                onChange={e => handleChange('travelKm', e.target.value)}
              />
            </div>
          </div>

          {/* Dettagli percorso calcolato */}
          {(parseFloat(formData.travelKm) > 0 || isCalculatingDistance) && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route size={16} className="text-indigo-600 shrink-0" />
                {isCalculatingDistance ? (
                  <span>Calcolo coordinate e chilometri in corso...</span>
                ) : (
                  <div>
                    <span className="font-semibold">~{formData.travelKm} km</span>
                    {formData.travelTimeMinutes && (
                      <span className="text-slate-600 ml-1.5 font-normal">
                        (~{formData.travelTimeMinutes} min guida)
                      </span>
                    )}
                    {formData.fromLocation && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Da: {formData.fromLocation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

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

function FairnessModal({
  isOpen,
  onClose,
  jollyEmployees,
  entriesThisWeek,
  workSites,
  onRunAutoSchedule,
  isAutoScheduling,
  shiftsToCoverCount
}: {
  isOpen: boolean;
  onClose: () => void;
  jollyEmployees: any[];
  entriesThisWeek: ScheduleEntry[];
  workSites: any[];
  onRunAutoSchedule: () => void;
  isAutoScheduling: boolean;
  shiftsToCoverCount: number;
}) {
  if (!isOpen) return null;

  const stats = jollyEmployees.map(op => {
    const opEntries = entriesThisWeek.filter(e => e.employeeId === op.id);
    const totalHours = opEntries.reduce((sum, e) => sum + e.hours, 0);
    const totalKm = opEntries.reduce((sum, e) => sum + (e.travelKm || 0), 0);
    return {
      id: op.id,
      name: op.name,
      city: op.city,
      address: op.address,
      province: op.province,
      count: opEntries.length,
      hours: Math.round(totalHours * 10) / 10,
      km: Math.round(totalKm * 10) / 10
    };
  });

  const maxKm = Math.max(...stats.map(s => s.km), 1);
  const totalKmWeek = stats.reduce((sum, s) => sum + s.km, 0);
  const totalHoursWeek = Math.round(stats.reduce((sum, s) => sum + s.hours, 0) * 10) / 10;
  const avgKm = stats.length > 0 ? Math.round((totalKmWeek / stats.length) * 10) / 10 : 0;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-700 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Scale size={20} className="text-indigo-200" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide">Bilanciamento Equo Percorsi (Jolly)</h3>
              <p className="text-xs text-indigo-200">Distribuzione equa di chilometri e turni tra gli operatori</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Explanation Banner */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 items-start">
            <Info size={18} className="text-indigo-600 mt-0.5 shrink-0" />
            <div className="text-xs text-indigo-950 space-y-1">
              <p className="font-semibold text-indigo-900">
                Come viene garantita l'equità dei percorsi:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-indigo-800/90 leading-relaxed">
                <li>
                  <strong>Calcolo chilometrico reale:</strong> La distanza stradale viene calcolata dal domicilio dell'operatore o dal cantiere del turno precedente.
                </li>
                <li>
                  <strong>Penalità progressiva chilometri:</strong> L'algoritmo penalizza gli operatori che hanno già percorso più chilometri nella settimana, favorendo chi ha viaggiato meno.
                </li>
                <li>
                  <strong>Verifica tempi di percorrenza:</strong> Viene stimato il tempo di trasferimento su strada per evitare ritardi o turni impossibili da raggiungere.
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="text-xs text-gray-500 font-medium">Km Totali Stimati</span>
              <p className="text-xl font-bold text-indigo-600 mt-0.5">~{Math.round(totalKmWeek)} km</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="text-xs text-gray-500 font-medium">Media per Operatore</span>
              <p className="text-xl font-bold text-gray-800 mt-0.5">~{avgKm} km</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="text-xs text-gray-500 font-medium">Ore Complessive</span>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">{totalHoursWeek} h</p>
            </div>
          </div>

          {/* Operator List with Progress Bars */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              Ripartizione per Operatore Jolly (Settimana Corrente)
            </h4>
            <div className="space-y-3">
              {stats.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Nessun operatore Jolly configurato.</p>
              ) : (
                stats.map(op => {
                  const pct = maxKm > 0 ? (op.km / maxKm) * 100 : 0;
                  return (
                    <div key={op.id} className="border border-gray-200 rounded-xl p-3.5 bg-white hover:bg-slate-50/60 transition-colors">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          <span className="font-bold text-sm text-gray-900">{op.name}</span>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <MapPin size={12} className="text-gray-400" />
                            <span>{op.city ? `${op.city} ${op.province ? `(${op.province})` : ''}` : 'Domicilio non specificato'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-indigo-700">~{op.km} km</span>
                          <div className="text-xs text-gray-500">{op.hours} ore • {op.count} interventi</div>
                        </div>
                      </div>
                      
                      {/* Bar indicator */}
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <div className="text-xs text-gray-600">
            {shiftsToCoverCount > 0 ? (
              <span className="font-semibold text-rose-600">
                {shiftsToCoverCount} {shiftsToCoverCount === 1 ? 'turno scoperto' : 'turni scoperti'} da coprire
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">Tutti i turni sono coperti</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors"
            >
              Chiudi
            </button>
            <button
              onClick={onRunAutoSchedule}
              disabled={isAutoScheduling || shiftsToCoverCount === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Route size={14} />
              {isAutoScheduling ? 'Elaborazione...' : 'Elabora Piani con Equità'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AutoScheduleReportModal({
  report,
  onClose
}: {
  report: {
    assignedCount: number;
    totalKm: number;
    details: Array<{
      opName: string;
      shiftName: string;
      date: string;
      time: string;
      km: number;
      fromLocation: string;
      coveredOpName?: string;
    }>;
  };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Route size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide">Pianificazione Equa Completata</h3>
              <p className="text-xs text-emerald-100">Riepilogo degli spostamenti e delle assegnazioni generate</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center">
              <span className="text-xs text-emerald-700 font-medium">Turni Assegnati</span>
              <p className="text-2xl font-extrabold text-emerald-800 mt-1">{report.assignedCount}</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-center">
              <span className="text-xs text-indigo-700 font-medium">Chilometri Stradali Distribuiti</span>
              <p className="text-2xl font-extrabold text-indigo-800 mt-1">~{report.totalKm} km</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
              Dettaglio Assegnazioni per Percorso & Operatore
            </h4>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {report.details.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-slate-50/70 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-gray-900">{d.opName}</span>
                    <span className="text-gray-600 font-medium">{d.shiftName} ({d.time})</span>
                    {d.coveredOpName && (
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded w-fit">
                        Sostituisce: {d.coveredOpName}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">Data: {d.date}</span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      🚗 ~{d.km} km
                    </span>
                    <span className="text-[10px] text-gray-500 mt-1">
                      Partenza: {d.fromLocation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            Chiudi e Visualizza Planning
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignLeaveCoverageModal({
  leave,
  employee,
  workSites,
  assignments,
  weekDays,
  onClose,
  onSave
}: {
  leave: LeaveRequest;
  employee?: any;
  workSites: WorkSite[];
  assignments: any[];
  weekDays: any[];
  onClose: () => void;
  onSave: (shifts: CoverageShift[]) => Promise<void>;
}) {
  const [shifts, setShifts] = useState<CoverageShift[]>(() => {
    if (leave.coverageShifts && leave.coverageShifts.length > 0) {
      return [...leave.coverageShifts];
    }
    return [
      {
        id: Math.random().toString(36).substring(2, 9),
        workSiteName: '',
        startTime: '08:00',
        endTime: '12:00',
        notes: ''
      }
    ];
  });
  const [isSaving, setIsSaving] = useState(false);

  // Trova i cantieri e turni abituali dell'operatore per suggerimento / pre-compilazione veloce
  const habitualShifts = React.useMemo(() => {
    if (!employee?.id) return [];
    const list: Array<{ workSiteName: string; startTime: string; endTime: string }> = [];
    const seen = new Set<string>();

    workSites.forEach(ws => {
      const hasDirectAssignment = (assignments || []).some(
        a => a.employeeId === employee.id && a.workSiteId === ws.id
      );

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
      days.forEach(dow => {
        const plan = ws.weeklyPlan?.[dow];
        plan?.shifts?.forEach(s => {
          if (s.assignedOperators?.includes(employee.id) || (hasDirectAssignment && s.startTime && s.endTime)) {
            const key = `${ws.name}-${s.startTime}-${s.endTime}`;
            if (!seen.has(key)) {
              seen.add(key);
              list.push({
                workSiteName: ws.name,
                startTime: s.startTime || '08:00',
                endTime: s.endTime || '12:00'
              });
            }
          }
        });
      });

      if (hasDirectAssignment && !seen.has(ws.name)) {
        seen.add(ws.name);
        list.push({
          workSiteName: ws.name,
          startTime: '08:00',
          endTime: '12:00'
        });
      }
    });

    return list;
  }, [employee?.id, workSites, assignments]);

  const handleImportHabitual = () => {
    if (habitualShifts.length === 0) return;
    const imported: CoverageShift[] = habitualShifts.map(h => ({
      id: Math.random().toString(36).substring(2, 9),
      workSiteName: h.workSiteName,
      startTime: h.startTime,
      endTime: h.endTime,
      notes: 'Turno abituale'
    }));

    if (shifts.length === 1 && !shifts[0].workSiteName.trim()) {
      setShifts(imported);
    } else {
      setShifts(prev => [...prev, ...imported]);
    }
    toast.success(`Importati ${imported.length} turni abituali di ${employee?.name || 'operatore'}`);
  };

  const handleAddShift = () => {
    setShifts(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        workSiteName: '',
        startTime: '08:00',
        endTime: '12:00',
        notes: ''
      }
    ]);
  };

  const handleRemoveShift = (index: number) => {
    setShifts(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateShift = (index: number, field: keyof CoverageShift, value: any) => {
    setShifts(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = shifts.filter(s => s.workSiteName.trim() && s.startTime && s.endTime);
    if (valid.length === 0) {
      toast.error('Inserisci almeno un cantiere con fascia oraria');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(valid);
      toast.success(`Assegnati ${valid.length} turni/cantieri da coprire per ${employee?.name || 'operatore'}`);
      onClose();
    } catch (err: any) {
      toast.error('Errore nel salvataggio: ' + (err.message || 'Errore imprevisto'));
    } finally {
      setIsSaving(false);
    }
  };

  const formatLeaveDates = () => {
    if (!leave.startDate) return '';
    if (leave.startDate === leave.endDate) {
      return new Date(leave.startDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return `${new Date(leave.startDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })} - ${new Date(leave.endDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-amber-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs">
              <Building2 size={22} className="text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-wide">
                  Assegna Cantieri e Orari da Coprire
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {leave.type}
                </span>
              </div>
              <p className="text-xs text-amber-100 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-white">{employee?.name || 'Operatore'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CalendarIcon size={12} className="text-amber-200" />
                  {formatLeaveDates()}
                </span>
                {employee?.city && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin size={11} className="text-amber-200" />
                      {employee.city}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            
            {/* Banner info */}
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 flex gap-3 items-start">
              <Info size={17} className="text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-amber-900">
                  Specifica quali cantieri e fasce orarie lasciate scoperte da <strong>{employee?.name || 'questo operatore'}</strong> durante l'assenza dovranno essere coperte dai colleghi o Jolly.
                </p>
                <p className="text-amber-800/80 text-[11.5px]">
                  I turni inseriti qui appariranno automaticamente nella sezione <strong>"Turni da Coprire"</strong> e potranno essere trascinati sui Jolly o assegnati con l'algoritmo equo.
                </p>
              </div>
            </div>

            {/* Habitual Shifts Quick Import Banner */}
            {habitualShifts.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={18} className="text-indigo-600 shrink-0" />
                  <div>
                    <span className="font-bold text-xs text-indigo-950">
                      Rilevati {habitualShifts.length} cantieri/turni abituali per {employee?.name}
                    </span>
                    <p className="text-[11px] text-indigo-700">
                      Puoi importarli rapidamente per non doverli riscrivere a mano.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleImportHabitual}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shrink-0 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={13} />
                  Importa abituali
                </button>
              </div>
            )}

            {/* List of Shifts to Cover */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={14} className="text-amber-600" />
                  Cantieri e Fasce Orarie da Coprire ({shifts.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddShift}
                  className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Plus size={14} />
                  Aggiungi cantiere
                </button>
              </div>

              {shifts.map((shift, idx) => {
                const loc = getWorkSiteLocationDetails(shift.workSiteName, workSites);
                const s = parseTime(shift.startTime);
                const e = parseTime(shift.endTime);
                let duration = 0;
                if (s !== null && e !== null) {
                  duration = (e - s) / 60;
                  if (duration < 0) duration += 24;
                  duration = Math.round(duration * 100) / 100;
                }

                return (
                  <div 
                    key={shift.id || idx} 
                    className="p-4 bg-slate-50/80 rounded-xl border border-gray-200 space-y-3 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-gray-200/70 pb-2">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[11px] font-bold">
                          {idx + 1}
                        </span>
                        Cantiere #{idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {duration > 0 && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ⏱ {duration} ore
                          </span>
                        )}
                        {shifts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveShift(idx)}
                            className="text-gray-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                            title="Rimuovi cantiere"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Cantiere Selection */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-1">
                        Nome Cantiere / Intervento <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            list={`worksites-list-${idx}`}
                            required
                            placeholder="Es. CONDOMINIO TERMINUS o seleziona..."
                            className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                            value={shift.workSiteName}
                            onChange={(e) => handleUpdateShift(idx, 'workSiteName', e.target.value)}
                          />
                          <datalist id={`worksites-list-${idx}`}>
                            {workSites.map(ws => (
                              <option key={ws.id} value={ws.name}>
                                {ws.name} {ws.city ? `(${ws.city})` : ''}
                              </option>
                            ))}
                          </datalist>
                        </div>
                        <select
                          aria-label="Scegli Cantiere da anagrafica"
                          className="w-36 border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white text-gray-700 focus:ring-2 focus:ring-amber-500"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleUpdateShift(idx, 'workSiteName', e.target.value);
                            }
                          }}
                        >
                          <option value="">Scegli da lista...</option>
                          {workSites.map(ws => (
                            <option key={ws.id} value={ws.name}>{ws.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Worksite location details preview */}
                      {loc.address && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-600 bg-white px-2.5 py-1 rounded border border-gray-200">
                          <MapPin size={12} className="text-rose-500 shrink-0" />
                          <span className="truncate">
                            Via / Indirizzo: <strong className="text-gray-800">{loc.address}</strong> {loc.city ? `(${loc.city})` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Orari e Giorni */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1 flex items-center gap-1">
                          <Clock size={11} className="text-amber-600" />
                          Da (Orario Inizio) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="time"
                          required
                          className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 bg-white font-medium"
                          value={shift.startTime}
                          onChange={(e) => handleUpdateShift(idx, 'startTime', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1 flex items-center gap-1">
                          <Clock size={11} className="text-amber-600" />
                          A (Orario Fine) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="time"
                          required
                          className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 bg-white font-medium"
                          value={shift.endTime}
                          onChange={(e) => handleUpdateShift(idx, 'endTime', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1 flex items-center gap-1">
                          <CalendarIcon size={11} className="text-amber-600" />
                          Giorno di applicazione
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 bg-white text-gray-700"
                          value={shift.date || ''}
                          onChange={(e) => handleUpdateShift(idx, 'date', e.target.value || undefined)}
                        >
                          <option value="">Tutti i giorni dell'assenza</option>
                          {weekDays.filter(d => d.date >= leave.startDate && d.date <= leave.endDate).map(day => (
                            <option key={day.date} value={day.date}>
                              Solo {day.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Note cantiere / istruzioni per il jolly */}
                    <div>
                      <input
                        type="text"
                        placeholder="Note o istruzioni speciali per il jolly (es. chiavi, codici allarme...)"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700 bg-white focus:ring-1 focus:ring-amber-500"
                        value={shift.notes || ''}
                        onChange={(e) => handleUpdateShift(idx, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddShift}
                className="w-full py-2.5 border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/50 hover:bg-amber-50 text-amber-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus size={15} />
                Aggiungi altro cantiere da coprire
              </button>
            </div>

          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center shrink-0">
            <span className="text-xs text-gray-500">
              {shifts.filter(s => s.workSiteName.trim()).length} cantiere/i configurato/i
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Check size={14} />
                {isSaving ? 'Salvataggio...' : 'Salva Cantieri da Coprire'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}