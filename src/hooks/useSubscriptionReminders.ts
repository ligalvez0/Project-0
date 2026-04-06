import { useMemo } from 'react';
import { useSubscriptionStore } from '../store';
import { differenceInDays } from 'date-fns';

export interface SubscriptionReminder {
  subscriptionId: string;
  name: string;
  daysUntilBilling: number;
  amount: number;
}

export function useSubscriptionReminders() {
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);

  return useMemo(() => {
    const today = new Date();
    const reminders: SubscriptionReminder[] = [];

    for (const sub of subscriptions) {
      if (!sub.isActive) continue;

      const nextBilling = new Date(sub.nextBillingDate);
      const daysUntil = differenceInDays(nextBilling, today);

      if (daysUntil >= 0 && daysUntil <= sub.reminderDaysBefore) {
        reminders.push({
          subscriptionId: sub.id,
          name: sub.name,
          daysUntilBilling: daysUntil,
          amount: sub.amount,
        });
      }
    }

    return reminders.sort((a, b) => a.daysUntilBilling - b.daysUntilBilling);
  }, [subscriptions]);
}
