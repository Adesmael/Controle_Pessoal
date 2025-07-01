
import type { ExpenseCategory, IncomeSource } from '@/types';

// This is now the default set of categories to seed the user's storage.
export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { value: 'food', label: 'Alimentação', icon: 'Utensils' },
  { value: 'transport', label: 'Transporte', icon: 'Car' },
  { value: 'housing', label: 'Moradia e Aluguel', icon: 'Home' },
  { value: 'utilities', label: 'Contas de Casa', icon: 'Lightbulb' },
  { value: 'entertainment', label: 'Entretenimento', icon: 'Film' },
  { value: 'health', label: 'Saúde e Bem-estar', icon: 'HeartPulse' },
  { value: 'education', label: 'Educação', icon: 'BookOpen' },
  { value: 'shopping', label: 'Compras', icon: 'ShoppingCart' },
  { value: 'other', label: 'Outros', icon: 'Package' },
];

export const INCOME_SOURCES: IncomeSource[] = [
  { value: 'salary', label: 'Salário' },
  { value: 'freelance', label: 'Projeto Freelance' },
  { value: 'business', label: 'Renda de Negócios' },
  { value: 'investment', label: 'Investimentos' },
  { value: 'gift', label: 'Presente' },
  { value: 'other', label: 'Outros' },
];

export const CURRENCY_SYMBOL = 'R$';
export const MONTHLY_SPENDING_GOAL_KEY = 'monthlySpendingGoal';
export const EXPENSE_CATEGORIES_STORAGE_KEY = 'financialApp_expense_categories';

export const GOOGLE_API_KEY_MISSING_ERROR = "Erro: A chave de API do Google (GOOGLE_API_KEY) não foi configurada ou é inválida. Verifique seu arquivo .env.local e reinicie os servidores (Next.js e Genkit) ou verifique o console do servidor Genkit para mais detalhes.";


export { Settings as SettingsIcon };
