import { ExpenseType } from './Category';

export interface Expense {
  id: string;
  amount: number; // stored in cents
  description: string;
  categoryId: string;
  type: ExpenseType;
  date: string; // ISO 8601
  createdAt: string;
  notes?: string;
}
