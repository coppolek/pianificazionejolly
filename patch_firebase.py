import re

with open('src/lib/firebase.ts', 'r') as f:
    content = f.read()

content = content.replace("import { getFirestore } from 'firebase/firestore';", "import { getFirestore } from 'firebase/firestore';\nimport { getAuth } from 'firebase/auth';")
content += "\nexport const auth = getAuth(app);\n"

with open('src/lib/firebase.ts', 'w') as f:
    f.write(content)
