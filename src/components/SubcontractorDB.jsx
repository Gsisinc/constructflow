import React, { useState } from 'react'
import '../styles/SubcontractorDB.css'

export default function SubcontractorDB({ subcontractors = [] }) {
  const [selectedSub, setSelectedSub] = useState(null)
  const [filterTrade, setFilterTrade] = useState('all')
  const [filterRating, setFilterRating] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const trades = [...new Set(subcontractors.map(s => s.trade))]

  const filteredSubs = subcontractors.filter(sub => {
    if (filterTrade !== 'all' && sub.trade !== filterTrade) return false
    if (filterRating !== 'all' && sub.rating < parseInt(filterRating)) return false
    if (searchTerm && !sub.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#11998e'
    if (rating >= 4) return '#667eea'
    if (rating >= 3) return '#f5576c'
    return '#eb3349'
  }

  const getQualificationStatus = (sub) => {
    const statuses = []
    if (sub.licenseVerified) statuses.push('✓ License')
    if (sub.insuranceVerified) statuses.push('✓ Insurance')
    if (sub.backgroundCheck) statuses.push('✓ Background')
    return statuses
  }

  return (
    <div className="subcontractor-db">
      <div className="db-header">
        <h2>Subcontractor Database & Qualification</h2>
        <p>Manage and track subcontractor qualifications and performance</p>
      </div>

      <div className="db-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search subcontractors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Trade</label>
          <select value={filterTrade} onChange={(e) => setFilterTrade(e.target.value)}>
            <option value="all">All Trades</option>
            {trades.map(trade => (
              <option key={trade} value={trade}>{trade}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Min Rating</label>
          <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
            <option value="all">All Ratings</option>
            <option value="3">3+ Stars</option>
            <option value="4">4+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
          </select>
        </div>

        <div className="filter-info">
          <span>{filteredSubs.length} subcontractors</span>
        </div>
      </div>

      <div className="db-content">
        <div className="subcontractor-grid">
          {filteredSubs.map(sub => (
            <div
              key={sub.id}
              className={`sub-card ${selectedSub?.id === sub.id ? 'selected' : ''}`}
              onClick={() => setSelectedSub(sub)}
            >
              <div className="sub-header">
                <h3>{sub.name}</h3>
                <span className="sub-trade">{sub.trade}</span>
              </div>

              <div className="sub-rating">
                <div className="stars">
                  {'★'.repeat(Math.floor(sub.rating))}
                  {sub.rating % 1 !== 0 && '½'}
                </div>
                <span className="rating-value" style={{ color: getRatingColor(sub.rating) }}>
                  {sub.rating}/5
                </span>
              </div>

              <div className="sub-stats">
                <div className="stat">
                  <span className="stat-label">Jobs</span>
                  <span className="stat-value">{sub.jobsCompleted}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">On-Time</span>
                  <span className="stat-value">{sub.onTimePercentage}%</span>
                </div>
              </div>

              <div className="sub-qualifications">
                {getQualificationStatus(sub).map((status, idx) => (
                  <span key={idx} className="qual-badge">{status}</span>
                ))}
              </div>

              <button className="sub-action-btn">View Details</button>
            </div>
          ))}
        </div>

        {selectedSub && (
          <div className="sub-details">
            <div className="details-header">
              <h2>{selectedSub.name}</h2>
              <button className="close-btn" onClick={() => setSelectedSub(null)}>✕</button>
            </div>

            <div className="details-grid">
              <div className="detail-section">
                <h3>Contact Information</h3>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{selectedSub.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{selectedSub.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Address</span>
                  <span className="detail-value">{selectedSub.address}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Qualifications</h3>
                <div className="qual-checklist">
                  <div className="qual-item">
                    <input type="checkbox" checked={selectedSub.licenseVerified} disabled />
                    <label>License Verified</label>
                  </div>
                  <div className="qual-item">
                    <input type="checkbox" checked={selectedSub.insuranceVerified} disabled />
                    <label>Insurance Verified</label>
                  </div>
                  <div className="qual-item">
                    <input type="checkbox" checked={selectedSub.backgroundCheck} disabled />
                    <label>Background Check</label>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Performance Metrics</h3>
                <div className="metric-item">
                  <span className="metric-label">Jobs Completed</span>
                  <span className="metric-value">{selectedSub.jobsCompleted}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">On-Time Completion</span>
                  <span className="metric-value">{selectedSub.onTimePercentage}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Quality Rating</span>
                  <span className="metric-value">{selectedSub.rating}/5</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Insurance & Bonding</h3>
                <div className="detail-item">
                  <span className="detail-label">License #</span>
                  <span className="detail-value">{selectedSub.licenseNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Insurance Provider</span>
                  <span className="detail-value">{selectedSub.insuranceProvider}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Policy #</span>
                  <span className="detail-value">{selectedSub.policyNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Bonded Amount</span>
                  <span className="detail-value">${selectedSub.bondAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Bid History</h3>
                <div className="bid-history">
                  {selectedSub.bidHistory?.map((bid, idx) => (
                    <div key={idx} className="bid-item">
                      <span className="bid-project">{bid.project}</span>
                      <span className="bid-amount">${bid.amount.toLocaleString()}</span>
                      <span className={`bid-status ${bid.status}`}>{bid.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="details-actions">
              <button className="action-btn btn-primary">Send Bid Invitation</button>
              <button className="action-btn btn-secondary">View Full Profile</button>
              <button className="action-btn btn-outline">Add to Favorites</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
