/**
 * Email Integration Service
 * Parses incoming emails to create tasks, issues, and updates
 * Integrates with DocuSign for e-signature workflows
 */

import { base44 } from '@/api/base44Client';

/**
 * Parse incoming email and extract actionable items
 * @param {Object} email - Email object with subject, body, sender, etc.
 * @returns {Promise<Object>} Parsed email with extracted actions
 */
export async function parseEmailForActions(email) {
  try {
    const {
      subject,
      body,
      sender,
      timestamp,
      attachments = []
    } = email;

    // Use AI to analyze email content
    const analysis = await base44.functions.invoke('analyzeEmailContent', {
      subject,
      body,
      sender
    });

    const actions = {
      tasks: [],
      issues: [],
      updates: [],
      documents: [],
      signatures: []
    };

    // Extract tasks from email
    if (analysis.tasks && analysis.tasks.length > 0) {
      actions.tasks = analysis.tasks.map(task => ({
        title: task.title,
        description: task.description,
        priority: task.priority || 'medium',
        dueDate: task.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignee: task.assignee || extractEmailRecipient(task.mention),
        source: 'email',
        sourceId: email.id,
        relatedProject: extractProjectReference(body)
      }));
    }

    // Extract issues from email
    if (analysis.issues && analysis.issues.length > 0) {
      actions.issues = analysis.issues.map(issue => ({
        title: issue.title,
        description: issue.description,
        severity: issue.severity || 'medium',
        category: issue.category || 'General',
        relatedProject: extractProjectReference(body),
        reportedBy: sender,
        source: 'email',
        sourceId: email.id
      }));
    }

    // Extract project updates from email
    if (analysis.updates && analysis.updates.length > 0) {
      actions.updates = analysis.updates.map(update => ({
        title: update.title,
        content: update.content,
        project: extractProjectReference(body),
        type: update.type || 'general',
        author: sender,
        source: 'email',
        sourceId: email.id
      }));
    }

    // Handle attachments
    if (attachments.length > 0) {
      actions.documents = attachments.map(att => ({
        filename: att.filename,
        mimeType: att.mimeType,
        size: att.size,
        url: att.url,
        uploadedBy: sender,
        relatedProject: extractProjectReference(body),
        source: 'email',
        sourceId: email.id
      }));
    }

    // Check for signature requests
    if (analysis.requiresSignature || body.toLowerCase().includes('sign') || body.toLowerCase().includes('signature')) {
      actions.signatures = [{
        type: 'contract',
        title: subject,
        content: body,
        requiredSignatures: extractSignatories(body),
        sender,
        source: 'email',
        sourceId: email.id
      }];
    }

    return {
      emailId: email.id,
      sender,
      subject,
      timestamp,
      actions,
      rawAnalysis: analysis
    };
  } catch (error) {
    console.error('Failed to parse email:', error);
    throw error;
  }
}

/**
 * Create task from email
 * @param {Object} taskData - Task data extracted from email
 * @returns {Promise<Object>} Created task
 */
export async function createTaskFromEmail(taskData) {
  try {
    const task = await base44.functions.invoke('createTask', {
      data: {
        ...taskData,
        createdFrom: 'email',
        emailReference: taskData.sourceId
      }
    });

    // Log email action
    await logEmailAction({
      type: 'task_created',
      emailId: taskData.sourceId,
      taskId: task.id,
      timestamp: new Date()
    });

    return task;
  } catch (error) {
    console.error('Failed to create task from email:', error);
    throw error;
  }
}

/**
 * Create issue from email
 * @param {Object} issueData - Issue data extracted from email
 * @returns {Promise<Object>} Created issue
 */
export async function createIssueFromEmail(issueData) {
  try {
    const issue = await base44.functions.invoke('createIssue', {
      data: {
        ...issueData,
        createdFrom: 'email',
        emailReference: issueData.sourceId
      }
    });

    await logEmailAction({
      type: 'issue_created',
      emailId: issueData.sourceId,
      issueId: issue.id,
      timestamp: new Date()
    });

    return issue;
  } catch (error) {
    console.error('Failed to create issue from email:', error);
    throw error;
  }
}

/**
 * Send document for e-signature via DocuSign
 * @param {Object} signatureRequest - Signature request data
 * @returns {Promise<Object>} DocuSign envelope
 */
export async function sendForSignature(signatureRequest) {
  try {
    const {
      title,
      content,
      requiredSignatures,
      sender,
      sourceId
    } = signatureRequest;

    // Create DocuSign envelope
    const envelope = await base44.functions.invoke('createDocuSignEnvelope', {
      data: {
        emailSubject: title,
        emailBlurb: `Please sign this document: ${title}`,
        signers: requiredSignatures.map(signer => ({
          email: signer.email,
          name: signer.name,
          role: signer.role || 'Signer'
        })),
        documents: [{
          documentBase64: Buffer.from(content).toString('base64'),
          name: title,
          fileExtension: 'pdf',
          documentId: sourceId
        }],
        status: 'sent'
      }
    });

    // Log signature request
    await logEmailAction({
      type: 'signature_requested',
      emailId: sourceId,
      envelopeId: envelope.envelopeId,
      signers: requiredSignatures,
      timestamp: new Date()
    });

    return envelope;
  } catch (error) {
    console.error('Failed to send for signature:', error);
    throw error;
  }
}

/**
 * Check DocuSign signature status
 * @param {string} envelopeId - DocuSign envelope ID
 * @returns {Promise<Object>} Envelope status
 */
export async function checkSignatureStatus(envelopeId) {
  try {
    const status = await base44.functions.invoke('getDocuSignEnvelopeStatus', {
      envelopeId
    });

    return {
      envelopeId,
      status: status.status,
      signers: status.signers.map(signer => ({
        email: signer.email,
        name: signer.name,
        status: signer.signatureStatus,
        signedDate: signer.signedDateTime
      })),
      sentDate: status.sentDateTime,
      completedDate: status.completedDateTime
    };
  } catch (error) {
    console.error('Failed to check signature status:', error);
    throw error;
  }
}

/**
 * Set up email forwarding rules
 * @param {Object} rules - Email forwarding rules
 * @returns {Promise<Object>} Created rules
 */
export async function setupEmailForwarding(rules) {
  try {
    const {
      emailAddress,
      forwardingRules = []
    } = rules;

    const created = await base44.functions.invoke('setupEmailForwarding', {
      emailAddress,
      rules: forwardingRules.map(rule => ({
        fromPattern: rule.fromPattern,
        subjectPattern: rule.subjectPattern,
        action: rule.action, // 'create_task', 'create_issue', 'request_signature'
        projectId: rule.projectId,
        assignee: rule.assignee,
        priority: rule.priority || 'medium'
      }))
    });

    return created;
  } catch (error) {
    console.error('Failed to setup email forwarding:', error);
    throw error;
  }
}

/**
 * Get email integration status
 * @returns {Promise<Object>} Integration status
 */
export async function getEmailIntegrationStatus() {
  try {
    const status = await base44.functions.invoke('getEmailIntegrationStatus', {});

    return {
      connected: status.connected,
      emailAddress: status.emailAddress,
      lastSync: status.lastSync,
      forwardingRules: status.forwardingRules,
      tasksCreated: status.tasksCreated,
      issuesCreated: status.issuesCreated,
      signaturesRequested: status.signaturesRequested
    };
  } catch (error) {
    console.error('Failed to get email integration status:', error);
    throw error;
  }
}

/**
 * Log email action for audit trail
 */
async function logEmailAction(action) {
  try {
    await base44.functions.invoke('logEmailAction', {
      action: {
        ...action,
        timestamp: action.timestamp.toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to log email action:', error);
  }
}

/**
 * Extract email recipient from text
 */
function extractEmailRecipient(text) {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : null;
}

/**
 * Extract project reference from email body
 */
function extractProjectReference(text) {
  const projectRegex = /(?:project|proj|prj)\s*[:#]?\s*([A-Z0-9]+)/gi;
  const matches = text.match(projectRegex);
  return matches ? matches[0].split(/[:#\s]+/)[1] : null;
}

/**
 * Extract signatories from email body
 */
function extractSignatories(text) {
  const signatories = [];
  const lines = text.split('\n');

  lines.forEach(line => {
    if (line.toLowerCase().includes('sign') || line.toLowerCase().includes('signature')) {
      const emailMatch = line.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
      const nameMatch = line.match(/([A-Za-z\s]+)/);

      if (emailMatch) {
        signatories.push({
          email: emailMatch[0],
          name: nameMatch ? nameMatch[0].trim() : 'Signatory'
        });
      }
    }
  });

  return signatories;
}

export default {
  parseEmailForActions,
  createTaskFromEmail,
  createIssueFromEmail,
  sendForSignature,
  checkSignatureStatus,
  setupEmailForwarding,
  getEmailIntegrationStatus
};
