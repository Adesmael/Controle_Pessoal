
'use client';

import type { IncomeSource } from '@/types';
import { DEFAULT_INCOME_SOURCES, INCOME_SOURCES_STORAGE_KEY } from '@/lib/constants';

export function getStoredIncomeSources(): IncomeSource[] {
  if (typeof window === 'undefined') {
    return [...DEFAULT_INCOME_SOURCES];
  }
  try {
    const storedData = localStorage.getItem(INCOME_SOURCES_STORAGE_KEY);
    if (!storedData) {
      localStorage.setItem(INCOME_SOURCES_STORAGE_KEY, JSON.stringify(DEFAULT_INCOME_SOURCES));
      return [...DEFAULT_INCOME_SOURCES];
    }
    return JSON.parse(storedData) as IncomeSource[];
  } catch (error) {
    console.error('Error retrieving income sources:', error);
    return [...DEFAULT_INCOME_SOURCES];
  }
}

function storeIncomeSources(sources: IncomeSource[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INCOME_SOURCES_STORAGE_KEY, JSON.stringify(sources));
    window.dispatchEvent(new StorageEvent('storage', { key: INCOME_SOURCES_STORAGE_KEY }));
  } catch (error) {
    console.error('Error saving income sources:', error);
  }
}

export function addStoredIncomeSource(label: string): { success: boolean, message: string } {
  if (!label) return { success: false, message: 'O nome da fonte de receita não pode estar vazio.'};

  const value = label.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (!value) return { success: false, message: 'Nome de fonte de receita inválido.' };

  const sources = getStoredIncomeSources();
  
  if (sources.some(src => src.value === value || src.label.toLowerCase() === label.trim().toLowerCase())) {
    return { success: false, message: 'Essa fonte de receita já existe.' };
  }

  const newSource: IncomeSource = {
    label: label.trim(),
    value: value,
  };

  const updatedSources = [...sources, newSource];
  storeIncomeSources(updatedSources);
  return { success: true, message: 'Fonte de receita adicionada com sucesso!' };
}

export function deleteStoredIncomeSource(value: string): boolean {
  try {
    const sources = getStoredIncomeSources();
    const updatedSources = sources.filter(src => src.value !== value);
    if (updatedSources.length === sources.length) {
      // Nothing was deleted
      return false;
    }
    storeIncomeSources(updatedSources);
    return true;
  } catch (error) {
    console.error('Error deleting source:', error);
    return false;
  }
}
