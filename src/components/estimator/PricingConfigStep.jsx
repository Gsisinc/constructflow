import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const defaultPricing = {
  laborRates: {
    AV: 125,
    Data: 125,
    FireAlarm: 130,
    AccessControl: 120,
    CCTV: 120,
    Paging: 125,
  },
  materialMarkup: 20, // percentage
  profitMargin: 22, // percentage
  contingencyPercent: 8, // percentage
};

export default function PricingConfigStep({ data, onComplete }) {
  const [pricing, setPricing] = useState(data.prices || defaultPricing);

  const handleChange = (category, key, value) => {
    setPricing(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: parseFloat(value) || 0,
      },
    }));
  };

  const handleNext = () => {
    // Validate
    if (Object.values(pricing.laborRates).some(v => v <= 0)) {
      toast.error('All labor rates must be greater than 0');
      return;
    }

    onComplete({ prices: pricing });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-600">
          <strong>Note:</strong> These are loaded billable rates (includes burden, utilization, overhead). 
          They will be applied to all estimated labor hours.
        </p>
      </div>

      {/* Labor Rates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Labor Rates ($/hour)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(pricing.laborRates).map(([scope, rate]) => (
            <div key={scope} className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">{scope}</label>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">$</span>
                <Input
                  type="number"
                  value={rate}
                  onChange={(e) => handleChange('laborRates', scope, e.target.value)}
                  className="flex-1"
                  min="0"
                />
                <span className="text-slate-600">/hr</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Material Markup */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Material Markup %</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={pricing.materialMarkup}
            onChange={(e) => setPricing(prev => ({ ...prev, materialMarkup: parseFloat(e.target.value) }))}
            min="0"
            max="100"
          />
          <span className="text-slate-600">%</span>
        </div>
        <p className="text-xs text-slate-500">Minimum 20% recommended</p>
      </div>

      {/* Profit Margin */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Profit Margin %</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={pricing.profitMargin}
            onChange={(e) => setPricing(prev => ({ ...prev, profitMargin: parseFloat(e.target.value) }))}
            min="0"
            max="100"
          />
          <span className="text-slate-600">%</span>
        </div>
        <p className="text-xs text-slate-500">Standard: 20-25% for new construction, 22-28% for renovation</p>
      </div>

      {/* Contingency */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Job Contingency %</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={pricing.contingencyPercent}
            onChange={(e) => setPricing(prev => ({ ...prev, contingencyPercent: parseFloat(e.target.value) }))}
            min="0"
            max="50"
          />
          <span className="text-slate-600">%</span>
        </div>
        <p className="text-xs text-slate-500">Applied to materials + labor + overhead. Standard: 7-10%</p>
      </div>

      {/* Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 space-y-2 text-sm">
          <p className="font-medium text-blue-900">Pricing Summary</p>
          <div className="text-blue-800 space-y-1">
            <p>• Materials marked up {pricing.materialMarkup}%</p>
            <p>• Profit margin {pricing.profitMargin}% on total subtotal</p>
            <p>• Contingency {pricing.contingencyPercent}% on costs</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleNext} className="w-full mt-8">
        Continue to Preview
      </Button>
    </div>
  );
}