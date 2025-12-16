import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { TrashIcon, CheckIcon, XMarkIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'super-admin' | 'admin' | 'professor';
  createdAt: any;
  status: 'active' | 'archived';
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [professors, setProfessors] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Check if user is admin (but not super-admin, since super-admins use the main UsersPage)
  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins can manage professors.</p>
        </div>
      </div>
    );
  }

  // Fetch professors
  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        // Query only professors
        const q = query(usersRef, where('role', '==', 'professor'));
        const snapshot = await getDocs(q);
        
        const professorsData: UserData[] = [];
        snapshot.forEach((doc) => {
          professorsData.push({
            uid: doc.id,
            ...doc.data(),
          } as UserData);
        });
        
        setProfessors(professorsData);
      } catch (error) {
        console.error('Error fetching professors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessors();
  }, []);

  // Filter professors
  const filteredProfessors = professors.filter((p) => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const handleArchiveProfessor = async (userId: string, userEmail: string) => {
    if (confirm(`Archive ${userEmail}?`)) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          status: 'archived'
        });
        setProfessors(professors.map(p => p.uid === userId ? { ...p, status: 'archived' } : p));
      } catch (error) {
        console.error('Error archiving professor:', error);
        alert('Failed to archive professor');
      }
    }
  };

  const handleRestoreProfessor = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'active'
      });
      setProfessors(professors.map(p => p.uid === userId ? { ...p, status: 'active' } : p));
    } catch (error) {
      console.error('Error restoring professor:', error);
      alert('Failed to restore professor');
    }
  };

  const handleMakeAdmin = async (userId: string, userEmail: string) => {
    if (confirm(`Make ${userEmail} an Admin?`)) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          role: 'admin'
        });
        // Remove from the list since they're no longer a professor
        setProfessors(professors.filter(p => p.uid !== userId));
        alert(`${userEmail} is now an Admin!`);
      } catch (error) {
        console.error('Error making professor admin:', error);
        alert('Failed to make professor an admin');
      }
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
          <h1 className="text-3xl font-bold text-gray-900">Professor Management</h1>
          <p className="mt-2 text-gray-600">Manage professors, assign as admin, and archive inactive users.</p>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
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

        {/* Professors Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProfessors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No professors found
                  </td>
                </tr>
              ) : (
                filteredProfessors.map((p) => (
                  <tr key={p.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.displayName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        p.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {p.status === 'active' ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-3">
                        {p.status === 'active' && (
                          <>
                            {/* Make Admin */}
                            <button
                              onClick={() => handleMakeAdmin(p.uid, p.email)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              title="Make Admin"
                            >
                              <ArrowUpIcon className="h-4 w-4" />
                              <span className="text-xs">Make Admin</span>
                            </button>
                            {/* Archive */}
                            <button
                              onClick={() => handleArchiveProfessor(p.uid, p.email)}
                              className="text-red-600 hover:text-red-900"
                              title="Archive professor"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {p.status === 'archived' && (
                          <button
                            onClick={() => handleRestoreProfessor(p.uid)}
                            className="text-green-600 hover:text-green-900"
                            title="Restore professor"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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
            Total Professors: <strong>{professors.length}</strong> | 
            Active: <strong>{professors.filter(p => p.status === 'active').length}</strong> | 
            Archived: <strong>{professors.filter(p => p.status === 'archived').length}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
