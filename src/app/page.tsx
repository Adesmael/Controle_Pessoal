
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, TrendingUp, TrendingDown, Activity, Loader2, AlertTriangle, Lightbulb, Target, Edit3 } from 'lucide-react';
import type { Transaction } from '@/types';
import { CURRENCY_SYMBOL, EXPENSE_CATEGORIES, MONTHLY_SPENDING_GOAL_KEY } from '@/lib/constants';
import { format, subDays, isValid, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]); // Manter para estrutura, mas será sempre vazio
  const [loading, setLoading] = useState(false); // Não há mais carregamento do Supabase
  const { toast } = useToast();

  const [monthlyGoal, setMonthlyGoal] = useState<number | null>(null);
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState<number>(0);

  const alert85DispatchedRef = useRef(false);
  const alert100DispatchedRef = useRef(false);

  useEffect(() => {
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
    // Apenas recalcula despesas do mês se houver meta (dados viriam de localStorage ou estado local se implementado)
    // Como não há transações do Supabase, currentMonthExpenses permanecerá 0 a menos que outra lógica seja adicionada.
    calculateCurrentMonthExpenses(); 
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

  function calculateCurrentMonthExpenses() {
    // Esta função agora dependeria de transações locais se fossem implementadas.
    // Por enquanto, com 'transactions' sempre vazio, currentMonthExpenses será 0.
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

  const getGoalProgress = () => {
    if (monthlyGoal === null || monthlyGoal <= 0) return 0;
    return (currentMonthExpenses / monthlyGoal) * 100;
  };

  const goalProgress = getGoalProgress();
  let goalProgressColor = "bg-primary"; 
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
      goalProgressColor = "bg-yellow-500"; 
      goalStatusMessage = `Atenção! Você já gastou ${currentMonthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${goalProgress.toFixed(0)}%) da sua meta de ${CURRENCY_SYMBOL}${monthlyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;
    } else {
        goalStatusMessage = `Você gastou ${CURRENCY_SYMBOL}${currentMonthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${goalProgress.toFixed(0)}%) da sua meta de ${CURRENCY_SYMBOL}${monthlyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Restam ${CURRENCY_SYMBOL}${remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  } else {
      goalStatusMessage = "Defina uma meta de gastos mensais na página de Configurações para acompanhar seu progresso.";
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
            <p className="text-xs text-muted-foreground">Nenhuma receita registrada</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-headline font-bold text-base">Despesa Total</CardTitle>
            <TrendingDown className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-body text-destructive">{CURRENCY_SYMBOL}{totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Nenhuma despesa registrada</p>
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
            <p className="text-xs text-muted-foreground">Calculado localmente</p>
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
          {monthlyGoal !== null && monthlyGoal > 0 ? (
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
      
      <div className="grid gap-6 md:grid-cols-1">
         {/* Card de Previsão e Tendência Removido pois dependia de dados do Supabase e Genkit */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline font-bold text-2xl">Atividade Recente</CardTitle>
          <CardDescription>Nenhuma transação registrada. Adicione transações para vê-las aqui.</CardDescription>
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
