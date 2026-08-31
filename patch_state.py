import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

old_state = """  const { employees, scheduleEntries, leaveRequests, deleteScheduleEntry, updateScheduleEntry, addScheduleEntry, updateEmployee } = useAppContext();
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDays = getWeekDays(weekOffset);
    const [isAutoScheduling, setIsAutoScheduling] = useState(false);"""

new_state = """  const { employees, scheduleEntries, leaveRequests, deleteScheduleEntry, updateScheduleEntry, addScheduleEntry, updateEmployee, workSites } = useAppContext();
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterDate, setFilterDate] = useState('');
  const [filterWorkSite, setFilterWorkSite] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const [isAutoScheduling, setIsAutoScheduling] = useState(false);"""

content = content.replace(old_state, new_state)

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
