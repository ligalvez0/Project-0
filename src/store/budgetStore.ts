import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Budget } from '../models';
import { asyncStorageAdapter } from '../storage/asyncStorageAdapter';
import { STORAGE_KEYS } from '../storage/keys';

interface BudgetState {
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  getBudgetsByMonth: (month: string) => Budget[];
  getBudgetForCategory: (categoryId: string, month: string) => Budget | undefined;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: [],

      addBudget: (budget) => {
        const newBudget: Budget = {
          ...budget,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ budgets: [...state.budgets, newBudget] }));
      },

      updateBudget: (id, updates) => {
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }));
      },

      deleteBudget: (id) => {
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id),
        }));
      },

      getBudgetsByMonth: (month) => {
        return get().budgets.filter((b) => b.month === month);
      },

      getBudgetForCategory: (categoryId, month) => {
        return get().budgets.find(
          (b) => b.categoryId === categoryId && b.month === month
        );
      },
    }),
    {
      name: STORAGE_KEYS.BUDGETS,
      storage: createJSONStorage(() => asyncStorageAdapter),
    }
  )
);
