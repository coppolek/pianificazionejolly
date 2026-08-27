import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Employee, WorkSite, Assignment, LeaveRequest, ScheduleEntry } from '../types';

interface AppContextType {
  employees: Employee[];
  workSites: WorkSite[];
  assignments: Assignment[];
  leaveRequests: LeaveRequest[];
  scheduleEntries: ScheduleEntry[];
  addEmployee: (emp: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addWorkSite: (ws: Omit<WorkSite, 'id'>) => Promise<void>;
  updateWorkSite: (id: string, updates: Partial<WorkSite>) => Promise<void>;
  deleteWorkSite: (id: string) => Promise<void>;
  toggleAssignment: (employeeId: string, workSiteId: string) => Promise<void>;
  addLeaveRequest: (req: Omit<LeaveRequest, 'id'>) => Promise<void>;
  deleteLeaveRequest: (id: string) => Promise<void>;
  addScheduleEntry: (entry: Omit<ScheduleEntry, 'id'>) => Promise<void>;
  updateScheduleEntry: (id: string, entry: Partial<ScheduleEntry>) => Promise<void>;
  deleteScheduleEntry: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workSites, setWorkSites] = useState<WorkSite[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);

  // Setup Firestore listeners
  useEffect(() => {
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Employee)));
    });
    const unsubWorkSites = onSnapshot(collection(db, 'workSites'), (snapshot) => {
      setWorkSites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as WorkSite)));
    });
    const unsubAssignments = onSnapshot(collection(db, 'assignments'), (snapshot) => {
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Assignment)));
    });
    const unsubLeaveReqs = onSnapshot(collection(db, 'leaveRequests'), (snapshot) => {
      setLeaveRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as LeaveRequest)));
    });
    const unsubSchedule = onSnapshot(collection(db, 'scheduleEntries'), (snapshot) => {
      setScheduleEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as ScheduleEntry)));
    });

    return () => {
      unsubEmployees();
      unsubWorkSites();
      unsubAssignments();
      unsubLeaveReqs();
      unsubSchedule();
    };
  }, []);

  const addEmployee = async (emp: Omit<Employee, 'id'>) => {
    await addDoc(collection(db, 'employees'), emp);
  };
  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    await updateDoc(doc(db, 'employees', id), updates);
  };
  const deleteEmployee = async (id: string) => {
    await deleteDoc(doc(db, 'employees', id));
  };
  
  const addWorkSite = async (ws: Omit<WorkSite, 'id'>) => {
    await addDoc(collection(db, 'workSites'), ws);
  };
  const updateWorkSite = async (id: string, updates: Partial<WorkSite>) => {
    await updateDoc(doc(db, 'workSites', id), updates);
  };
  const deleteWorkSite = async (id: string) => {
    await deleteDoc(doc(db, 'workSites', id));
  };

  const toggleAssignment = async (employeeId: string, workSiteId: string) => {
    const existing = assignments.find(a => a.employeeId === employeeId && a.workSiteId === workSiteId);
    if (existing && existing.id) {
      await deleteDoc(doc(db, 'assignments', existing.id));
    } else {
      await addDoc(collection(db, 'assignments'), { employeeId, workSiteId });
    }
  };

  const addLeaveRequest = async (req: Omit<LeaveRequest, 'id'>) => {
    await addDoc(collection(db, 'leaveRequests'), req);
  };
  const deleteLeaveRequest = async (id: string) => {
    await deleteDoc(doc(db, 'leaveRequests', id));
  };

  const addScheduleEntry = async (entry: Omit<ScheduleEntry, 'id'>) => {
    await addDoc(collection(db, 'scheduleEntries'), entry);
  };
  const updateScheduleEntry = async (id: string, updatedFields: Partial<ScheduleEntry>) => {
    await updateDoc(doc(db, 'scheduleEntries', id), updatedFields);
  };
  const deleteScheduleEntry = async (id: string) => {
    await deleteDoc(doc(db, 'scheduleEntries', id));
  };

  return (
    <AppContext.Provider value={{
      employees, workSites, assignments, leaveRequests, scheduleEntries,
      addEmployee, updateEmployee, deleteEmployee, addWorkSite, updateWorkSite, deleteWorkSite, toggleAssignment,
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
