import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

old_logic = """        if (isMissing) {
          shiftsToCover.push({"""

new_logic = """        if (isMissing) {
          // Controlla se il turno è già stato coperto da un intervento (ScheduleEntry)
          // Consideriamo coperto se esiste un intervento nella stessa data, con lo stesso nome cantiere,
          // che copre approssimativamente quegli orari (margine di 30 minuti).
          const isCovered = scheduleEntries.some(entry => {
             if (entry.date !== day.date) return false;
             // Match del nome cantiere
             if (!entry.taskDescription.toUpperCase().includes(ws.name.toUpperCase())) return false;
             
             // Check orari
             const eStart = parseTime(entry.startTime);
             const eEnd = parseTime(entry.endTime);
             const sStart = parseTime(shift.startTime);
             const sEnd = parseTime(shift.endTime);
             
             // Considerato coperto se c'è un minimo di sovrapposizione o corrispondenza
             return (eStart <= sStart + 60 && eEnd >= sEnd - 60);
          });

          if (!isCovered) {
            shiftsToCover.push({"""

content = content.replace(old_logic, new_logic)
content = content.replace("            missingReason: reason\n          });\n        }", "            missingReason: reason\n          });\n          }\n        }")

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
