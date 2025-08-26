import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PageMeta from '../components/common/PageMeta';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface ProfileForm {
  name: string;
  department: string;
  phone: string;
  avatar_url: string | null;
  collegeName: string;
  collegeLogoUrl: string;
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    department: '',
    phone: '',
    avatar_url: null,
    collegeName: '',
    collegeLogoUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [original, setOriginal] = useState<ProfileForm | null>(null);

  useEffect(() => {
    if (!user || !user._id) return;
    // Load profile from backend to ensure freshness
    (async () => {
      try {
        const { data } = await axios.get(`/api/users/${user._id}`);
        const next = {
          name: data.name || '',
          department: data.department || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || null,
          collegeName: data.collegeName || data.college_name || (user as any)?.collegeName || '',
          collegeLogoUrl: data.collegeLogoUrl || data.college_logo_url || (user as any)?.collegeLogoUrl || '',
        } as ProfileForm;
        setForm(next);
        setOriginal(next);
      } catch (e) {
        // fallback to auth user
        const next = {
          name: user.name || '',
          department: (user as any).department || '',
          phone: (user as any).phone || '',
          avatar_url: (user as any).avatar_url || null,
          collegeName: (user as any).collegeName || '',
          collegeLogoUrl: (user as any).collegeLogoUrl || '',
        } as ProfileForm;
        setForm(next);
        setOriginal(next);
      }
    })();
  }, [user]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user._id) return;
    setLoading(true);
    try {
      const { data } = await axios.put(`/api/users/${user._id}`, {
        name: form.name,
        department: form.department,
        phone: form.phone,
        collegeName: form.collegeName,
        collegeLogoUrl: form.collegeLogoUrl,
      });
      updateUser({
        name: data.name,
        department: data.department,
        phone: data.phone,
        collegeName: data.collegeName ?? form.collegeName,
        collegeLogoUrl: data.collegeLogoUrl ?? form.collegeLogoUrl,
      } as any);
      setOriginal({
        name: data.name || '',
        department: data.department || '',
        phone: data.phone || '',
        avatar_url: form.avatar_url || null,
        collegeName: data.collegeName ?? form.collegeName ?? '',
        collegeLogoUrl: data.collegeLogoUrl ?? form.collegeLogoUrl ?? '',
      });
      setEditMode(false);
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !user._id) return;
    // Cache the input element before any await to avoid React event pooling issues
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    setLoading(true);
    try {
      const { data } = await axios.post(`/api/users/${user._id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, avatar_url: data.avatar_url || null }));
      updateUser({ avatar_url: data.avatar_url } as any);
      toast.success('Avatar updated');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setLoading(false);
      // reset input safely using cached element
      if (inputEl) inputEl.value = '';
    }
  };

  const avatarSrc = form.avatar_url || '/images/user/owner.jpg';

  return (
    <>
      <PageMeta title="Feedstream Profile" description="Manage your profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex items-center justify-between lg:mb-7">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Profile</h3>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              type="button"
              className="inline-flex items-center rounded-lg bg-[#2563eb] text-white px-4 py-2 text-sm font-medium hover:bg-[#1d4ed8] shadow focus:outline-none focus:ring-2 focus:ring-[#2563eb]/50 dark:bg-primary dark:hover:opacity-95 dark:focus:ring-primary/40"
            >
              Edit profile
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                form="profileForm"
                disabled={loading}
                type="submit"
                className="inline-flex items-center rounded-lg bg-[#2563eb] text-white px-4 py-2 text-sm font-medium hover:bg-[#1d4ed8] disabled:opacity-60 shadow focus:outline-none focus:ring-2 focus:ring-[#2563eb]/50 dark:bg-primary dark:hover:opacity-95 dark:focus:ring-primary/40"
              >
                {loading ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (original) setForm(original);
                  setEditMode(false);
                }}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="flex flex-col items-center gap-4">
              <img src={avatarSrc} alt="Avatar" className="h-24 w-24 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
              <label className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium cursor-pointer ${editMode ? 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow dark:bg-primary dark:hover:opacity-95' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'}`}>
                <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} disabled={!editMode} />
                Upload new photo
              </label>
              <p className="text-xs text-gray-500">JPG, PNG. Max 2MB.</p>
            </div>
          </div>
          <div className="md:col-span-2">
            <form id="profileForm" onSubmit={submit} className="space-y-4">
              {!editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                    <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 dark:border-gray-800 dark:text-gray-200 bg-gray-50 dark:bg:white/5">{form.name || '-'}</div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">Branch</label>
                      <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 dark:border-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-white/5">{form.department || '-'}</div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                      <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 dark:border-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-white/5">{form.phone || '-'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">College Name</label>
                      <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 dark:border-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-white/5">{form.collegeName || '-'}</div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">College Logo URL</label>
                      <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 dark:border-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-white/5 break-all">{form.collegeLogoUrl || '-'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input name="name" value={form.name} onChange={onChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800 dark:bg-transparent" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Branch</label>
                      <input name="department" value={form.department} onChange={onChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800 dark:bg-transparent" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                      <input name="phone" value={form.phone} onChange={onChange} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800 dark:bg-transparent" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">College Name</label>
                      <input name="collegeName" value={form.collegeName} onChange={onChange} placeholder="e.g., ABC Institute of Technology" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800 dark:bg-transparent" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">College Logo URL</label>
                      <input name="collegeLogoUrl" value={form.collegeLogoUrl} onChange={onChange} placeholder="https://.../logo.png" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800 dark:bg-transparent" />
                      <p className="mt-1 text-xs text-gray-500">Provide a public image URL. Uploads may be supported later.</p>
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
