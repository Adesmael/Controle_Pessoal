
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, TrendingUp, TrendingDown, Activity, Loader2, AlertTriangle, Lightbulb, Target, Edit3 } from 'lucide-react';
import type { Transaction, TransactionType } from '@/types';
import { CURRENCY_SYMBOL, EXPENSE_CATEGORIES, MONTHLY_SPENDING_GOAL_KEY, GOOGLE_API_KEY_MISSING_ERROR } from '@/lib/constants';
import { format, subDays, isValid, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { getFinancialTrend, type FinancialTrendInput, type FinancialTrendOutput } from '@/ai/flows/financial-trend-flow';
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [trendAnalysis, setTrendAnalysis] = useState<string | null>(null);
  const [projectedBalanceNext30Days, setProjectedBalanceNext30Days] = useState<number | null>(null);
  const [trendAnalysisLoading, setTrendAnalysisLoading] = useState(false);
  const [trendAnalysisError, setTrendAnalysisError] = useState<string | null>(null);

  const [monthlyGoal, setMonthlyGoal] = useState<number | null>(null);
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState<number>(0);

  const alert85DispatchedRef = useRef(false);
  const alert100DispatchedRef = useRef(false);


  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    fetchTransactions();
    loadMonthlyGoal();
  }, []);

  function loadMonthlyGoal() {
    const storedGoal = localStorage.getItem(MONTHLY_SPENDING_GOAL_KEY);
    if (storedGoal) {
      const parsedGoal = parseFloat(storedGoal);
      if (!isNaN(parsedGoal) && parsedGoal > 0) {
        setMonthlyGoal(parsedGoal);
      } else {
        setMonthlyGoal(null);
      }
    } else {
      setMonthlyGoal(null);
    }
  }
  
  useEffect(() => {
    if (transactions.length > 0) {
      calculateCurrentMonthExpenses();
    } else if (!loading && transactions.length === 0) {
      setCurrentMonthExpenses(0); 
    }
  }, [transactions, monthlyGoal, loading]); 

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === MONTHLY_SPENDING_GOAL_KEY) {
        loadMonthlyGoal(); 
        alert85DispatchedRef.current = false; 
        alert100DispatchedRef.current = false;
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
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
      const formattedTransactions = data.map(t => {
        if (!t.date) return { ...t, id: t.id as string, date: new Date(), type: t.type as TransactionType }; 
        const [year, month, day] = (t.date as string).split('-').map(Number);
        const transactionDate = new Date(year, month - 1, day);
        return { ...t, id: t.id as string, date: isValid(transactionDate) ? transactionDate : new Date(), type: t.type as TransactionType };
      });
      setTransactions(formattedTransactions);
    }
    setLoading(false);
  }

  function calculateCurrentMonthExpenses() {
    const today = new Date();
    const firstDayOfMonth = startOfMonth(today);
    const lastDayOfMonth = endOfMonth(today);

    const expensesThisMonth = transactions
      .filter(t => 
        t.type === 'expense' && 
        isValid(t.date) &&
        isWithinInterval(t.date, { start: firstDayOfMonth, end: lastDayOfMonth })
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);
    setCurrentMonthExpenses(expensesThisMonth);
  }
  
  const totalIncome = useMemo(() => transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0), [transactions]);

  const totalExpenses = useMemo(() => transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0), [transactions]);

  const balance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const { incomeLast30Days, expensesLast30Days } = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);

    const last30DaysTransactions = transactions.filter(t => {
      const transactionDate = t.date;
      return isValid(transactionDate) && transactionDate >= thirtyDaysAgo && transactionDate <= today;
    });

    const income = last30DaysTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = last30DaysTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    return { incomeLast30Days: income, expensesLast30Days: expenses };
  }, [transactions]);


  useEffect(() => {
    if (transactions.length > 0 && supabase && !loading) { 
      setTrendAnalysisLoading(true);
      setTrendAnalysisError(null);
      setTrendAnalysis(null); 
      
      const netChangeLast30Days = incomeLast30Days - expensesLast30Days;
      setProjectedBalanceNext30Days(balance + netChangeLast30Days);

      const calculateTrendAndProjection = async () => {
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
          let errorMessage = 'Falha ao obter análise de tendência.';
          if (error.message && error.message.toLowerCase().includes('failed to fetch')) {
            errorMessage = GOOGLE_API_KEY_MISSING_ERROR + ' (Trend Analysis)';
          } else if (error.message && (error.message.includes('503') || error.message.toLowerCase().includes('overloaded'))) {
            errorMessage = 'O serviço de IA para análise de tendência parece estar ocupado. Por favor, tente novamente em alguns instantes.';
          } else if (error.message) {
            errorMessage = error.message;
          }
          setTrendAnalysisError(errorMessage);
          setTrendAnalysis(null);
        } finally {
          setTrendAnalysisLoading(false);
        }
      };
      
      if (incomeLast30Days > 0 || expensesLast30Days > 0) {
         calculateTrendAndProjection();
      } else {
        setTrendAnalysisLoading(false);
        setProjectedBalanceNext30Days(balance); 
        setTrendAnalysis("Sem movimentações recentes para análise de tendência.");
      }
    } else if (!loading && transactions.length === 0) {
      setProjectedBalanceNext30Days(null);
      setTrendAnalysis(null);
      setTrendAnalysisLoading(false);
      setTrendAnalysisError(null);
    }
  }, [transactions, balance, loading, supabase, incomeLast30Days, expensesLast30Days]);

  const getGoalProgress = () => {
    if (monthlyGoal === null || monthlyGoal <= 0) return 0;
    return (currentMonthExpenses / monthlyGoal) * 100;
  };

  const goalProgress = getGoalProgress();
  let goalProgressColor = "bg-primary"; // Usando a cor primária do tema
  let goalStatusMessage = `Você gastou ${CURRENCY_SYMBOL}${currentMonthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} de ${CURRENCY_SYMBOL}${monthlyGoal?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}.`;
  let remainingAmount = monthlyGoal ? monthlyGoal - currentMonthExpenses : 0;


  useEffect(() => {
    const checkAndSendAlerts = async () => {
      if (monthlyGoal !== null && monthlyGoal > 0) { 
        const progress = (currentMonthExpenses / monthlyGoal) * 100;
        const formattedGoal = CURRENCY_SYMBOL + monthlyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        if (progress >= 100 && !alert100DispatchedRef.current) {
          toast({
            title: '🔴 Meta de Gastos Atingida!',
            description: `Você atingiu/ultrapassou sua meta de ${formattedGoal}. Gasto atual: ${CURRENCY_SYMBOL}${currentMonthExpenses.toLocaleString('pt-BR', {minimumFractionDigits: 2})}.`,
            variant: 'destructive',
            duration: 7000,
          });
          alert100DispatchedRef.current = true;
          alert85DispatchedRef.current = true; 
        } else if (progress >= 85 && progress < 100 && !alert85DispatchedRef.current) {
           toast({
            title: '🟡 Atenção: Meta de Gastos Próxima!',
            description: `Você utilizou ${progress.toFixed(0)}% da sua meta de ${formattedGoal}. Gasto atual: ${CURRENCY_SYMBOL}${currentMonthExpenses.toLocaleString('pt-BR', {minimumFractionDigits: 2})}.`,
            variant: 'default', 
            duration: 7000,
          });
          alert85DispatchedRef.current = true;
        }

        if (progress < 100) alert100DispatchedRef.current = false;
        if (progress < 85) alert85DispatchedRef.current = false;
      }
    };
    checkAndSendAlerts();
  }, [currentMonthExpenses, monthlyGoal, toast]);


  if (monthlyGoal !== null && monthlyGoal > 0) {
    if (goalProgress >= 100) {
      goalProgressColor = "bg-destructive"; 
      goalStatusMessage = `Meta de ${CURRENCY_SYMBOL}${monthlyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ultrapassada em ${CURRENCY_SYMBOL}${Math.abs(remainingAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}!`;
    } else if (goalProgress >= 75) {
      goalProgressColor = "bg-yellow-500"; // Amarelo para alerta
      goalStatusMessage = `Atenção! Você já gastou ${currentMonthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${goalProgress.toFixed(0)}%) da sua meta de ${CURRENCY_SYMBOL}${monthlyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;
    } else {
        goalStatusMessage = `Você gastou ${CURRENCY_SYMBOL}${currentMonthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${goalProgress.toFixed(0)}%) da sua meta de ${CURRENCY_SYMBOL}${monthlyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Restam ${CURRENCY_SYMBOL}${remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  } else {
      goalStatusMessage = "Defina uma meta de gastos mensais na página de Configurações para acompanhar seu progresso.";
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

  if (loading && transactions.length === 0) { 
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
            <CardTitle className="font-headline font-bold text-base">Receita Total</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-body text-primary">{CURRENCY_SYMBOL}{totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">De todas as fontes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-headline font-bold text-base">Despesa Total</CardTitle>
            <TrendingDown className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-body text-destructive">{CURRENCY_SYMBOL}{totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">De todas as categorias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-headline font-bold text-base">Saldo Atual</CardTitle>
            <Activity className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-body ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {CURRENCY_SYMBOL}{balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Sua saúde financeira</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline font-bold text-base flex items-center">
                    <Target className="mr-2 h-5 w-5 text-accent" />
                    Meta de Gastos Mensal
                </CardTitle>
                {monthlyGoal !== null && (
                    <CardDescription className="text-xs mt-1">
                        Meta definida: {CURRENCY_SYMBOL}{monthlyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </CardDescription>
                )}
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs -mt-1 -mr-2">
                <Link href="/settings">
                    <Edit3 className="mr-1 h-3 w-3" /> {monthlyGoal !== null ? "Editar Meta" : "Definir Meta"}
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && monthlyGoal === null ? (
             <div className="flex items-center space-x-2 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Carregando dados da meta...</span>
            </div>
          ) : monthlyGoal !== null && monthlyGoal > 0 ? (
            <>
              <Progress value={goalProgress > 100 ? 100 : goalProgress} className="w-full h-3 mb-2" 
                indicatorClassName={goalProgressColor} 
              />
              <p className="text-sm text-muted-foreground">{goalStatusMessage}</p>
            </>
          ) : (
            <div className="text-center py-4">
              <Target className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Você ainda não definiu uma meta de gastos para o mês.
              </p>
              <Button asChild>
                <Link href="/settings">
                  <PlusCircle className="mr-2 h-4 w-4" /> Definir Meta Agora
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {supabase && (
      <div className="grid gap-6 md:grid-cols-1"> {/* Alterado para md:grid-cols-1 para que o card ocupe a largura total */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-headline font-bold text-base">Previsão e Tendência de Saldo</CardTitle>
              <Lightbulb className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent className="min-h-[120px]"> {/* Ajustado min-h se necessário */}
              { (loading || (trendAnalysisLoading && transactions.length > 0 && projectedBalanceNext30Days === null) ) && !trendAnalysisError && (
                  <div className="flex items-center space-x-2 py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>{loading && transactions.length === 0 ? 'Carregando dados...' : 'Analisando...'}</span>
                  </div>
              )}
              {!loading && transactions.length === 0 && !trendAnalysisLoading && (
                   <p className="text-sm text-muted-foreground py-4">Adicione transações para ver a previsão e análise de tendências.</p>
              )}
              
              {projectedBalanceNext30Days !== null && (
                 <>
                    <div className={`text-2xl font-bold ${projectedBalanceNext30Days >=0 ? 'text-primary' : 'text-destructive'}`}>
                        {CURRENCY_SYMBOL}{projectedBalanceNext30Days.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Saldo projetado (próximos 30 dias - estimativa simples)
                    </p>
                 </>
              )}

              {trendAnalysisLoading && projectedBalanceNext30Days !== null && ( 
                <div className="flex items-center space-x-2 py-2 mt-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm">Analisando tendência...</span>
                </div>
              )}

              {trendAnalysisError && !trendAnalysisLoading && (
                <div className="flex items-start space-x-2 text-destructive py-2 mt-2">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{trendAnalysisError}</span>
                </div>
              )}

              {!trendAnalysisLoading && !trendAnalysisError && trendAnalysis && (
                <p className="mt-3 text-sm">{trendAnalysis}</p>
              )}
              
              {!trendAnalysisLoading && !trendAnalysisError && !trendAnalysis && transactions.length > 0 && (incomeLast30Days > 0 || expensesLast30Days > 0) && (
                 <p className="mt-3 text-sm text-muted-foreground">Análise de tendência indisponível no momento.</p>
              )}

            </CardContent>
          </Card>

          {/* Card de Recomendações Financeiras Removido */}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-headline font-bold text-2xl">Atividade Recente</CardTitle>
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
                    <TableCell className={transaction.type === 'income' ? 'text-primary' : 'text-destructive'}>
                      {transaction.type === 'income' ? '+' : '-'}{CURRENCY_SYMBOL}{Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{isValid(transaction.date) ? format(transaction.date, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inválida'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
               <Image src="https://placehold.co/300x200.png" alt="Nenhuma transação" width={300} height={200} className="mx-auto mb-4 rounded-md" data-ai-hint="ilustração vazia"/>
              <p className="text-muted-foreground">Nenhuma transação ainda. Comece adicionando receitas ou despesas!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    