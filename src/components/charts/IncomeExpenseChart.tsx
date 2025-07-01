
'use client';

import { useState, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts';
import type { Transaction } from '@/types';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isValid, isWithinInterval, subDays, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

type ViewMode = 'monthly' | 'daily';

const ValueFormatter = (value: number) => {
  if (value === 0) return '';
  return `${CURRENCY_SYMBOL}${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  const chartData = useMemo(() => {
    if (viewMode === 'monthly') {
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
      const currentMonthEnd = endOfMonth(new Date());
      const monthsInterval = eachMonthOfInterval({ start: sixMonthsAgo, end: currentMonthEnd });

      return monthsInterval.map(monthStart => {
        const monthLabel = format(monthStart, 'MMM yy', { locale: ptBR });
        const monthEndRange = endOfMonth(monthStart);
        const monthlyIncome = transactions
          .filter(t => t.type === 'income' && isValid(new Date(t.date)) && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEndRange }))
          .reduce((sum, t) => sum + t.amount, 0);
        const monthlyExpenses = transactions
          .filter(t => t.type === 'expense' && isValid(new Date(t.date)) && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEndRange }))
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          name: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          Receita: monthlyIncome,
          Despesas: monthlyExpenses,
        };
      });
    } else { // Daily view for last 30 days
      const today = new Date();
      const thirtyDaysAgo = subDays(today, 29); // Includes today, so 29 days back + today = 30 days
      const dateInterval = eachDayOfInterval({ start: startOfDay(thirtyDaysAgo), end: endOfDay(today) });

      return dateInterval.map(day => {
        const dayLabel = format(day, 'dd/MM', { locale: ptBR });
        const dailyIncome = transactions
          .filter(t => t.type === 'income' && isValid(new Date(t.date)) && isWithinInterval(new Date(t.date), { start: startOfDay(day), end: endOfDay(day) }))
          .reduce((sum, t) => sum + t.amount, 0);
        const dailyExpenses = transactions
          .filter(t => t.type === 'expense' && isValid(new Date(t.date)) && isWithinInterval(new Date(t.date), { start: startOfDay(day), end: endOfDay(day) }))
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          name: dayLabel,
          Receita: dailyIncome,
          Despesas: dailyExpenses,
        };
      });
    }
  }, [transactions, viewMode]);

  const chartTitle = viewMode === 'monthly' ? 'Receitas vs. Despesas Mensais (Últimos 6 Meses)' : 'Receitas vs. Despesas Diárias (Últimos 30 Dias)';
  const emptyStateDescription = viewMode === 'monthly' ? 'Nenhum dado de transação disponível para os últimos 6 meses.' : 'Nenhum dado de transação disponível para os últimos 30 dias.';
  const emptyStateHint = viewMode === 'monthly' ? 'gráfico mês vazio' : 'gráfico dia vazio';
  const dailyViewLabel = "Diária (30 dias)";

  if (chartData.every(d => d.Receita === 0 && d.Despesas === 0)) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <CardTitle className="font-headline">{chartTitle}</CardTitle>
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Selecionar Visualização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal (6 meses)</SelectItem>
                <SelectItem value="daily">{dailyViewLabel}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>{emptyStateDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Image src="https://placehold.co/200x150.png" alt="Sem dados para o gráfico" width={200} height={150} className="mb-4 rounded-md" data-ai-hint={emptyStateHint} />
          <p className="text-muted-foreground">Adicione transações para ver o resumo.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <CardTitle className="font-headline">{chartTitle}</CardTitle>
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Selecionar Visualização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal (6 meses)</SelectItem>
              <SelectItem value="daily">{dailyViewLabel}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${CURRENCY_SYMBOL}${value.toLocaleString('pt-BR')}`} />
            <Tooltip
              formatter={(value: number) => `${CURRENCY_SYMBOL}${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Receita" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Receita">
              <LabelList dataKey="Receita" position="top" formatter={ValueFormatter} fontSize={11} fill="hsl(var(--foreground))" fontWeight="bold" />
            </Bar>
            <Bar dataKey="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Despesas">
              <LabelList dataKey="Despesas" position="top" formatter={ValueFormatter} fontSize={11} fill="hsl(var(--foreground))" fontWeight="bold" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
