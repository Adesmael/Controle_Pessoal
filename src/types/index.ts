import type { LucideIcon } from 'lucide-react';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id?: string; // Para integração futura com autenticação do Supabase
  type: TransactionType;
  description: string;
  amount: number;
  date: Date | string; // Manter Date para componentes, string para Supabase (Supabase lida com conversão)
  category?: string; // For expenses
  source?: string; // For income
  created_at?: string; // Supabase geralmente adiciona este
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
