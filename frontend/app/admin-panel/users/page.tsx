'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getDbInstance } from '@/lib/firebase/config';
import UserAddressesModal from './UserAddressesModal';

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
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [addressesModalUser, setAddressesModalUser] = useState<{ id: string; name: string } | null>(null);
  const [newUserData, setNewUserData] = useState<any>({
    email: '',
    role: 'b2c',
    status: 'pending',
    preferredLanguage: 'it',
  });

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

        // Verify which users still exist in Firebase Auth
        const userIds = usersData.map(u => u.id);
        const verifyResponse = await fetch('/api/users/verify-exists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds })
        });

        if (verifyResponse.ok) {
          const { results } = await verifyResponse.json();

          // Delete orphaned users (those that don't exist in Auth)
          const orphanedUsers = usersData.filter(u => results[u.id] === false);

          if (orphanedUsers.length > 0) {
            console.log(`🗑️ Found ${orphanedUsers.length} orphaned users, deleting...`);

            for (const orphanedUser of orphanedUsers) {
              try {
                const userRef = doc(db, 'users', orphanedUser.id);
                await deleteDoc(userRef);
                console.log(`✅ Deleted orphaned user: ${orphanedUser.email} (${orphanedUser.id})`);
              } catch (err) {
                console.error(`❌ Failed to delete user ${orphanedUser.id}:`, err);
              }
            }

            // Filter out deleted users
            const validUsers = usersData.filter(u => results[u.id] !== false);

            // Sort by createdAt (newest first)
            validUsers.sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || 0;
              const bTime = b.createdAt?.toMillis?.() || 0;
              return bTime - aTime;
            });

            setUsers(validUsers);

            if (orphanedUsers.length > 0) {
              alert(`Eliminati ${orphanedUsers.length} utenti orfani (presenti in Firestore ma non in Firebase Auth)`);
            }
          } else {
            // Sort by createdAt (newest first)
            usersData.sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || 0;
              const bTime = b.createdAt?.toMillis?.() || 0;
              return bTime - aTime;
            });

            setUsers(usersData);
          }
        } else {
          console.warn('Failed to verify users, showing all');

          // Sort by createdAt (newest first)
          usersData.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });

          setUsers(usersData);
        }
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
    if (!confirm(`Sei sicuro di voler eliminare l'utente ${userEmail}?\n\nQuesta azione è irreversibile e eliminerà l'utente sia da Firebase Auth che da Firestore!`)) {
      return;
    }

    try {
      // Call API to delete from both Auth and Firestore
      const response = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante l\'eliminazione');
      }

      // Update local state
      setUsers(users.filter(u => u.id !== userId));
      alert('Utente eliminato con successo da Firebase Auth e Firestore!');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Errore: ' + error.message);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({ ...user });
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !editFormData) return;

    try {
      const db = getDbInstance();
      const userRef = doc(db, 'users', editingUser.id);

      // Remove undefined values and id
      const updateData = { ...editFormData };
      delete updateData.id;
      delete updateData.createdAt;
      Object.keys(updateData).forEach(key =>
        updateData[key] === undefined && delete updateData[key]
      );

      updateData.updatedAt = new Date();

      await updateDoc(userRef, updateData);

      // Update local state
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updateData } : u));

      setEditingUser(null);
      setEditFormData(null);
      alert('Utente aggiornato con successo');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Errore durante l\'aggiornamento dell\'utente');
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!confirm(`Inviare email di reset password a ${email}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Email di reset password inviata con successo!');
      } else {
        throw new Error(data.error || 'Errore durante il reset password');
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      alert('Errore: ' + error.message);
    }
  };

  const handleCreateUser = async () => {
    try {
      // Validate required fields
      if (!newUserData.email) {
        alert('Email è obbligatoria');
        return;
      }

      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Utente creato con successo! L\'utente riceverà un\'email per impostare la password.');
        setShowCreateModal(false);
        setNewUserData({
          email: '',
          role: 'b2c',
          status: 'pending',
          preferredLanguage: 'it',
        });

        // Reload users
        window.location.reload();
      } else {
        throw new Error(data.error || 'Errore durante la creazione utente');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert('Errore: ' + error.message);
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestione Utenti</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                {users.length}
              </span>
              utenti registrati nel sistema
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Aggiungi Utente
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Filtra per Status</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Tutti
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  filter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {users.length}
                </span>
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filter === 'pending'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Pendenti
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  filter === 'pending' ? 'bg-white/20 text-white' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {pendingCount}
                </span>
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filter === 'active'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Attivi
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  filter === 'active' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                }`}>
                  {users.filter(u => u.status === 'active').length}
                </span>
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filter === 'inactive'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Disattivi
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  filter === 'inactive' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                }`}>
                  {users.filter(u => u.status === 'inactive').length}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Filtra per Ruolo</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  roleFilter === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Tutti i Ruoli
              </button>
              <button
                onClick={() => setRoleFilter('admin')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  roleFilter === 'admin'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                👑 Admin
              </button>
              <button
                onClick={() => setRoleFilter('b2b')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  roleFilter === 'b2b'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                🏢 B2B
              </button>
              <button
                onClick={() => setRoleFilter('b2c')}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  roleFilter === 'b2c'
                    ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-lg shadow-teal-500/30'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                👤 B2C
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-lg rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Utente
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Ruolo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Codice Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Registrato
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
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
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors border-b border-gray-100 last:border-0">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                          {u.role === 'b2b'
                            ? (u.ragioneSociale?.[0] || 'B').toUpperCase()
                            : ((u.nome?.[0] || '') + (u.cognome?.[0] || '')).toUpperCase() || 'U'
                          }
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {u.role === 'b2b' ? u.ragioneSociale : `${u.nome || ''} ${u.cognome || ''}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {u.role === 'admin' ? '👑 Amministratore' : u.role === 'b2b' ? '🏢 Business' : '👤 Privato'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{u.email}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value as any)}
                        className={`text-xs font-bold px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer ${
                          u.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 focus:ring-purple-500'
                            : u.role === 'b2b'
                            ? 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100 focus:ring-cyan-500'
                            : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 focus:ring-teal-500'
                        }`}
                      >
                        <option value="admin">👑 Admin</option>
                        <option value="b2b">🏢 B2B</option>
                        <option value="b2c">👤 B2C</option>
                      </select>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <input
                        type="text"
                        value={u.clientCode || ''}
                        onChange={(e) => handleUpdateClientCode(u.id, e.target.value)}
                        placeholder="es. CLI001"
                        className="text-sm px-3 py-2 border-2 border-gray-200 rounded-lg w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-colors"
                        title="Codice cliente nel gestionale MySQL"
                      />
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <select
                        value={u.status}
                        onChange={(e) => handleUpdateStatus(u.id, e.target.value as any)}
                        className={`px-3 py-2 text-xs font-bold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer ${
                          u.status === 'active'
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 focus:ring-green-500'
                            : u.status === 'pending'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 focus:ring-yellow-500'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 focus:ring-red-500'
                        }`}
                      >
                        <option value="pending">⏳ Pendente</option>
                        <option value="active">✅ Attivo</option>
                        <option value="inactive">🚫 Disattivo</option>
                      </select>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {u.createdAt?.toDate?.()?.toLocaleDateString('it-IT') || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditUser(u)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                          title="Modifica utente"
                        >
                          ✏️ Modifica
                        </button>
                        <button
                          onClick={() => setAddressesModalUser({
                            id: u.id,
                            name: u.ragioneSociale || `${u.nome || ''} ${u.cognome || ''}`.trim() || u.email
                          })}
                          className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                          title="Gestisci indirizzi"
                        >
                          📍 Indirizzi
                        </button>
                        <button
                          onClick={() => handleResetPassword(u.email)}
                          className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
                          title="Reset password"
                        >
                          🔑 Reset
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                          title="Elimina utente"
                        >
                          🗑️ Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Modifica Utente: {editingUser.email}
              </h2>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setEditFormData(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Common Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Codice Cliente</label>
                  <input
                    type="text"
                    value={editFormData.clientCode || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, clientCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="es. CLI001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lingua Preferita</label>
                  <select
                    value={editFormData.preferredLanguage || 'it'}
                    onChange={(e) => setEditFormData({ ...editFormData, preferredLanguage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="it">Italiano</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                    <option value="pt">Português</option>
                    <option value="hr">Hrvatski</option>
                    <option value="sl">Slovenščina</option>
                    <option value="el">Ελληνικά</option>
                  </select>
                </div>
              </div>

              {/* B2C Fields */}
              {editingUser.role === 'b2c' && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dati Personali</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                        <input
                          type="text"
                          value={editFormData.nome || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
                        <input
                          type="text"
                          value={editFormData.cognome || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, cognome: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale</label>
                        <input
                          type="text"
                          value={editFormData.codiceFiscale || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, codiceFiscale: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA</label>
                        <input
                          type="text"
                          value={editFormData.partitaIva || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, partitaIva: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefono *</label>
                        <input
                          type="tel"
                          value={editFormData.telefono || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Indirizzo di Spedizione</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Via *</label>
                        <input
                          type="text"
                          value={editFormData.indirizzoSpedizione?.via || ''}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            indirizzoSpedizione: { ...editFormData.indirizzoSpedizione, via: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Città *</label>
                        <input
                          type="text"
                          value={editFormData.indirizzoSpedizione?.citta || ''}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            indirizzoSpedizione: { ...editFormData.indirizzoSpedizione, citta: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CAP *</label>
                        <input
                          type="text"
                          value={editFormData.indirizzoSpedizione?.cap || ''}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            indirizzoSpedizione: { ...editFormData.indirizzoSpedizione, cap: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
                        <input
                          type="text"
                          value={editFormData.indirizzoSpedizione?.provincia || ''}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            indirizzoSpedizione: { ...editFormData.indirizzoSpedizione, provincia: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Paese *</label>
                        <input
                          type="text"
                          value={editFormData.indirizzoSpedizione?.paese || ''}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            indirizzoSpedizione: { ...editFormData.indirizzoSpedizione, paese: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* B2B Fields */}
              {editingUser.role === 'b2b' && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dati Azienda</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ragione Sociale *</label>
                        <input
                          type="text"
                          value={editFormData.ragioneSociale || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, ragioneSociale: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA *</label>
                        <input
                          type="text"
                          value={editFormData.partitaIva || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, partitaIva: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Codice SDI *</label>
                        <input
                          type="text"
                          value={editFormData.codiceSDI || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, codiceSDI: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Indirizzo di Fatturazione</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Via *</label>
                        <input
                          type="text"
                          value={editFormData.indirizzoFatturazione?.via || ''}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            indirizzoFatturazione: { ...editFormData.indirizzoFatturazione, via: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Città *</label>
                        <input
                          type="text"
                          value={editFormData.indirizzoFatturazione?.citta || ''}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            indirizzoFatturazione: { ...editFormData.indirizzoFatturazione, citta: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CAP *</label>
                        <input
                          type="text"
                          value={editFormData.indirizzoFatturazione?.cap || ''}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            indirizzoFatturazione: { ...editFormData.indirizzoFatturazione, cap: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
                        <input
                          type="text"
                          value={editFormData.indirizzoFatturazione?.provincia || ''}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            indirizzoFatturazione: { ...editFormData.indirizzoFatturazione, provincia: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Paese *</label>
                        <input
                          type="text"
                          value={editFormData.indirizzoFatturazione?.paese || ''}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            indirizzoFatturazione: { ...editFormData.indirizzoFatturazione, paese: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Referente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Referente *</label>
                        <input
                          type="text"
                          value={editFormData.referente?.nome || ''}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            referente: { ...editFormData.referente, nome: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Referente *</label>
                        <input
                          type="email"
                          value={editFormData.referente?.email || ''}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            referente: { ...editFormData.referente, email: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefono Referente *</label>
                        <input
                          type="tel"
                          value={editFormData.referente?.telefono || ''}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            referente: { ...editFormData.referente, telefono: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Admin Fields */}
              {editingUser.role === 'admin' && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Dati Admin</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                      <input
                        type="text"
                        value={editFormData.nome || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
                      <input
                        type="text"
                        value={editFormData.cognome || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, cognome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingUser(null);
                  setEditFormData(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Crea Nuovo Utente
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">L&apos;utente riceverà un&apos;email per impostare la password</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo *</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="b2c">B2C (Cliente Privato)</option>
                    <option value="b2b">B2B (Azienda)</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newUserData.status}
                    onChange={(e) => setNewUserData({ ...newUserData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pendente</option>
                    <option value="active">Attivo</option>
                    <option value="inactive">Disattivo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lingua Preferita</label>
                  <select
                    value={newUserData.preferredLanguage || 'it'}
                    onChange={(e) => setNewUserData({ ...newUserData, preferredLanguage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="it">Italiano</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                    <option value="pt">Português</option>
                    <option value="hr">Hrvatski</option>
                    <option value="sl">Slovenščina</option>
                    <option value="el">Ελληνικά</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Codice Cliente</label>
                  <input
                    type="text"
                    value={newUserData.clientCode || ''}
                    onChange={(e) => setNewUserData({ ...newUserData, clientCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="es. CLI001"
                  />
                </div>
              </div>

              {/* Role-specific fields */}
              {(newUserData.role === 'b2c' || newUserData.role === 'admin') && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Dati Personali</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                      <input
                        type="text"
                        value={newUserData.nome || ''}
                        onChange={(e) => setNewUserData({ ...newUserData, nome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
                      <input
                        type="text"
                        value={newUserData.cognome || ''}
                        onChange={(e) => setNewUserData({ ...newUserData, cognome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {newUserData.role === 'b2b' && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Dati Azienda</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ragione Sociale *</label>
                      <input
                        type="text"
                        value={newUserData.ragioneSociale || ''}
                        onChange={(e) => setNewUserData({ ...newUserData, ragioneSociale: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA *</label>
                        <input
                          type="text"
                          value={newUserData.partitaIva || ''}
                          onChange={(e) => setNewUserData({ ...newUserData, partitaIva: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Codice SDI *</label>
                        <input
                          type="text"
                          value={newUserData.codiceSDI || ''}
                          onChange={(e) => setNewUserData({ ...newUserData, codiceSDI: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Come funziona:</strong><br />
                  1. L&apos;utente riceverà un&apos;email per impostare la propria password<br />
                  2. Dopo aver impostato la password, potrà completare i dati mancanti (indirizzi, telefono, ecc.) dal proprio profilo<br />
                  3. Una volta completati i dati, l&apos;account sarà pronto all&apos;uso
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Crea Utente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Addresses Modal */}
      {addressesModalUser && (
        <UserAddressesModal
          userId={addressesModalUser.id}
          userName={addressesModalUser.name}
          isOpen={true}
          onClose={() => setAddressesModalUser(null)}
        />
      )}
    </div>
  );
}
