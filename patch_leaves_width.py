import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

content = content.replace('<div className="mt-8 min-w-[1200px] grid grid-cols-1 xl:grid-cols-2 gap-8">', '<div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">')

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
