import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import type { ReportType } from '../types';

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, formatStr: string = 'MMM dd, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

export function getDateRange(type: ReportType): { startDate: Date; endDate: Date } {
  const now = new Date();

  switch (type) {
    case 'daily':
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
    case 'weekly':
      return { startDate: startOfWeek(now, { weekStartsOn: 1 }), endDate: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'monthly':
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    case 'yearly':
      return { startDate: startOfYear(now), endDate: endOfYear(now) };
  }
}

export function getPreviousDateRange(type: ReportType): { startDate: Date; endDate: Date } {
  const now = new Date();

  switch (type) {
    case 'daily':
      const prevDay = subDays(now, 1);
      return { startDate: startOfDay(prevDay), endDate: endOfDay(prevDay) };
    case 'weekly':
      const prevWeek = subWeeks(now, 1);
      return { startDate: startOfWeek(prevWeek, { weekStartsOn: 1 }), endDate: endOfWeek(prevWeek, { weekStartsOn: 1 }) };
    case 'monthly':
      const prevMonth = subMonths(now, 1);
      return { startDate: startOfMonth(prevMonth), endDate: endOfMonth(prevMonth) };
    case 'yearly':
      const prevYear = subYears(now, 1);
      return { startDate: startOfYear(prevYear), endDate: endOfYear(prevYear) };
  }
}

export function getPercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
];

export function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency?.symbol || code;
}
