import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Download } from 'lucide-react';

export default function AttachmentLinks({ attachments = [] }) {
  const [loading, setLoading] = useState(null);
  const name = (uri) => decodeURIComponent(uri.split('/').pop().split('?')[0]).slice(-40);

  const open = async (uri, i) => {
    setLoading(i);
    try {
      const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
      if (res?.signed_url) window.open(res.signed_url, '_blank');
    } catch (e) {
      console.error(e);
    }
    setLoading(null);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((uri, i) => (
        <button
          key={i}
          type="button"
          onClick={() => open(uri, i)}
          className="inline-flex items-center gap-1 text-xs text-navy-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 hover:bg-slate-100"
          title={name(uri)}
        >
          {loading === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
          <span className="max-w-[160px] truncate">{name(uri)}</span>
        </button>
      ))}
    </div>
  );
}