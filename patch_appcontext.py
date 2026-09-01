import re

with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

# 1. Add AppNotification to imports
content = content.replace("UserRoleData } from '../types';", "UserRoleData, AppNotification } from '../types';")
if "AppNotification" not in content:
    content = content.replace("from '../types';", ", AppNotification } from '../types';")

# 2. Add notifications to Context type
context_type = """  addScheduleEntry: (entry: Omit<ScheduleEntry, 'id'>) => Promise<void>;
  updateScheduleEntry: (id: string, entry: Partial<ScheduleEntry>) => Promise<void>;
  deleteScheduleEntry: (id: string) => Promise<void>;
}"""
new_context_type = """  addScheduleEntry: (entry: Omit<ScheduleEntry, 'id'>) => Promise<void>;
  updateScheduleEntry: (id: string, entry: Partial<ScheduleEntry>) => Promise<void>;
  deleteScheduleEntry: (id: string) => Promise<void>;
  notifications: AppNotification[];
  clearNotifications: () => void;
}"""
content = content.replace(context_type, new_context_type)

# 3. Add state and fetch logic
state_block = """  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);"""
new_state_block = """  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);"""
content = content.replace(state_block, new_state_block)

fetch_logic = """    const unsubSchedule = onSnapshot(collection(db, 'scheduleEntries'), (snap) => {
      setScheduleEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleEntry)));
    });

    return () => {"""
new_fetch_logic = """    const unsubSchedule = onSnapshot(collection(db, 'scheduleEntries'), (snap) => {
      setScheduleEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleEntry)));
    });

    // We only need the last 50 notifications, ordered by createdAt desc
    const { query, orderBy, limit } = require('firebase/firestore');
    const qNotif = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(50));
    const unsubNotif = onSnapshot(qNotif, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)));
    });

    return () => {
      unsubNotif();"""
content = content.replace(fetch_logic, new_fetch_logic)

# 4. Modify functions to add notifications
# Note: we need to use addDoc for notifications. addDoc is already imported.
add_entry = """  const addScheduleEntry = async (entry: Omit<ScheduleEntry, 'id'>) => {
    await addDoc(collection(db, 'scheduleEntries'), entry);
  };"""
new_add_entry = """  const addScheduleEntry = async (entry: Omit<ScheduleEntry, 'id'>) => {
    await addDoc(collection(db, 'scheduleEntries'), entry);
    const emp = employees.find(e => e.id === entry.employeeId);
    if (emp?.type === 'jolly') {
      await addDoc(collection(db, 'notifications'), {
        createdAt: new Date().toISOString(),
        message: `È stato aggiunto un nuovo intervento per ${emp.name} in data ${entry.date}`
      });
    }
  };"""
content = content.replace(add_entry, new_add_entry)

update_entry = """  const updateScheduleEntry = async (id: string, updatedFields: Partial<ScheduleEntry>) => {
    await updateDoc(doc(db, 'scheduleEntries', id), updatedFields);
  };"""
new_update_entry = """  const updateScheduleEntry = async (id: string, updatedFields: Partial<ScheduleEntry>) => {
    const oldEntry = scheduleEntries.find(e => e.id === id);
    await updateDoc(doc(db, 'scheduleEntries', id), updatedFields);
    if (oldEntry) {
      const empId = updatedFields.employeeId || oldEntry.employeeId;
      const emp = employees.find(e => e.id === empId);
      if (emp?.type === 'jolly') {
        await addDoc(collection(db, 'notifications'), {
          createdAt: new Date().toISOString(),
          message: `È stato modificato un intervento per ${emp.name} in data ${updatedFields.date || oldEntry.date}`
        });
      }
    }
  };"""
content = content.replace(update_entry, new_update_entry)

delete_entry = """  const deleteScheduleEntry = async (id: string) => {
    await deleteDoc(doc(db, 'scheduleEntries', id));
  };"""
new_delete_entry = """  const deleteScheduleEntry = async (id: string) => {
    const entry = scheduleEntries.find(e => e.id === id);
    if (entry) {
      const emp = employees.find(e => e.id === entry.employeeId);
      if (emp?.type === 'jolly') {
        await addDoc(collection(db, 'notifications'), {
          createdAt: new Date().toISOString(),
          message: `È stato eliminato un intervento per ${emp.name} in data ${entry.date}`
        });
      }
    }
    await deleteDoc(doc(db, 'scheduleEntries', id));
  };"""
content = content.replace(delete_entry, new_delete_entry)

# 5. Clear notifications method
clear_notif = """  const clearNotifications = () => {
    // Just a placeholder, actual clearing will be handled locally by the user saving their last read timestamp
  };"""
  
# 6. Expose in return
return_block = """      addLeaveRequest, updateLeaveRequest, deleteLeaveRequest, addScheduleEntry, updateScheduleEntry, deleteScheduleEntry
    }}>"""
new_return_block = """      addLeaveRequest, updateLeaveRequest, deleteLeaveRequest, addScheduleEntry, updateScheduleEntry, deleteScheduleEntry,
      notifications, clearNotifications: () => {}
    }}>"""
content = content.replace(return_block, new_return_block)

with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)
