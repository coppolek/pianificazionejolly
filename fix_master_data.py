import re

with open('src/pages/MasterDataPage.tsx', 'r') as f:
    lines = f.readlines()

bad_lines = []

# Find indices of {editingAssignmentsEmpId && (
for i, line in enumerate(lines):
    if "{editingAssignmentsEmpId && (" in line:
        bad_lines.append(i)

# We want to keep the one inside OperatoriSection.
# OperatoriSection starts at line 424 and ends around 535. 
# So the index around 526 is the correct one. The ones at 301, 346, 413 are wrong.

indices_to_delete = []
for idx in bad_lines:
    if idx < 500: # before OperatoriSection
        indices_to_delete.extend(range(idx, idx+7))

# Also need to remove the multiple insertions of it? Wait, 526 is in OperatoriSection, which is correct.
# Wait, let's just delete the exact lines for the ones we don't want.

new_lines = []
for i, line in enumerate(lines):
    if i not in indices_to_delete:
        new_lines.append(line)

with open('src/pages/MasterDataPage.tsx', 'w') as f:
    f.writelines(new_lines)

