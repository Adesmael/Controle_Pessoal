'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { Transaction } from '@/types';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from 'next/image';

// Mock transactions for display. In a real app, this would come from an API/DB.
const mockTransactions: Transaction[] = [
  { id: '1', type: 'income', description: 'Monthly Salary', amount: 5000, date: new Date(2024, 6, 1), source: 'salary' },
  { id: '2', type: 'expense', description: 'Groceries', amount: 150, date: new Date(2024, 6, 3), category: 'food' },
  { id: '3', type: 'expense', description: 'Netflix Subscription', amount: 15, date: new Date(2024, 6, 5), category: 'entertainment' },
  { id: '4', type: 'income', description: 'Freelance Project', amount: 750, date: new Date(2024, 6, 10), source: 'freelance' },
  { id: '5', type: 'expense', description: 'Gas Bill', amount: 60, date: new Date(2024, 6, 12), category: 'utilities' },
];


export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Simulate fetching data and ensure client-side only execution for mock data with dates
    setTransactions(mockTransactions);
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <div className="flex justify-center items-center h-screen"><p>Loading Dashboard...</p></div>;
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild variant="default">
            <Link href="/income">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Income
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/expenses">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-body">{CURRENCY_SYMBOL}{totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across all sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-body">{CURRENCY_SYMBOL}{totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Activity className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-body ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {CURRENCY_SYMBOL}{balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Your financial health</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Showing your last 5 transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        transaction.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.type === 'income' ? '+' : '-'}{CURRENCY_SYMBOL}{transaction.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{format(transaction.date, 'MMM dd, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
               <Image src="https://placehold.co/300x200.png" alt="No transactions" width={300} height={200} className="mx-auto mb-4 rounded-md" data-ai-hint="empty state illustration" />
              <p className="text-muted-foreground">No transactions yet. Start by adding income or expenses!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
