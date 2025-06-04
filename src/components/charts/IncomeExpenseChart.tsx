
'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts';
import type { Transaction } from '@/types';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

const ValueFormatter = (value: number) => {
  if (value === 0) return '';
  return `${CURRENCY_SYMBOL}${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const sixMonthsAgo = subMonths(new Date(), 5);
  const currentMonthEnd = endOfMonth(new Date());
  const monthsInterval = eachMonthOfInterval({ start: startOfMonth(sixMonthsAgo), end: currentMonthEnd });

  const data = monthsInterval.map(monthStart => {
    const monthLabel = format(monthStart, 'MMM yy', { locale: ptBR });
    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && format(t.date, 'MMM yy', { locale: ptBR }) === monthLabel)
      .reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense' && format(t.date, 'MMM yy', { locale: ptBR }) === monthLabel)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      name: monthLabel,
      Receita: monthlyIncome, // Translated Key
      Despesas: monthlyExpenses, // Translated Key
    };
  });

  if (data.every(d => d.Receita === 0 && d.Despesas === 0)) {
     return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Receitas vs. Despesas</CardTitle>
          <CardDescription>Nenhum dado de transação disponível para os últimos 6 meses.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Image src="https://placehold.co/200x150.png" alt="Sem dados para o gráfico" width={200} height={150} className="mb-4 rounded-md" data-ai-hint="gráfico estado vazio"/>
          <p className="text-muted-foreground">Adicione algumas transações para ver as receitas vs. despesas.</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Receitas vs. Despesas Mensais (Últimos 6 Meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
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
              <LabelList dataKey="Receita" position="top" formatter={ValueFormatter} fontSize={11} fill="hsl(var(--foreground))" />
            </Bar>
            <Bar dataKey="Despesas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Despesas">
              <LabelList dataKey="Despesas" position="top" formatter={ValueFormatter} fontSize={11} fill="hsl(var(--foreground))" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

