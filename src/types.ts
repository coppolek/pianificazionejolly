export interface Employee {
  id: string;
  name: string;
  type?: 'jolly' | 'ordinario';
}

export interface DailyPlan {
  startTime?: string;
  endTime?: string;
  operatorsCount?: string;
  assignedOperators?: string[];
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
}

export interface Assignment {
  employeeId: string;
  workSiteId: string;
}

export type LeaveType = 'Ferie' | 'Permesso' | 'Malattia';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface ScheduleEntry {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  taskDescription: string;
  hours: number;
}
