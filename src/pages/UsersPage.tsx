import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserRoleData, UserRole } from '../types';
import { Shield, ShieldAlert, ShieldCheck, Trash2, UserPlus, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function UsersPage() {
  const [users, setUsers] = useState<UserRoleData[]>([]);
  const { user: currentUser, isAdmin } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('operator');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    
    const unsubscribe = onSnapshot(collection(db, 'userRoles'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data() } as UserRoleData)));
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleUpdateRole = async (email: string, role: UserRole) => {
    try {
      if (email === currentUser?.email && role !== 'admin') {
        toast.error("Non puoi rimuovere i permessi di amministratore a te stesso.");
        return;
      }
      await setDoc(doc(db, 'userRoles', email), { email, role });
      toast.success('Ruolo aggiornato con successo');
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento del ruolo');
      console.error(error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    
    try {
      const emailLower = newEmail.toLowerCase().trim();
      await setDoc(doc(db, 'userRoles', emailLower), { email: emailLower, role: newRole });
      toast.success('Utente aggiunto con successo');
      setNewEmail('');
      setIsAdding(false);
    } catch (error) {
      toast.error("Errore durante l'aggiunta dell'utente");
      console.error(error);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (email === currentUser?.email) {
      toast.error("Non puoi eliminare te stesso.");
      return;
    }
    
    if (window.confirm(`Sei sicuro di voler revocare l'accesso a ${email}?`)) {
      try {
        await deleteDoc(doc(db, 'userRoles', email));
        toast.success('Utente rimosso con successo');
      } catch (error) {
        toast.error('Errore durante la rimozione dell\'utente');
        console.error(error);
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <ShieldAlert size={48} className="mb-4 text-rose-500" />
        <h2 className="text-xl font-medium">Accesso Negato</h2>
        <p className="mt-2 text-sm">Non hai i permessi necessari per visualizzare questa pagina.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-[#1e5b99]" />
            Gestione Utenti e Permessi
          </h2>
          <p className="text-sm text-gray-500 mt-1">Gestisci i ruoli e l'accesso all'applicazione.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#1e5b99] hover:bg-[#1a4f85] text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition-colors text-sm font-medium shrink-0"
        >
          {isAdding ? 'Annulla' : (
            <>
              <UserPlus size={18} />
              Aggiungi Utente
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 max-w-md">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Nuovo Accesso</h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="utente@azienda.it"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1e5b99] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ruolo</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#1e5b99] focus:outline-none"
              >
                <option value="operator">Operatore (Sola lettura / Ferie)</option>
                <option value="admin">Amministratore (Accesso completo)</option>
              </select>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-[#1e5b99] hover:bg-[#1a4f85] text-white px-4 py-2 rounded-md shadow-sm transition-colors text-sm font-medium w-full"
              >
                Autorizza Utente
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">Email</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Ruolo</th>
                <th className="px-6 py-4 font-semibold text-gray-700 w-20 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.email} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.role === 'admin' ? 'bg-[#1e5b99]' : 'bg-emerald-600'}`}>
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                      {u.email}
                      {u.email === currentUser?.email && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Tu</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u.email, e.target.value as UserRole)}
                      disabled={u.email === currentUser?.email}
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-[#1e5b99] focus:border-[#1e5b99] disabled:bg-gray-100 disabled:text-gray-500 py-1.5"
                    >
                      <option value="operator">Operatore</option>
                      <option value="admin">Amministratore</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteUser(u.email)}
                      disabled={u.email === currentUser?.email}
                      className="text-rose-500 hover:bg-rose-50 p-2 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                      title="Rimuovi accesso"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Nessun utente trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
