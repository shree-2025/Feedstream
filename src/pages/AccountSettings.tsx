import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'edit' | 'verify'>('edit');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSending(true);
      await api.post('/auth/password/send-otp', {});
      setStep('verify');
      setSuccess('An OTP has been sent to your registered email. Please enter it below to confirm password change.');
    } catch (e: any) {
      setError(e?.error || 'Failed to send OTP');
    } finally {
      setSending(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!otp.trim()) {
      setError('Please enter the OTP sent to your email');
      return;
    }

    try {
      setVerifying(true);
      await api.post('/auth/password/verify', { otp: otp.trim(), newPassword });
      setSuccess('Your password has been changed successfully.');
      setStep('edit');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
    } catch (e: any) {
      setError(e?.error || 'Failed to verify OTP');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold mb-2">Account Settings</h1>
      <p className="text-sm text-gray-600 mb-6">Change your password using email OTP verification.</p>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <input className="w-full border rounded-lg px-3 py-2 bg-gray-100" value={user?.email || ''} disabled />
      </div>

      {step === 'edit' && (
        <form onSubmit={sendOtp} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">New Password</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Confirm New Password</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} required />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}

          <button type="submit" disabled={sending} className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50">
            {sending ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'verify' && (
        <form onSubmit={verifyOtp} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Enter OTP</label>
            <input className="w-full border rounded-lg px-3 py-2" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" required />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}

          <div className="flex gap-2">
            <button type="submit" disabled={verifying} className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50">
              {verifying ? 'Verifying...' : 'Verify & Change Password'}
            </button>
            <button type="button" onClick={() => { setStep('edit'); setOtp(''); }} className="px-4 py-2 rounded-lg border">
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AccountSettings;
