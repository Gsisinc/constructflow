import React, { useState } from 'react'
import '../styles/AuditTrail.css'

export default function AuditTrail({ logs = [] }) {
  const [filterType, setFilterType] = useState('all')
  const [filterUser, setFilterUser] = useState('all')

  const getActionIcon = (action) => {
    const icons = {
      create: '✨',
      update: '✏️',
      delete: '🗑️',
      view: '👁️',
      export: '📤',
      import: '📥',
      approve: '✅',
      reject: '❌',
      share: '🔗',
      lock: '🔒'
    }
    return icons[action] || '📝'
  }

  const getActionColor = (action) => {
    const colors = {
      create: '#11998e',
      update: '#667eea',
      delete: '#eb3349',
      view: '#4facfe',
      export: '#f5576c',
      import: '#f093fb',
      approve: '#11998e',
      reject: '#eb3349',
      share: '#667eea',
      lock: '#f5576c'
    }
    return colors[action] || '#667eea'
  }

  const filteredLogs = logs.filter(log => {
    if (filterType !== 'all' && log.action !== filterType) return false
    if (filterUser !== 'all' && log.user !== filterUser) return false
    return true
  })

  const users = [...new Set(logs.map(log => log.user))]
  const actions = [...new Set(logs.map(log => log.action))]

  return (
    <div className="audit-trail">
      <div className="audit-header">
        <h2>Audit Trail & Compliance</h2>
        <p>Complete history of all system changes and user actions</p>
      </div>

      <div className="audit-filters">
        <div className="filter-group">
          <label>Action Type</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Actions</option>
            {actions.map(action => (
              <option key={action} value={action}>
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>User</label>
          <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
            <option value="all">All Users</option>
            {users.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>

        <div className="filter-info">
          <span className="log-count">{filteredLogs.length} entries</span>
        </div>
      </div>

      <div className="audit-timeline">
        {filteredLogs.length === 0 ? (
          <div className="empty-logs">
            <p>No audit logs found</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-marker" style={{ borderColor: getActionColor(log.action) }}>
                <span className="marker-icon">{getActionIcon(log.action)}</span>
              </div>

              <div className="timeline-content">
                <div className="log-header">
                  <span className="log-action" style={{ color: getActionColor(log.action) }}>
                    {log.action.toUpperCase()}
                  </span>
                  <span className="log-timestamp">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="log-details">
                  <p className="log-description">{log.description}</p>
                  <div className="log-metadata">
                    <span className="metadata-item">
                      <strong>User:</strong> {log.user}
                    </span>
                    <span className="metadata-item">
                      <strong>Entity:</strong> {log.entity}
                    </span>
                    {log.changes && (
                      <span className="metadata-item">
                        <strong>Changes:</strong> {log.changes}
                      </span>
                    )}
                  </div>
                </div>

                {log.ipAddress && (
                  <div className="log-security">
                    <span className="security-badge">IP: {log.ipAddress}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="audit-stats">
        <div className="stat-card">
          <h4>Total Actions</h4>
          <span className="stat-value">{logs.length}</span>
        </div>
        <div className="stat-card">
          <h4>Active Users</h4>
          <span className="stat-value">{users.length}</span>
        </div>
        <div className="stat-card">
          <h4>Action Types</h4>
          <span className="stat-value">{actions.length}</span>
        </div>
        <div className="stat-card">
          <h4>Last Activity</h4>
          <span className="stat-value">
            {logs.length > 0 ? new Date(logs[0].timestamp).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  )
}
