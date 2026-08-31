import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# Add onDropNew to DayColumn
daycol_sig_old = "key?: React.Key, day: any, employeeId: string, isLast: boolean, entries: ScheduleEntry[], onDelete: (id: string) => void, onAdd: () => void, onEdit: (entry: ScheduleEntry) => void, onDropEntry: (entryId: string, date: string, employeeId: string) => void"
daycol_sig_new = daycol_sig_old + ", onDropNew: (shiftData: any, date: string, employeeId: string) => void"

content = content.replace(
    "day, employeeId, isLast, entries, onDelete, onAdd, onEdit, onDropEntry",
    "day, employeeId, isLast, entries, onDelete, onAdd, onEdit, onDropEntry, onDropNew"
)
content = content.replace(daycol_sig_old, daycol_sig_new)

handle_drop_old = """  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const entryId = e.dataTransfer.getData('text/plain');
    if (entryId) {"""
handle_drop_new = """  const handleDrop = (e: React.DragEvent) => {
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
    if (entryId) {"""

content = content.replace(handle_drop_old, handle_drop_new)

# Add onDropNew to EmployeeScheduleBlock
empblock_sig_old = "key?: React.Key, employee: any, weekDays: any[], entries: ScheduleEntry[], onDelete: (id: string) => void, onUpdate: (id: string, name: string) => void, onAdd: (date: string) => void, onEdit: (entry: ScheduleEntry) => void, onDropEntry: (entryId: string, date: string, employeeId: string) => void"
empblock_sig_new = empblock_sig_old + ", onDropNew: (shiftData: any, date: string, employeeId: string) => void"

content = content.replace(
    "employee, weekDays, entries, onDelete, onUpdate, onAdd, onEdit, onDropEntry",
    "employee, weekDays, entries, onDelete, onUpdate, onAdd, onEdit, onDropEntry, onDropNew"
)
content = content.replace(empblock_sig_old, empblock_sig_new)

# Pass onDropNew down in EmployeeScheduleBlock
content = content.replace(
    "onDropEntry={onDropEntry}",
    "onDropEntry={onDropEntry}\n            onDropNew={onDropNew}"
)

# Pass onDropNew in SchedulePage
content = content.replace(
    "onDropEntry={handleDropEntry}",
    """onDropEntry={handleDropEntry}
                onDropNew={(shiftData, date, employeeId) => {
                  let hours = 0;
                  const start = parseTime(shiftData.startTime);
                  const end = parseTime(shiftData.endTime);
                  if (start !== null && end !== null) {
                    hours = (end - start) / 60;
                  }
                  setModalData({
                    employeeId,
                    date,
                    startTime: shiftData.startTime,
                    endTime: shiftData.endTime,
                    taskDescription: shiftData.workSiteName,
                    hours: hours > 0 ? hours : undefined
                  });
                }}"""
)

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)

