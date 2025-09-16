import React, { useState } from 'react';
import api from '../utils/api';

export default function Support() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let attachmentUrl = '';
      if (file) {
        const b64 = await fileToBase64(file);
        // Reuse profile avatar endpoint to store files under uploads (simplest approach)
        const up = await api.post('/profile/avatar', { image: b64 });
        attachmentUrl = up?.data?.url || '';
      }
      const resp = await api.post('/support-requests', { subject, message, attachmentUrl });
      if (resp?.data?.ok) {
        alert('Support request submitted');
        setSubject('');
        setMessage('');
        setFile(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit support request');
    } finally {
      setSubmitting(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Support</h1>
      <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Subject</label>
          <input className="w-full border rounded-lg px-3 py-2" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Message</label>
          <textarea className="w-full border rounded-lg px-3 py-2" rows={6} value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your issue" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Attachment (optional)</label>
          <input type="file" onChange={onFileChange} />
          {file && <div className="text-xs text-gray-500 mt-1">{file.name}</div>}
        </div>
        <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit request'}
        </button>
      </form>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
