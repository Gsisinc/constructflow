import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SymbolReviewStep({ data, onComplete }) {
  const [symbols, setSymbols] = useState(data.symbols || {});
  const [unknownSymbols, setUnknownSymbols] = useState([]);
  const [allResolved, setAllResolved] = useState(true); // always allow proceeding

  const handleResolveSymbol = (symbolId, interpretation) => {
    setSymbols(prev => ({ ...prev, [symbolId]: interpretation }));
    setUnknownSymbols(prev => prev.filter(s => s !== symbolId));
    setAllResolved(true);
  };

  const handleNext = () => {
    // Allow proceeding even if no symbols — user may add manually later
    onComplete({ symbols });
  };

  const scopeList = Object.values(symbols)
    .map(s => s.scope)
    .filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900">Legend Review</p>
          <p className="text-sm text-blue-700 mt-1">
            The software detected these symbols from the plan's legend. Review and confirm each one.
          </p>
        </div>
      </div>

      {/* Detected Scopes */}
      {scopeList.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Detected Scopes:</p>
          <div className="flex flex-wrap gap-2">
            {scopeList.map(scope => (
              <div
                key={scope}
                className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-full text-sm font-medium"
              >
                {scope}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Symbol Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(symbols).map(([symbolId, symbolData]) => (
          <Card key={symbolId} className="border-slate-200 hover:border-slate-300 transition">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{symbolData?.name || symbolId}</p>
                  {symbolData?.description && <p className="text-xs text-slate-500 mt-1">{symbolData.description}</p>}
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              </div>
              <div className="text-sm">
                <p className="text-slate-600">
                  <span className="font-medium">Scope:</span> {symbolData.scope}
                </p>
                <p className="text-slate-600">
                  <span className="font-medium">Qty:</span> {symbolData.quantity || 0} detected
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {unknownSymbols.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="font-medium text-amber-900">Unknown Symbols</p>
          <p className="text-sm text-amber-800 mt-2">
            {unknownSymbols.length} symbol(s) require manual identification. Please identify each one:
          </p>
          {unknownSymbols.map((symbolId, idx) => (
            <div key={idx} className="mt-3 p-3 bg-white rounded border border-amber-300 space-y-2">
              <p className="text-sm font-medium text-slate-900">Symbol #{symbolId}</p>
              <input
                type="text"
                placeholder="What is this symbol? (e.g., 'Smoke Detector', 'Camera')"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                onBlur={(e) => {
                  if (e.target.value) {
                    handleResolveSymbol(symbolId, {
                      name: e.target.value,
                      scope: 'TBD',
                    });
                  }
                }}
              />
            </div>
          ))}
        </div>
      )}

      {allResolved ? (
        <Button onClick={handleNext} className="w-full mt-8">
          Confirm Symbols & Continue
        </Button>
      ) : (
        <Button disabled className="w-full mt-8">
          Resolve all symbols to continue
        </Button>
      )}
    </div>
  );
}