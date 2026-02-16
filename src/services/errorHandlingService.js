/**
 * Error Handling Service
 * Provides proper error handling without fake data fallbacks
 * 
 * Core Principle: NEVER return fake data
 * - Return empty results with clear error message
 * - Provide helpful guidance to user
 * - Log errors for debugging
 */

/**
 * Error types
 */
export const ERROR_TYPES = {
  NO_API_KEY: 'NO_API_KEY',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  NO_RESULTS: 'NO_RESULTS',
  INVALID_FILTERS: 'INVALID_FILTERS',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Error messages for users
 */
const USER_MESSAGES = {
  NO_API_KEY: 'SAM.GOV API key not configured. Please add VITE_SAM_GOV_API_KEY to environment variables.',
  NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',
  API_ERROR: 'Failed to fetch from data source. Please try again later.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  NO_RESULTS: 'No opportunities found matching your filters. Try adjusting your search criteria.',
  INVALID_FILTERS: 'Invalid filter values. Please check your selections.',
  TIMEOUT: 'Request timed out. Please try again.',
  UNKNOWN: 'An unexpected error occurred. Please try again.'
};

/**
 * Create error response (NO FAKE DATA)
 */
export function createErrorResponse(errorType = ERROR_TYPES.UNKNOWN, additionalInfo = {}) {
  return {
    opportunities: [], // EMPTY - never fake data
    success: false,
    error: {
      type: errorType,
      userMessage: USER_MESSAGES[errorType] || USER_MESSAGES.UNKNOWN,
      technicalMessage: additionalInfo.technicalMessage || null,
      timestamp: new Date().toISOString(),
      ...additionalInfo
    }
  };
}

/**
 * Create success response
 */
export function createSuccessResponse(opportunities = [], metadata = {}) {
  return {
    opportunities,
    success: true,
    error: null,
    metadata: {
      count: opportunities.length,
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };
}

/**
 * Handle API errors
 */
export function handleApiError(error, context = {}) {
  console.error(`❌ API Error in ${context.source || 'unknown'}:`, error);

  if (!error) {
    return createErrorResponse(ERROR_TYPES.UNKNOWN);
  }

  // Network errors
  if (error.message === 'Failed to fetch' || error instanceof TypeError) {
    return createErrorResponse(ERROR_TYPES.NETWORK_ERROR, {
      technicalMessage: error.message
    });
  }

  // Timeout errors
  if (error.message.includes('timeout') || error.code === 'ECONNABORTED') {
    return createErrorResponse(ERROR_TYPES.TIMEOUT, {
      technicalMessage: error.message
    });
  }

  // Rate limit errors
  if (error.status === 429 || error.message.includes('rate limit')) {
    return createErrorResponse(ERROR_TYPES.RATE_LIMITED, {
      technicalMessage: error.message,
      retryAfter: error.retryAfter || 60
    });
  }

  // API errors
  if (error.status >= 400 && error.status < 500) {
    if (error.status === 401 || error.status === 403) {
      return createErrorResponse(ERROR_TYPES.NO_API_KEY, {
        technicalMessage: `Authentication error: ${error.status}`
      });
    }
    return createErrorResponse(ERROR_TYPES.INVALID_FILTERS, {
      technicalMessage: `Invalid request: ${error.message}`
    });
  }

  // Server errors
  if (error.status >= 500) {
    return createErrorResponse(ERROR_TYPES.API_ERROR, {
      technicalMessage: `Server error: ${error.status} ${error.statusText}`
    });
  }

  // Unknown error
  return createErrorResponse(ERROR_TYPES.UNKNOWN, {
    technicalMessage: error.message
  });
}

/**
 * Validate filters
 */
export function validateFilters(filters = {}) {
  const errors = [];

  if (filters.state && typeof filters.state !== 'string') {
    errors.push('State must be a string');
  }

  if (filters.workType && typeof filters.workType !== 'string') {
    errors.push('Work type must be a string');
  }

  if (filters.page && (!Number.isInteger(filters.page) || filters.page < 1)) {
    errors.push('Page must be a positive integer');
  }

  if (filters.pageSize && (!Number.isInteger(filters.pageSize) || filters.pageSize < 1)) {
    errors.push('Page size must be a positive integer');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate filter values
 */
export function validateFilterValues(filters = {}, validValues = {}) {
  const errors = [];

  if (filters.state && validValues.states && !validValues.states.includes(filters.state)) {
    errors.push(`Invalid state: ${filters.state}`);
  }

  if (filters.workType && validValues.workTypes && !validValues.workTypes.includes(filters.workType)) {
    errors.push(`Invalid work type: ${filters.workType}`);
  }

  if (filters.classification && validValues.classifications && !validValues.classifications.includes(filters.classification)) {
    errors.push(`Invalid classification: ${filters.classification}`);
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Log error for debugging
 */
export function logError(errorType, context = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    errorType,
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };

  console.error('📋 Error Log:', logEntry);

  // Could send to error tracking service here
  // e.g., Sentry, LogRocket, etc.
}

/**
 * Get helpful suggestions based on error
 */
export function getHelpfulSuggestions(errorType) {
  const suggestions = {
    [ERROR_TYPES.NO_API_KEY]: [
      'Get a free SAM.GOV API key at https://open.sam.gov/',
      'Add it to your .env file as VITE_SAM_GOV_API_KEY',
      'Restart the application'
    ],
    [ERROR_TYPES.NETWORK_ERROR]: [
      'Check your internet connection',
      'Try again in a few moments',
      'Check if SAM.GOV is accessible'
    ],
    [ERROR_TYPES.API_ERROR]: [
      'Try different search filters',
      'Wait a few minutes and try again',
      'Check SAM.GOV status page'
    ],
    [ERROR_TYPES.RATE_LIMITED]: [
      'Wait 1-2 minutes before trying again',
      'Try with fewer filters',
      'Consider using a proxy service'
    ],
    [ERROR_TYPES.NO_RESULTS]: [
      'Try broader search criteria',
      'Check different states or work types',
      'Adjust date ranges if applicable',
      'Check back later for new opportunities'
    ],
    [ERROR_TYPES.INVALID_FILTERS]: [
      'Verify your filter selections',
      'Make sure state name is spelled correctly',
      'Try selecting from the dropdown list'
    ],
    [ERROR_TYPES.TIMEOUT]: [
      'Check your internet connection',
      'Try again with simpler filters',
      'Wait a moment and retry'
    ]
  };

  return suggestions[errorType] || suggestions[ERROR_TYPES.UNKNOWN];
}

/**
 * Format error for display to user
 */
export function formatErrorForDisplay(error) {
  if (!error) return null;

  return {
    title: 'Search Error',
    message: error.userMessage || USER_MESSAGES.UNKNOWN,
    suggestions: getHelpfulSuggestions(error.type),
    technical: error.technicalMessage ? `Technical: ${error.technicalMessage}` : null
  };
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`⏳ Retry attempt ${attempt}/${maxRetries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Validate response has real data
 */
export function validateResponseHasRealData(response) {
  if (!response) {
    return {
      valid: false,
      reason: 'Response is null or undefined'
    };
  }

  if (!Array.isArray(response.opportunities)) {
    return {
      valid: false,
      reason: 'Response does not contain opportunities array'
    };
  }

  // Check if opportunities have required fields
  for (const opp of response.opportunities) {
    if (!opp.id || !opp.title || !opp.source) {
      return {
        valid: false,
        reason: 'Opportunity missing required fields (id, title, source)'
      };
    }

    // Check if source is real (not fake)
    const validSources = ['sam_gov', 'county_portal', 'city_portal', 'business_portal', 'web'];
    if (!validSources.includes(opp.source)) {
      return {
        valid: false,
        reason: `Invalid source: ${opp.source}`
      };
    }
  }

  return { valid: true };
}

export default {
  ERROR_TYPES,
  USER_MESSAGES,
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  validateFilters,
  validateFilterValues,
  logError,
  getHelpfulSuggestions,
  formatErrorForDisplay,
  retryWithBackoff,
  validateResponseHasRealData
};
