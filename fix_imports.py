import re
with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

content = content.replace("} , AppNotification }", ", AppNotification }")
with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)
