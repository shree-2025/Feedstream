import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Select from '../../components/form/Select';
import { UserRole } from '../../context/AuthContext';

const OTP_LENGTH = 6;

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const roleOptions = [
    { value: 'OrganizationAdmin', label: 'Organization Admin' },
    { value: 'DepartmentAdmin', label: 'Department Admin' },
    { value: 'Staff', label: 'Staff' },
  ];

  // Backend public password reset endpoints
  const PUBLIC_FORGOT = '/auth/password/forgot-public';
  const PUBLIC_RESET = '/auth/password/reset-public';
  const backendRole: Record<UserRole, 'DEPT' | 'STAFF' | 'ORG' | null> = {
    MasterAdmin: null,
    Student: null,
    OrganizationAdmin: 'ORG',
    DepartmentAdmin: 'DEPT',
    Staff: 'STAFF',
  };

  // Build candidate list including absolute URLs using VITE_API_URL when a path is relative
  const apiBase = (import.meta.env.VITE_API_URL || '').toString().replace(/\/+$/, '');
  const withAbsolute = (
    path: string | null | undefined,
    ...more: Array<string | null | undefined>
  ): Array<string | null | undefined> => {
    const list: Array<string | null | undefined> = [];
    const pushWithBase = (p?: string | null) => {
      if (!p) return;
      list.push(p);
      if (apiBase && p.startsWith('/')) list.push(`${apiBase}${p}`);
    };
    pushWithBase(path);
    more.forEach(pushWithBase);
    return list;
  };

  // Try a list of endpoint paths until one succeeds. If an item is an absolute URL (http/https), axios will ignore baseURL.
  const postFirstAvailable = async (candidates: Array<string | null | undefined>, body: any) => {
    const tried: string[] = [];
    let lastErr: any = null;
    for (const path of candidates) {
      if (!path) continue;
      try {
        tried.push(path);
        return await api.post(path, body);
      } catch (e: any) {
        lastErr = e;
        // If not 404, fail fast. If 404, continue to next candidate.
        if (e?.status && e.status !== 404) {
          break;
        }
      }
    }
    const attempted = tried.join(', ');
    const msg = lastErr?.message || 'All endpoint attempts failed';
    throw new Error(`${msg}. Attempted: ${attempted || 'none'}`);
  };

  const onChangeOtp = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!role) {
      setError('Please select a role');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }
    const roleCode = backendRole[role as UserRole];
    if (!roleCode) {
      setError('Password reset is not available for this role yet.');
      return;
    }
    setIsLoading(true);
    try {
      await api.post(PUBLIC_FORGOT, { role: roleCode, email });
      toast.success('OTP sent to your email');
      setStep('verify');
      // focus first OTP input
      setTimeout(() => inputsRef.current[0]?.focus(), 0);
    } catch (err: any) {
      const message = err?.message || 'Failed to send OTP';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setError(`Please enter the ${OTP_LENGTH}-digit OTP`);
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!role) {
      setError('Please select a role');
      return;
    }

    const roleCode = backendRole[role as UserRole];

    setIsLoading(true);
    try {
      if (!roleCode) throw new Error('Password reset is not available for this role.');
      await api.post(PUBLIC_RESET, { role: roleCode, email, otp: code, newPassword: password });
      toast.success('Password reset successfully. Please sign in.');
      navigate('/signin');
    } catch (err: any) {
      const message = err?.message || 'Failed to reset password';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!email) return;
    if (!role) return;
    try {
      const roleCode = backendRole[role as UserRole];
      if (!roleCode) throw new Error('Endpoint unavailable for this role');
      await api.post(PUBLIC_FORGOT, { role: roleCode, email });
      toast.success('OTP resent');
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-6 bg-white border border-gray-200 rounded-2xl shadow-theme-lg dark:bg-gray-900 dark:border-gray-800">
        <div className="mb-4 text-center">
          <div className="flex justify-center mb-3">
            <img src="/images/logo/logo.svg" alt="Feedstream logo" className="h-18 w-auto block dark:hidden" />
            <img src="/images/logo/logo-dark.svg" alt="Feedstream logo" className="h-18 w-auto hidden dark:block" />
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-white" style={{ fontSize: '28px' }}>
            {step === 'request' ? 'Forgot Password' : 'Reset Password'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {step === 'request' ? 'We will send a One-Time Password (OTP) to your email.' : 'Enter the OTP sent to your email and set a new password.'}
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 mb-3">
            {error}
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <div>
              <Label>Role</Label>
              <Select
                options={roleOptions}
                placeholder="Select a role"
                value={role || ''}
                onChange={(val: string) => setRole(val as UserRole)}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm font-medium text-white rounded-md bg-brand-500 hover:bg-brand-600 disabled:opacity-50"
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <div className="text-center text-sm">
              <Link to="/signin" className="text-brand-500 hover:text-brand-600">Back to sign in</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Label>Enter OTP</Label>
              <div className="flex gap-2 justify-center">
                {otp.map((d, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputsRef.current[idx] = el; }}
                    value={d}
                    onChange={(e) => onChangeOtp(idx, e.target.value.replace(/\D/g, '').slice(0, 1))}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                        inputsRef.current[idx - 1]?.focus();
                      }
                    }}
                    inputMode="numeric"
                    className="w-10 h-12 text-center border rounded-md dark:bg-gray-800 dark:border-gray-700"
                    maxLength={1}
                  />
                ))}
              </div>
              <div className="text-center mt-2">
                <button type="button" onClick={resendOtp} className="text-xs text-brand-500 hover:text-brand-600">Resend OTP</button>
              </div>
            </div>

            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm font-medium text-white rounded-md bg-brand-500 hover:bg-brand-600 disabled:opacity-50"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center text-sm">
              <Link to="/signin" className="text-brand-500 hover:text-brand-600">Back to sign in</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
