with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

content = "import toast from 'react-hot-toast';\n" + content

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
