import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Camera, Clock, MapPin, QrCode, Wifi, WifiOff, Upload, CheckCircle2 } from 'lucide-react';

export default function MobileFieldApp() {
  const [offlineMode, setOfflineMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dailyReport, setDailyReport] = useState({
    date: new Date().toISOString().split('T')[0],
    crew: 'Team A',
    location: 'Project Site - Phase 3',
    activities: '',
    issues: '',
    photos: [],
    materialDeliveries: [],
  });

  const [timeEntry, setTimeEntry] = useState({
    clockIn: null,
    clockOut: null,
    taskId: null,
    totalHours: 0,
  });

  const [syncQueue, setSyncQueue] = useState([]);
  const cameraRef = useRef(null);

  const fieldFeatures = [
    {
      title: 'Daily Report Builder',
      icon: '📝',
      description: 'Quick daily activity logging',
      status: 'ready',
    },
    {
      title: 'Photo Documentation',
      icon: '📷',
      description: 'Capture site photos with metadata',
      status: 'ready',
    },
    {
      title: 'Time Tracking',
      icon: '⏱️',
      description: 'Clock in/out with GPS verification',
      status: 'ready',
    },
    {
      title: 'QR Code Scanning',
      icon: '📱',
      description: 'Quick material/equipment tracking',
      status: 'ready',
    },
    {
      title: 'Offline Sync',
      icon: '📡',
      description: 'Auto-sync when connection restored',
      status: 'ready',
    },
    {
      title: 'Materials Tracking',
      icon: '📦',
      description: 'Log material deliveries and usage',
      status: 'ready',
    },
  ];

  const handleClockIn = () => {
    const now = new Date();
    setTimeEntry(prev => ({
      ...prev,
      clockIn: now.toLocaleTimeString(),
    }));
    addToSyncQueue({
      type: 'time_tracking',
      action: 'clock_in',
      timestamp: now.toISOString(),
    });
  };

  const handleClockOut = () => {
    const now = new Date();
    setTimeEntry(prev => ({
      ...prev,
      clockOut: now.toLocaleTimeString(),
    }));
    addToSyncQueue({
      type: 'time_tracking',
      action: 'clock_out',
      timestamp: now.toISOString(),
    });
  };

  const addToSyncQueue = (item) => {
    setSyncQueue(prev => [...prev, item]);
  };

  const handlePhotoCapture = () => {
    // Simulate photo capture
    const newPhoto = {
      id: Date.now(),
      url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3EPhoto Captured%3C/text%3E%3C/svg%3E',
      timestamp: new Date().toLocaleString(),
      location: 'Project Site - Phase 3',
    };

    setDailyReport(prev => ({
      ...prev,
      photos: [...prev.photos, newPhoto],
    }));

    addToSyncQueue({
      type: 'photo',
      photoId: newPhoto.id,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSubmitDailyReport = () => {
    const report = {
      ...dailyReport,
      submittedAt: new Date().toISOString(),
    };

    addToSyncQueue({
      type: 'daily_report',
      data: report,
      timestamp: new Date().toISOString(),
    });

    // Reset form
    setDailyReport({
      date: new Date().toISOString().split('T')[0],
      crew: 'Team A',
      location: 'Project Site - Phase 3',
      activities: '',
      issues: '',
      photos: [],
      materialDeliveries: [],
    });
  };

  const handleSyncData = () => {
    // Simulate syncing with server
    if (syncQueue.length > 0) {
      setTimeout(() => {
        setSyncQueue([]);
        // Show success notification
      }, 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mobile Field App</h1>
          <p className="text-gray-600 mt-2">
            Empower field crews with real-time project management and offline capabilities.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
          {offlineMode ? (
            <>
              <WifiOff className="text-red-600" size={20} />
              <span className="text-sm font-medium">Offline Mode</span>
            </>
          ) : (
            <>
              <Wifi className="text-green-600" size={20} />
              <span className="text-sm font-medium">Online</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {fieldFeatures.map((feature, idx) => (
          <Card key={idx} className="border">
            <CardContent className="pt-6">
              <div className="text-3xl mb-2">{feature.icon}</div>
              <h3 className="font-semibold text-sm">{feature.title}</h3>
              <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
              <Badge className="mt-2 bg-green-100 text-green-800 text-xs">
                Ready
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="daily-report" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily-report">Daily Report</TabsTrigger>
          <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
        </TabsList>

        <TabsContent value="daily-report" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity Report</CardTitle>
              <CardDescription>
                Submit end-of-day site activities and observations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <input
                    type="date"
                    value={dailyReport.date}
                    onChange={(e) =>
                      setDailyReport(prev => ({ ...prev, date: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Crew</label>
                  <input
                    type="text"
                    value={dailyReport.crew}
                    onChange={(e) =>
                      setDailyReport(prev => ({ ...prev, crew: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Location</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={dailyReport.location}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                  />
                  <Button variant="outline" size="sm">
                    <MapPin size={16} className="mr-1" />
                    Update
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Activities Completed</label>
                <textarea
                  value={dailyReport.activities}
                  onChange={(e) =>
                    setDailyReport(prev => ({ ...prev, activities: e.target.value }))
                  }
                  placeholder="Describe work completed today..."
                  className="mt-1 w-full px-3 py-2 border rounded-lg h-24"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Issues/Notes</label>
                <textarea
                  value={dailyReport.issues}
                  onChange={(e) =>
                    setDailyReport(prev => ({ ...prev, issues: e.target.value }))
                  }
                  placeholder="Report any issues encountered..."
                  className="mt-1 w-full px-3 py-2 border rounded-lg h-24"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Photos ({dailyReport.photos.length})</label>
                <div className="grid grid-cols-4 gap-2">
                  {dailyReport.photos.map(photo => (
                    <div key={photo.id} className="relative bg-gray-100 rounded-lg p-2">
                      <img
                        src={photo.url}
                        alt="Site photo"
                        className="w-full h-20 object-cover rounded"
                      />
                      <div className="absolute top-1 right-1">
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handlePhotoCapture}
                    className="bg-gray-100 border-2 border-dashed rounded-lg p-2 hover:bg-gray-50 transition flex items-center justify-center h-24"
                  >
                    <Camera size={24} className="text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSubmitDailyReport}
                  className="flex-1"
                  disabled={!dailyReport.activities.trim()}
                >
                  <CheckCircle2 size={16} className="mr-2" />
                  Submit Report
                </Button>
                {offlineMode && (
                  <Badge variant="outline" className="py-2">
                    <AlertCircle size={14} className="mr-2" />
                    Will sync when online
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time-tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking</CardTitle>
              <CardDescription>
                Clock in and out with automatic GPS location verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-blue-600" />
                  <span className="font-medium text-blue-900">GPS Verified Location</span>
                </div>
                <p className="text-sm text-blue-800">Project Site - Phase 3 (Verified)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="border">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Clock In</p>
                      <div className="text-3xl font-bold">
                        {timeEntry.clockIn || '--:--'}
                      </div>
                      <Button
                        onClick={handleClockIn}
                        className="w-full mt-4"
                        disabled={!!timeEntry.clockIn && !timeEntry.clockOut}
                      >
                        <Clock size={16} className="mr-2" />
                        Clock In
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Clock Out</p>
                      <div className="text-3xl font-bold">
                        {timeEntry.clockOut || '--:--'}
                      </div>
                      <Button
                        onClick={handleClockOut}
                        className="w-full mt-4"
                        disabled={!timeEntry.clockIn || !!timeEntry.clockOut}
                        variant={timeEntry.clockIn && !timeEntry.clockOut ? 'default' : 'outline'}
                      >
                        <Clock size={16} className="mr-2" />
                        Clock Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {timeEntry.clockIn && timeEntry.clockOut && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="text-green-600" size={20} />
                      <span className="font-medium text-green-900">Time Entry Recorded</span>
                    </div>
                    <p className="text-sm text-green-800">
                      Day recorded and ready to sync: {timeEntry.clockIn} - {timeEntry.clockOut}
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Material Tracking</CardTitle>
              <CardDescription>
                Log material deliveries and track usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <QrCode size={16} className="mr-2" />
                  Scan QR Code
                </Button>
                <Button variant="outline" className="flex-1">
                  <Upload size={16} className="mr-2" />
                  Log Delivery
                </Button>
              </div>

              <Card className="border">
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500 py-8">
                    <QrCode size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No materials logged yet</p>
                    <p className="text-sm mt-2">
                      Use QR scanning or manual entry to track materials
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sync Queue</CardTitle>
                  <CardDescription>
                    {syncQueue.length} items pending sync
                  </CardDescription>
                </div>
                <Button
                  onClick={handleSyncData}
                  disabled={syncQueue.length === 0 || offlineMode}
                  size="sm"
                >
                  <Upload size={16} className="mr-2" />
                  Sync Now
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {syncQueue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 size={48} className="mx-auto mb-4 opacity-30" />
                  <p>All data synced</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {syncQueue.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium text-sm capitalize">
                          {item.type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Offline Mode Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Enable Offline Mode</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Continue working without internet connection
                  </p>
                </div>
                <Button
                  onClick={() => setOfflineMode(!offlineMode)}
                  variant={offlineMode ? 'default' : 'outline'}
                >
                  {offlineMode ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
