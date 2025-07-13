
'use client';

import { useState, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts';
import type { Transaction } from '@/types';
import { format, getYear, startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth, isValid, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MonthlyComparisonChartProps {
  transactions: Transaction[];
}

const ValueFormatter = (value: number) => {
  if (value === 0) return '';
  return `${CURRENCY_SYMBOL}${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function MonthlyComparisonChart({ transactions }: MonthlyComparisonChartProps) {
  
  const availableYears = useMemo(() => {
    if (transactions.length === 0) return [getYear(new Date())];
    const years = new Set(transactions.map(t => getYear(new Date(t.date))));
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);
  
  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0]);

  const chartData = useMemo(() => {
    const yearDate = new Date(selectedYear, 0, 1);
    const start = startOfYear(yearDate);
    const end = endOfYear(yearDate);
    
    const transactionsInYear = transactions.filter(t => 
        isValid(new Date(t.date)) && isWithinInterval(new Date(t.date), { start, end })
    );

    const monthsInterval = eachMonthOfInterval({ start, end });

    return monthsInterval.map(monthStart => {
      const monthLabel = format(monthStart, 'MMM', { locale: ptBR });
      const monthEndRange = endOfMonth(monthStart);
      
      const monthlyIncome = transactionsInYear
        .filter(t => t.type === 'income' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEndRange }))
        .reduce((sum, t) => sum + t.amount, 0);
        
      const monthlyExpenses = transactionsInYear
        .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEndRange }))
        .reduce((sum, t) => sum + t.amount, 0);
        
      return {
        name: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        Receita: monthlyIncome,
        Despesas: monthlyExpenses,
      };
    });
  }, [transactions, selectedYear]);

  const chartTitle = `Comparativo Mensal de ${selectedYear}`;
  const emptyStateDescription = `Nenhum dado de transação disponível para o ano de ${selectedYear}.`;

  if (chartData.every(d => d.Receita === 0 && d.Despesas === 0)) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <CardTitle className="font-headline">{chartTitle}</CardTitle>
            <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Selecione o Ano" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CardDescription>{emptyStateDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Image src="https://placehold.co/200x150.png" alt="Sem dados para o gráfico" width={200} height={150} className="mb-4 rounded-md" data-ai-hint="gráfico ano vazio"/>
          <p className="text-muted-foreground">Adicione transações para ver o comparativo anual.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <CardTitle className="font-headline">{chartTitle}</CardTitle>
           <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Selecione o Ano" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        <CardDescription>
            Análise de receitas e despesas de cada mês do ano selecionado.
        </CardDescription>
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

    