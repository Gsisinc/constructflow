import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2 } from 'lucide-react';

export default function AIAgentsMultiPlatform() {
  const [windows, setWindows] = useState({
    deepseek: { width: 600, height: 800, visible: true, maximized: false, x: 50, y: 50 },
    chatgpt: { width: 600, height: 800, visible: true, maximized: false, x: 700, y: 50 },
    grok: { width: 600, height: 800, visible: true, maximized: false, x: 1350, y: 50 },
    claude: { width: 600, height: 800, visible: true, maximized: false, x: 50, y: 900 },
    custom: { width: 600, height: 800, visible: true, maximized: false, x: 700, y: 900 },
  });

  const [activeTab, setActiveTab] = useState('claude');
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);

  const agentConfigs = {
    deepseek: {
      name: 'DeepSeek',
      color: 'from-purple-500 to-blue-600',
      url: 'https://chat.deepseek.com/',
      description: 'DeepSeek AI - Advanced reasoning',
    },
    chatgpt: {
      name: 'ChatGPT',
      color: 'from-green-500 to-emerald-600',
      url: 'https://chat.openai.com/',
      description: 'OpenAI ChatGPT - Powerful language model',
    },
    grok: {
      name: 'Grok',
      color: 'from-yellow-500 to-orange-600',
      url: 'https://grok.com/',
      description: 'Grok AI - Real-time reasoning',
    },
    claude: {
      name: 'Claude',
      color: 'from-blue-500 to-cyan-600',
      url: 'https://claude.ai/',
      description: 'Anthropic Claude - Thoughtful AI',
    },
    custom: {
      name: 'Custom Agents',
      color: 'from-indigo-500 to-purple-600',
      url: null,
      description: 'ConstructFlow Built-in Agents',
    },
  };

  const handleDragStart = (e, id) => {
    setDragging({ id, startX: e.clientX, startY: e.clientY, startWindowX: windows[id].x, startWindowY: windows[id].y });
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

  React.useEffect(() => {
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
        width: !prev[id].maximized ? window.innerWidth - 40 : 600,
        height: !prev[id].maximized ? window.innerHeight - 200 : 800,
      }
    }));
  };

  const toggleVisibility = (id) => {
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], visible: !prev[id].visible }
    }));
  };

  const CustomAgents = () => (
    <div className="space-y-4 p-4 overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: 'Central Orchestrator', desc: 'Project coordination' },
          { title: 'Market Intelligence', desc: 'Bid discovery' },
          { title: 'Bid Package Assembly', desc: 'RFP analysis' },
          { title: 'Proposal Generation', desc: 'Custom proposals' },
          { title: 'Risk Prediction', desc: 'Risk management' },
          { title: 'Regulatory Intelligence', desc: 'Permits & compliance' },
          { title: 'Quality Assurance', desc: 'QA planning' },
          { title: 'Safety Compliance', desc: 'Safety planning' },
          { title: 'Sustainability', desc: 'Green building' },
          { title: 'Stakeholder Comm', desc: 'Message tailoring' },
        ].map((agent, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{agent.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600">{agent.desc}</p>
              <Button className="mt-2 w-full text-xs py-1 h-8">Use</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const AgentWindow = ({ id, config }) => {
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
          <div className="flex-1">
            <h3 className="font-bold text-sm">{config.name}</h3>
            <p className="text-xs opacity-90">{config.description}</p>
          </div>
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => toggleMaximize(id)}
              className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition"
              title={windowState.maximized ? 'Minimize' : 'Maximize'}
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
            <CustomAgents />
          ) : (
            <iframe
              src={config.url}
              className="w-full h-full border-0"
              title={config.name}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-presentation"
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2">AI Agent Platform</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Multiple AI services + ConstructFlow agents</p>
        </div>

        {/* Tab Navigation */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-4 sm:pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 sm:gap-2">
                <TabsTrigger value="deepseek" className="text-xs sm:text-sm">DeepSeek</TabsTrigger>
                <TabsTrigger value="chatgpt" className="text-xs sm:text-sm">ChatGPT</TabsTrigger>
                <TabsTrigger value="grok" className="text-xs sm:text-sm">Grok</TabsTrigger>
                <TabsTrigger value="claude" className="text-xs sm:text-sm">Claude</TabsTrigger>
                <TabsTrigger value="custom" className="text-xs sm:text-sm">Custom</TabsTrigger>
              </TabsList>

              {Object.entries(agentConfigs).map(([key, config]) => (
                <TabsContent key={key} value={key}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => setWindows(prev => ({...prev, [key]: {...prev[key], visible: true}}))}
                        className="w-full"
                      >
                        Open {config.name}
                      </Button>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">{config.description}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Active Windows Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Windows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {Object.entries(windows).map(([id, state]) => (
                <Button
                  key={id}
                  variant={state.visible ? 'default' : 'outline'}
                  onClick={() => toggleVisibility(id)}
                  className="text-xs py-1 h-8"
                >
                  {agentConfigs[id].name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Windows Container */}
      <div className="fixed inset-0 pointer-events-none">
        {Object.entries(agentConfigs).map(([key, config]) => (
          <div key={key} className="pointer-events-auto">
            <AgentWindow id={key} config={config} />
          </div>
        ))}
      </div>
    </div>
  );
}
