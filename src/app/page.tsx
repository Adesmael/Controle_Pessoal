
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, TrendingUp, TrendingDown, Activity, Loader2, AlertTriangle, Lightbulb } from 'lucide-react';
import type { Transaction, TransactionType } from '@/types';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { getFinancialTrend, type FinancialTrendInput, type FinancialTrendOutput } from '@/ai/flows/financial-trend-flow';


export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [trendAnalysis, setTrendAnalysis] = useState<string | null>(null);
  const [projectedBalanceNext30Days, setProjectedBalanceNext30Days] = useState<number | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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
      toast({ 
        title: 'Erro ao buscar transações!', 
        description: error.message || 'Não foi possível conectar ao banco de dados ou buscar os dados para o painel.', 
        variant: 'destructive' 
      });
      setTransactions([]);
    } else if (data) {
      setTransactions(data.map(t => {
        const [year, month, day] = (t.date as string).split('-').map(Number);
        return { ...t, id: t.id as string, date: new Date(year, month - 1, day), type: t.type as TransactionType };
      }));
    }
    setLoading(false);
  }
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  useEffect(() => {
    if (transactions.length > 0 && supabase && !loading) { 
      const calculateTrendAndProjection = async () => {
        setAnalysisLoading(true);
        setAnalysisError(null);

        const today = new Date();
        const thirtyDaysAgo = subDays(today, 30);

        const last30DaysTransactions = transactions.filter(t => {
          const transactionDate = t.date; // t.date is already a Date object
          return transactionDate >= thirtyDaysAgo && transactionDate <= today;
        });

        const incomeLast30Days = last30DaysTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expensesLast30Days = last30DaysTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const netChangeLast30Days = incomeLast30Days - expensesLast30Days;
        setProjectedBalanceNext30Days(balance + netChangeLast30Days);

        try {
          const analysisInput: FinancialTrendInput = {
            currentBalance: balance,
            incomeLast30Days: incomeLast30Days,
            expensesLast30Days: expensesLast30Days,
          };
          const result: FinancialTrendOutput = await getFinancialTrend(analysisInput);
          setTrendAnalysis(result.analysis);
        } catch (error: any) {
          console.error('Error fetching trend analysis:', error);
          setAnalysisError(error.message || 'Falha ao obter análise de tendência.');
          setTrendAnalysis(null);
        } finally {
          setAnalysisLoading(false);
        }
      };

      calculateTrendAndProjection();
    } else if (!loading && transactions.length === 0) {
      // Reset states if there are no transactions
      setProjectedBalanceNext30Days(null);
      setTrendAnalysis(null);
      setAnalysisLoading(false);
      setAnalysisError(null);
    }
  }, [transactions, balance, loading, supabase]);


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

  // This specific loading state is for the initial page load.
  // Analysis loading is handled separately within its card.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando Painel...</p>
      </div>
    );
  }

  const recentTransactions = transactions.slice(0, 5); 

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Painel</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button asChild variant="default" className="w-full sm:w-auto">
            <Link href="/income">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Receita
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
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
            <div className={`text-2xl font-bold font-body ${balance >= 0 ? '' : 'text-destructive'}`}>
              {CURRENCY_SYMBOL}{balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Sua saúde financeira</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Analysis and Forecast Card */}
      {supabase && ( /* Only show if supabase is configured, otherwise transactions won't load */
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previsão e Tendência de Saldo</CardTitle>
            <Lightbulb className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent className="min-h-[100px]"> {/* Added min-height to prevent layout shifts */}
            { (loading || (analysisLoading && transactions.length > 0) ) && !analysisError && (
                <div className="flex items-center space-x-2 py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>{loading ? 'Carregando dados...' : 'Analisando tendências...'}</span>
                </div>
            )}
            {!loading && transactions.length === 0 && !analysisLoading && (
                 <p className="text-sm text-muted-foreground py-4">Adicione transações para ver a previsão e análise de tendências.</p>
            )}
            {analysisError && !analysisLoading && (
              <div className="flex items-center space-x-2 text-destructive py-4">
                <AlertTriangle className="h-5 w-5" />
                <span>{analysisError}</span>
              </div>
            )}
            {!loading && !analysisLoading && !analysisError && transactions.length > 0 && (
              <>
                {projectedBalanceNext30Days !== null ? (
                  <>
                    <div className="text-2xl font-bold">
                      {CURRENCY_SYMBOL}{projectedBalanceNext30Days.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Saldo projetado (próximos 30 dias - estimativa simples)
                    </p>
                  </>
                ) : (
                     <p className="text-sm text-muted-foreground">Não foi possível calcular a projeção.</p>
                )}
                {trendAnalysis ? (
                  <p className="mt-3 text-sm">{trendAnalysis}</p>
                ) : (
                   <p className="mt-3 text-sm text-muted-foreground">Análise de tendência indisponível no momento.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

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
                    <TableCell className={transaction.type === 'income' ? '' : 'text-destructive'}>
                      {transaction.type === 'income' ? '+' : '-'}{CURRENCY_SYMBOL}{Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{format(transaction.date, 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
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

