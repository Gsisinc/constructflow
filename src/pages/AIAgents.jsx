import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2, Maximize } from 'lucide-react';

export default function AIAgents() {
  const [windows, setWindows] = useState({
    deepseek: { width: 900, height: 600, visible: true, maximized: false, x: 20, y: 100 },
    grok: { width: 900, height: 600, visible: true, maximized: false, x: 950, y: 100 },
    chatgpt: { width: 900, height: 600, visible: true, maximized: false, x: 1880, y: 100 },
    claude: { width: 900, height: 600, visible: true, maximized: false, x: 20, y: 750 },
    manus: { width: 900, height: 600, visible: true, maximized: false, x: 950, y: 750 },
    custom: { width: 900, height: 600, visible: true, maximized: false, x: 1880, y: 750 },
  });

  const [activeTab, setActiveTab] = useState('deepseek');
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);

  const agentConfigs = {
    deepseek: {
      name: 'DeepSeek',
      color: 'from-purple-500 to-blue-600',
      url: 'https://chat.deepseek.com/',
      icon: '🧠',
    },
    grok: {
      name: 'Grok',
      color: 'from-yellow-500 to-orange-600',
      url: 'https://grok.com/',
      icon: '⚡',
    },
    chatgpt: {
      name: 'ChatGPT',
      color: 'from-green-500 to-emerald-600',
      url: 'https://chat.openai.com/',
      icon: '💬',
    },
    claude: {
      name: 'Claude',
      color: 'from-blue-500 to-cyan-600',
      url: 'https://claude.ai/',
      icon: '🤖',
    },
    manus: {
      name: 'Manus AMS',
      color: 'from-red-500 to-pink-600',
      url: 'https://www.manusams.com/',
      icon: '🏗️',
    },
    custom: {
      name: 'Custom Agents',
      color: 'from-indigo-500 to-purple-600',
      url: null,
      icon: '⚙️',
    },
  };

  const constructflowAgents = [
    { id: 'central-orchestrator', title: 'Central Orchestrator', desc: 'Project CEO coordinating all specialist agents', icon: '🎯' },
    { id: 'market-intel', title: 'Market Intelligence', desc: 'Proactive bid opportunity searcher', icon: '📊' },
    { id: 'bid-assembly', title: 'Bid Package Assembly', desc: 'Intelligent document synthesis and pricing', icon: '📋' },
    { id: 'proposal-gen', title: 'Proposal Generation', desc: 'Client-specific personalized proposals', icon: '✍️' },
    { id: 'risk-predict', title: 'Risk Prediction', desc: 'Cost overruns and schedule risks prediction', icon: '⚠️' },
    { id: 'regulatory-intel', title: 'Regulatory Intelligence', desc: 'Permit automation and compliance expert', icon: '⚖️' },
    { id: 'quality-assure', title: 'Quality Assurance', desc: 'Quality control and inspection planning', icon: '✅' },
    { id: 'safety-comply', title: 'Safety Compliance', desc: 'OSHA compliance and safety planning', icon: '🛡️' },
    { id: 'sustainability', title: 'Sustainability', desc: 'Green building and eco-friendly strategies', icon: '🌱' },
    { id: 'stakeholder', title: 'Stakeholder Communication', desc: 'Message tailoring for audiences', icon: '💼' },
  ];

  const handleDragStart = (e, id) => {
    if (e.target.closest('.window-header')) {
      setDragging({
        id,
        startX: e.clientX,
        startY: e.clientY,
        startWindowX: windows[id].x,
        startWindowY: windows[id].y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      setWindows(prev => ({
        ...prev,
        [dragging.id]: {
          ...prev[dragging.id],
          x: Math.max(0, dragging.startWindowX + dx),
          y: Math.max(0, dragging.startWindowY + dy),
        }
      }));
    }

    if (resizing) {
      const dw = e.clientX - resizing.startX;
      const dh = e.clientY - resizing.startY;
      setWindows(prev => ({
        ...prev,
        [resizing.id]: {
          ...prev[resizing.id],
          width: Math.max(300, resizing.startWidth + dw),
          height: Math.max(300, resizing.startHeight + dh),
        }
      }));
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, resizing]);

  const toggleMaximize = (id) => {
    setWindows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        maximized: !prev[id].maximized,
        width: !prev[id].maximized ? window.innerWidth - 40 : 900,
        height: !prev[id].maximized ? window.innerHeight - 200 : 600,
      }
    }));
  };

  const toggleVisibility = (id) => {
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], visible: !prev[id].visible }
    }));
  };

  const CustomAgentsPanel = () => (
    <div className="space-y-4 p-4 overflow-y-auto h-full bg-slate-50 dark:bg-slate-900">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {constructflowAgents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="text-xl">{agent.icon}</span>
                {agent.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-400">{agent.desc}</p>
              <Button size="sm" className="w-full h-8 text-xs">
                Use Agent
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const EmbeddedWindow = ({ id, config }) => {
    const windowState = windows[id];
    if (!windowState.visible) return null;

    return (
      <div
        onMouseDown={(e) => {
          if (e.target.closest('.window-header')) {
            handleDragStart(e, id);
          }
        }}
        className="fixed border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-2xl bg-white dark:bg-slate-900 flex flex-col overflow-hidden"
        style={{
          left: `${windowState.maximized ? 0 : windowState.x}px`,
          top: `${windowState.maximized ? 0 : windowState.y}px`,
          width: windowState.maximized ? '100%' : `${windowState.width}px`,
          height: windowState.maximized ? '100%' : `${windowState.height}px`,
          minWidth: '300px',
          minHeight: '300px',
          zIndex: dragging?.id === id ? 1000 : 50,
        }}
      >
        {/* Title Bar */}
        <div 
          className={`window-header bg-gradient-to-r ${config.color} text-white p-3 rounded-t-md flex items-center justify-between cursor-move select-none`}
        >
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <span>{config.icon}</span>
              {config.name}
            </h3>
          </div>
          <div className="flex gap-1 ml-2 flex-shrink-0">
            <button
              onClick={() => toggleMaximize(id)}
              className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition"
              title={windowState.maximized ? 'Restore' : 'Maximize'}
            >
              {windowState.maximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => toggleVisibility(id)}
              className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-slate-800">
          {id === 'custom' ? (
            <CustomAgentsPanel />
          ) : (
            <iframe
              src={config.url}
              className="w-full h-full border-0"
              title={config.name}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-presentation allow-downloads"
            />
          )}
        </div>

        {/* Resize Handle */}
        {!windowState.maximized && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 dark:bg-blue-400 cursor-se-resize rounded-tl hover:bg-blue-600 transition"
            onMouseDown={(e) => {
              e.preventDefault();
              setResizing({
                id,
                startX: e.clientX,
                startY: e.clientY,
                startWidth: windowState.width,
                startHeight: windowState.height,
              });
            }}
            title="Drag to resize"
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-2 sm:p-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">AI Agent Platform</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Access 5 major AI services and 10 ConstructFlow custom agents</p>
        </div>

        {/* Tab Navigation */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-4 sm:pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2">
                <TabsTrigger value="deepseek" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">DeepSeek</span>
                  <span className="sm:hidden">🧠</span>
                </TabsTrigger>
                <TabsTrigger value="grok" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Grok</span>
                  <span className="sm:hidden">⚡</span>
                </TabsTrigger>
                <TabsTrigger value="chatgpt" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">ChatGPT</span>
                  <span className="sm:hidden">💬</span>
                </TabsTrigger>
                <TabsTrigger value="claude" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Claude</span>
                  <span className="sm:hidden">🤖</span>
                </TabsTrigger>
                <TabsTrigger value="manus" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Manus</span>
                  <span className="sm:hidden">🏗️</span>
                </TabsTrigger>
                <TabsTrigger value="custom" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Custom</span>
                  <span className="sm:hidden">⚙️</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab Contents */}
              {Object.entries(agentConfigs).map(([key, config]) => (
                <TabsContent key={key} value={key} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{config.icon}</span>
                        {config.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => setWindows(prev => ({...prev, [key]: {...prev[key], visible: true}}))}
                        className="w-full sm:w-auto"
                      >
                        {windows[key].visible ? 'Window Visible' : `Open ${config.name}`}
                      </Button>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                        {key === 'custom' 
                          ? 'Access 10 specialized ConstructFlow AI agents for construction project management'
                          : `Access the official ${config.name} interface directly`
                        }
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Window Status Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Active Windows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {Object.entries(windows).map(([id, state]) => (
                <Button
                  key={id}
                  variant={state.visible ? 'default' : 'outline'}
                  onClick={() => toggleVisibility(id)}
                  className="text-xs py-1 h-8"
                  size="sm"
                >
                  {agentConfigs[id].icon} {agentConfigs[id].name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>📌 <strong>Drag Title Bar:</strong> Click and drag the colored header to move windows around</p>
            <p>🔲 <strong>Resize:</strong> Drag the blue corner at bottom-right to resize</p>
            <p>⬜ <strong>Maximize:</strong> Click the maximize button to go fullscreen</p>
            <p>❌ <strong>Close:</strong> Click X to hide window (toggle above to show)</p>
            <p>📱 <strong>Mobile:</strong> Same features work great on mobile with touch controls</p>
          </CardContent>
        </Card>
      </div>

      {/* Floating Windows Container */}
      <div className="fixed inset-0 pointer-events-none">
        {Object.entries(agentConfigs).map(([key, config]) => (
          <div key={key} className="pointer-events-auto">
            <EmbeddedWindow id={key} config={config} />
          </div>
        ))}
      </div>
    </div>
  );
}
