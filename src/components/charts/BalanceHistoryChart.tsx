'use client';

import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Transaction } from '@/types';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, isValid, eachDayOfInterval, startOfDay, endOfDay, compareAsc } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BalanceHistoryChartProps {
  transactions: Transaction[];
}

type ViewMode = 'daily' | 'monthly';

export default function BalanceHistoryChart({ transactions }: BalanceHistoryChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');

  const chartData = useMemo(() => {
    if (transactions.length === 0) {
      return [];
    }

    const sortedTransactions = [...transactions].sort((a, b) => compareAsc(new Date(a.date), new Date(b.date)));
    const firstDate = startOfDay(new Date(sortedTransactions[0].date));
    const lastDate = endOfDay(new Date(sortedTransactions[sortedTransactions.length - 1].date));
    
    if (!isValid(firstDate) || !isValid(lastDate)) return [];

    const dailyNetChanges = new Map<string, number>();
    for (const t of sortedTransactions) {
        if (!isValid(new Date(t.date))) continue;
        const dateKey = format(startOfDay(new Date(t.date)), 'yyyy-MM-dd');
        const change = t.type === 'income' ? t.amount : -t.amount;
        dailyNetChanges.set(dateKey, (dailyNetChanges.get(dateKey) || 0) + change);
    }

    let cumulativeBalance = 0;

    if (viewMode === 'daily') {
        const dateInterval = eachDayOfInterval({ start: firstDate, end: lastDate });
        return dateInterval.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            cumulativeBalance += dailyNetChanges.get(dateKey) || 0;
            return {
                name: format(day, 'dd/MM', { locale: ptBR }),
                Saldo: cumulativeBalance
            };
        });
    } else { // monthly
        const monthInterval = eachMonthOfInterval({ start: firstDate, end: lastDate });
        
        const monthlyNetChanges = new Map<string, number>();
        for(const [dateKey, change] of dailyNetChanges.entries()) {
            const monthKey = format(new Date(dateKey), 'yyyy-MM');
            monthlyNetChanges.set(monthKey, (monthlyNetChanges.get(monthKey) || 0) + change);
        }

        return monthInterval.map(monthStart => {
            const monthKey = format(monthStart, 'yyyy-MM');
            cumulativeBalance += monthlyNetChanges.get(monthKey) || 0;
            const capitalizedMonth = format(monthStart, 'MMM yy', { locale: ptBR });
            return {
                name: capitalizedMonth.charAt(0).toUpperCase() + capitalizedMonth.slice(1),
                Saldo: cumulativeBalance
            };
        });
    }
  }, [transactions, viewMode]);

  const chartTitle = "Evolução do Saldo (Período Filtrado)";
  const emptyStateDescription = "Não há dados de transação suficientes no período filtrado para exibir o gráfico de evolução do saldo.";
  const emptyStateHint = 'gráfico evolução vazio';
  const dailyViewLabel = "Diária";
  const monthlyViewLabel = "Mensal";

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{chartTitle}</CardTitle>
          <CardDescription>{emptyStateDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Image src="https://placehold.co/200x150.png" alt="Sem dados para o gráfico" width={200} height={150} className="mb-4 rounded-md" data-ai-hint={emptyStateHint} />
          <p className="text-muted-foreground">Filtre um período com transações para ver a evolução do saldo.</p>
        </CardContent>
      </Card>
    );
  }

  const finalBalance = chartData[chartData.length - 1]?.Saldo || 0;
  const strokeColor = finalBalance >= 0 ? "hsl(var(--chart-1))" : "hsl(var(--chart-5))"; 
  const gradientId = finalBalance >= 0 ? "balanceGradientPositive" : "balanceGradientNegative";

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
              <SelectItem value="daily">{dailyViewLabel}</SelectItem>
              <SelectItem value="monthly">{monthlyViewLabel}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>Este gráfico mostra o saldo acumulado com base nas transações do período filtrado, começando em zero.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
                 <linearGradient id="balanceGradientPositive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="balanceGradientNegative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${CURRENCY_SYMBOL}${value.toLocaleString('pt-BR')}`} domain={['auto', 'auto']} />
            <Tooltip
              formatter={(value: number) => [`${CURRENCY_SYMBOL}${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Saldo Acumulado']}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
            />
            <Area type="monotone" dataKey="Saldo" stroke={strokeColor} fillOpacity={1} fill={`url(#${gradientId})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
