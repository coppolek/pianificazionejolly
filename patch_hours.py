import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# Fix handleAutoSchedule
old_auto_hours = """        let shiftHours = shiftEnd - shiftStart;
        if (shiftHours < 0) shiftHours += 24;"""

new_auto_hours = """        let shiftHours = (shiftEnd - shiftStart) / 60;
        if (shiftHours < 0) shiftHours += 24;"""
        
content = content.replace(old_auto_hours, new_auto_hours)

# Fix onDropNew
old_drop_hours = """              if (start !== null && end !== null) {
                hours = (end - start) / 60;
              }"""

new_drop_hours = """              if (start !== null && end !== null) {
                hours = (end - start) / 60;
                if (hours < 0) hours += 24;
              }"""

content = content.replace(old_drop_hours, new_drop_hours)

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
