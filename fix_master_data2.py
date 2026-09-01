import re

with open('src/pages/MasterDataPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("</button>}", "</button>")

with open('src/pages/MasterDataPage.tsx', 'w') as f:
    f.write(content)
