import re

with open('src/types.ts', 'r') as f:
    content = f.read()

if "export interface AppNotification" not in content:
    content += """
export interface AppNotification {
  id: string;
  createdAt: string;
  message: string;
}
"""

with open('src/types.ts', 'w') as f:
    f.write(content)
