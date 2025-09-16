import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

type ProfileData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  avatarUrl?: string;
};

const initialState: ProfileData = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phone: '',
  bio: '',
  avatarUrl: '',
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [data, setData] = useState<ProfileData>(initialState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const displayName = useMemo(() => {
    if (user?.role === 'DepartmentAdmin' || user?.role === 'OrganizationAdmin') {
      return data.username || user?.name || '';
    }
    const full = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
    return full || data.username || user?.name || '';
  }, [data.firstName, data.lastName, data.username, user?.name, user?.role]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/profile');
        const p = res.data || {};
        const merged: ProfileData = {
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          username: p.username || '',
          email: p.email || user?.email || '',
          phone: p.phone || '',
          bio: p.bio || '',
          avatarUrl: p.avatarUrl || '',
        };
        if (!mounted) return;
        setData(merged);
        setAvatarPreview(merged.avatarUrl || '');
        // Ensure header/sidebar reflect stored avatar and correct name after reload
        const computedName = (user?.role === 'DepartmentAdmin' || user?.role === 'OrganizationAdmin')
          ? (merged.username || user?.name || '')
          : ([merged.firstName, merged.lastName].filter(Boolean).join(' ').trim() || merged.username || user?.name || '');
        updateUser({ name: computedName, avatarUrl: merged.avatarUrl || user?.avatarUrl });
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.email]);

  function onChange<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setData(prev => ({ ...prev, [key]: value }));
  }

  async function onSelectAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = String(reader.result || '');
      setAvatarPreview(base64);
      try {
        const resp = await api.post('/profile/avatar', { image: base64 });
        const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/g, '').replace(/\/$/g, '');
        const relative = resp?.data?.url || '';
        const absolute = resp?.data?.absoluteUrl || (relative ? `${apiBaseUrl}${relative}` : '');
        const finalUrl = absolute || relative;
        if (finalUrl) {
          setData(prev => ({ ...prev, avatarUrl: finalUrl }));
          // Immediately reflect avatar in header/sidebar without needing Save
          updateUser({ avatarUrl: finalUrl });
        }
      } catch {}
    };
    reader.readAsDataURL(file);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...data };
      // email should not be modified here; keep as is
      payload.email = data.email || (user?.email || '');
      const res = await api.put('/profile', payload);
      // Optionally update AuthContext name for header
      const newName = (user?.role === 'DepartmentAdmin' || user?.role === 'OrganizationAdmin')
        ? (res.data?.username || '')
        : [res.data?.firstName, res.data?.lastName].filter(Boolean).join(' ').trim() || (res.data?.username || '');
      const newAvatar = res.data?.avatarUrl || data.avatarUrl || '';
      updateUser({ name: newName || user?.name, avatarUrl: newAvatar || user?.avatarUrl });
      alert('Profile updated');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">My Profile</h1>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <form onSubmit={onSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user?.role === 'DepartmentAdmin' ? (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Department Name</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={data.username} onChange={e => onChange('username', e.target.value)} placeholder="Department Name" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Mobile</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={data.phone} onChange={e => onChange('phone', e.target.value)} placeholder="Phone" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input className="w-full border rounded-lg px-3 py-2 bg-gray-100" value={data.email} disabled />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">First name</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={data.firstName} onChange={e => onChange('firstName', e.target.value)} placeholder="First name" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Last name</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={data.lastName} onChange={e => onChange('lastName', e.target.value)} placeholder="Last name" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Username</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={data.username} onChange={e => onChange('username', e.target.value)} placeholder="Username" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Mobile</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={data.phone} onChange={e => onChange('phone', e.target.value)} placeholder="Phone" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input className="w-full border rounded-lg px-3 py-2 bg-gray-100" value={data.email} disabled />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Bio</label>
                    <textarea className="w-full border rounded-lg px-3 py-2" rows={4} value={data.bio} onChange={e => onChange('bio', e.target.value)} placeholder="Write something about you..." />
                  </div>
                </>
              )}
            </div>

            <div>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100">
                  {avatarPreview || data.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview || data.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                </div>
                <div>
                  <div className="font-medium">{displayName || 'Unnamed User'}</div>
                  <div className="text-sm text-gray-500">{data.email}</div>
                </div>
              </div>
              <div className="mt-3">
                <label className="inline-block px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="file" accept="image/*" className="hidden" onChange={onSelectAvatar} />
                  Upload new picture
                </label>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
