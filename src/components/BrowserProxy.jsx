import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Plus, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BrowserProxy() {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  const addTab = () => {
    const newTab = {
      id: Date.now(),
      url: '',
      title: 'New Tab'
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    setUrlInput('');
    setError(null);
  };

  const closeTab = (id) => {
    const newTabs = tabs.filter(tab => tab.id !== id);
    setTabs(newTabs);
    if (activeTabId === id && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const navigateToUrl = async (url) => {
    if (!url) return;

    // Ensure URL has protocol
    let fullUrl = url;
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }

    setLoading(true);
    setError(null);
    
    // Update the active tab
    const updatedTabs = tabs.map(tab => {
      if (tab.id === activeTabId) {
        return {
          ...tab,
          url: fullUrl,
          title: new URL(fullUrl).hostname
        };
      }
      return tab;
    });
    setTabs(updatedTabs);
    setUrlInput(fullUrl);
    
    // Simulate loading delay
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleOpenClick = () => {
    navigateToUrl(urlInput);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      navigateToUrl(urlInput);
    }
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className="w-full h-full bg-background text-foreground flex flex-col rounded-lg border border-border">
      {/* Browser Header */}
      <div className="bg-muted border-b border-border p-3 space-y-3">
        {/* Navigation Bar */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            disabled
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            disabled
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => navigateToUrl(activeTab?.url)}
            disabled={!activeTab?.url || loading}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Address Bar */}
        <div className="flex items-center gap-2 bg-card border border-input rounded px-3 py-2">
          <Input
            type="text"
            placeholder="Enter URL (e.g., sam.gov, google.com)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-transparent border-0 text-foreground placeholder-muted-foreground focus:outline-none flex-1"
          />
          <Button
            size="sm"
            onClick={handleOpenClick}
            disabled={!urlInput || loading}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {loading ? 'Loading...' : 'Open'}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-muted border border-border rounded p-2 overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-3 py-1 rounded cursor-pointer whitespace-nowrap ${
                activeTabId === tab.id
                  ? 'bg-card text-foreground border border-border'
                  : 'bg-muted text-muted-foreground hover:bg-input'
              }`}
              onClick={() => {
                setActiveTabId(tab.id);
                setUrlInput(tab.url);
              }}
            >
              <span className="text-sm">{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={addTab}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Browser Content */}
      <div className="flex-1 overflow-hidden bg-background flex flex-col">
        {activeTab?.url ? (
          <>
            <div className="flex-1 overflow-auto bg-white">
              <iframe
                ref={iframeRef}
                src={activeTab.url}
                className="w-full h-full border-0"
                title="Browser"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox allow-top-navigation"
                style={{ minHeight: '100%' }}
                onError={() => setError('Failed to load page')}
              />
            </div>
            {error && (
              <div className="bg-red-50 border-t border-red-200 p-3 flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="bg-slate-100 border-t border-slate-200 p-2 text-xs text-slate-600">
              <p>Note: Some websites may have CORS restrictions and may not load in this embedded browser. Try: sam.gov, google.com, or other public sites.</p>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">Enter a URL to get started</p>
              <p className="text-sm">Try: sam.gov, google.com, quickbooks.com</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
