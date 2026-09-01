import re

with open('src/context/AuthContext.tsx', 'r') as f:
    content = f.read()

import_repl = """import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: UserRole | null;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, userRole: null, isAdmin: false });
"""

content = re.sub(r"import React.*?const AuthContext = createContext<AuthContextType>\(\{ user: null, loading: true \}\);", import_repl, content, flags=re.DOTALL)

provider_repl = """export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.email) {
        try {
          const roleRef = doc(db, 'userRoles', currentUser.email.toLowerCase());
          const roleSnap = await getDoc(roleRef);
          
          if (!roleSnap.exists()) {
            // Auto-assign admin to specific email if missing
            const initialRole: UserRole = currentUser.email.toLowerCase() === 'coppolek@gmail.com' ? 'admin' : 'operator';
            await setDoc(roleRef, { email: currentUser.email.toLowerCase(), role: initialRole });
            setUserRole(initialRole);
          } else {
            setUserRole(roleSnap.data().role as UserRole);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole('operator'); // Default fallback
        }
      } else {
        setUserRole(null);
      }
      
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userRole, isAdmin: userRole === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};"""

content = re.sub(r"export const AuthProvider = \(\{ children \}: \{ children: ReactNode \}\) => \{.*?\};\n", provider_repl + "\n", content, flags=re.DOTALL)

with open('src/context/AuthContext.tsx', 'w') as f:
    f.write(content)
