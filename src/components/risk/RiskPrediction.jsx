import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Activity,
  Zap,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  MapPin
} from 'lucide-react';

export default function RiskPrediction() {
  const [projectHealth] = useState({
    overall: 72,
    schedule: 65,
    budget: 80,
    quality: 85,
    safety: 92,
    resources: 70
  });

  const [risks] = useState([
    {
      id: 'RISK-001',
      category: 'Schedule',
      title: 'Foundation Delay Risk',
      probability: 0.35,
      impact: 0.8,
      score: 0.28,
      severity: 'high',
      description: 'Weather delays could push foundation completion by 2 weeks',
      mitigation: 'Accelerate concrete curing with heated enclosure',
      owner: 'Project Manager'
    },
    {
      id: 'RISK-002',
      category: 'Budget',
      title: 'Material Price Escalation',
      probability: 0.6,
      impact: 0.5,
      score: 0.30,
      severity: 'high',
      description: 'Steel prices may increase 8-12% in next quarter',
      mitigation: 'Lock in prices with suppliers now',
      owner: 'Procurement'
    },
    {
      id: 'RISK-003',
      category: 'Resource',
      title: 'Labor Shortage',
      probability: 0.45,
      impact: 0.6,
      score: 0.27,
      severity: 'medium',
      description: 'Skilled trades availability declining in region',
      mitigation: 'Recruit from neighboring counties',
      owner: 'HR Manager'
    },
    {
      id: 'RISK-004',
      category: 'Quality',
      title: 'Design Coordination',
      probability: 0.25,
      impact: 0.4,
      score: 0.10,
      severity: 'low',
      description: 'Potential MEP coordination issues',
      mitigation: 'Weekly coordination meetings',
      owner: 'Engineering Lead'
    }
  ]);

  const [heatMap] = useState([
    { category: 'Schedule', probability: 0.35, impact: 0.8 },
    { category: 'Budget', probability: 0.6, impact: 0.5 },
    { category: 'Quality', probability: 0.25, impact: 0.4 },
    { category: 'Safety', probability: 0.1, impact: 0.9 },
    { category: 'Resource', probability: 0.45, impact: 0.6 }
  ]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-8 h-8 text-blue-600" />
          Risk Prediction & Project Health
        </h1>
        <p className="text-slate-600 mt-1">Monte Carlo simulation and predictive analytics</p>
      </div>

      {/* Project Health Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Project Health Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Overall Health */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <p className="text-sm text-slate-600 mb-2">Overall Health</p>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${projectHealth.overall}%` }}
                    />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${getHealthColor(projectHealth.overall)}`}>
                  {projectHealth.overall}%
                </p>
              </div>
            </div>

            {/* Individual Metrics */}
            {[
              { label: 'Schedule', value: projectHealth.schedule, icon: Clock },
              { label: 'Budget', value: projectHealth.budget, icon: DollarSign },
              { label: 'Quality', value: projectHealth.quality, icon: Zap },
              { label: 'Safety', value: projectHealth.safety, icon: Activity },
              { label: 'Resources', value: projectHealth.resources, icon: Users }
            ].map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-600" />
                      <p className="text-sm font-medium">{metric.label}</p>
                    </div>
                    <p className={`font-bold ${getHealthColor(metric.value)}`}>{metric.value}%</p>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metric.value >= 80
                          ? 'bg-green-600'
                          : metric.value >= 60
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Risk Heat Map */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Heat Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {heatMap.map((item, idx) => (
              <div key={idx} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{item.category}</p>
                  <p className="text-xs text-slate-600">
                    Risk Score: {(item.probability * item.impact * 100).toFixed(0)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded relative">
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-black rounded"
                      style={{ left: `${item.probability * 100}%` }}
                      title="Probability"
                    />
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white rounded"
                      style={{ left: `${item.impact * 100}%` }}
                      title="Impact"
                    />
                  </div>
                  <div className="text-xs text-slate-600 w-24 text-right">
                    P: {(item.probability * 100).toFixed(0)}% | I: {(item.impact * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Risks */}
      <Card>
        <CardHeader>
          <CardTitle>Identified Risks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {risks
            .sort((a, b) => b.score - a.score)
            .map((risk) => (
              <div key={risk.id} className={`p-4 border rounded-lg ${getSeverityColor(risk.severity)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{risk.title}</h3>
                    <p className="text-xs mt-1">{risk.description}</p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {risk.category}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 text-xs border-t border-current border-opacity-20">
                  <div>
                    <p className="opacity-75">Probability</p>
                    <p className="font-bold">{(risk.probability * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="opacity-75">Impact</p>
                    <p className="font-bold">{(risk.impact * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="opacity-75">Score</p>
                    <p className="font-bold">{(risk.score * 100).toFixed(0)}</p>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-current border-opacity-20 text-xs">
                  <p className="opacity-75">Mitigation:</p>
                  <p className="font-medium">{risk.mitigation}</p>
                  <p className="opacity-75 mt-1">Owner: {risk.owner}</p>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Predictive Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Predictive Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-slate-600 mb-2">Predicted Completion Date</p>
              <p className="text-xl font-bold text-blue-600">May 15, 2024</p>
              <p className="text-xs text-slate-600 mt-1">±2 weeks confidence interval</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-slate-600 mb-2">Predicted Final Cost</p>
              <p className="text-xl font-bold text-green-600">$2.48M</p>
              <p className="text-xs text-slate-600 mt-1">±$150K confidence interval</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-slate-600 mb-2">Probability of On-Time Delivery</p>
              <p className="text-xl font-bold text-orange-600">65%</p>
              <p className="text-xs text-slate-600 mt-1">Based on historical data</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-slate-600 mb-2">Probability of Budget Overrun</p>
              <p className="text-xl font-bold text-purple-600">35%</p>
              <p className="text-xs text-slate-600 mt-1">Potential overage: $200K</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
