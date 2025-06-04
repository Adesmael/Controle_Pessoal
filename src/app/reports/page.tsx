
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Transaction, TransactionType } from '@/types';
import ExpenseBreakdownChart from '@/components/charts/ExpenseBreakdownChart';
import IncomeExpenseChart from '@/components/charts/IncomeExpenseChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CURRENCY_SYMBOL, EXPENSE_CATEGORIES } from '@/lib/constants';
import { TrendingUp, TrendingDown, Activity, Loader2, AlertTriangle, FileSpreadsheet, CalendarIcon, FilterX, Check, ChevronsUpDown } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    async function fetchAllTransactions() {
      if (!supabase) return; // Double check, though already checked above
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
        setDisplayedTransactions([]);
      } else if (data) {
        const formattedData = data.map(t => {
          const [year, month, day] = (t.date as string).split('-').map(Number);
          return {...t, id: t.id as string, date: new Date(year, month - 1, day), type: t.type as TransactionType };
        });
        setAllTransactions(formattedData);
        setDisplayedTransactions(formattedData);
      }
      setLoading(false);
    }
    fetchAllTransactions();
  }, [toast]); // supabase is stable, toast is stable

  const summary = useMemo(() => {
    const totalIncome = displayedTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = displayedTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, balance };
  }, [displayedTransactions]);
  
  const transactionListDescription = useMemo(() => {
    let descriptionText = 'Uma lista completa de suas receitas e despesas registradas.';
    const dateParts: string[] = [];
    if (startDate) dateParts.push(`de ${format(startDate, 'dd/MM/yy', { locale: ptBR })}`);
    if (endDate) dateParts.push(`até ${format(endDate, 'dd/MM/yy', { locale: ptBR })}`);

    if (dateParts.length > 0 || selectedCategory) {
      descriptionText = 'Exibindo transações ';
      if (dateParts.length > 0) {
        descriptionText += dateParts.join(' ');
      }
      if (selectedCategory) {
        const categoryLabel = EXPENSE_CATEGORIES.find(cat => cat.value === selectedCategory)?.label || selectedCategory;
        descriptionText += `${dateParts.length > 0 ? '. ' : ''}Despesas filtradas por: ${categoryLabel}.`;
      } else if (dateParts.length > 0) {
        descriptionText += '.';
      }
    }
    return descriptionText;
  }, [startDate, endDate, selectedCategory]);

  const applyFilters = () => {
    let filtered = [...allTransactions];

    if (startDate) {
      const filterStart = startOfDay(startDate);
      filtered = filtered.filter(t => t.date >= filterStart);
    }

    if (endDate) {
      const filterEnd = endOfDay(endDate);
      filtered = filtered.filter(t => t.date <= filterEnd);
    }

    if (selectedCategory) {
      filtered = filtered.filter(t => {
        if (t.type === 'expense') {
          return t.category === selectedCategory;
        }
        // If filtering by expense category, we might want to decide if income transactions are shown.
        // For now, let's assume if an expense category is selected, we only show expenses of that category
        // AND all income transactions. If the goal is to *only* show expenses of that category, this needs adjustment.
        // Current behavior: if expense category selected, non-matching expenses are filtered out, income remains.
        // To only show matching expenses and no income:
        // return t.type === 'expense' && t.category === selectedCategory;
        return true; 
      });
    }
    setDisplayedTransactions(filtered);
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedCategory(undefined);
    setDisplayedTransactions(allTransactions);
  };

  const handleExportToExcel = () => {
    if (!displayedTransactions.length) {
      toast({
        title: 'Nenhuma transação',
        description: 'Não há transações para exportar no período selecionado.',
        variant: 'default'
      });
      return;
    }

    const dataToExport = displayedTransactions.map(transaction => ({
      'Data': format(transaction.date, 'dd/MM/yyyy', { locale: ptBR }),
      'Descrição': transaction.description,
      'Tipo': transaction.type === 'income' ? 'Receita' : 'Despesa',
      'Categoria/Fonte': transaction.type === 'expense'
        ? (EXPENSE_CATEGORIES.find(cat => cat.value === transaction.category)?.label || transaction.category || '-')
        : (transaction.source || '-'),
      'Valor': transaction.amount
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 40 }, { wch: 10 }, { wch: 25 }, { wch: 15 }
    ];
    dataToExport.forEach((_, index) => {
      const cellRef = XLSX.utils.encode_cell({c: 4, r: index + 1});
      if(worksheet[cellRef]) {
         worksheet[cellRef].z = `"${CURRENCY_SYMBOL}" #,##0.00;[Red]-"${CURRENCY_SYMBOL}" #,##0.00`;
         worksheet[cellRef].t = 'n';
      }
    });
    XLSX.utils.sheet_add_aoa(worksheet, [['Data', 'Descrição', 'Tipo', `Categoria/Fonte`, `Valor (${CURRENCY_SYMBOL})`]], { origin: 'A1' });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');
    XLSX.writeFile(workbook, 'transacoes_fluxo_financeiro.xlsx');
    toast({
      title: 'Exportação Concluída',
      description: 'O arquivo transacoes_fluxo_financeiro.xlsx foi baixado.',
    });
  };


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
            <CardTitle className="text-sm font-medium">Receita (Período)</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{CURRENCY_SYMBOL}{summary.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas (Período)</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{CURRENCY_SYMBOL}{summary.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo (Período)</CardTitle>
            <Activity className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
             <div className={`text-2xl font-bold ${summary.balance >= 0 ? '' : 'text-destructive'}`}>
              {CURRENCY_SYMBOL}{summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">Filtrar Transações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div className="grid gap-2 w-full">
                    <label htmlFor="startDate" className="text-sm font-medium">Data Inicial</label>
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        id="startDate"
                        variant={'outline'}
                        className={cn(
                            'w-full justify-start text-left font-normal',
                            !startDate && 'text-muted-foreground'
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : <span>Escolha uma data</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        locale={ptBR}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        />
                    </PopoverContent>
                    </Popover>
                </div>
                <div className="grid gap-2 w-full">
                    <label htmlFor="endDate" className="text-sm font-medium">Data Final</label>
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        id="endDate"
                        variant={'outline'}
                        className={cn(
                            'w-full justify-start text-left font-normal',
                            !endDate && 'text-muted-foreground'
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : <span>Escolha uma data</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        locale={ptBR}
                        disabled={(date) => date > new Date() || date < (startDate || new Date('1900-01-01'))}
                        />
                    </PopoverContent>
                    </Popover>
                </div>
                 <div className="grid gap-2 w-full">
                    <label htmlFor="categoryFilter" className="text-sm font-medium">Categoria da Despesa</label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="categoryFilter"
                            variant="outline"
                            role="combobox"
                            className={cn(
                            "w-full justify-between",
                            !selectedCategory && "text-muted-foreground"
                            )}
                        >
                            {selectedCategory
                            ? EXPENSE_CATEGORIES.find(cat => cat.value === selectedCategory)?.label
                            : "Todas as categorias"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                        <Command>
                            <CommandInput placeholder="Buscar categoria..." />
                            <CommandList>
                            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                key="all-categories"
                                value="all-categories"
                                onSelect={() => {
                                    const combobox = document.activeElement;
                                    if (combobox) (combobox as HTMLElement).blur();
                                    setSelectedCategory(undefined);
                                }}
                                >
                                <Check
                                    className={cn(
                                    "mr-2 h-4 w-4",
                                    !selectedCategory ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                Todas as categorias
                                </CommandItem>
                                {EXPENSE_CATEGORIES.map((category) => (
                                <CommandItem
                                    value={category.label}
                                    key={category.value}
                                    onSelect={() => {
                                      setSelectedCategory(category.value);
                                      const combobox = document.activeElement;
                                      if (combobox) (combobox as HTMLElement).blur();
                                    }}
                                >
                                    <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        category.value === selectedCategory ? "opacity-100" : "opacity-0"
                                    )}
                                    />
                                    <category.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                    {category.label}
                                </CommandItem>
                                ))}
                            </CommandGroup>
                            </CommandList>
                        </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button onClick={applyFilters} className="w-full sm:w-auto">Aplicar Filtros</Button>
                <Button onClick={clearFilters} variant="outline" className="w-full sm:w-auto">
                    <FilterX className="mr-2 h-4 w-4" />
                    Limpar Filtros
                </Button>
            </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeExpenseChart transactions={displayedTransactions} />
        <ExpenseBreakdownChart expenses={displayedTransactions.filter(t => t.type === 'expense')} />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-headline text-xl">Transações do Período</CardTitle>
            <CardDescription>
              {transactionListDescription}
            </CardDescription>
          </div>
          <Button onClick={handleExportToExcel} variant="outline" className="w-full sm:w-auto">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar para Excel
          </Button>
        </CardHeader>
        <CardContent>
          {displayedTransactions.length > 0 ? (
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
                  {displayedTransactions.map((transaction) => (
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
               <Image src="https://placehold.co/300x200.png" alt="Nenhuma transação encontrada" width={300} height={200} className="mx-auto mb-4 rounded-md" data-ai-hint="documento pesquisa vazia"/>
              <p className="text-muted-foreground">Nenhuma transação encontrada para os filtros selecionados ou nenhuma transação registrada.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
