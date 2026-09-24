export interface Employee {
  id: string;
  name: string;
  type?: 'jolly' | 'ordinario';
  company?: string;
  address?: string;
  city?: string;
  province?: string;
  lat?: number;
  lng?: number;
}

export interface ShiftPlan {
  id: string;
  startTime?: string;
  endTime?: string;
  assignedOperators?: string[];
}

export interface DailyPlan {
  startTime?: string;
  endTime?: string;
  operatorsCount?: string;
  assignedOperators?: string[];
  shifts?: ShiftPlan[];
}

export interface WeeklyPlan {
  monday?: DailyPlan;
  tuesday?: DailyPlan;
  wednesday?: DailyPlan;
  thursday?: DailyPlan;
  friday?: DailyPlan;
  saturday?: DailyPlan;
  sunday?: DailyPlan;
}

export interface WorkSite {
  id: string;
  name: string;
  address?: string;
  city?: string;
  province?: string;
  radius?: string;
  scanType?: string;
  printTag?: string;
  weeklyPlan?: WeeklyPlan;
  lat?: number;
  lng?: number;
}

export interface Assignment {
  employeeId: string;
  workSiteId: string;
}

export type LeaveType = 'Ferie' | 'Permesso' | 'Malattia' | 'Annotazione';

export interface CoverageShift {
  id: string;
  workSiteName: string;
  startTime: string;
  endTime: string;
  date?: string; // Facoltativo: YYYY-MM-DD specifico, altrimenti valido per tutti i giorni dell'assenza
  daysOfWeek?: string[]; // Facoltativo: giorni specifici della settimana (es. ['monday', 'tuesday'])
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId?: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status?: 'pending' | 'approved' | 'rejected';
  notes?: string;
  coverageShifts?: CoverageShift[];
}

export interface ScheduleEntry {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  taskDescription: string;
  hours: number;
  travelKm?: number;
  fromLocation?: string;
  travelTimeMinutes?: number;
  coveredEmployeeId?: string;
  coveredEmployeeName?: string;
}

export type UserRole = 'admin' | 'operator';

export interface UserRoleData {
  email: string;
  role: UserRole;
}

export interface AppNotification {
  id: string;
  createdAt: string;
  message: string;
}
