import React, { useState } from 'react'
import '../styles/AIBidAnalysis.css'

export default function AIBidAnalysis({ bid = {} }) {
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)

  const mockAnalysis = {
    riskScore: 7.2,
    riskLevel: 'Medium',
    winProbability: 68,
    profitMargin: 22,
    recommendations: [
      { type: 'warning', text: 'Scope creep risk detected in Section 3' },
      { type: 'info', text: 'Competitor pricing suggests margin opportunity' },
      { type: 'success', text: 'Timeline is realistic and achievable' },
      { type: 'warning', text: 'Insurance costs may be underestimated' }
    ],
    competitorAnalysis: {
      avgPrice: 125000,
      yourPrice: 135000,
      pricePercentage: 108,
      marketPosition: 'Premium'
    },
    historicalData: {
      similarProjects: 12,
      winRate: 72,
      avgMargin: 24,
      avgDuration: '45 days'
    },
    aiInsights: [
      'Based on 500+ similar projects, this bid has a 68% win probability',
      'Your pricing is 8% above market average but justified by quality',
      'Recommend emphasizing experience with similar project types',
      'Timeline matches industry standards for this scope'
    ]
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    // Simulate API call
    setTimeout(() => {
      setAnalysis(mockAnalysis)
      setAnalyzing(false)
    }, 2000)
  }

  const getRiskColor = (score) => {
    if (score < 3) return '#11998e'
    if (score < 5) return '#4facfe'
    if (score < 7) return '#f5a623'
    return '#f5576c'
  }

  const getRiskLabel = (score) => {
    if (score < 3) return 'Low'
    if (score < 5) return 'Low-Medium'
    if (score < 7) return 'Medium'
    if (score < 9) return 'Medium-High'
    return 'High'
  }

  return (
    <div className="ai-bid-analysis">
      <div className="analysis-header">
        <h2>🤖 AI-Powered Bid Analysis</h2>
        <p>Get intelligent insights on bid risk, win probability, and profitability</p>
      </div>

      {!analysis ? (
        <div className="analysis-prompt">
          <div className="prompt-content">
            <h3>Analyze This Bid with AI</h3>
            <p>Our AI engine will analyze your bid against:</p>
            <ul>
              <li>Historical project data</li>
              <li>Market pricing trends</li>
              <li>Risk factors & scope analysis</li>
              <li>Competitor benchmarking</li>
              <li>Win probability prediction</li>
            </ul>
            <button
              className="btn-analyze"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? '⏳ Analyzing...' : '🚀 Analyze Bid Now'}
            </button>
          </div>
        </div>
      ) : (
        <div className="analysis-results">
          <div className="results-grid">
            <div className="result-card risk-card">
              <h3>Risk Assessment</h3>
              <div className="risk-score">
                <div
                  className="risk-circle"
                  style={{ backgroundColor: getRiskColor(analysis.riskScore) }}
                >
                  <span className="risk-number">{analysis.riskScore}</span>
                </div>
                <div className="risk-info">
                  <span className="risk-label">{getRiskLabel(analysis.riskScore)}</span>
                  <span className="risk-desc">Out of 10</span>
                </div>
              </div>
            </div>

            <div className="result-card probability-card">
              <h3>Win Probability</h3>
              <div className="probability-display">
                <div className="probability-circle">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" className="circle-bg" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      className="circle-progress"
                      style={{
                        strokeDasharray: `${(analysis.winProbability / 100) * 283} 283`
                      }}
                    />
                  </svg>
                  <span className="probability-value">{analysis.winProbability}%</span>
                </div>
              </div>
            </div>

            <div className="result-card margin-card">
              <h3>Profit Margin</h3>
              <div className="margin-display">
                <span className="margin-value">{analysis.profitMargin}%</span>
                <span className="margin-label">Estimated Margin</span>
              </div>
              <div className="margin-bar">
                <div
                  className="margin-fill"
                  style={{ width: `${analysis.profitMargin}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="recommendations-section">
            <h3>AI Recommendations</h3>
            <div className="recommendations-list">
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className={`recommendation-item ${rec.type}`}>
                  <span className="rec-icon">
                    {rec.type === 'warning' && '⚠️'}
                    {rec.type === 'info' && 'ℹ️'}
                    {rec.type === 'success' && '✅'}
                  </span>
                  <span className="rec-text">{rec.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="insights-grid">
            <div className="insight-card">
              <h4>Competitor Analysis</h4>
              <div className="insight-item">
                <span className="insight-label">Market Average</span>
                <span className="insight-value">${analysis.competitorAnalysis.avgPrice.toLocaleString()}</span>
              </div>
              <div className="insight-item">
                <span className="insight-label">Your Price</span>
                <span className="insight-value">${analysis.competitorAnalysis.yourPrice.toLocaleString()}</span>
              </div>
              <div className="insight-item">
                <span className="insight-label">Market Position</span>
                <span className="insight-value">{analysis.competitorAnalysis.marketPosition}</span>
              </div>
            </div>

            <div className="insight-card">
              <h4>Historical Data</h4>
              <div className="insight-item">
                <span className="insight-label">Similar Projects</span>
                <span className="insight-value">{analysis.historicalData.similarProjects}</span>
              </div>
              <div className="insight-item">
                <span className="insight-label">Win Rate</span>
                <span className="insight-value">{analysis.historicalData.winRate}%</span>
              </div>
              <div className="insight-item">
                <span className="insight-label">Avg Margin</span>
                <span className="insight-value">{analysis.historicalData.avgMargin}%</span>
              </div>
            </div>

            <div className="insight-card">
              <h4>AI Insights</h4>
              <ul className="insights-list">
                {analysis.aiInsights.map((insight, idx) => (
                  <li key={idx}>{insight}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="actions-section">
            <button className="action-btn btn-primary">📊 View Detailed Report</button>
            <button className="action-btn btn-secondary">💾 Save Analysis</button>
            <button className="action-btn btn-outline" onClick={() => setAnalysis(null)}>
              🔄 Analyze Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
