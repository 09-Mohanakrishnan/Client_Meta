import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../services/api';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Shield, UserX, UserPlus, Check, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserManagementPage = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('VIEWER');

  // Fetch Users
  const { data: usersRes, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await API.get('/users');
      return res.data?.data || [];
    },
  });

  const users = usersRes || [];

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      const res = await API.post('/users', userData);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(data.message || 'User created successfully');
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create user');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const res = await API.patch(`/users/${id}`, updates);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(data.message || 'User updated successfully');
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update user');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id) => {
      const res = await API.delete(`/users/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(data.message || 'User deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    },
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('VIEWER');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // Leave blank by default
    setRole(user.role);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and Email are required');
      return;
    }

    if (editingUser) {
      const updates = { name, email, role };
      if (password) updates.password = password; // Only update password if provided
      updateUserMutation.mutate({ id: editingUser._id, updates });
    } else {
      if (!password) {
        toast.error('Password is required for new users');
        return;
      }
      createUserMutation.mutate({ name, email, password, role });
    }
  };

  const handleDelete = (user) => {
    if (user._id === currentUser._id) {
      toast.error('You cannot delete your own account');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user '${user.name}'?`)) {
      deleteUserMutation.mutate(user._id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <RefreshCw size={24} className="text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-xs text-red-500">
        Error loading users: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">User Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage console operators, edit roles, and assign passwords.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus size={14} />
          <span>Add Operator</span>
        </button>
      </div>

      {/* Grid Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3">User Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">System Role</th>
                <th className="px-4 py-3">Created Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-gray-900">{u.name}</td>
                  <td className="px-4 py-3.5 font-mono text-gray-600">{u.email}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : u.role === 'ADMIN'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : u.role === 'EDITOR'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}
                    >
                      <Shield size={10} />
                      <span>{u.role.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-3.5 text-right space-x-1">
                    <button
                      onClick={() => openEditModal(u)}
                      className="inline-flex rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={u._id === currentUser._id}
                      className="inline-flex rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-150 px-6 py-4 bg-gray-50/50">
              <h2 className="text-sm font-semibold text-gray-900">
                {editingUser ? `Edit Operator: ${editingUser.name}` : 'Create System Operator'}
              </h2>
              <button onClick={closeModal} className="rounded p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Password {editingUser && <span className="text-[9px] text-gray-400 normal-case">(Leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  required={!editingUser}
                  minLength="6"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">System Authorization Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                >
                  <option value="VIEWER">Viewer (Read-only)</option>
                  <option value="EDITOR">Editor (Create/Edit, no delete)</option>
                  <option value="ADMIN">Admin (Create/Edit/Delete, manage columns)</option>
                  <option value="SUPER_ADMIN">Super Admin (Full Console Access)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-150 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Check size={14} />
                  <span>{editingUser ? 'Save Changes' : 'Create Operator'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
