
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, TrendingUp, TrendingDown, Activity, Loader2, AlertTriangle } from 'lucide-react';
import type { Transaction, TransactionType } from '@/types';
import { CURRENCY_SYMBOL, EXPENSE_CATEGORIES } from '@/lib/constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";


export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações:', error);
      toast({ title: 'Erro!', description: 'Não foi possível buscar as transações para o painel.', variant: 'destructive' });
      setTransactions([]);
    } else if (data) {
      setTransactions(data.map(t => ({ ...t, date: new Date(t.date), type: t.type as TransactionType })));
    }
    setLoading(false);
  }

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
        <p className="text-muted-foreground mt-4">O Painel estará indisponível até que o Supabase seja configurado.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando Painel...</p>
      </div>
    );
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  const recentTransactions = transactions.slice(0, 5); 

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Painel</h1>
        <div className="flex gap-2">
          <Button asChild variant="default">
            <Link href="/income">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Receita
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/expenses">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Despesa
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-body">{CURRENCY_SYMBOL}{totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">De todas as fontes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-body">{CURRENCY_SYMBOL}{totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">De todas as categorias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <Activity className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-body ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {CURRENCY_SYMBOL}{balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Sua saúde financeira</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Exibindo suas últimas 5 transações.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
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
                        {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </TableCell>
                    <TableCell className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.type === 'income' ? '+' : '-'}{CURRENCY_SYMBOL}{Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
               <Image src="https://placehold.co/300x200.png" alt="Nenhuma transação" width={300} height={200} className="mx-auto mb-4 rounded-md" data-ai-hint="ilustração vazia" />
              <p className="text-muted-foreground">Nenhuma transação ainda. Comece adicionando receitas ou despesas!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
