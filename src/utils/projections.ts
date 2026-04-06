import { SavingsGoal } from '../models';
import { addMonths, differenceInMonths } from 'date-fns';

export function projectCompletionDate(goal: SavingsGoal): Date | null {
  if (goal.currentAmount >= goal.targetAmount) return new Date();
  if (goal.monthlyContribution <= 0) return null;

  const remaining = goal.targetAmount - goal.currentAmount;
  const monthsNeeded = Math.ceil(remaining / goal.monthlyContribution);
  return addMonths(new Date(), monthsNeeded);
}

export function projectAmountByDate(goal: SavingsGoal, targetDate: Date): number {
  const months = differenceInMonths(targetDate, new Date());
  if (months <= 0) return goal.currentAmount;
  return goal.currentAmount + goal.monthlyContribution * months;
}

export function getMonthlyEquivalent(amountCents: number, billingCycle: string): number {
  switch (billingCycle) {
    case 'weekly': return Math.round(amountCents * 52 / 12);
    case 'monthly': return amountCents;
    case 'quarterly': return Math.round(amountCents / 3);
    case 'yearly': return Math.round(amountCents / 12);
    default: return amountCents;
  }
}
