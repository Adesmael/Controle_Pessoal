
'use client';

import type { Log, LogAction, LogEntity } from '@/types';

const LOGS_STORAGE_KEY = 'financialApp_logs';

export function getLogs(): Log[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const storedData = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!storedData) {
      return [];
    }
    const logs = JSON.parse(storedData) as Log[];
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Error retrieving logs from localStorage:', error);
    return [];
  }
}

export function addLog(logData: { action: LogAction; entity: LogEntity; description: string }): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    // Get existing logs without sorting them again
    const storedData = localStorage.getItem(LOGS_STORAGE_KEY);
    const existingLogs = storedData ? JSON.parse(storedData) : [];

    const newLog: Log = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...logData,
    };
    // Prepend the new log to maintain chronological order on retrieval
    const updatedLogs = [newLog, ...existingLogs];
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
    // Dispatch event so the logs page can update if open
    window.dispatchEvent(new StorageEvent('storage', { key: LOGS_STORAGE_KEY }));
  } catch (error) {
    console.error('Error adding log to localStorage:', error);
  }
}

export function clearAllLogs(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(LOGS_STORAGE_KEY);
    window.dispatchEvent(new StorageEvent('storage', { key: LOGS_STORAGE_KEY }));
  } catch (error) {
    console.error('Error clearing logs from localStorage:', error);
  }
}
