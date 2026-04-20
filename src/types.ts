/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemeType = 'light' | 'dark' | 'pink';
export type CurrencyType = 'RUB' | 'USD' | 'EUR';
export type Language = 'RU' | 'EN';

export interface Expense {
  id: string | number;
  name: string;
  amount: number;
}

export interface HistoryRecord {
  id: string | number;
  date: string;
  monthKey: string;
  income: number;
  totalExpenses: number;
  saved: number;
  leftover: number;
}

export interface MonthData {
  income: number;
  savingsGoal: number;
  expenses: Expense[];
}

export type ThemeStyles = {
  bg: string;
  text: string;
  card: string;
  input: string;
  divider: string;
  muted: string;
}
