import re

with open('src/types.ts', 'r') as f:
    content = f.read()

new_types = """
export type UserRole = 'admin' | 'operator';

export interface UserRoleData {
  email: string;
  role: UserRole;
}
"""

content = content + new_types

with open('src/types.ts', 'w') as f:
    f.write(content)
