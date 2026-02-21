import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Maximize2 } from 'lucide-react';

/**
 * Opens external URLs in a popup "minibrowser" window so they work even when
 * the site blocks embedding (X-Frame-Options). Use instead of iframes for
 * chat.openai.com, claude.ai, etc.
 */
const DEFAULT_FEATURES = 'width=960,height=900,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=yes,status=yes';

export function openMinibrowser(url, name = 'Minibrowser', features = DEFAULT_FEATURES) {
  if (!url) return null;
  const slug = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const win = window.open(url, `minibrowser_${slug}`, features);
  if (win) win.focus();
  return win;
}

export default function MinibrowserLauncher({ url, label = 'Open in minibrowser', variant = 'default', className, icon: Icon = Maximize2 }) {
  if (!url) return null;
  return (
    <Button
      variant={variant}
      className={className}
      onClick={() => openMinibrowser(url, label)}
    >
      {Icon && <Icon className="h-4 w-4 mr-2" />}
      {label}
    </Button>
  );
}
