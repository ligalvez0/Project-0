import { format, startOfMonth, endOfMonth, parse } from 'date-fns';

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function getMonthRange(month: string): { start: Date; end: Date } {
  const date = parse(month, 'yyyy-MM', new Date());
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

export function formatMonthYear(month: string): string {
  const date = parse(month, 'yyyy-MM', new Date());
  return format(date, 'MMMM yyyy');
}
