import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

old_modal = """    if (overlap && !overlapWarning) {
      setOverlapWarning(`L'orario si accavalla con "${overlap.taskDescription}" (${overlap.startTime} - ${overlap.endTime}). Clicca di nuovo su "Salva" per forzare l'inserimento.`);
      return;
    }"""

new_modal = """    if (overlap && !overlapWarning) {
      setOverlapWarning(`L'orario si accavalla con "${overlap.taskDescription}" (${overlap.startTime} - ${overlap.endTime}). Clicca di nuovo su "Salva" per forzare l'inserimento.`);
      toast.error(`Sovrapposizione con "${overlap.taskDescription}" (${overlap.startTime} - ${overlap.endTime})`);
      return;
    }"""

content = content.replace(old_modal, new_modal)

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
