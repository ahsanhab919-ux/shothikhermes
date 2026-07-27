// Shothik AI Economic Infrastructure
// Token Cost Simulation & Dynamic Pricing Engine

// ============================================
// 1. TOKEN COST SIMULATION (Preflight)
// ============================================

interface TokenCostVariables {
  Cm: number; // Model cost per 1M tokens ($)
  Ci: number; // Infrastructure cost per request ($)
  Ca: number; // Agent orchestration cost ($)
  U: number;  // Average tokens consumed per task
  P: number;  // Price user pays per Base Credit
  M: number;  // Target gross margin (0.7 = 70%)
}

interface TaskComplexity {
  estimatedOutputTokens: number;
  reasoningDepth: number;      // 1-10 scale
  agentAutonomyLevel: number;  // 1-10 scale
  externalApiCalls: number;
  recursionRisk: number;       // 0-1 probability
}

interface LoadFactors {
  systemUtilization: number;   // 0-1 percentage
  queueDepth: number;
  timeOfDay: number;           // Hour (0-23)
}

// Core Cost Formula
// Revenue per task ≥ (Cm × U + Ci + Ca) × (1 + SafetyBuffer)
export function calculateMinimumRevenue(vars: TokenCostVariables): number {
  const SAFETY_BUFFER = 0.3; // 30% safety margin
  const baseCost = (vars.Cm * (vars.U / 1_000_000)) + vars.Ci + vars.Ca;
  return baseCost * (1 + SAFETY_BUFFER);
}

// Dynamic Pricing Formula
// TaskCost = BaseModelCost × ComplexityScore × RiskMultiplier × LoadFactor
export function calculateDynamicPrice(
  baseCost: number,
  complexity: TaskComplexity,
  load: LoadFactors
): number {
  // Complexity Score: output length + reasoning depth
  const complexityScore = Math.log10(complexity.estimatedOutputTokens + 1) * 
                         (1 + complexity.reasoningDepth / 10);
  
  // Risk Multiplier: agent autonomy level
  const riskMultiplier = 1 + (complexity.agentAutonomyLevel / 20); // 1.0 - 1.5x
  
  // Load Factor: surge pricing during high utilization
  const loadFactor = load.systemUtilization > 0.8 
    ? 1 + ((load.systemUtilization - 0.8) * 2) // Up to 1.4x at 100%
    : 1;
  
  return baseCost * complexityScore * riskMultiplier * loadFactor;
}

// Preflight Simulation
export interface PreflightResult {
  canExecute: boolean;
  estimatedCost: number;
  estimatedRevenue: number;
  projectedMargin: number;
  riskLevel: 'low' | 'medium' | 'high';
  warnings: string[];
  maxAgentDepth: number;
  estimatedDuration: number; // seconds
}

export function simulateTaskCost(
  prompt: string,
  model: string,
  complexity: TaskComplexity,
  load: LoadFactors,
  userTier: 'developer' | 'growth' | 'enterprise'
): PreflightResult {
  const warnings: string[] = [];
  
  // Parse prompt to estimate tokens
  const estimatedInputTokens = estimateTokens(prompt);
  const estimatedOutputTokens = complexity.estimatedOutputTokens;
  const totalTokens = estimatedInputTokens + estimatedOutputTokens;
  
  // Get model cost
  const modelCost = getModelCostPer1M(model);
  
  // Calculate base cost
  const baseCost = (modelCost * totalTokens / 1_000_000) + 0.001 + 0.0005; // Ci + Ca
  
  // Apply dynamic pricing
  const estimatedCost = calculateDynamicPrice(baseCost, complexity, load);
  
  // Calculate revenue based on user tier
  const pricePerCredit = getPricePerCredit(userTier);
  const estimatedRevenue = pricePerCredit * (totalTokens / 1000); // Credits = tokens/1000
  
  // Calculate margin
  const projectedMargin = (estimatedRevenue - estimatedCost) / estimatedRevenue;
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (complexity.recursionRisk > 0.5 || complexity.agentAutonomyLevel > 7) {
    riskLevel = 'high';
    warnings.push('High agent autonomy may lead to unpredictable costs');
  } else if (complexity.reasoningDepth > 5 || complexity.externalApiCalls > 3) {
    riskLevel = 'medium';
    warnings.push('Complex task may exceed estimated cost');
  }
  
  // Check if margin is acceptable
  const MIN_MARGIN = 0.3; // 30%
  const canExecute = projectedMargin >= MIN_MARGIN;
  
  if (!canExecute) {
    warnings.push(`Projected margin ${(projectedMargin * 100).toFixed(1)}% below threshold ${(MIN_MARGIN * 100).toFixed(0)}%`);
  }
  
  // Calculate max agent depth based on cost limits
  const maxAgentDepth = calculateMaxAgentDepth(estimatedCost, userTier);
  
  // Estimate duration
  const estimatedDuration = estimateDuration(complexity, model);
  
  return {
    canExecute,
    estimatedCost,
    estimatedRevenue,
    projectedMargin,
    riskLevel,
    warnings,
    maxAgentDepth,
    estimatedDuration,
  };
}

// Helper functions
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for English
  return Math.ceil(text.length / 4);
}

function getModelCostPer1M(model: string): number {
  const costs: Record<string, number> = {
    'kimi-k2': 0.50,      // $0.50 per 1M tokens
    'gpt-4': 30.00,       // $30 per 1M tokens
    'gpt-4-turbo': 10.00, // $10 per 1M tokens
    'claude-3-opus': 15.00,
    'deepseek-chat': 0.50,
    'gemini-pro': 0.50,
  };
  return costs[model] || 1.00;
}

function getPricePerCredit(tier: string): number {
  const prices: Record<string, number> = {
    'developer': 0.002,   // $0.002 per credit
    'growth': 0.0015,     // $0.0015 per credit (volume discount)
    'enterprise': 0.001,  // $0.001 per credit
  };
  return prices[tier] || 0.002;
}

function calculateMaxAgentDepth(estimatedCost: number, tier: string): number {
  const maxCosts: Record<string, number> = {
    'developer': 0.10,    // $0.10 max per task
    'growth': 0.50,       // $0.50 max per task
    'enterprise': 2.00,   // $2.00 max per task
  };
  
  const maxCost = maxCosts[tier] || 0.10;
  const maxDepth = Math.floor(Math.log2(maxCost / estimatedCost));
  return Math.max(1, Math.min(maxDepth, 5)); // Cap at 5 levels
}

function estimateDuration(complexity: TaskComplexity, model: string): number {
  const baseTime = 2; // 2 seconds base
  const reasoningTime = complexity.reasoningDepth * 0.5;
  const apiTime = complexity.externalApiCalls * 1;
  const modelFactor = model.includes('gpt-4') ? 1.5 : 1;
  
  return (baseTime + reasoningTime + apiTime) * modelFactor;
}

// ============================================
// 2. BEHAVIORAL ELASTICITY & LTV MODEL
// ============================================

interface UserSegment {
  segment: 'heavy_writer' | 'heavy_agent' | 'enterprise' | 'abuse_risk';
  avgMonthlySpend: number;
  purchaseFrequency: number; // per month
  retentionMonths: number;
  infraCostPerMonth: number;
}

export function calculateLTV(segment: UserSegment): number {
  const ltv = segment.avgMonthlySpend * segment.purchaseFrequency * segment.retentionMonths;
  return ltv;
}

export function calculateLTVCACRatio(segment: UserSegment): number {
  const ltv = calculateLTV(segment);
  const cac = segment.infraCostPerMonth * segment.retentionMonths * 1.5; // 1.5x multiplier for acquisition
  return ltv / cac;
}

export function isSegmentSustainable(segment: UserSegment): boolean {
  const ratio = calculateLTVCACRatio(segment);
  return ratio >= 3; // LTV/CAC must be ≥ 3
}

// User segmentation based on behavior
export function segmentUser(
  monthlySpend: number,
  agentUsageRatio: number, // agent tasks / total tasks
  apiCallVolume: number,
  burnPattern: 'steady' | 'spiky' | 'abusive'
): UserSegment['segment'] {
  if (burnPattern === 'abusive' || apiCallVolume > 10000) {
    return 'abuse_risk';
  }
  
  if (monthlySpend > 1000 && agentUsageRatio > 0.7) {
    return 'enterprise';
  }
  
  if (agentUsageRatio > 0.5) {
    return 'heavy_agent';
  }
  
  return 'heavy_writer';
}

// ============================================
// 3. REAL-TIME MARGIN MONITOR
// ============================================

interface MarginAlert {
  timestamp: number;
  taskId: string;
  userId: string;
  severity: 'warning' | 'critical';
  projectedMargin: number;
  threshold: number;
  action: 'block' | 'downgrade' | 'warn';
}

export function monitorTaskMargin(
  taskId: string,
  userId: string,
  estimatedRevenue: number,
  estimatedCost: number,
  threshold: number = 0.3
): MarginAlert | null {
  const projectedMargin = (estimatedRevenue - estimatedCost) / estimatedRevenue;
  
  if (projectedMargin >= threshold) {
    return null; // Healthy margin
  }
  
  const severity = projectedMargin < 0 ? 'critical' : 'warning';
  const action = projectedMargin < 0 ? 'block' : (projectedMargin < 0.15 ? 'downgrade' : 'warn');
  
  return {
    timestamp: Date.now(),
    taskId,
    userId,
    severity,
    projectedMargin,
    threshold,
    action,
  };
}

// Export all functions
export const EconomicEngine = {
  calculateMinimumRevenue,
  calculateDynamicPrice,
  simulateTaskCost,
  calculateLTV,
  calculateLTVCACRatio,
  isSegmentSustainable,
  segmentUser,
  monitorTaskMargin,
};
