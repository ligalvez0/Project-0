import { Budget } from '../models';
import { Expense } from '../models';

export function getSpentInCategory(
  expenses: Expense[],
  categoryId: string,
  month: string,
): number {
  return expenses
    .filter(
      (e) =>
        e.categoryId === categoryId &&
        e.date.startsWith(month),
    )
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getBudgetStatus(
  budget: Budget,
  spent: number,
): { percentage: number; isOverThreshold: boolean; isOverBudget: boolean } {
  const percentage = budget.monthlyLimit > 0 ? spent / budget.monthlyLimit : 0;
  return {
    percentage: Math.min(percentage, 1),
    isOverThreshold: percentage >= budget.alertThreshold,
    isOverBudget: percentage >= 1,
  };
}
