import type { ExpenseCategory, IncomeSource } from '@/types';
import {
  Utensils,
  Car,
  Home,
  Lightbulb,
  Film,
  HeartPulse,
  BookOpen,
  ShoppingCart,
  Package,
  Briefcase,
  Gift,
  Landmark,
  DollarSign
} from 'lucide-react';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { value: 'food', label: 'Alimentação', icon: Utensils },
  { value: 'transport', label: 'Transporte', icon: Car },
  { value: 'housing', label: 'Moradia e Aluguel', icon: Home },
  { value: 'utilities', label: 'Contas de Casa', icon: Lightbulb },
  { value: 'entertainment', label: 'Entretenimento', icon: Film },
  { value: 'health', label: 'Saúde e Bem-estar', icon: HeartPulse },
  { value: 'education', label: 'Educação', icon: BookOpen },
  { value: 'shopping', label: 'Compras', icon: ShoppingCart },
  { value: 'other', label: 'Outros', icon: Package },
];

export const INCOME_SOURCES: IncomeSource[] = [
  { value: 'salary', label: 'Salário' },
  { value: 'freelance', label: 'Projeto Freelance' },
  { value: 'business', label: 'Renda de Negócios' },
  { value: 'investment', label: 'Investimentos' },
  { value: 'gift', label: 'Presente' },
  { value: 'other', label: 'Outros' },
];

export const CURRENCY_SYMBOL = 'R$'; // Símbolo da moeda brasileira

