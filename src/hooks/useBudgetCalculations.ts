import { useMemo } from 'react';
import { MonthData } from '../types';

export function useBudgetCalculations(currentData: MonthData, history: any[], includeLeftover: boolean) {
  const totalExpenses = useMemo(() => {
    return (currentData.expenses || []).reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  }, [currentData.expenses]);

  const freeMoney = useMemo(() => {
    return (currentData.income || 0) - totalExpenses - (currentData.savingsGoal || 0);
  }, [currentData.income, totalExpenses, currentData.savingsGoal]);

  const totalSavedEver = useMemo(() => {
    return history.reduce((sum, month) => sum + month.saved + (includeLeftover ? month.leftover : 0), 0);
  }, [history, includeLeftover]);

  return { totalExpenses, freeMoney, totalSavedEver };
}
