import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Expense, ExpenseType } from '../models';
import { asyncStorageAdapter } from '../storage/asyncStorageAdapter';
import { STORAGE_KEYS } from '../storage/keys';

interface ExpenseState {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getExpensesByMonth: (month: string) => Expense[];
  getExpensesByType: (type: ExpenseType) => Expense[];
  getTotalByMonth: (month: string) => number;
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],

      addExpense: (expense) => {
        const newExpense: Expense = {
          ...expense,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ expenses: [...state.expenses, newExpense] }));
      },

      updateExpense: (id, updates) => {
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      deleteExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        }));
      },

      getExpensesByMonth: (month) => {
        return get().expenses.filter((e) => e.date.startsWith(month));
      },

      getExpensesByType: (type) => {
        return get().expenses.filter((e) => e.type === type);
      },

      getTotalByMonth: (month) => {
        return get()
          .expenses.filter((e) => e.date.startsWith(month))
          .reduce((sum, e) => sum + e.amount, 0);
      },
    }),
    {
      name: STORAGE_KEYS.EXPENSES,
      storage: createJSONStorage(() => asyncStorageAdapter),
    }
  )
);
