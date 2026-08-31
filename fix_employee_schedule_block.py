import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# Add onDropNew to EmployeeScheduleBlock instantiation
old_inst = "onDropEntry={(entryId, date, employeeId) => updateScheduleEntry(entryId, { date, employeeId })}"
new_inst = """onDropEntry={(entryId, date, employeeId) => updateScheduleEntry(entryId, { date, employeeId })}
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
content = content.replace(old_inst, new_inst)

# Check if there are duplicate onDropNew declarations due to my previous script
content = content.replace("onDropEntry={handleDropEntry}", "onDropEntry={handleDropEntry}") # Does nothing just a check

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)

