import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, DollarSign, Users, FileText } from 'lucide-react';

export default function BidPreviewStep({ data }) {
  const scopes = useMemo(() => {
    const scopeMap = {};
    Object.values(data.symbols || {}).forEach(symbol => {
      if (symbol.scope) {
        scopeMap[symbol.scope] = (scopeMap[symbol.scope] || 0) + (symbol.quantity || 0);
      }
    });
    return scopeMap;
  }, [data.symbols]);

  const totalDevices = useMemo(
    () => (data.devices || []).length || 0,
    [data.devices]
  );

  const cableLength = useMemo(() => {
    let total = 0;
    Object.values(data.cables || {}).forEach(scope => {
      if (scope.totalLF) total += scope.totalLF;
    });
    return total;
  }, [data.cables]);

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <p className="text-sm text-emerald-900">
          <strong>Ready to generate bid documents.</strong> The system will create separate bid documents for each detected scope,
          a marked-up plan PDF with all measurements, a BOM CSV for suppliers, and an estimate record.
        </p>
      </div>

      {/* Project Summary */}
      <Card className="border-slate-200">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-lg">Project Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Project Name</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">{data.projectName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Location</p>
              <p className="text-lg font-semibold text-slate-900 mt-1 capitalize">{data.location}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">GC</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">{data.gcName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Address</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">{data.projectAddress}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detected Scopes */}
      {Object.keys(scopes).length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Detected Scopes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-3">
              {Object.entries(scopes).map(([scope, qty]) => (
                <Badge key={scope} variant="secondary" className="px-4 py-2 text-sm">
                  <span className="font-semibold">{scope}</span>
                  <span className="ml-2 text-xs opacity-75">({qty} devices)</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quantity Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Devices</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalDevices}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-3 rounded-lg bg-amber-100">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Cable (LF)</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{Math.round(cableLength).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="p-3 rounded-lg bg-emerald-100">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Profit Margin</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.prices?.profitMargin || 22}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {data.notes && (
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm">Special Instructions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-700 whitespace-pre-wrap">{data.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <p className="text-sm text-blue-900 font-medium mb-3">Click "Generate Bids" to create:</p>
          <ul className="text-sm text-blue-800 space-y-2 ml-4">
            <li>✓ Marked-up plan PDF with device circles and measurements</li>
            <li>✓ One bid document per detected scope (Word format)</li>
            <li>✓ Bill of Materials CSV for suppliers</li>
            <li>✓ Estimate record saved to database</li>
            {Object.keys(scopes).some(s => ['FireAlarm', 'AccessControl'].includes(s)) && (
              <li>✓ Plan vs Spec Conflict Report (if specs uploaded)</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}