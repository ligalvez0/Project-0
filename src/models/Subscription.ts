import { ExpenseType } from './Category';

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Subscription {
  id: string;
  name: string;
  amount: number; // in cents, per billing cycle
  billingCycle: BillingCycle;
  type: ExpenseType;
  categoryId: string;
  startDate: string;
  nextBillingDate: string;
  isActive: boolean;
  notes?: string;
  reminderDaysBefore: number;
  createdAt: string;
}
