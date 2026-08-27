export interface Employee {
  id: string;
  name: string;
}

export interface WorkSite {
  id: string;
  name: string;
  address?: string;
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
