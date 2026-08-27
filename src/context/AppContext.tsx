import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Employee, WorkSite, Assignment, LeaveRequest, ScheduleEntry } from '../types';

interface AppContextType {
  employees: Employee[];
  workSites: WorkSite[];
  assignments: Assignment[];
  leaveRequests: LeaveRequest[];
  scheduleEntries: ScheduleEntry[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, name: string) => void;
  deleteEmployee: (id: string) => void;
  addWorkSite: (ws: Omit<WorkSite, 'id'>) => void;
  deleteWorkSite: (id: string) => void;
  toggleAssignment: (employeeId: string, workSiteId: string) => void;
  addLeaveRequest: (req: Omit<LeaveRequest, 'id'>) => void;
  deleteLeaveRequest: (id: string) => void;
  addScheduleEntry: (entry: Omit<ScheduleEntry, 'id'>) => void;
  updateScheduleEntry: (id: string, entry: Partial<ScheduleEntry>) => void;
  deleteScheduleEntry: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to get dates for current week to populate mock schedule
const getMondayOfCurrentWeek = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  return new Date(today.setDate(diff));
};

const monday = getMondayOfCurrentWeek();
const getDateStr = (offset: number) => {
  const d = new Date(monday);
  d.setDate(monday.getDate() + offset);
  return d.toISOString().split('T')[0];
};

const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', name: 'GIOVANNI' },
  { id: '2', name: 'GABRIELE' },
  { id: '3', name: 'MARGHERITA' },
];

const MOCK_WORKSITES: WorkSite[] = [
  { id: '1', name: 'METALTECNICA' },
  { id: '2', name: 'LASERSOFT' },
  { id: '3', name: 'GLOBALFORNITURE' },
  { id: '4', name: 'INTESA GREEN' },
  { id: '5', name: 'OFFICINA TURBO CAR' },
];

const MOCK_SCHEDULE: ScheduleEntry[] = [
  { id: 's1', employeeId: '1', date: getDateStr(0), startTime: '4:30', endTime: '7:00', taskDescription: 'MONDILLA x INNA + OPPORTUNITY', hours: 2.5 },
  { id: 's2', employeeId: '1', date: getDateStr(0), startTime: '7:00', endTime: '9:00', taskDescription: 'DIGITAL PROMOTER x SARA', hours: 2 },
  { id: 's3', employeeId: '1', date: getDateStr(0), startTime: '15:30', endTime: '16:30', taskDescription: 'AUSL VIA SANTARCANGIOLESE x TABITA', hours: 1 },
  { id: 's4', employeeId: '1', date: getDateStr(1), startTime: '6:00', endTime: '8:00', taskDescription: 'INTESA GREEN x ELISA', hours: 2 },
  { id: 's5', employeeId: '1', date: getDateStr(1), startTime: '10:30', endTime: '13:30', taskDescription: 'METALTECNICA x ELISA', hours: 3 },
  { id: 's6', employeeId: '2', date: getDateStr(0), startTime: '4:30', endTime: '7:00', taskDescription: 'R&R SERVIZI GRAFICI x SARA', hours: 2.5 },
  { id: 's7', employeeId: '2', date: getDateStr(1), startTime: '5:00', endTime: '7:00', taskDescription: 'RAGIONIERI x SARA', hours: 2 },
];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [workSites, setWorkSites] = useState<WorkSite[]>(MOCK_WORKSITES);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>(MOCK_SCHEDULE);

  const addEmployee = (emp: Omit<Employee, 'id'>) => setEmployees([...employees, { ...emp, id: Date.now().toString() }]);
  const updateEmployee = (id: string, name: string) => setEmployees(employees.map(e => e.id === id ? { ...e, name } : e));
  const deleteEmployee = (id: string) => setEmployees(employees.filter(e => e.id !== id));
  
  const addWorkSite = (ws: Omit<WorkSite, 'id'>) => setWorkSites([...workSites, { ...ws, id: Date.now().toString() }]);
  const deleteWorkSite = (id: string) => setWorkSites(workSites.filter(w => w.id !== id));

  const toggleAssignment = (employeeId: string, workSiteId: string) => {
    setAssignments(prev => {
      const exists = prev.find(a => a.employeeId === employeeId && a.workSiteId === workSiteId);
      if (exists) {
        return prev.filter(a => !(a.employeeId === employeeId && a.workSiteId === workSiteId));
      } else {
        return [...prev, { employeeId, workSiteId }];
      }
    });
  };

  const addLeaveRequest = (req: Omit<LeaveRequest, 'id'>) => setLeaveRequests([...leaveRequests, { ...req, id: Date.now().toString() }]);
  const deleteLeaveRequest = (id: string) => setLeaveRequests(leaveRequests.filter(r => r.id !== id));

  const addScheduleEntry = (entry: Omit<ScheduleEntry, 'id'>) => setScheduleEntries([...scheduleEntries, { ...entry, id: Date.now().toString() }]);
  const updateScheduleEntry = (id: string, updatedFields: Partial<ScheduleEntry>) => {
    setScheduleEntries(entries => entries.map(e => e.id === id ? { ...e, ...updatedFields } : e));
  };
  const deleteScheduleEntry = (id: string) => setScheduleEntries(scheduleEntries.filter(s => s.id !== id));

  return (
    <AppContext.Provider value={{
      employees, workSites, assignments, leaveRequests, scheduleEntries,
      addEmployee, updateEmployee, deleteEmployee, addWorkSite, deleteWorkSite, toggleAssignment,
      addLeaveRequest, deleteLeaveRequest, addScheduleEntry, updateScheduleEntry, deleteScheduleEntry
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
