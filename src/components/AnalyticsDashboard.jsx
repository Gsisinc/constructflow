import React, { useState } from 'react'
import '../styles/AnalyticsDashboard.css'

export default function AnalyticsDashboard({ data = {} }) {
  const [timeRange, setTimeRange] = useState('month')
  const [selectedMetric, setSelectedMetric] = useState('all')

  const metrics = {
    bidMetrics: {
      totalBids: data.totalBids || 0,
      winRate: data.winRate || 0,
      avgBidAmount: data.avgBidAmount || 0,
      responseTime: data.responseTime || 0
    },
    profitability: {
      totalProfit: data.totalProfit || 0,
      avgMargin: data.avgMargin || 0,
      topProject: data.topProject || 'N/A',
      lossProjects: data.lossProjects || 0
    },
    performance: {
      onTimeCompletion: data.onTimeCompletion || 0,
      qualityScore: data.qualityScore || 0,
      clientSatisfaction: data.clientSatisfaction || 0,
      repeatClientRate: data.repeatClientRate || 0
    },
    team: {
      activeUsers: data.activeUsers || 0,
      avgBidsPerUser: data.avgBidsPerUser || 0,
      topPerformer: data.topPerformer || 'N/A',
      teamProductivity: data.teamProductivity || 0
    }
  }

  const chartData = {
    bidTrend: [
      { month: 'Jan', bids: 12, wins: 4 },
      { month: 'Feb', bids: 15, wins: 6 },
      { month: 'Mar', bids: 18, wins: 7 },
      { month: 'Apr', bids: 14, wins: 5 },
      { month: 'May', bids: 20, wins: 9 },
      { month: 'Jun', bids: 22, wins: 10 }
    ],
    profitabilityTrend: [
      { month: 'Jan', profit: 45000 },
      { month: 'Feb', profit: 52000 },
      { month: 'Mar', profit: 48000 },
      { month: 'Apr', profit: 61000 },
      { month: 'May', profit: 73000 },
      { month: 'Jun', profit: 85000 }
    ]
  }

  const maxBids = Math.max(...chartData.bidTrend.map(d => d.bids))
  const maxProfit = Math.max(...chartData.profitabilityTrend.map(d => d.profit))

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Analytics & Reporting Dashboard</h2>
        <div className="header-controls">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="time-range-select">
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Bid Metrics</h3>
          <div className="metric-items">
            <div className="metric-item">
              <span className="metric-label">Total Bids</span>
              <span className="metric-value">{metrics.bidMetrics.totalBids}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Win Rate</span>
              <span className="metric-value">{metrics.bidMetrics.winRate}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Avg Bid Amount</span>
              <span className="metric-value">${(metrics.bidMetrics.avgBidAmount / 1000).toFixed(0)}K</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Response Time</span>
              <span className="metric-value">{metrics.bidMetrics.responseTime}h</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Profitability</h3>
          <div className="metric-items">
            <div className="metric-item">
              <span className="metric-label">Total Profit</span>
              <span className="metric-value">${(metrics.profitability.totalProfit / 1000).toFixed(0)}K</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Avg Margin</span>
              <span className="metric-value">{metrics.profitability.avgMargin}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Top Project</span>
              <span className="metric-value">{metrics.profitability.topProject}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Loss Projects</span>
              <span className="metric-value">{metrics.profitability.lossProjects}</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Performance</h3>
          <div className="metric-items">
            <div className="metric-item">
              <span className="metric-label">On-Time</span>
              <span className="metric-value">{metrics.performance.onTimeCompletion}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Quality Score</span>
              <span className="metric-value">{metrics.performance.qualityScore}/10</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Client Satisfaction</span>
              <span className="metric-value">{metrics.performance.clientSatisfaction}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Repeat Clients</span>
              <span className="metric-value">{metrics.performance.repeatClientRate}%</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Team Performance</h3>
          <div className="metric-items">
            <div className="metric-item">
              <span className="metric-label">Active Users</span>
              <span className="metric-value">{metrics.team.activeUsers}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Avg Bids/User</span>
              <span className="metric-value">{metrics.team.avgBidsPerUser}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Top Performer</span>
              <span className="metric-value">{metrics.team.topPerformer}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Productivity</span>
              <span className="metric-value">{metrics.team.teamProductivity}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <h3>Bid Trend</h3>
          <div className="chart">
            {chartData.bidTrend.map((data, idx) => (
              <div key={idx} className="chart-column">
                <div className="column-bars">
                  <div
                    className="bar bar-bids"
                    style={{ height: `${(data.bids / maxBids) * 100}%` }}
                    title={`${data.bids} bids`}
                  ></div>
                  <div
                    className="bar bar-wins"
                    style={{ height: `${(data.wins / maxBids) * 100}%` }}
                    title={`${data.wins} wins`}
                  ></div>
                </div>
                <span className="column-label">{data.month}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-color bids"></span>Bids</span>
            <span className="legend-item"><span className="legend-color wins"></span>Wins</span>
          </div>
        </div>

        <div className="chart-container">
          <h3>Profitability Trend</h3>
          <div className="chart">
            {chartData.profitabilityTrend.map((data, idx) => (
              <div key={idx} className="chart-column">
                <div
                  className="profit-bar"
                  style={{ height: `${(data.profit / maxProfit) * 100}%` }}
                  title={`$${(data.profit / 1000).toFixed(0)}K`}
                ></div>
                <span className="column-label">{data.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="export-section">
        <h3>Export Reports</h3>
        <div className="export-buttons">
          <button className="export-btn">📊 Export to Excel</button>
          <button className="export-btn">📄 Export to PDF</button>
          <button className="export-btn">📧 Email Report</button>
          <button className="export-btn">🔗 Share Link</button>
        </div>
      </div>
    </div>
  )
}
