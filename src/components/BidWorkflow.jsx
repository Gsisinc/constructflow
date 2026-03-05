import React, { useState } from 'react'
import '../styles/BidWorkflow.css'

export default function BidWorkflow({ workflows = [] }) {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null)
  const [editMode, setEditMode] = useState(false)

  const defaultWorkflows = [
    {
      id: 1,
      name: 'Standard Bid Process',
      description: 'Default workflow for all bids',
      stages: [
        { id: 1, name: 'Draft', order: 1, duration: 2 },
        { id: 2, name: 'Review', order: 2, duration: 1, requiresApproval: true },
        { id: 3, name: 'Sent', order: 3, duration: 0 },
        { id: 4, name: 'Awaiting Response', order: 4, duration: 7 },
        { id: 5, name: 'Closed', order: 5, duration: 0 }
      ]
    },
    {
      id: 2,
      name: 'Fast Track Bid',
      description: 'Expedited workflow for urgent bids',
      stages: [
        { id: 1, name: 'Draft', order: 1, duration: 1 },
        { id: 2, name: 'Quick Review', order: 2, duration: 0.5, requiresApproval: true },
        { id: 3, name: 'Sent', order: 3, duration: 0 },
        { id: 4, name: 'Closed', order: 4, duration: 0 }
      ]
    },
    {
      id: 3,
      name: 'Complex Project Bid',
      description: 'Multi-stage workflow for large projects',
      stages: [
        { id: 1, name: 'Requirements Analysis', order: 1, duration: 3 },
        { id: 2, name: 'Scope Development', order: 2, duration: 2 },
        { id: 3, name: 'Cost Estimation', order: 3, duration: 2 },
        { id: 4, name: 'Management Review', order: 4, duration: 1, requiresApproval: true },
        { id: 5, name: 'Final Review', order: 5, duration: 1, requiresApproval: true },
        { id: 6, name: 'Sent', order: 6, duration: 0 },
        { id: 7, name: 'Closed', order: 7, duration: 0 }
      ]
    }
  ]

  const activeWorkflows = workflows.length > 0 ? workflows : defaultWorkflows
  const workflow = selectedWorkflow || activeWorkflows[0]

  const getStageColor = (index) => {
    const colors = ['#667eea', '#11998e', '#f5576c', '#4facfe', '#f093fb']
    return colors[index % colors.length]
  }

  return (
    <div className="bid-workflow">
      <div className="workflow-header">
        <h2>Bid Workflow Automation</h2>
        <button className="btn-create-workflow">+ Create Workflow</button>
      </div>

      <div className="workflow-content">
        <div className="workflow-list">
          <h3>Available Workflows</h3>
          <div className="workflows">
            {activeWorkflows.map(wf => (
              <div
                key={wf.id}
                className={`workflow-item ${workflow?.id === wf.id ? 'active' : ''}`}
                onClick={() => setSelectedWorkflow(wf)}
              >
                <div className="workflow-name">{wf.name}</div>
                <div className="workflow-desc">{wf.description}</div>
                <div className="workflow-stages-count">{wf.stages.length} stages</div>
              </div>
            ))}
          </div>
        </div>

        <div className="workflow-details">
          {workflow && (
            <>
              <div className="details-header">
                <div>
                  <h3>{workflow.name}</h3>
                  <p>{workflow.description}</p>
                </div>
                <button
                  className="btn-edit"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? '✓ Save' : '✏️ Edit'}
                </button>
              </div>

              <div className="workflow-visualization">
                <div className="stages-timeline">
                  {workflow.stages.map((stage, index) => (
                    <div key={stage.id} className="stage-container">
                      <div
                        className="stage-node"
                        style={{ backgroundColor: getStageColor(index) }}
                      >
                        <span className="stage-number">{index + 1}</span>
                      </div>
                      <div className="stage-info">
                        <div className="stage-name">{stage.name}</div>
                        <div className="stage-duration">
                          {stage.duration > 0 ? `${stage.duration} day${stage.duration > 1 ? 's' : ''}` : 'Immediate'}
                        </div>
                        {stage.requiresApproval && (
                          <div className="stage-requirement">🔒 Requires Approval</div>
                        )}
                      </div>
                      {index < workflow.stages.length - 1 && (
                        <div className="stage-arrow">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="workflow-settings">
                <h4>Workflow Settings</h4>
                <div className="settings-grid">
                  <div className="setting-item">
                    <label>
                      <input type="checkbox" defaultChecked />
                      Send notifications on stage change
                    </label>
                  </div>
                  <div className="setting-item">
                    <label>
                      <input type="checkbox" defaultChecked />
                      Require approval before sending
                    </label>
                  </div>
                  <div className="setting-item">
                    <label>
                      <input type="checkbox" />
                      Auto-escalate overdue bids
                    </label>
                  </div>
                  <div className="setting-item">
                    <label>
                      <input type="checkbox" defaultChecked />
                      Track time in each stage
                    </label>
                  </div>
                </div>
              </div>

              <div className="workflow-actions">
                <h4>Automation Actions</h4>
                <div className="actions-list">
                  <div className="action-item">
                    <span className="action-icon">📧</span>
                    <span className="action-text">Send email notification when bid is sent</span>
                  </div>
                  <div className="action-item">
                    <span className="action-icon">📋</span>
                    <span className="action-text">Create follow-up task after 5 days</span>
                  </div>
                  <div className="action-item">
                    <span className="action-icon">⏰</span>
                    <span className="action-text">Auto-escalate if no response after 7 days</span>
                  </div>
                  <div className="action-item">
                    <span className="action-icon">📊</span>
                    <span className="action-text">Log bid metrics when closed</span>
                  </div>
                </div>
              </div>

              <div className="workflow-stats">
                <h4>Workflow Statistics</h4>
                <div className="stats-grid">
                  <div className="stat">
                    <span className="stat-label">Total Bids Using This Workflow</span>
                    <span className="stat-value">247</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Average Completion Time</span>
                    <span className="stat-value">12.5 days</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Success Rate</span>
                    <span className="stat-value">68%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Avg Bid Amount</span>
                    <span className="stat-value">$125K</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
