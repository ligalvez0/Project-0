import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Subscription } from '../models';
import { asyncStorageAdapter } from '../storage/asyncStorageAdapter';
import { STORAGE_KEYS } from '../storage/keys';

interface SubscriptionState {
  subscriptions: Subscription[];
  addSubscription: (sub: Omit<Subscription, 'id' | 'createdAt'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  cancelSubscription: (id: string) => void;
  deleteSubscription: (id: string) => void;
  getActiveSubscriptions: () => Subscription[];
  getTotalMonthlyCost: () => number;
}

const toMonthlyCost = (amount: number, cycle: Subscription['billingCycle']): number => {
  switch (cycle) {
    case 'weekly':
      return (amount * 52) / 12;
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
  }
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscriptions: [],

      addSubscription: (sub) => {
        const newSub: Subscription = {
          ...sub,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ subscriptions: [...state.subscriptions, newSub] }));
      },

      updateSubscription: (id, updates) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      cancelSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, isActive: false } : s
          ),
        }));
      },

      deleteSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.id !== id),
        }));
      },

      getActiveSubscriptions: () => {
        return get().subscriptions.filter((s) => s.isActive);
      },

      getTotalMonthlyCost: () => {
        return get()
          .subscriptions.filter((s) => s.isActive)
          .reduce((sum, s) => sum + toMonthlyCost(s.amount, s.billingCycle), 0);
      },
    }),
    {
      name: STORAGE_KEYS.SUBSCRIPTIONS,
      storage: createJSONStorage(() => asyncStorageAdapter),
    }
  )
);
