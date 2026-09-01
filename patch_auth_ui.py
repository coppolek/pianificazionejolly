import re

# MasterDataPage
with open('src/pages/MasterDataPage.tsx', 'r') as f:
    content = f.read()

# Add a CSS class conditionally to action buttons
def hide_if_not_admin(match):
    return match.group(0).replace('className="', 'className={`${!isAdmin ? "hidden" : ""} ')

# Pattern to find buttons inside td (table cells) for Edit/Delete
content = re.sub(r'(<button[^>]*onClick=\{[^>]*setEditingEmployee[^>]*>[^<]*<Edit2)', hide_if_not_admin, content)
content = re.sub(r'(<button[^>]*onClick=\{[^>]*handleDeleteEmployee[^>]*>[^<]*<Trash2)', hide_if_not_admin, content)
content = re.sub(r'(<button[^>]*onClick=\{[^>]*setEditingWorkSite[^>]*>[^<]*<Edit2)', hide_if_not_admin, content)
content = re.sub(r'(<button[^>]*onClick=\{[^>]*handleDeleteWorkSite[^>]*>[^<]*<Trash2)', hide_if_not_admin, content)

# Aggiungi Operatore / Cantiere
content = re.sub(r'(<button[^>]*onClick=\{[^>]*setIsAddingEmployee\(true\)[^>]*>)', hide_if_not_admin, content)
content = re.sub(r'(<button[^>]*onClick=\{[^>]*setIsAddingWorkSite\(true\)[^>]*>)', hide_if_not_admin, content)

with open('src/pages/MasterDataPage.tsx', 'w') as f:
    f.write(content)

# LeaveRequestsPage
with open('src/pages/LeaveRequestsPage.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'(<button[^>]*onClick=\{[^>]*setEditingRequest[^>]*>[^<]*<Edit2)', hide_if_not_admin, content)
content = re.sub(r'(<button[^>]*onClick=\{[^>]*deleteLeaveRequest[^>]*>[^<]*<Trash2)', hide_if_not_admin, content)
content = re.sub(r'(<button[^>]*onClick=\{[^>]*setIsAdding\(true\)[^>]*>)', hide_if_not_admin, content)

with open('src/pages/LeaveRequestsPage.tsx', 'w') as f:
    f.write(content)

