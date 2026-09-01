import re

with open('src/pages/LeaveRequestsPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("</button>}", "</button>")
content = content.replace("</select> : <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(req.status || 'pending')}`}>{getStatusLabel(req.status || 'pending')}</span>}", "</select>")
content = content.replace("{isAdmin ? <select\n                          value={req.status || 'pending'}", "<select\n                          value={req.status || 'pending'}")

# Now let's do a more robust regex or just leave the buttons but set disabled={!isAdmin} which is much easier and standard!
with open('src/pages/LeaveRequestsPage.tsx', 'w') as f:
    f.write(content)
