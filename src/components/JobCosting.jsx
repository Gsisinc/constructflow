import React, { useState } from 'react'
import '../styles/JobCosting.css'

export default function JobCosting({ jobs = [] }) {
  const [selectedJob, setSelectedJob] = useState(null)
  const [viewMode, setViewMode] = useState('overview')

  const calculateVariance = (budget, actual) => {
    return ((actual - budget) / budget * 100).toFixed(1)
  }

  const getProfitability = (budget, actual) => {
    return ((budget - actual) / budget * 100).toFixed(1)
  }

  const selectedJobData = jobs.find(j => j.id === selectedJob) || jobs[0]

  return (
    <div className="job-costing">
      <div className="costing-header">
        <h2>Job Costing & Profitability Analysis</h2>
        <div className="view-toggles">
          <button
            className={`toggle-btn ${viewMode === 'overview' ? 'active' : ''}`}
            onClick={() => setViewMode('overview')}
          >
            Overview
          </button>
          <button
            className={`toggle-btn ${viewMode === 'detailed' ? 'active' : ''}`}
            onClick={() => setViewMode('detailed')}
          >
            Detailed
          </button>
          <button
            className={`toggle-btn ${viewMode === 'trends' ? 'active' : ''}`}
            onClick={() => setViewMode('trends')}
          >
            Trends
          </button>
        </div>
      </div>

      <div className="costing-content">
        {viewMode === 'overview' && (
          <div className="overview-section">
            <div className="job-selector">
              <label>Select Job</label>
              <select value={selectedJob || ''} onChange={(e) => setSelectedJob(e.target.value)}>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.name} - ${job.budget.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {selectedJobData && (
              <>
                <div className="costing-cards">
                  <div className="costing-card">
                    <h3>Budget</h3>
                    <span className="costing-value">${selectedJobData.budget.toLocaleString()}</span>
                    <p className="costing-label">Total Budget</p>
                  </div>

                  <div className="costing-card">
                    <h3>Actual Cost</h3>
                    <span className="costing-value">${selectedJobData.actualCost.toLocaleString()}</span>
                    <p className="costing-label">Spent to Date</p>
                  </div>

                  <div className="costing-card">
                    <h3>Variance</h3>
                    <span className={`costing-value ${calculateVariance(selectedJobData.budget, selectedJobData.actualCost) > 0 ? 'negative' : 'positive'}`}>
                      {calculateVariance(selectedJobData.budget, selectedJobData.actualCost)}%
                    </span>
                    <p className="costing-label">Over/Under Budget</p>
                  </div>

                  <div className="costing-card">
                    <h3>Profitability</h3>
                    <span className="costing-value">{getProfitability(selectedJobData.budget, selectedJobData.actualCost)}%</span>
                    <p className="costing-label">Profit Margin</p>
                  </div>
                </div>

                <div className="progress-section">
                  <h3>Budget vs Actual</h3>
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div
                        className="progress-budget"
                        style={{
                          width: `${Math.min((selectedJobData.actualCost / selectedJobData.budget) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    <div className="progress-labels">
                      <span>Budget: ${selectedJobData.budget.toLocaleString()}</span>
                      <span>Actual: ${selectedJobData.actualCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="cost-breakdown">
                  <h3>Cost Breakdown</h3>
                  <table className="breakdown-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Budget</th>
                        <th>Actual</th>
                        <th>Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedJobData.costBreakdown?.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.category}</td>
                          <td>${item.budget.toLocaleString()}</td>
                          <td>${item.actual.toLocaleString()}</td>
                          <td className={calculateVariance(item.budget, item.actual) > 0 ? 'negative' : 'positive'}>
                            {calculateVariance(item.budget, item.actual)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {viewMode === 'detailed' && (
          <div className="detailed-section">
            <div className="detailed-grid">
              {jobs.map(job => {
                const variance = calculateVariance(job.budget, job.actualCost)
                const profitability = getProfitability(job.budget, job.actualCost)

                return (
                  <div key={job.id} className="detailed-card">
                    <div className="card-header-detailed">
                      <h4>{job.name}</h4>
                      <span className={`status-badge ${profitability > 0 ? 'profitable' : 'loss'}`}>
                        {profitability > 0 ? 'Profitable' : 'Loss'}
                      </span>
                    </div>

                    <div className="card-metrics">
                      <div className="metric">
                        <span className="metric-label">Budget</span>
                        <span className="metric-value">${job.budget.toLocaleString()}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Actual</span>
                        <span className="metric-value">${job.actualCost.toLocaleString()}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Variance</span>
                        <span className={`metric-value ${variance > 0 ? 'negative' : 'positive'}`}>
                          {variance}%
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Profit</span>
                        <span className="metric-value">${(job.budget - job.actualCost).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="card-progress">
                      <div className="mini-progress-bar">
                        <div
                          className="mini-progress-fill"
                          style={{
                            width: `${Math.min((job.actualCost / job.budget) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                      <span className="progress-percent">
                        {((job.actualCost / job.budget) * 100).toFixed(0)}% spent
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {viewMode === 'trends' && (
          <div className="trends-section">
            <div className="trends-grid">
              <div className="trend-card">
                <h3>Total Portfolio Value</h3>
                <span className="trend-value">
                  ${jobs.reduce((sum, j) => sum + j.budget, 0).toLocaleString()}
                </span>
              </div>

              <div className="trend-card">
                <h3>Total Spent</h3>
                <span className="trend-value">
                  ${jobs.reduce((sum, j) => sum + j.actualCost, 0).toLocaleString()}
                </span>
              </div>

              <div className="trend-card">
                <h3>Average Profitability</h3>
                <span className="trend-value">
                  {(jobs.reduce((sum, j) => sum + parseFloat(getProfitability(j.budget, j.actualCost)), 0) / jobs.length).toFixed(1)}%
                </span>
              </div>

              <div className="trend-card">
                <h3>On-Budget Jobs</h3>
                <span className="trend-value">
                  {jobs.filter(j => calculateVariance(j.budget, j.actualCost) <= 0).length}/{jobs.length}
                </span>
              </div>
            </div>

            <div className="profitability-chart">
              <h3>Job Profitability Comparison</h3>
              <div className="chart-bars">
                {jobs.map(job => (
                  <div key={job.id} className="chart-bar-item">
                    <div className="chart-bar">
                      <div
                        className="chart-bar-fill"
                        style={{
                          height: `${Math.max(parseFloat(getProfitability(job.budget, job.actualCost)), 0)}%`
                        }}
                      ></div>
                    </div>
                    <span className="chart-label">{job.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
