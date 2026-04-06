export interface SavingsContribution {
  id: string;
  amount: number; // in cents
  date: string;
  note?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number; // in cents
  currentAmount: number; // in cents
  targetDate?: string;
  monthlyContribution: number; // in cents
  createdAt: string;
  contributions: SavingsContribution[];
}
