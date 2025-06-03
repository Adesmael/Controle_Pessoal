'use client';

import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell } from 'recharts';
import type { Transaction } from '@/types';
import { EXPENSE_CATEGORIES, CURRENCY_SYMBOL } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';

interface ExpenseBreakdownChartProps {
  expenses: Transaction[];
}

const COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))',
  '#82ca9d', '#ffc658', '#ff7f0e', '#00C49F', '#FFBB28', '#FF8042' 
];


export default function ExpenseBreakdownChart({ expenses }: ExpenseBreakdownChartProps) {
  const data = EXPENSE_CATEGORIES.map((category, index) => {
    const total = expenses
      .filter((e) => e.category === category.value)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      name: category.label, // Already translated from constants
      value: total,
      fill: COLORS[index % COLORS.length],
    };
  }).filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Detalhamento de Despesas</CardTitle>
          <CardDescription>Nenhum dado de despesa disponível para exibir o gráfico.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Image src="https://placehold.co/200x150.png" alt="Sem dados para o gráfico" width={200} height={150} className="mb-4 rounded-md" data-ai-hint="gráfico estado vazio"/>
          <p className="text-muted-foreground">Adicione algumas despesas para ver o detalhamento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Detalhamento de Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (
                  <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px">
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${CURRENCY_SYMBOL}${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
