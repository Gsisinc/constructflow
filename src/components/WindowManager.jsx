import React, { useState, useRef } from 'react';
import { X, Plus, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useWindows } from '@/contexts/WindowContext';

export default function WindowManager() {
  const { windows, setWindows, closeWindow } = useWindows();
  const [activeWindowId, setActiveWindowId] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [isAddingTab, setIsAddingTab] = useState(false);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  // Set active window to first window when windows change
  React.useEffect(() => {
    if (windows.length > 0 && !activeWindowId) {
      setActiveWindowId(windows[0].id);
    }
  }, [windows, activeWindowId]);

  const addWindow = () => {
    if (!urlInput.trim()) return;
    
    let url = urlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const newWindow = {
      id: Date.now(),
      url: url,
      title: new URL(url).hostname || url
    };
    
    setWindows([...windows, newWindow]);
    setActiveWindowId(newWindow.id);
    setUrlInput('');
    setIsAddingTab(false);
  };

  const handleUrlChange = (windowId, newUrl) => {
    setWindows(windows.map(w => 
      w.id === windowId 
        ? { ...w, url: newUrl, title: new URL(newUrl).hostname || newUrl }
        : w
    ));
  };

  const activeWindow = windows.find(w => w.id === activeWindowId);

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col" ref={containerRef}>
      {/* Browser Header - Like Chrome/Firefox */}
      <div className="bg-slate-800 border-b border-slate-700 flex items-center gap-1 px-2 py-2 flex-shrink-0">
        {/* Navigation Buttons */}
        <button className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button 
          onClick={() => {
            if (iframeRef.current) {
              iframeRef.current.src = iframeRef.current.src;
            }
          }}
          className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Tabs Container */}
        <div className="flex-1 flex gap-1 items-center overflow-x-auto ml-2">
          {windows.map((win) => (
            <button
              key={win.id}
              onClick={() => setActiveWindowId(win.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-t-lg whitespace-nowrap text-sm transition-colors ${
                activeWindowId === win.id
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              <span className="truncate max-w-xs">{win.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeWindow(win.id);
                  if (activeWindowId === win.id && windows.length > 1) {
                    const nextWindow = windows.find(w => w.id !== win.id);
                    setActiveWindowId(nextWindow?.id);
                  }
                }}
                className="p-0.5 hover:bg-slate-600 rounded transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </button>
          ))}
          
          {/* Add Tab Button */}
          <button
            onClick={() => setIsAddingTab(true)}
            className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200 flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Address Bar */}
      {activeWindow && (
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex-shrink-0">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={activeWindow.url}
              onChange={(e) => handleUrlChange(activeWindowId, e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  let url = e.target.value;
                  if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                  }
                  handleUrlChange(activeWindowId, url);
                }
              }}
              placeholder="Enter URL (e.g., sam.gov, vendor.planetbids.com)"
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
            />
          </div>
        </div>
      )}

      {/* Add Tab Input */}
      {isAddingTab && (
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter URL (e.g., sam.gov, vendor.planetbids.com)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addWindow()}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
              autoFocus
            />
            <button
              onClick={addWindow}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Open
            </button>
            <button
              onClick={() => {
                setIsAddingTab(false);
                setUrlInput('');
              }}
              className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Real Browser Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeWindow ? (
          <iframe
            ref={iframeRef}
            key={activeWindow.id}
            src={activeWindow.url}
            className="w-full h-full border-0"
            title={activeWindow.title}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-pointer-lock allow-presentation allow-downloads"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <Plus className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">GSISweb Browser</p>
            <p className="text-sm">Click the + button to open a new tab and start browsing</p>
            <p className="text-xs mt-4 text-slate-500">Visit sam.gov, vendor.planetbids.com, or any website</p>
          </div>
        )}
      </div>
    </div>
  );
}
