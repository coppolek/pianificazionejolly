import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

old_bad = """        </div>
      </div>
      {/* Filter Bar */}"""

new_good = """        </div>
      {/* Filter Bar */}"""

content = content.replace(old_bad, new_good)

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
