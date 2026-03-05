import React, { useState } from 'react'
import '../styles/BidComparison.css'

export default function BidComparison({ bids = [] }) {
  const [selectedBids, setSelectedBids] = useState([])
  const [sortBy, setSortBy] = useState('amount')

  const toggleBidSelection = (bidId) => {
    setSelectedBids(prev =>
      prev.includes(bidId)
        ? prev.filter(id => id !== bidId)
        : [...prev, bidId]
    )
  }

  const selectedBidData = bids.filter(bid => selectedBids.includes(bid.id))

  const getWinProbability = (bid) => {
    // AI-powered win probability calculation
    const factors = {
      price: bid.amount < 100000 ? 0.3 : bid.amount < 200000 ? 0.5 : 0.7,
      timeline: bid.timeline === 'fast' ? 0.2 : 0.5,
      quality: bid.quality || 0.6,
      vendor: bid.vendorRating || 0.5
    }
    return Math.round((factors.price * 0.4 + factors.timeline * 0.2 + factors.quality * 0.2 + factors.vendor * 0.2) * 100)
  }

  const getRiskLevel = (bid) => {
    // AI-powered risk detection
    const risks = []
    if (bid.amount > 500000) risks.push('high_amount')
    if (!bid.vendorRating) risks.push('unknown_vendor')
    if (bid.timeline === 'rush') risks.push('tight_timeline')
    if (!bid.insurance) risks.push('no_insurance')
    
    return risks.length > 2 ? 'high' : risks.length > 0 ? 'medium' : 'low'
  }

  const sortedBids = [...selectedBidData].sort((a, b) => {
    if (sortBy === 'amount') return a.amount - b.amount
    if (sortBy === 'date') return new Date(b.date) - new Date(a.date)
    if (sortBy === 'vendor') return a.vendor.localeCompare(b.vendor)
    return 0
  })

  return (
    <div className="bid-comparison">
      <div className="comparison-header">
        <h2>Bid Comparison & Analysis</h2>
        <div className="comparison-controls">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
            <option value="amount">Sort by Amount</option>
            <option value="date">Sort by Date</option>
            <option value="vendor">Sort by Vendor</option>
          </select>
        </div>
      </div>

      {selectedBidData.length === 0 ? (
        <div className="empty-state">
          <p>Select bids from the list below to compare</p>
        </div>
      ) : (
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Timeline</th>
                <th>Win Probability</th>
                <th>Risk Level</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {sortedBids.map(bid => {
                const winProb = getWinProbability(bid)
                const riskLevel = getRiskLevel(bid)
                const score = Math.round(winProb * 0.7 + (100 - (riskLevel === 'high' ? 70 : riskLevel === 'medium' ? 50 : 20)) * 0.3)

                return (
                  <tr key={bid.id} className="comparison-row">
                    <td className="vendor-cell">
                      <strong>{bid.vendor}</strong>
                      <span className="vendor-rating">★ {bid.vendorRating || 'N/A'}</span>
                    </td>
                    <td className="amount-cell">
                      <span className="amount">${bid.amount.toLocaleString()}</span>
                    </td>
                    <td className="timeline-cell">
                      <span className="timeline-badge">{bid.timeline}</span>
                    </td>
                    <td className="probability-cell">
                      <div className="probability-bar">
                        <div className="probability-fill" style={{ width: `${winProb}%` }}></div>
                      </div>
                      <span className="probability-text">{winProb}%</span>
                    </td>
                    <td className="risk-cell">
                      <span className={`risk-badge risk-${riskLevel}`}>{riskLevel}</span>
                    </td>
                    <td className="score-cell">
                      <span className="score-badge">{score}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="bid-selection-list">
        <h3>Available Bids</h3>
        <div className="bid-list">
          {bids.map(bid => (
            <div
              key={bid.id}
              className={`bid-item ${selectedBids.includes(bid.id) ? 'selected' : ''}`}
              onClick={() => toggleBidSelection(bid.id)}
            >
              <input
                type="checkbox"
                checked={selectedBids.includes(bid.id)}
                onChange={() => {}}
              />
              <div className="bid-info">
                <div className="bid-vendor">{bid.vendor}</div>
                <div className="bid-amount">${bid.amount.toLocaleString()}</div>
              </div>
              <span className="bid-date">{new Date(bid.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedBidData.length > 0 && (
        <div className="comparison-insights">
          <h3>AI Insights</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <h4>Best Value</h4>
              <p>{sortedBids[0]?.vendor || 'N/A'}</p>
              <span className="insight-value">${sortedBids[0]?.amount.toLocaleString()}</span>
            </div>
            <div className="insight-card">
              <h4>Highest Win Probability</h4>
              <p>{sortedBids.reduce((a, b) => getWinProbability(a) > getWinProbability(b) ? a : b)?.vendor}</p>
              <span className="insight-value">{Math.max(...sortedBids.map(getWinProbability))}%</span>
            </div>
            <div className="insight-card">
              <h4>Lowest Risk</h4>
              <p>{sortedBids.filter(b => getRiskLevel(b) === 'low')[0]?.vendor || 'N/A'}</p>
              <span className="insight-value">Low Risk</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
