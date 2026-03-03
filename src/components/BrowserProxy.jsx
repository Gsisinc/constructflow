import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Plus, X, AlertCircle, ExternalLink, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BrowserProxy() {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addTab = () => {
    if (tabs.length === 0) {
      const newTab = {
        id: Date.now(),
        url: '',
        title: 'New Tab',
        screenshot: null
      };
      setTabs([newTab]);
      setActiveTabId(newTab.id);
    }
  };

  const closeTab = (id) => {
    const newTabs = tabs.filter(tab => tab.id !== id);
    setTabs(newTabs);
    if (activeTabId === id && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const navigateToUrl = async (url) => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    let fullUrl = url;
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + url;
    }

    setLoading(true);
    setError(null);

    try {
      // Use Browserless.io free endpoint to render page
      // This will show a screenshot of the actual website
      const browserlessUrl = `https://chrome.browserless.io/screenshot?url=${encodeURIComponent(fullUrl)}&width=1200&height=800`;
      
      const updatedTabs = tabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            url: fullUrl,
            title: new URL(fullUrl).hostname,
            screenshot: browserlessUrl
          };
        }
        return tab;
      });
      
      setTabs(updatedTabs);
      setUrlInput(fullUrl);
    } catch (err) {
      setError(err.message || 'Failed to load page');
    } finally {
      setLoading(false);
    }
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

  // Initialize with one tab if none exist
  if (tabs.length === 0 && activeTabId === null) {
    const initialTab = { id: Date.now(), url: '', title: 'New Tab', screenshot: null };
    setTabs([initialTab]);
    setActiveTabId(initialTab.id);
  }

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
            title="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            disabled
            title="Forward"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => navigateToUrl(activeTab?.url)}
            disabled={!activeTab?.url || loading}
            title="Refresh"
          >
            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => activeTab?.url && window.open(activeTab.url, '_blank')}
            disabled={!activeTab?.url}
            title="Open in new window"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        {/* Address Bar */}
        <div className="flex items-center gap-2 bg-card border border-input rounded px-3 py-2">
          <Input
            type="text"
            placeholder="Enter URL (e.g., sam.gov, google.com, planetbids.com)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-transparent border-0 text-foreground placeholder-muted-foreground focus:outline-none flex-1 text-sm"
          />
          <Button
            size="sm"
            onClick={handleOpenClick}
            disabled={!urlInput || loading}
            className="bg-accent hover:bg-accent/90 text-accent-foreground whitespace-nowrap"
          >
            {loading ? 'Loading...' : 'Open'}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-muted border border-border rounded p-2">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-3 py-1 rounded cursor-pointer whitespace-nowrap text-sm ${
                activeTabId === tab.id
                  ? 'bg-card text-foreground border border-border'
                  : 'bg-muted text-muted-foreground hover:bg-input'
              }`}
              onClick={() => {
                setActiveTabId(tab.id);
                setUrlInput(tab.url);
              }}
            >
              <span>{tab.title || 'New Tab'}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={addTab}
            disabled={tabs.length > 0}
            title="New tab"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Browser Content */}
      <div className="flex-1 overflow-auto bg-background flex flex-col">
        {activeTab?.url ? (
          <>
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader className="h-8 w-8 animate-spin text-accent mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading {activeTab.url}...</p>
                </div>
              </div>
            ) : activeTab.screenshot ? (
              <div className="w-full h-full flex flex-col">
                <img
                  src={activeTab.screenshot}
                  alt="Website screenshot"
                  className="w-full h-auto object-contain"
                  onError={() => setError('Failed to load screenshot')}
                />
                <div className="bg-slate-100 border-t border-slate-200 p-2 text-xs text-slate-600">
                  <p>📸 This is a screenshot of the website rendered by Browserless. Click "Open in new window" to interact with the site.</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-accent" />
              </div>
            )}
            {error && (
              <div className="bg-red-50 border-t border-red-200 p-3 flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2 font-semibold">Enter a URL to get started</p>
              <p className="text-sm mb-4">Try: sam.gov, google.com, planetbids.com</p>
              <p className="text-xs text-slate-500">The browser will show you a screenshot of the website</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
