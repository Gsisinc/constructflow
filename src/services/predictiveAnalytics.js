/**
 * Predictive Analytics Service
 * Uses AI and historical data to forecast project outcomes
 * Provides advanced insights for decision-making
 */

import { base44 } from '@/api/base44Client';
import { callOpenAI } from '@/services/llmService';

/**
 * Predict project completion date
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Completion prediction
 */
export async function predictProjectCompletion(projectId) {
  try {
    // Get project data
    const projectData = await base44.functions.invoke('getProjectData', {
      projectId
    });

    // Get historical project data
    const historicalData = await base44.functions.invoke('getHistoricalProjectData', {
      filters: {
        type: projectData.type,
        size: projectData.size
      }
    });

    // Use AI to analyze and predict
    const prediction = await callOpenAI({
      systemPrompt: `You are a construction project management AI. Analyze project data and predict completion dates.
      Provide predictions with confidence levels and key factors affecting the timeline.`,
      userMessage: `Analyze this project and predict completion date:
      Project: ${projectData.name}
      Current Progress: ${projectData.progress}%
      Planned Duration: ${projectData.plannedDuration} days
      Actual Duration So Far: ${projectData.actualDuration} days
      Tasks Completed: ${projectData.tasksCompleted}/${projectData.totalTasks}
      Historical Average: ${historicalData.averageDuration} days
      
      Provide:
      1. Predicted completion date
      2. Confidence level (0-100%)
      3. Key factors affecting timeline
      4. Risk factors
      5. Recommendations`
    });

    return {
      projectId,
      predictedCompletion: extractDate(prediction),
      confidenceLevel: extractConfidence(prediction),
      factors: extractFactors(prediction),
      risks: extractRisks(prediction),
      recommendations: extractRecommendations(prediction),
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Failed to predict project completion:', error);
    throw error;
  }
}

/**
 * Forecast project budget
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Budget forecast
 */
export async function forecastProjectBudget(projectId) {
  try {
    const projectData = await base44.functions.invoke('getProjectData', {
      projectId
    });

    const expenseData = await base44.functions.invoke('getProjectExpenses', {
      projectId
    });

    const prediction = await callOpenAI({
      systemPrompt: `You are a construction financial analyst. Forecast project budgets based on spending patterns.`,
      userMessage: `Forecast the final budget for this project:
      Project: ${projectData.name}
      Original Budget: $${projectData.originalBudget}
      Current Spent: $${expenseData.totalSpent}
      Progress: ${projectData.progress}%
      Remaining Time: ${projectData.remainingDays} days
      Spending Rate: $${expenseData.averageDailySpend}/day
      
      Provide:
      1. Predicted final cost
      2. Budget variance (over/under)
      3. Cost drivers
      4. Savings opportunities
      5. Risk areas`
    });

    return {
      projectId,
      originalBudget: projectData.originalBudget,
      currentSpent: expenseData.totalSpent,
      predictedFinalCost: extractBudget(prediction),
      budgetVariance: extractVariance(prediction),
      costDrivers: extractCostDrivers(prediction),
      savingsOpportunities: extractSavings(prediction),
      riskAreas: extractRiskAreas(prediction),
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Failed to forecast project budget:', error);
    throw error;
  }
}

/**
 * Predict resource needs
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Resource prediction
 */
export async function predictResourceNeeds(projectId) {
  try {
    const projectData = await base44.functions.invoke('getProjectData', {
      projectId
    });

    const taskData = await base44.functions.invoke('getProjectTasks', {
      projectId
    });

    const prediction = await callOpenAI({
      systemPrompt: `You are a construction resource planning expert. Predict resource requirements.`,
      userMessage: `Predict resource needs for this project:
      Project: ${projectData.name}
      Remaining Tasks: ${taskData.remaining}
      Remaining Duration: ${projectData.remainingDays} days
      Current Team Size: ${projectData.teamSize}
      Task Complexity: ${taskData.averageComplexity}
      
      Provide:
      1. Recommended team size
      2. Required skill sets
      3. Equipment needs
      4. Timeline for hiring/procurement
      5. Cost implications`
    });

    return {
      projectId,
      recommendedTeamSize: extractTeamSize(prediction),
      requiredSkills: extractSkills(prediction),
      equipmentNeeds: extractEquipment(prediction),
      timeline: extractTimeline(prediction),
      costImplications: extractCost(prediction),
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Failed to predict resource needs:', error);
    throw error;
  }
}

/**
 * Analyze project risks
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Risk analysis
 */
export async function analyzeProjectRisks(projectId) {
  try {
    const projectData = await base44.functions.invoke('getProjectData', {
      projectId
    });

    const historicalRisks = await base44.functions.invoke('getHistoricalRisks', {
      filters: { type: projectData.type }
    });

    const prediction = await callOpenAI({
      systemPrompt: `You are a construction risk management expert. Identify and analyze project risks.`,
      userMessage: `Analyze risks for this project:
      Project: ${projectData.name}
      Type: ${projectData.type}
      Location: ${projectData.location}
      Duration: ${projectData.plannedDuration} days
      Budget: $${projectData.originalBudget}
      Historical Risk Rate: ${historicalRisks.riskRate}%
      
      Provide:
      1. Top 5 risks
      2. Probability of each risk
      3. Impact if risk occurs
      4. Mitigation strategies
      5. Contingency budget recommendation`
    });

    return {
      projectId,
      topRisks: extractRisks(prediction),
      probabilities: extractProbabilities(prediction),
      impacts: extractImpacts(prediction),
      mitigationStrategies: extractMitigation(prediction),
      contingencyBudget: extractContingency(prediction),
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Failed to analyze project risks:', error);
    throw error;
  }
}

/**
 * Forecast cash flow
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Cash flow forecast
 */
export async function forecastCashFlow(projectId) {
  try {
    const projectData = await base44.functions.invoke('getProjectData', {
      projectId
    });

    const paymentSchedule = await base44.functions.invoke('getPaymentSchedule', {
      projectId
    });

    const expenseSchedule = await base44.functions.invoke('getExpenseSchedule', {
      projectId
    });

    const forecast = await callOpenAI({
      systemPrompt: `You are a construction financial planner. Forecast cash flow based on payment and expense schedules.`,
      userMessage: `Forecast cash flow for this project:
      Project: ${projectData.name}
      Total Budget: $${projectData.originalBudget}
      Payment Schedule: ${JSON.stringify(paymentSchedule)}
      Expense Schedule: ${JSON.stringify(expenseSchedule)}
      
      Provide:
      1. Monthly cash flow forecast
      2. Peak funding needs
      3. Cash flow gaps
      4. Financing recommendations
      5. Optimization suggestions`
    });

    return {
      projectId,
      monthlyForecast: extractMonthlyForecast(forecast),
      peakFundingNeeds: extractPeakFunding(forecast),
      cashFlowGaps: extractGaps(forecast),
      financingRecommendations: extractFinancing(forecast),
      optimizationSuggestions: extractOptimization(forecast),
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Failed to forecast cash flow:', error);
    throw error;
  }
}

/**
 * Get predictive insights dashboard
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Dashboard data
 */
export async function getPredictiveInsights(projectId) {
  try {
    const [
      completion,
      budget,
      resources,
      risks,
      cashFlow
    ] = await Promise.all([
      predictProjectCompletion(projectId),
      forecastProjectBudget(projectId),
      predictResourceNeeds(projectId),
      analyzeProjectRisks(projectId),
      forecastCashFlow(projectId)
    ]);

    return {
      projectId,
      completion,
      budget,
      resources,
      risks,
      cashFlow,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Failed to get predictive insights:', error);
    throw error;
  }
}

// Helper functions to extract data from AI responses
function extractDate(text) {
  const dateMatch = text.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
  return dateMatch ? new Date(dateMatch[0]) : null;
}

function extractConfidence(text) {
  const match = text.match(/(\d+)%/);
  return match ? parseInt(match[1]) : 50;
}

function extractFactors(text) {
  return text.split('\n').filter(line => line.includes('•') || line.includes('-')).slice(0, 5);
}

function extractRisks(text) {
  return text.split('\n').filter(line => line.includes('risk') || line.includes('Risk')).slice(0, 5);
}

function extractRecommendations(text) {
  return text.split('\n').filter(line => line.includes('recommend') || line.includes('Recommend')).slice(0, 3);
}

function extractBudget(text) {
  const match = text.match(/\$[\d,]+/);
  return match ? parseFloat(match[0].replace(/[$,]/g, '')) : 0;
}

function extractVariance(text) {
  const match = text.match(/(\d+)%/);
  return match ? parseInt(match[1]) : 0;
}

function extractCostDrivers(text) {
  return text.split('\n').filter(line => line.includes('cost') || line.includes('Cost')).slice(0, 3);
}

function extractSavings(text) {
  return text.split('\n').filter(line => line.includes('saving') || line.includes('Saving')).slice(0, 3);
}

function extractRiskAreas(text) {
  return text.split('\n').filter(line => line.includes('risk') || line.includes('Risk')).slice(0, 3);
}

function extractTeamSize(text) {
  const match = text.match(/(\d+)\s*(?:people|team|members)/i);
  return match ? parseInt(match[1]) : 0;
}

function extractSkills(text) {
  return text.split('\n').filter(line => line.includes('skill') || line.includes('Skill')).slice(0, 5);
}

function extractEquipment(text) {
  return text.split('\n').filter(line => line.includes('equipment') || line.includes('Equipment')).slice(0, 5);
}

function extractTimeline(text) {
  return text.split('\n').filter(line => line.includes('timeline') || line.includes('Timeline')).slice(0, 3);
}

function extractCost(text) {
  const match = text.match(/\$[\d,]+/);
  return match ? parseFloat(match[0].replace(/[$,]/g, '')) : 0;
}

function extractProbabilities(text) {
  return text.match(/(\d+)%/g) || [];
}

function extractImpacts(text) {
  return text.split('\n').filter(line => line.includes('impact') || line.includes('Impact')).slice(0, 5);
}

function extractMitigation(text) {
  return text.split('\n').filter(line => line.includes('mitigat') || line.includes('Mitigat')).slice(0, 5);
}

function extractContingency(text) {
  const match = text.match(/\$[\d,]+/);
  return match ? parseFloat(match[0].replace(/[$,]/g, '')) : 0;
}

function extractMonthlyForecast(text) {
  return text.split('\n').filter(line => line.includes('month') || line.includes('Month')).slice(0, 12);
}

function extractPeakFunding(text) {
  const match = text.match(/\$[\d,]+/);
  return match ? parseFloat(match[0].replace(/[$,]/g, '')) : 0;
}

function extractGaps(text) {
  return text.split('\n').filter(line => line.includes('gap') || line.includes('Gap')).slice(0, 3);
}

function extractFinancing(text) {
  return text.split('\n').filter(line => line.includes('financing') || line.includes('Financing')).slice(0, 3);
}

function extractOptimization(text) {
  return text.split('\n').filter(line => line.includes('optim') || line.includes('Optim')).slice(0, 3);
}

export default {
  predictProjectCompletion,
  forecastProjectBudget,
  predictResourceNeeds,
  analyzeProjectRisks,
  forecastCashFlow,
  getPredictiveInsights
};
