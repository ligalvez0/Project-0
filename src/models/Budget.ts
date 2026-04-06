import { ExpenseType } from './Category';

export interface Budget {
  id: string;
  categoryId: string;
  type: ExpenseType;
  monthlyLimit: number; // in cents
  month: string; // 'YYYY-MM'
  alertThreshold: number; // 0.0-1.0
  createdAt: string;
}
