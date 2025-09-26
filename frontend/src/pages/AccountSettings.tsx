import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const roleToChangePasswordEndpoint: Record<string, string | null> = {
    OrganizationAdmin: '/auth/org/change-password',
    DepartmentAdmin: '/auth/department/change-password',
    Staff: '/auth/staff/change-password',
    MasterAdmin: null,
    Student: null,
  };

  // In some deployments, OrganizationAdmin endpoint path may differ. We'll try these in order on 404.
  const endpointCandidatesByRole: Record<string, string[]> = {
    OrganizationAdmin: [
      '/auth/org/change-password',
      '/auth/organization/change-password',
      '/auth/organization-admin/change-password',
      '/auth/admin-org/change-password',
      '/auth/change-password',
      '/auth/org/update-password',
      '/auth/organization/update-password',
      '/auth/organization-admin/update-password',
      '/auth/org/password/change',
      '/auth/organization/password/change',
      '/organization-admin/change-password',
      '/organization/change-password',
      '/org/change-password'
    ],
    DepartmentAdmin: ['/auth/department/change-password'],
    Staff: ['/auth/staff/change-password'],
    MasterAdmin: [],
    Student: [],
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('You must be signed in to change your password');
      return;
    }

    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    const endpoint = roleToChangePasswordEndpoint[user.role] || null;
    if (!endpoint) {
      setError('Password change is not available for this role.');
      return;
    }

    try {
      setSubmitting(true);
      // Try primary endpoint first; if 404, try alternatives for this role
      const candidates = endpointCandidatesByRole[user.role] && endpointCandidatesByRole[user.role].length
        ? endpointCandidatesByRole[user.role]
        : [endpoint];
      let succeeded = false;
      let lastErr: any = null;
      const methods: Array<'post' | 'put' | 'patch'> = ['post', 'put', 'patch'];
      for (const ep of candidates) {
        let epSucceeded = false;
        for (const method of methods) {
          try {
            await (api as any)[method](ep, { oldPassword: currentPassword, newPassword });
            epSucceeded = true;
            break;
          } catch (err: any) {
            const status = err?.response?.status;
            lastErr = err;
            if (status === 404 || status === 405) {
              // Try next method or endpoint
              continue;
            }
            // For other errors, stop immediately
            throw err;
          }
        }
        if (epSucceeded) {
          succeeded = true;
          break;
        }
      }
      if (!succeeded) {
        // Exhausted all candidates
        throw lastErr || new Error('Change password endpoint not found');
      }
      setSuccess('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Account Settings</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Change your password.</p>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Email</label>
        <input className="w-full p-2 border rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" value={user?.email || ''} disabled />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Current Password</label>
          <input type="password" className="input-field" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">New Password</label>
          <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Confirm New Password</label>
          <input type="password" className="input-field" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} required />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

        <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50">
          {submitting ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default AccountSettings;
