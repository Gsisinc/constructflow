import React, { useState } from 'react'
import '../styles/TemplateLibrary.css'

export default function TemplateLibrary({ templates = [] }) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const defaultTemplates = [
    {
      id: 1,
      name: 'Standard Bid Template',
      category: 'bid',
      description: 'General purpose bid template for most projects',
      sections: ['Executive Summary', 'Scope of Work', 'Timeline', 'Cost Breakdown', 'Terms & Conditions'],
      usage: 245,
      rating: 4.8
    },
    {
      id: 2,
      name: 'Commercial Construction Bid',
      category: 'bid',
      description: 'Specialized template for commercial projects',
      sections: ['Project Overview', 'Detailed Scope', 'Schedule', 'Cost Analysis', 'Insurance & Bonding', 'References'],
      usage: 189,
      rating: 4.7
    },
    {
      id: 3,
      name: 'Residential Estimate',
      category: 'estimate',
      description: 'Quick estimate template for residential work',
      sections: ['Property Details', 'Work Description', 'Materials', 'Labor', 'Total Cost'],
      usage: 312,
      rating: 4.9
    },
    {
      id: 4,
      name: 'Scope of Work - General',
      category: 'scope',
      description: 'Generic scope of work template',
      sections: ['Project Description', 'Deliverables', 'Exclusions', 'Timeline', 'Assumptions'],
      usage: 156,
      rating: 4.6
    },
    {
      id: 5,
      name: 'Electrical Work Scope',
      category: 'scope',
      description: 'Specialized scope for electrical projects',
      sections: ['Electrical Work Description', 'Materials List', 'Safety Protocols', 'Inspections', 'Warranty'],
      usage: 98,
      rating: 4.5
    },
    {
      id: 6,
      name: 'Terms & Conditions Standard',
      category: 'terms',
      description: 'Standard terms and conditions',
      sections: ['Payment Terms', 'Warranty', 'Liability', 'Changes', 'Termination'],
      usage: 267,
      rating: 4.7
    }
  ]

  const allTemplates = templates.length > 0 ? templates : defaultTemplates
  const categories = ['all', ...new Set(allTemplates.map(t => t.category))]

  const filteredTemplates = allTemplates.filter(template => {
    if (selectedCategory !== 'all' && template.category !== selectedCategory) return false
    if (searchTerm && !template.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const getCategoryColor = (category) => {
    const colors = {
      bid: '#667eea',
      estimate: '#11998e',
      scope: '#f5576c',
      terms: '#4facfe',
      other: '#f093fb'
    }
    return colors[category] || colors.other
  }

  const getCategoryLabel = (category) => {
    const labels = {
      bid: 'Bid',
      estimate: 'Estimate',
      scope: 'Scope',
      terms: 'Terms',
      other: 'Other'
    }
    return labels[category] || 'Other'
  }

  return (
    <div className="template-library">
      <div className="library-header">
        <h2>Template Library</h2>
        <p>Reusable templates for bids, estimates, scopes, and more</p>
      </div>

      <div className="library-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'All Templates' : getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      <div className="library-content">
        <div className="templates-grid">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="template-header">
                <h3>{template.name}</h3>
                <span
                  className="category-badge"
                  style={{ backgroundColor: getCategoryColor(template.category) }}
                >
                  {getCategoryLabel(template.category)}
                </span>
              </div>

              <p className="template-description">{template.description}</p>

              <div className="template-sections">
                <strong>Sections:</strong>
                <ul>
                  {template.sections.slice(0, 3).map((section, idx) => (
                    <li key={idx}>{section}</li>
                  ))}
                  {template.sections.length > 3 && (
                    <li className="more">+{template.sections.length - 3} more</li>
                  )}
                </ul>
              </div>

              <div className="template-stats">
                <div className="stat">
                  <span className="stat-label">Used</span>
                  <span className="stat-value">{template.usage}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Rating</span>
                  <span className="stat-value">⭐ {template.rating}</span>
                </div>
              </div>

              <button className="use-template-btn">Use Template</button>
            </div>
          ))}
        </div>

        {selectedTemplate && (
          <div className="template-preview">
            <div className="preview-header">
              <h3>{selectedTemplate.name}</h3>
              <button className="close-btn" onClick={() => setSelectedTemplate(null)}>✕</button>
            </div>

            <div className="preview-content">
              <div className="preview-section">
                <h4>Description</h4>
                <p>{selectedTemplate.description}</p>
              </div>

              <div className="preview-section">
                <h4>Sections Included</h4>
                <div className="sections-list">
                  {selectedTemplate.sections.map((section, idx) => (
                    <div key={idx} className="section-item">
                      <span className="section-number">{idx + 1}</span>
                      <span className="section-name">{section}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="preview-section">
                <h4>Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-box">
                    <span className="stat-label">Times Used</span>
                    <span className="stat-value">{selectedTemplate.usage}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Average Rating</span>
                    <span className="stat-value">⭐ {selectedTemplate.rating}/5</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Category</span>
                    <span className="stat-value">{getCategoryLabel(selectedTemplate.category)}</span>
                  </div>
                </div>
              </div>

              <div className="preview-actions">
                <button className="action-btn btn-primary">Use This Template</button>
                <button className="action-btn btn-secondary">Duplicate & Edit</button>
                <button className="action-btn btn-outline">View Full Preview</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="create-template-section">
        <h3>Create Custom Template</h3>
        <p>Save your current bid as a reusable template for future projects</p>
        <button className="btn-create-template">+ Create New Template</button>
      </div>
    </div>
  )
}
