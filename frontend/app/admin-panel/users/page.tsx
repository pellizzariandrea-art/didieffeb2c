'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getDbInstance } from '@/lib/firebase/config';

interface User {
  id: string;
  email: string;
  nome?: string;
  cognome?: string;
  ragioneSociale?: string;
  role: 'admin' | 'b2b' | 'b2c';
  status: 'pending' | 'active' | 'inactive';
  clientCode?: string;  // Codice cliente nel gestionale MySQL
  createdAt: any;
  lastLogin?: any;
}

export default function UsersManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'b2b' | 'b2c'>('all');

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);

  // Load users from Firestore
  useEffect(() => {
    async function loadUsers() {
      try {
        const db = getDbInstance();
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];

        // Sort by createdAt (newest first)
        usersData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: 'active' | 'inactive') => {
    try {
      const db = getDbInstance();
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { status: newStatus });

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Errore durante l\'aggiornamento dello status');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'b2b' | 'b2c') => {
    if (!confirm(`Sei sicuro di voler cambiare il ruolo di questo utente in "${newRole}"?`)) {
      return;
    }

    try {
      const db = getDbInstance();
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Errore durante l\'aggiornamento del ruolo');
    }
  };

  const handleUpdateClientCode = async (userId: string, newClientCode: string) => {
    try {
      const db = getDbInstance();
      const userRef = doc(db, 'users', userId);

      // Se vuoto, rimuovi il campo
      if (newClientCode.trim() === '') {
        await updateDoc(userRef, { clientCode: null });
        setUsers(users.map(u => u.id === userId ? { ...u, clientCode: undefined } : u));
      } else {
        await updateDoc(userRef, { clientCode: newClientCode.trim() });
        setUsers(users.map(u => u.id === userId ? { ...u, clientCode: newClientCode.trim() } : u));
      }
    } catch (error) {
      console.error('Error updating client code:', error);
      alert('Errore durante l\'aggiornamento del codice cliente');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Sei sicuro di voler eliminare l'utente ${userEmail}?\n\nQuesta azione è irreversibile!`)) {
      return;
    }

    try {
      const db = getDbInstance();
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);

      // Update local state
      setUsers(users.filter(u => u.id !== userId));
      alert('Utente eliminato con successo');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Errore durante l\'eliminazione dell\'utente');
    }
  };

  const filteredUsers = users.filter(u => {
    if (filter !== 'all' && u.status !== filter) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    return true;
  });

  const pendingCount = users.filter(u => u.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestione Utenti</h1>
        <p className="mt-2 text-sm text-gray-600">
          Approva, modifica o elimina gli utenti registrati
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutti ({users.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendenti ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Attivi ({users.filter(u => u.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'inactive'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Disattivi ({users.filter(u => u.status === 'inactive').length})
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ruolo</label>
          <div className="flex gap-2">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === 'admin'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setRoleFilter('b2b')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === 'b2b'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              B2B
            </button>
            <button
              onClick={() => setRoleFilter('b2c')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === 'b2c'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              B2C
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruolo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Codice Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registrato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Nessun utente trovato
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {u.role === 'b2b' ? u.ragioneSociale : `${u.nome || ''} ${u.cognome || ''}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value as any)}
                        className="text-xs font-medium px-2 py-1 rounded-full border"
                      >
                        <option value="admin">Admin</option>
                        <option value="b2b">B2B</option>
                        <option value="b2c">B2C</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={u.clientCode || ''}
                        onChange={(e) => handleUpdateClientCode(u.id, e.target.value)}
                        placeholder="es. CLI001"
                        className="text-xs px-2 py-1 border rounded w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Codice cliente nel gestionale MySQL"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          u.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : u.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.status === 'active' ? 'Attivo' : u.status === 'pending' ? 'Pendente' : 'Disattivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.createdAt?.toDate?.()?.toLocaleDateString('it-IT') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {u.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(u.id, 'active')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approva
                        </button>
                      )}
                      {u.status === 'active' && (
                        <button
                          onClick={() => handleUpdateStatus(u.id, 'inactive')}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Disattiva
                        </button>
                      )}
                      {u.status === 'inactive' && (
                        <button
                          onClick={() => handleUpdateStatus(u.id, 'active')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Riattiva
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
