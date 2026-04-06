import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { SavingsGoal, SavingsContribution } from '../models';
import { asyncStorageAdapter } from '../storage/asyncStorageAdapter';
import { STORAGE_KEYS } from '../storage/keys';

interface SavingsState {
  goals: SavingsGoal[];
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'currentAmount' | 'contributions'>) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  addContribution: (goalId: string, amount: number, note?: string) => void;
}

export const useSavingsStore = create<SavingsState>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (goal) => {
        const newGoal: SavingsGoal = {
          ...goal,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          currentAmount: 0,
          contributions: [],
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      },

      addContribution: (goalId, amount, note?) => {
        const contribution: SavingsContribution = {
          id: uuidv4(),
          amount,
          date: new Date().toISOString(),
          note,
        };
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  currentAmount: g.currentAmount + amount,
                  contributions: [...g.contributions, contribution],
                }
              : g
          ),
        }));
      },
    }),
    {
      name: STORAGE_KEYS.SAVINGS_GOALS,
      storage: createJSONStorage(() => asyncStorageAdapter),
    }
  )
);
