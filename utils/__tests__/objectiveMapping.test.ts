import { describe, expect, it } from 'vitest';
import {
  getOptimizationGoalForObjective,
  getValidOptimizationGoalsForObjective,
  isOptimizationGoalValidForObjective,
} from '../objectiveMapping';

describe('objectiveMapping', () => {
  it('returns a default optimization goal for sales objective', () => {
    expect(getOptimizationGoalForObjective('OUTCOME_SALES')).toBe('LINK_CLICKS');
  });

  it('returns valid goals for awareness objective', () => {
    expect(getValidOptimizationGoalsForObjective('OUTCOME_AWARENESS')).toEqual([
      'REACH',
      'IMPRESSIONS',
      'AD_RECALL_LIFT',
    ]);
  });

  it('validates optimization-goal compatibility', () => {
    expect(
      isOptimizationGoalValidForObjective('OUTCOME_LEADS', 'LEAD_GENERATION')
    ).toBe(true);
    expect(
      isOptimizationGoalValidForObjective('OUTCOME_LEADS', 'REACH')
    ).toBe(false);
  });
});
