'use client';

import { useState, useEffect } from 'react';
import type { Transaction } from '@/types';
import ExpenseBreakdownChart from '@/components/charts/ExpenseBreakdownChart';
import IncomeExpenseChart from '@/components/charts/IncomeExpenseChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CURRENCY_SYMBOL, EXPENSE_CATEGORIES } from '@/lib/constants';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import Image from 'next/image';

export default function ReportsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedIncomes = JSON.parse(localStorage.getItem('financialFlowIncomes') || '[]').map((t: Transaction) => ({...t, date: new Date(t.date), type: 'income' as 'income' | 'expense'}));
    const storedExpenses = JSON.parse(localStorage.getItem('financialFlowExpenses') || '[]').map((t: Transaction) => ({...t, date: new Date(t.date), type: 'expense' as 'income' | 'expense'}));
    setAllTransactions([...storedIncomes, ...storedExpenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <div className="flex justify-center items-center h-screen"><p>Carregando Relatórios...</p></div>;
  }

  const totalIncome = allTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const getCategoryIcon = (categoryValue?: string) => {
    const category = EXPENSE_CATEGORIES.find(cat => cat.value === categoryValue);
    return category ? <category.icon className="h-4 w-4 mr-1 inline-block text-muted-foreground" /> : null;
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Relatórios Financeiros</h1>
        <p className="text-muted-foreground">Visualize seus dados financeiros e obtenha insights.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Geral</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{CURRENCY_SYMBOL}{totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Gerais</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{CURRENCY_SYMBOL}{totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <Activity className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
             <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {CURRENCY_SYMBOL}{balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeExpenseChart transactions={allTransactions} />
        <ExpenseBreakdownChart expenses={allTransactions.filter(t => t.type === 'expense')} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Todas as Transações</CardTitle>
          <CardDescription>Uma lista completa de suas receitas e despesas registradas.</CardDescription>
        </CardHeader>
        <CardContent>
          {allTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria/Fonte</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>
                         <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          transaction.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                         }`}>
                          {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                        </span>
                      </TableCell>
                      <TableCell className="flex items-center">
                        {transaction.type === 'expense' ? getCategoryIcon(transaction.category) : null}
                        {transaction.type === 'expense' 
                          ? (EXPENSE_CATEGORIES.find(cat => cat.value === transaction.category)?.label || transaction.category || '-')
                          : (transaction.source || '-')}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{CURRENCY_SYMBOL}{transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <div className="text-center py-10">
               <Image src="https://placehold.co/300x200.png" alt="Nenhuma transação encontrada" width={300} height={200} className="mx-auto mb-4 rounded-md" data-ai-hint="documento vazio"/>
              <p className="text-muted-foreground">Nenhuma transação encontrada. Comece adicionando receitas ou despesas.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
