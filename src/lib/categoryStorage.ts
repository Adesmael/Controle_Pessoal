
'use client';

import type { ExpenseCategory } from '@/types';
import { DEFAULT_EXPENSE_CATEGORIES, EXPENSE_CATEGORIES_STORAGE_KEY } from '@/lib/constants';
import { addLog } from './logStorage';

export function getStoredExpenseCategories(): ExpenseCategory[] {
  if (typeof window === 'undefined') {
    return [...DEFAULT_EXPENSE_CATEGORIES];
  }
  try {
    const storedData = localStorage.getItem(EXPENSE_CATEGORIES_STORAGE_KEY);
    if (!storedData) {
      localStorage.setItem(EXPENSE_CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_EXPENSE_CATEGORIES));
      return [...DEFAULT_EXPENSE_CATEGORIES];
    }
    return JSON.parse(storedData) as ExpenseCategory[];
  } catch (error) {
    console.error('Error retrieving expense categories:', error);
    return [...DEFAULT_EXPENSE_CATEGORIES];
  }
}

function storeExpenseCategories(categories: ExpenseCategory[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EXPENSE_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new StorageEvent('storage', { key: EXPENSE_CATEGORIES_STORAGE_KEY }));
  } catch (error) {
    console.error('Error saving expense categories:', error);
  }
}

export function addStoredExpenseCategory(label: string): { success: boolean, message: string } {
  if (!label) return { success: false, message: 'O nome da categoria não pode estar vazio.'};

  const value = label.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (!value) return { success: false, message: 'Nome de categoria inválido.' };

  const categories = getStoredExpenseCategories();
  
  if (categories.some(cat => cat.value === value || cat.label.toLowerCase() === label.trim().toLowerCase())) {
    return { success: false, message: 'Essa categoria já existe.' };
  }

  const newCategory: ExpenseCategory = {
    label: label.trim(),
    value: value,
    icon: 'Package', // Default icon for all new categories
  };

  const updatedCategories = [...categories, newCategory];
  storeExpenseCategories(updatedCategories);

  addLog({
    action: 'CREATE',
    entity: 'CATEGORY',
    description: `Categoria de despesa "${newCategory.label}" foi criada.`,
  });

  return { success: true, message: 'Categoria adicionada com sucesso!' };
}

export function deleteStoredExpenseCategory(value: string): boolean {
  try {
    const categories = getStoredExpenseCategories();
    const categoryToDelete = categories.find(cat => cat.value === value);
    if (!categoryToDelete) return false;

    const updatedCategories = categories.filter(cat => cat.value !== value);
    if (updatedCategories.length === categories.length) {
      // Nothing was deleted
      return false;
    }
    storeExpenseCategories(updatedCategories);

    addLog({
      action: 'DELETE',
      entity: 'CATEGORY',
      description: `Categoria de despesa "${categoryToDelete.label}" foi excluída.`,
    });

    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
}
