import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ShieldCheck, ShieldAlert, Users, Trash2, UserPlus, X, User as UserIcon } from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  allUsers: User[];
  onUpdateRole: (userId: string, newRole: UserRole) => void;
  onDeleteUser: (userId: string) => void;
  onAddUser: (name: string, email: string, department: string, role: UserRole) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  allUsers,
  onUpdateRole,
  onDeleteUser,
  onAddUser,
}) => {
  // State for Add User Modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDept, setNewUserDept] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('student');

  if (currentUser.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-red-50 border border-red-200 rounded-2xl text-red-700 my-12">
        <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-sm">You must be logged in as an Administrator (mpigome44@gmail.com) to access this page.</p>
      </div>
    );
  }

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    onAddUser(newUserName, newUserEmail, newUserDept, newUserRole);
    
    // Reset form and close modal
    setNewUserName('');
    setNewUserEmail('');
    setNewUserDept('');
    setNewUserRole('student');
    setIsAddUserModalOpen(false);
  };

  const renderAvatar = (avatarUrl?: string, name?: string) => {
    // If the image is from unsplash (sample data), or undefined, render a blank profile.
    // Otherwise, assume it's a real Google OAuth profile picture.
    const isSampleImage = avatarUrl?.includes('unsplash.com');
    const hasValidGoogleImage = avatarUrl && !isSampleImage;

    if (hasValidGoogleImage) {
      return (
        <img 
          src={avatarUrl} 
          alt={name} 
          className="w-10 h-10 rounded-xl object-cover border border-slate-200" 
          // Required to successfully load external Google profile images
          referrerPolicy="no-referrer" 
        />
      );
    }

    return (
      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400">
        <UserIcon className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
      
      {/* Header section */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">System User & Role Administration</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Logged in as Super Admin: <span className="text-amber-400 font-mono">{currentUser.email}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 animate-fadeIn">
        {/* Quick Metrics Bar & Add User Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-50 border border-cyan-200 p-2.5 rounded-xl">
              <Users className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Managed Accounts</p>
              <p className="text-lg font-extrabold text-slate-900">{allUsers.length} Active System Users</p>
            </div>
          </div>

          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="px-5 py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-xl text-xs font-extrabold transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>

        {/* Table section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-900">
          <div className="p-5 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-800">User Access Directory</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">User Details</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Current Role</th>
                  <th className="px-6 py-3.5 text-right">Role Authorization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {renderAvatar(user.avatarUrl, user.name)}
                        <div>
                          <p className="font-extrabold text-slate-900">{user.name}</p>
                          <p className="text-[11px] font-mono text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {user.department || 'General Member'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : user.role === 'instructor'
                            ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end space-x-3">
                      <select
                        value={user.role}
                        onChange={(e) => onUpdateRole(user.id, e.target.value as UserRole)}
                        className="px-3 py-1.5 bg-white border border-slate-300 text-slate-800 font-bold text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] cursor-pointer shadow-sm"
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        title="Delete User"
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-[#0EA5E9]" />
                <span>Add New Platform User</span>
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Yohanes Pigome"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. yohanes@jasaprimapapua.co.id"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department / Division</label>
                <input
                  type="text"
                  value={newUserDept}
                  onChange={(e) => setNewUserDept(e.target.value)}
                  placeholder="e.g. Heavy Equipment & Logistics"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Assignment</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E9]"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
