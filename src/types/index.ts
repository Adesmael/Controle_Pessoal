
import type { LucideIcon } from 'lucide-react';

export type TransactionType = 'income' | 'expense';
export type ExpenseSubtype = 'fixed' | 'variable';

export interface Transaction {
  id: string;
  user_id?: string; // Kept for potential future use, not actively used with localStorage
  type: TransactionType;
  description: string;
  amount: number;
  date: Date; // Stored as ISO string in localStorage, converted to Date object in app
  category?: string; 
  source?: string; 
  expenseSubtype?: ExpenseSubtype;
  created_at: string; // ISO string, set at creation time
}

export interface ExpenseCategory {
  value: string;
  label: string;
  icon: string; // Changed from LucideIcon to string name for storage
}

export interface IncomeSource {
  value: string;
  label: string;
}
