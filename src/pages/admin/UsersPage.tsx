import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'super-admin' | 'admin' | 'professor';
  createdAt: any;
  status: 'active' | 'archived';
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<'all' | 'super-admin' | 'admin' | 'professor'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<'super-admin' | 'admin' | 'professor'>('professor');

  // Check if user is super-admin
  if (currentUser?.role !== 'super-admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only super admins can manage users.</p>
        </div>
      </div>
    );
  }

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        
        const usersData: UserData[] = [];
        snapshot.forEach((doc) => {
          usersData.push({
            uid: doc.id,
            ...doc.data(),
          } as UserData);
        });
        
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRole && matchesStatus && matchesSearch;
  });

  const handleArchiveUser = async (userId: string, userEmail: string) => {
    if (userId === currentUser?.uid) {
      alert('You cannot archive yourself');
      return;
    }

    if (confirm(`Archive ${userEmail}?`)) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          status: 'archived'
        });
        setUsers(users.map(u => u.uid === userId ? { ...u, status: 'archived' } : u));
      } catch (error) {
        console.error('Error archiving user:', error);
        alert('Failed to archive user');
      }
    }
  };

  const handleRestoreUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'active'
      });
      setUsers(users.map(u => u.uid === userId ? { ...u, status: 'active' } : u));
    } catch (error) {
      console.error('Error restoring user:', error);
      alert('Failed to restore user');
    }
  };

  const handleUpdateRole = async (userId: string, userEmail: string, newRole: 'super-admin' | 'admin' | 'professor') => {
    if (userId === currentUser?.uid) {
      alert('You cannot change your own role');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
      setUsers(users.map(u => u.uid === userId ? { ...u, role: newRole } : u));
      setEditingUserId(null);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">Manage users, assign roles, and archive inactive users.</p>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            >
              <option value="all">All Roles</option>
              <option value="super-admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="professor">Professor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.displayName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                    <td className="px-6 py-4 text-sm">
                      {editingUserId === u.uid ? (
                        <div className="flex gap-2">
                          <select
                            value={editingRole}
                            onChange={(e) => setEditingRole(e.target.value as any)}
                            className="rounded border border-gray-300 px-2 py-1 text-sm"
                          >
                            <option value="super-admin">Super Admin</option>
                            <option value="admin">Admin</option>
                            <option value="professor">Professor</option>
                          </select>
                          <button
                            onClick={() => handleUpdateRole(u.uid, u.email, editingRole)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => {
                            setEditingUserId(u.uid);
                            setEditingRole(u.role);
                          }}
                          className="inline-block cursor-pointer rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-200"
                        >
                          {u.role === 'super-admin' ? '👑 Super Admin' : u.role === 'admin' ? '👨‍💼 Admin' : '👨‍🎓 Professor'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        u.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {u.status === 'active' ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {u.status === 'active' ? (
                        <button
                          onClick={() => handleArchiveUser(u.uid, u.email)}
                          disabled={u.uid === currentUser?.uid}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={u.uid === currentUser?.uid ? 'Cannot archive yourself' : 'Archive user'}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestoreUser(u.uid)}
                          className="text-green-600 hover:text-green-900"
                          title="Restore user"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            Total Users: <strong>{users.length}</strong> | 
            Active: <strong>{users.filter(u => u.status === 'active').length}</strong> | 
            Archived: <strong>{users.filter(u => u.status === 'archived').length}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
