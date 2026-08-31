import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

old_auto = """    } finally {
      setIsAutoScheduling(false);
    }
  };"""

new_auto = """      toast.success("Pianificazione automatica completata");
    } finally {
      setIsAutoScheduling(false);
    }
  };"""

content = content.replace(old_auto, new_auto)

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
