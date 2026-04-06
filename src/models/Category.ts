export type ExpenseType = 'personal' | 'business';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: ExpenseType;
  isCustom: boolean;
}
