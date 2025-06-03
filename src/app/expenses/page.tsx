'use client';

import { useState, useEffect } from 'react';
import ExpenseForm from '@/components/forms/ExpenseForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Transaction } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { EXPENSE_CATEGORIES, CURRENCY_SYMBOL } from '@/lib/constants';
import Image from 'next/image';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedExpenses = localStorage.getItem('financialFlowExpenses');
    if (storedExpenses) {
      setExpenses(JSON.parse(storedExpenses).map((t: Transaction) => ({...t, date: new Date(t.date)})));
    }
    setHydrated(true);
  }, []);
  
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('financialFlowExpenses', JSON.stringify(expenses));
    }
  }, [expenses, hydrated]);

  const handleExpenseAdded = (newExpense: Transaction) => {
    setExpenses((prevExpenses) => [newExpense, ...prevExpenses]);
  };

  if (!hydrated) {
    return <div className="flex justify-center items-center h-screen"><p>Loading Expenses Page...</p></div>;
  }

  const getCategoryIcon = (categoryValue?: string) => {
    const category = EXPENSE_CATEGORIES.find(cat => cat.value === categoryValue);
    return category ? <category.icon className="h-5 w-5 mr-2 inline-block text-muted-foreground" /> : null;
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Record Expenses</h1>
        <p className="text-muted-foreground">Keep track of where your money is going.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">New Expense Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm onExpenseAdded={handleExpenseAdded} />
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Recent Expenses</CardTitle>
          <CardDescription>Showing your latest recorded expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
             <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.slice(0, 10).map((expense) => ( // Show latest 10
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell className="flex items-center">
                        {getCategoryIcon(expense.category)}
                        {EXPENSE_CATEGORIES.find(cat => cat.value === expense.category)?.label || expense.category || '-'}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {CURRENCY_SYMBOL}{expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <Image src="https://placehold.co/300x200.png" alt="No expense records" width={300} height={200} className="mx-auto mb-4 rounded-md" data-ai-hint="empty state wallet" />
              <p className="text-muted-foreground">No expenses recorded yet. Add your first expense using the form above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
