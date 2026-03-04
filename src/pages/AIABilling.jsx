import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import constructflowClient from '@/api/constructflowClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Download, Upload, Edit2, Trash2 } from 'lucide-react';

/** AIA Billing – G702/G703 Pay Applications. */
export default function AIABilling() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedForms, setUploadedForms] = useState([
    { id: '1', name: 'G702-Template.pdf', uploadedDate: '2026-02-20', type: 'G702' },
    { id: '2', name: 'G703-Template.pdf', uploadedDate: '2026-02-19', type: 'G703' }
  ]);

  const payApps = [
    { id: '1', period: 'January 2025', contractSum: 500000, previousCert: 0, currentCert: 45000, retainage: 2250, status: 'approved' },
    { id: '2', period: 'February 2025', contractSum: 500000, previousCert: 45000, currentCert: 52000, retainage: 2600, status: 'pending' }
  ];

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => constructflowClient.getCurrentUser()
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadForm = () => {
    if (selectedFile) {
      const newForm = {
        id: Date.now().toString(),
        name: selectedFile.name,
        uploadedDate: new Date().toISOString().split('T')[0],
        type: selectedFile.name.includes('G702') ? 'G702' : 'G703'
      };
      setUploadedForms([...uploadedForms, newForm]);
      setSelectedFile(null);
      setShowUploadDialog(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 break-words">AIA Billing</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Generate and manage G702/G703 pay applications</p>
        </div>
        <Button size="lg" className="w-full sm:w-auto sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> New Pay App
        </Button>
      </div>

      {/* Upload Forms Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" /> AIA Form Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowUploadDialog(!showUploadDialog)}
              className="w-full sm:w-auto sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" /> Upload Form Template
            </Button>
          </div>

          {/* Upload Dialog */}
          {showUploadDialog && (
            <div className="border-2 border-dashed rounded-lg p-4 sm:p-6 bg-slate-50">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">Upload G702 or G703 PDF Template</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4 file:rounded-md
                    file:border-0 file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <p className="text-xs sm:text-sm text-slate-600">Selected: {selectedFile.name}</p>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleUploadForm}
                    disabled={!selectedFile}
                  >
                    Upload
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowUploadDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Forms List */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Your Templates</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 sm:grid-cols-2 gap-2">
              {uploadedForms.map((form) => (
                <div key={form.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">{form.name}</p>
                      <p className="text-xs text-slate-500">{form.type} • {form.uploadedDate}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pay Applications Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" /> Pay Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mobile View - Cards */}
          <div className="block sm:hidden space-y-3">
            {payApps.map((row) => (
              <div key={row.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{row.period}</p>
                    <Badge variant={row.status === 'approved' ? 'default' : 'secondary'} className="text-xs mt-1">
                      {row.status}
                    </Badge>
                  </div>
                  <p className="font-semibold text-sm text-slate-900 text-right">
                    ${row.currentCert.toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Contract</p>
                    <p className="font-medium">${(row.contractSum / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Prev. Cert</p>
                    <p className="font-medium">${(row.previousCert / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Retainage</p>
                    <p className="font-medium">${(row.retainage / 1000).toFixed(1)}K</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full sm:w-auto text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-700">Period</th>
                  <th className="text-right p-3 font-medium text-slate-700">Contract Sum</th>
                  <th className="text-right p-3 font-medium text-slate-700">Previous Cert.</th>
                  <th className="text-right p-3 font-medium text-slate-700">Current Cert.</th>
                  <th className="text-right p-3 font-medium text-slate-700">Retainage</th>
                  <th className="text-center p-3 font-medium text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {payApps.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-slate-50">
                    <td className="p-3 text-slate-900 font-medium">{row.period}</td>
                    <td className="p-3 text-right text-slate-900">${row.contractSum.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-900">${row.previousCert.toLocaleString()}</td>
                    <td className="p-3 text-right font-semibold text-slate-900">${row.currentCert.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-900">${row.retainage.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <Badge variant={row.status === 'approved' ? 'default' : 'secondary'}>
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500">
            <strong>G702:</strong> Application and Certificate for Payment • <strong>G703:</strong> Continuation Sheet
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
