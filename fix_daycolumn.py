import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# Fix duplicate attribute
content = content.replace("            isLast={idx === 6} \n            entries={entries.filter(e => e.date === day.date)}\n            onDelete={onDelete}\n            onAdd={() => isAdmin && onAdd(day.date)}\n            onEdit={onEdit}\n            onDropEntry={onDropEntry}\n            onDropNew={onDropNew}\n            isLast={true}", 
"            entries={entries.filter(e => e.date === day.date)}\n            onDelete={onDelete}\n            onAdd={() => isAdmin && onAdd(day.date)}\n            onEdit={onEdit}\n            onDropEntry={onDropEntry}\n            onDropNew={onDropNew}\n            isLast={true}")

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
