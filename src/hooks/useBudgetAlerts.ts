import { useMemo } from 'react';
import { useBudgetStore, useExpenseStore } from '../store';
import { getSpentInCategory, getBudgetStatus } from '../utils/budgetCalculations';
import { getCurrentMonth } from '../utils/dateHelpers';
import { DEFAULT_CATEGORIES } from '../constants/categories';

export interface BudgetAlert {
  categoryId: string;
  categoryName: string;
  percentage: number;
  spent: number;
  limit: number;
  isOverBudget: boolean;
}

export function useBudgetAlerts(month?: string) {
  const budgets = useBudgetStore((s) => s.budgets);
  const expenses = useExpenseStore((s) => s.expenses);
  const targetMonth = month ?? getCurrentMonth();

  return useMemo(() => {
    const monthBudgets = budgets.filter((b) => b.month === targetMonth);
    const alerts: BudgetAlert[] = [];

    for (const budget of monthBudgets) {
      const spent = getSpentInCategory(expenses, budget.categoryId, targetMonth);
      const status = getBudgetStatus(budget, spent);

      if (status.isOverThreshold) {
        const category = DEFAULT_CATEGORIES.find((c) => c.id === budget.categoryId);
        alerts.push({
          categoryId: budget.categoryId,
          categoryName: category?.name ?? 'Unknown',
          percentage: status.percentage,
          spent,
          limit: budget.monthlyLimit,
          isOverBudget: status.isOverBudget,
        });
      }
    }

    return alerts.sort((a, b) => b.percentage - a.percentage);
  }, [budgets, expenses, targetMonth]);
}
