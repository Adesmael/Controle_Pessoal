import type { LucideIcon } from 'lucide-react';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: Date;
  category?: string; // For expenses
  source?: string; // For income
}

export interface ExpenseCategory {
  value: string;
  label: string;
  icon: LucideIcon;
}

export interface IncomeSource {
  value: string;
  label: string;
}
