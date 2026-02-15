import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertTriangle, Zap, Brain } from 'lucide-react';
import { toast } from 'sonner';

// KPI Tracking Component
export function KPITracking() {
  const [kpis] = useState([
    {
      id: 1,
      name: 'On-Time Delivery Rate',
      value: 88.5,
      unit: '%',
      target: 95,
      trend: 3.2,
      status: 'warning',
      historicalData: [85, 84, 86, 87, 88, 89, 88, 88.5]
    },
    {
      id: 2,
      name: 'Budget Variance',
      value: 2.1,
      unit: '%',
      target: 0,
      trend: -0.5,
      status: 'good',
      historicalData: [3.2, 3.0, 2.8, 2.5, 2.3, 2.2, 2.1, 2.1]
    },
    {
      id: 3,
      name: 'Safety Incidents',
      value: 2,
      unit: 'incidents',
      target: 0,
      trend: -1,
      status: 'good',
      historicalData: [5, 4, 3, 3, 2, 2, 2, 2]
    },
    {
      id: 4,
      name: 'Team Utilization',
      value: 82,
      unit: '%',
      target: 85,
      trend: 2.1,
      status: 'good',
      historicalData: [75, 76, 78, 79, 80, 81, 81, 82]
    },
    {
      id: 5,
      name: 'Client Satisfaction',
      value: 4.6,
      unit: '/5',
      target: 4.8,
      trend: 0.2,
      status: 'good',
      historicalData: [4.2, 4.3, 4.4, 4.5, 4.5, 4.6, 4.6, 4.6]
    },
    {
      id: 6,
      name: 'Quality Score',
      value: 94,
      unit: '%',
      target: 98,
      trend: 2.1,
      status: 'warning',
      historicalData: [88, 89, 90, 91, 92, 93, 93, 94]
    }
  ]);

  const getStatusColor = (status) => {
    return status === 'good' ? 'text-green-600' : status === 'warning' ? 'text-orange-600' : 'text-red-600';
  };

  const getStatusBgColor = (status) => {
    return status === 'good' ? 'bg-green-50 border-green-200' : status === 'warning' ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators (KPIs)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map(kpi => (
              <div key={kpi.id} className={`border rounded-lg p-4 ${getStatusBgColor(kpi.status)}`}>
                <div className="flex items-start justify-between mb-3">
                  <p className="font-bold text-sm">{kpi.name}</p>
                  <div className={`flex items-center gap-1 ${getStatusColor(kpi.status)}`}>
                    {kpi.trend > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-xs font-medium">{Math.abs(kpi.trend).toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex items-end gap-2 mb-3">
                  <p className="text-3xl font-bold">{kpi.value}</p>
                  <p className="text-slate-600 text-sm">{kpi.unit}</p>
                </div>

                <p className="text-xs text-slate-600 mb-3">Target: {kpi.target} {kpi.unit}</p>

                {/* Mini sparkline */}
                <div className="h-8 flex items-end gap-0.5">
                  {kpi.historicalData.map((value, idx) => {
                    const maxValue = Math.max(...kpi.historicalData);
                    const height = (value / maxValue) * 100;
                    return (
                      <div
                        key={idx}
                        className={`flex-1 rounded-t ${
                          idx === kpi.historicalData.length - 1 ? 'bg-blue-600' : 'bg-blue-300'
                        }`}
                        style={{ height: `${height}%`, minHeight: '2px' }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Predictive Analytics Component
export function PredictiveAnalytics() {
  const [predictions] = useState([
    {
      id: 1,
      metric: 'Project Completion',
      prediction: 'On schedule',
      confidence: 87,
      riskFactors: ['Good progress on foundation', 'Adequate resource allocation'],
      daysEarly: 5
    },
    {
      id: 2,
      metric: 'Budget Overrun',
      prediction: 'Possible 2-3% overrun',
      confidence: 72,
      riskFactors: ['Material price increases', 'Potential scope changes'],
      estimatedAmount: 45000
    },
    {
      id: 3,
      metric: 'Resource Shortage',
      prediction: 'Carpenter shortage in March',
      confidence: 81,
      riskFactors: ['Current demand high', 'Limited local availability'],
      recommendedAction: 'Start recruiting 2 weeks early'
    },
    {
      id: 4,
      metric: 'Quality Issues',
      prediction: 'Low risk',
      confidence: 94,
      riskFactors: ['Strong QA processes', 'Experienced team'],
      status: 'good'
    }
  ]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <CardTitle>Predictive Analytics</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {predictions.map(prediction => {
            const getConfidenceColor = (conf) => {
              if (conf >= 80) return 'bg-green-100 text-green-800';
              if (conf >= 60) return 'bg-yellow-100 text-yellow-800';
              return 'bg-orange-100 text-orange-800';
            };

            return (
              <div key={prediction.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-sm">{prediction.metric}</p>
                    <p className="text-sm text-slate-700 mt-1">{prediction.prediction}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getConfidenceColor(prediction.confidence)}`}>
                    {prediction.confidence}% confidence
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-600">Risk Factors:</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {prediction.riskFactors.map((factor, idx) => (
                      <li key={idx}>• {factor}</li>
                    ))}
                  </ul>
                </div>

                {prediction.recommendedAction && (
                  <div className="mt-3 p-2 bg-blue-50 rounded">
                    <p className="text-xs font-medium text-blue-900">Recommended Action:</p>
                    <p className="text-xs text-blue-800 mt-1">{prediction.recommendedAction}</p>
                  </div>
                )}

                {prediction.estimatedAmount && (
                  <div className="mt-3 p-2 bg-red-50 rounded">
                    <p className="text-xs font-medium text-red-900">Estimated Impact: ${prediction.estimatedAmount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Sentiment Analysis Component
export function SentimentAnalysis() {
  const [sentiments] = useState([
    {
      id: 1,
      source: 'Client Communication',
      sentiment: 'positive',
      score: 8.2,
      message: 'Client expressing satisfaction with progress',
      count: 5
    },
    {
      id: 2,
      source: 'Team Communication',
      sentiment: 'positive',
      score: 7.8,
      message: 'Team morale is good, positive feedback',
      count: 12
    },
    {
      id: 3,
      source: 'Safety Alerts',
      sentiment: 'negative',
      score: 3.1,
      message: 'Occasional safety concerns noted',
      count: 2
    },
    {
      id: 4,
      source: 'Supplier/Vendor Feedback',
      sentiment: 'neutral',
      score: 5.5,
      message: 'Neutral feedback on delivery times',
      count: 3
    }
  ]);

  const overallSentiment = (sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length).toFixed(1);

  const getSentimentColor = (sentiment) => {
    return sentiment === 'positive' ? 'bg-green-50 border-green-200 text-green-700' :
           sentiment === 'negative' ? 'bg-red-50 border-red-200 text-red-700' :
           'bg-slate-50 border-slate-200 text-slate-700';
  };

  const getSentimentIcon = (sentiment) => {
    return sentiment === 'positive' ? '😊' : sentiment === 'negative' ? '😟' : '😐';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Overall Project Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-5xl mb-2">{getSentimentIcon('positive')}</p>
            <p className="text-4xl font-bold text-green-600">{overallSentiment}/10</p>
            <p className="text-slate-600 mt-2">Positive Outlook</p>
            <p className="text-sm text-slate-600 mt-4">Based on analysis of communications from clients, team, and stakeholders</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sentiment by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sentiments.map(item => (
              <div key={item.id} className={`border rounded-lg p-4 ${getSentimentColor(item.sentiment)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">{item.source}</p>
                    <p className="text-xs mt-1">{item.message}</p>
                  </div>
                  <span className="text-2xl">{getSentimentIcon(item.sentiment)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs">Score: {item.score}/10</p>
                  <p className="text-xs text-slate-600">{item.count} mentions</p>
                </div>

                {/* Score bar */}
                <div className="mt-2 bg-white/40 h-2 rounded overflow-hidden">
                  <div
                    className={`h-full ${
                      item.sentiment === 'positive' ? 'bg-green-500' :
                      item.sentiment === 'negative' ? 'bg-red-500' :
                      'bg-slate-500'
                    }`}
                    style={{ width: `${(item.score / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alerts Based on Sentiment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded">
            <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-orange-900">Safety Concerns Detected</p>
              <p className="text-xs text-orange-800 mt-1">2 mentions of safety issues in last week. Consider team meeting.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Anomaly Detection Component
export function AnomalyDetection() {
  const [anomalies] = useState([
    {
      id: 1,
      type: 'expense',
      description: 'Unusual spike in material costs',
      severity: 'high',
      impact: '$15,000 over budget',
      suggestedAction: 'Review supplier pricing'
    },
    {
      id: 2,
      type: 'productivity',
      description: 'Productivity drop on March 10',
      severity: 'medium',
      impact: '20% below average',
      suggestedAction: 'Check team availability'
    },
    {
      id: 3,
      type: 'schedule',
      description: 'Task completion rate slowing',
      severity: 'medium',
      impact: 'May impact deadline',
      suggestedAction: 'Increase resource allocation'
    }
  ]);

  const getSeverityColor = (severity) => {
    return severity === 'high' ? 'bg-red-50 border-red-200 text-red-700' :
           'bg-yellow-50 border-yellow-200 text-yellow-700';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-600" />
          <CardTitle>Anomaly Detection</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {anomalies.map(anomaly => (
            <div key={anomaly.id} className={`border rounded-lg p-4 ${getSeverityColor(anomaly.severity)}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-sm">{anomaly.description}</p>
                  <p className="text-xs mt-1">Impact: {anomaly.impact}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                  anomaly.severity === 'high' ? 'bg-red-200 text-red-900' : 'bg-yellow-200 text-yellow-900'
                }`}>
                  {anomaly.severity}
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-2">Recommended: {anomaly.suggestedAction}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
