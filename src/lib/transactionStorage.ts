
'use client';

import type { Transaction } from '@/types';

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
    const updatedTransactions = existingTransactions.filter(tx => tx.id !== transactionId);
    storeTransactions(updatedTransactions);
    return true;
  } catch (error) {
    console.error('Error deleting transaction from localStorage:', error);
    return false;
  }
}
