import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

const roleToChangePasswordEndpoint: Record<string, string | null> = {
  OrganizationAdmin: '/auth/org/change-password', // TODO: implement on backend if needed
  DepartmentAdmin: '/auth/department/change-password',
  Staff: '/auth/staff/change-password', // TODO: implement on backend if needed
  MasterAdmin: null,
  Student: null,
};

const dashboardByRole: Record<string, string> = {
  MasterAdmin: '/master-admin/dashboard',
  OrganizationAdmin: '/organization-admin/dashboard',
  DepartmentAdmin: '/department-admin/dashboard',
  Staff: '/staff/dashboard',
  Student: '/student/dashboard',
};

const ChangePassword: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) return;

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const endpoint = roleToChangePasswordEndpoint[user.role] || null;

    if (!endpoint) {
      setError('Password change is not available for this role yet.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${base}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('elog_token') || ''}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully');
      toast.success('Password changed successfully');
      // Clear the flag and send user to their dashboard
      updateUser({ requiresPasswordChange: false });
      const dest = dashboardByRole[user.role] || '/dashboard';
      navigate(dest, { replace: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to change password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold mb-1">Change Your Password</h1>
        <p className="text-sm text-gray-600 mb-6">You must set a new password before continuing.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="old">Current Password</label>
            <div className="relative">
              <input
                id="old"
                type={showOld ? 'text' : 'password'}
                className="w-full border rounded px-3 py-2 pr-20"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowOld((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900 px-2 py-1"
                aria-label={showOld ? 'Hide current password' : 'Show current password'}
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="new">New Password</label>
            <div className="relative">
              <input
                id="new"
                type={showNew ? 'text' : 'password'}
                className="w-full border rounded px-3 py-2 pr-20"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900 px-2 py-1"
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="confirm">Confirm New Password</label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                className="w-full border rounded px-3 py-2 pr-20"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900 px-2 py-1"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 text-white rounded px-4 py-2"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
