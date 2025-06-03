
'use client';

import { useState, useEffect } from 'react';
import type { Transaction, TransactionType } from '@/types';
import ExpenseBreakdownChart from '@/components/charts/ExpenseBreakdownChart';
import IncomeExpenseChart from '@/components/charts/IncomeExpenseChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CURRENCY_SYMBOL, EXPENSE_CATEGORIES } from '@/lib/constants';
import { TrendingUp, TrendingDown, Activity, Loader2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export default function ReportsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    async function fetchAllTransactions() {
      if (!supabase) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Erro ao buscar todas as transações:', error);
        toast({ 
          title: 'Erro ao buscar transações!', 
          description: error.message || 'Não foi possível conectar ao banco de dados ou buscar os dados para os relatórios.', 
          variant: 'destructive' 
        });
        setAllTransactions([]);
      } else if (data) {
        setAllTransactions(data.map(t => {
          const [year, month, day] = (t.date as string).split('-').map(Number);
          return {...t, id: t.id as string, date: new Date(year, month - 1, day), type: t.type as TransactionType };
        }));
      }
      setLoading(false);
    }
    fetchAllTransactions();
  }, [toast]);

  if (!supabase) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4 bg-background text-foreground">
        <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
        <h1 className="text-2xl font-bold mb-4 text-destructive">Supabase Não Configurado</h1>
        <p className="mb-2">As variáveis de ambiente do Supabase (URL e Chave Anônima) não foram encontradas.</p>
        <p className="mb-2">Por favor, crie um arquivo <code>.env.local</code> na raiz do projeto com o seguinte conteúdo:</p>
        <pre className="bg-muted p-3 rounded-md text-sm my-3 text-left shadow">
          {`NEXT_PUBLIC_SUPABASE_URL=SUA_URL_AQUI\nNEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_AQUI`}
        </pre>
        <p className="text-sm text-muted-foreground mb-1">Substitua <code>SUA_URL_AQUI</code> e <code>SUA_CHAVE_AQUI</code> com suas credenciais do Supabase.</p>
        <p className="mb-4">Após criar ou modificar o arquivo, <strong className="text-primary">reinicie o servidor de desenvolvimento</strong>.</p>
        <p className="text-muted-foreground mt-4">A página de Relatórios estará indisponível até que o Supabase seja configurado.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando Relatórios...</p>
      </div>
    );
  }

  const totalIncome = allTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

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
             <div className={`text-2xl font-bold ${balance >= 0 ? '' : 'text-destructive'}`}>
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
                      <TableCell>{format(transaction.date, 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
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
                      <TableCell className={`text-right font-semibold ${transaction.type === 'income' ? '' : 'text-destructive'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{CURRENCY_SYMBOL}{Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
