
'use client';

import type { Transaction } from '@/types';
import { addLog } from './logStorage';
import { CURRENCY_SYMBOL } from './constants';

const TRANSACTIONS_STORAGE_KEY = 'financialApp_transactions';

/**
 * Retrieves all transactions from localStorage.
 * Parses dates from ISO strings back to Date objects.
 * @returns {Transaction[]} An array of transactions, or an empty array if none are found or an error occurs.
 */
export function getStoredTransactions(): Transaction[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const storedData = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!storedData) {
      return [];
    }
    const transactions = JSON.parse(storedData) as Transaction[];
    // Convert date strings back to Date objects
    return transactions.map(tx => ({
      ...tx,
      date: new Date(tx.date), 
    }));
  } catch (error) {
    console.error('Error retrieving transactions from localStorage:', error);
    return [];
  }
}

/**
 * Saves an array of transactions to localStorage.
 * Dates are automatically converted to ISO strings by JSON.stringify.
 * @param {Transaction[]} transactions The array of transactions to save.
 */
export function storeTransactions(transactions: Transaction[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transactions to localStorage:', error);
  }
}

/**
 * Adds a single transaction to the stored list.
 * @param {Omit<Transaction, 'id' | 'created_at'>} newTransactionData The data for the new transaction.
 * @param {'income' | 'expense'} type The type of the transaction.
 * @returns {Transaction | null} The newly added transaction with id and created_at, or null if an error occurs.
 */
export function addStoredTransaction(
  newTransactionData: Omit<Transaction, 'id' | 'created_at' | 'type'>,
  type: 'income' | 'expense'
): Transaction | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const existingTransactions = getStoredTransactions();
    const newTransaction: Transaction = {
      ...newTransactionData,
      id: crypto.randomUUID(),
      type: type,
      created_at: new Date().toISOString(),
    };
    const updatedTransactions = [...existingTransactions, newTransaction];
    storeTransactions(updatedTransactions);

    const typeText = type === 'income' ? 'Receita' : 'Despesa';
    const amountFormatted = `${CURRENCY_SYMBOL}${newTransaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    addLog({
      action: 'CREATE',
      entity: 'TRANSACTION',
      description: `${typeText} "${newTransaction.description}" (${amountFormatted}) foi adicionada.`,
    });

    return newTransaction;
  } catch (error) {
    console.error('Error adding transaction to localStorage:', error);
    return null;
  }
}

/**
 * Deletes a transaction by its ID from localStorage.
 * @param {string} transactionId The ID of the transaction to delete.
 * @returns {boolean} True if deletion was successful, false otherwise.
 */
export function deleteStoredTransaction(transactionId: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const existingTransactions = getStoredTransactions();
    const transactionToDelete = existingTransactions.find(tx => tx.id === transactionId);

    if (!transactionToDelete) {
      return false;
    }

    const updatedTransactions = existingTransactions.filter(tx => tx.id !== transactionId);
    storeTransactions(updatedTransactions);

    const typeText = transactionToDelete.type === 'income' ? 'Receita' : 'Despesa';
    const amountFormatted = `${CURRENCY_SYMBOL}${transactionToDelete.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    addLog({
      action: 'DELETE',
      entity: 'TRANSACTION',
      description: `${typeText} "${transactionToDelete.description}" (${amountFormatted}) foi excluída.`,
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting transaction from localStorage:', error);
    return false;
  }
}

/**
 * Deletes multiple transactions by their IDs from localStorage.
 * @param {string[]} transactionIds An array of transaction IDs to delete.
 * @returns {boolean} True if deletion was successful, false otherwise.
 */
export function deleteStoredTransactions(transactionIds: string[]): boolean {
  if (typeof window === 'undefined' || transactionIds.length === 0) {
    return false;
  }
  try {
    const existingTransactions = getStoredTransactions();
    const idsToDeleteSet = new Set(transactionIds);
    
    const updatedTransactions = existingTransactions.filter(tx => !idsToDeleteSet.has(tx.id));

    if (updatedTransactions.length === existingTransactions.length) {
      // No transactions were found to delete
      return false;
    }

    storeTransactions(updatedTransactions);

    const numDeleted = existingTransactions.length - updatedTransactions.length;
    addLog({
      action: 'DELETE',
      entity: 'TRANSACTION',
      description: `${numDeleted} transaçõe(s) foram excluídas em massa.`,
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting multiple transactions from localStorage:', error);
    return false;
  }
}
