import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

old_end = """        </div>
      )}
    </div>
  );
}"""

new_end = """        </div>
      )}
      </div>
    </div>
  );
}"""

content = content.replace(old_end, new_end)

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
