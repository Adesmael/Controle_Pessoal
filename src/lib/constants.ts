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
  { value: 'food', label: 'Food & Dining', icon: Utensils },
  { value: 'transport', label: 'Transportation', icon: Car },
  { value: 'housing', label: 'Housing & Rent', icon: Home },
  { value: 'utilities', label: 'Utilities', icon: Lightbulb },
  { value: 'entertainment', label: 'Entertainment', icon: Film },
  { value: 'health', label: 'Healthcare & Wellness', icon: HeartPulse },
  { value: 'education', label: 'Education', icon: BookOpen },
  { value: 'shopping', label: 'Shopping', icon: ShoppingCart },
  { value: 'other', label: 'Other', icon: Package },
];

export const INCOME_SOURCES: IncomeSource[] = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance Project' },
  { value: 'business', label: 'Business Income' },
  { value: 'investment', label: 'Investments' },
  { value: 'gift', label: 'Gift' },
  { value: 'other', label: 'Other' },
];

export const CURRENCY_SYMBOL = '$'; // Or any other currency symbol like '€', '£', '₹'
