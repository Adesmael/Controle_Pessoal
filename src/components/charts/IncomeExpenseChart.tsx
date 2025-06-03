'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Transaction } from '@/types';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

export default function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  // Aggregate data by month for the last 6 months
  const sixMonthsAgo = subMonths(new Date(), 5);
  const currentMonthEnd = endOfMonth(new Date());
  const monthsInterval = eachMonthOfInterval({ start: startOfMonth(sixMonthsAgo), end: currentMonthEnd });

  const data = monthsInterval.map(monthStart => {
    const monthLabel = format(monthStart, 'MMM yy');
    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && format(t.date, 'MMM yy') === monthLabel)
      .reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense' && format(t.date, 'MMM yy') === monthLabel)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      name: monthLabel,
      Income: monthlyIncome,
      Expenses: monthlyExpenses,
    };
  });

  if (data.every(d => d.Income === 0 && d.Expenses === 0)) {
     return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Income vs. Expenses</CardTitle>
          <CardDescription>No transaction data available for the last 6 months.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Image src="https://placehold.co/200x150.png" alt="No data for chart" width={200} height={150} className="mb-4 rounded-md" data-ai-hint="chart empty state graph"/>
          <p className="text-muted-foreground">Add some transactions to see income vs. expenses.</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Monthly Income vs. Expenses (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${CURRENCY_SYMBOL}${value}`} />
            <Tooltip
              formatter={(value: number) => `${CURRENCY_SYMBOL}${value.toFixed(2)}`}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Income" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expenses" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
