
import type { LucideIcon } from 'lucide-react';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id?: string; 
  type: TransactionType;
  description: string;
  amount: number;
  date: Date; // Alterado para Date, pois a conversão é feita ao buscar/adicionar.
  category?: string; 
  source?: string; 
  created_at?: string; 
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
