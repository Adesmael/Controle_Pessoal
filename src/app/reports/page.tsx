
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Transaction, TransactionType, ExpenseCategory, ExpenseSubtype, IncomeSource } from '@/types';
import ExpenseBreakdownChart from '@/components/charts/ExpenseBreakdownChart';
import IncomeExpenseChart from '@/components/charts/IncomeExpenseChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, endOfDay, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { TrendingUp, TrendingDown, Activity, Loader2, FileSpreadsheet, CalendarIcon, FilterX, Check, ChevronsUpDown } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { getStoredTransactions } from '@/lib/transactionStorage';
import { getStoredExpenseCategories } from '@/lib/categoryStorage';
import { getStoredIncomeSources } from '@/lib/incomeSourceStorage';
import { getIcon } from '@/lib/iconMap';

const typeFilterOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'income', label: 'Receitas' },
  { value: 'expense', label: 'Despesas' },
];

const expenseSubtypeFilterOptions = [
  { value: 'all', label: 'Ambos os Tipos' },
  { value: 'fixed', label: 'Fixa' },
  { value: 'variable', label: 'Variável' },
];

export default function ReportsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedSource, setSelectedSource] = useState<string | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<TransactionType | 'all' | undefined>('all');
  const [selectedExpenseSubtype, setSelectedExpenseSubtype] = useState<ExpenseSubtype | 'all' | undefined>('all');
  
  useEffect(() => {
    function loadData() {
      setLoading(true);
      const storedTransactions = getStoredTransactions();
      const storedCategories = getStoredExpenseCategories();
      const storedSources = getStoredIncomeSources();
      setAllTransactions(storedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setDisplayedTransactions(storedTransactions);
      setExpenseCategories(storedCategories);
      setIncomeSources(storedSources);
      setLoading(false);
    }
    loadData();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'financialApp_transactions' || event.key === 'financialApp_expense_categories' || event.key === 'financialApp_income_sources') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

  }, []); 

  const transactionListDescription = useMemo(() => {
    let descriptionText = 'Uma lista completa de suas receitas e despesas registradas localmente.';
    const dateParts: string[] = [];
    if (startDate) dateParts.push(`de ${format(startDate, 'dd/MM/yy', { locale: ptBR })}`);
    if (endDate) dateParts.push(`até ${format(endDate, 'dd/MM/yy', { locale: ptBR })}`);

    let filtersApplied: string[] = [];

    if (dateParts.length > 0) {
      filtersApplied.push(dateParts.join(' '));
    }

    if (selectedType && selectedType !== 'all') {
      const typeLabel = typeFilterOptions.find(opt => opt.value === selectedType)?.label || selectedType;
      filtersApplied.push(`Tipo: ${typeLabel}`);
    }
    
    if (selectedCategory) {
      const categoryLabel = expenseCategories.find(cat => cat.value === selectedCategory)?.label || selectedCategory;
      filtersApplied.push(`Categoria: ${categoryLabel}`);
    }

    if (selectedSource) {
      const sourceLabel = incomeSources.find(src => src.value === selectedSource)?.label || selectedSource;
      filtersApplied.push(`Fonte: ${sourceLabel}`);
    }

    if (selectedExpenseSubtype && selectedExpenseSubtype !== 'all' && selectedType !== 'income') {
      const subtypeLabel = expenseSubtypeFilterOptions.find(opt => opt.value === selectedExpenseSubtype)?.label || '';
      filtersApplied.push(`Despesas do tipo: ${subtypeLabel}`);
    }

    if (filtersApplied.length > 0) {
      descriptionText = `Exibindo transações locais com filtros: ${filtersApplied.join('; ')}.`;
    }
    
    if (allTransactions.length === 0) {
        descriptionText = "Nenhuma transação registrada ainda. Adicione transações para vê-las aqui."
    } else if (displayedTransactions.length === 0 && filtersApplied.length > 0) {
        descriptionText = "Nenhuma transação encontrada para os filtros aplicados."
    }


    return descriptionText;
  }, [startDate, endDate, selectedCategory, selectedSource, selectedType, selectedExpenseSubtype, displayedTransactions.length, allTransactions.length, expenseCategories, incomeSources]);


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
  

  const applyFilters = () => {
    let filtered = [...allTransactions]; 

    if (startDate) {
      const filterStart = startOfDay(startDate);
      filtered = filtered.filter(t => new Date(t.date) >= filterStart);
    }

    if (endDate) {
      const filterEnd = endOfDay(endDate);
      filtered = filtered.filter(t => new Date(t.date) <= filterEnd);
    }
    
    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    if (selectedCategory) {
      if (selectedType === 'all' || selectedType === 'expense') {
        filtered = filtered.filter(t => {
            if (t.type === 'expense') {
                return t.category === selectedCategory;
            }
            return selectedType === 'all' ? true : false; 
        });
      }
    }

    if (selectedSource) {
      if (selectedType === 'all' || selectedType === 'income') {
        filtered = filtered.filter(t => {
            if (t.type === 'income') {
                return t.source === selectedSource;
            }
            return selectedType === 'all' ? true : false;
        });
      }
    }

    if (selectedExpenseSubtype && selectedExpenseSubtype !== 'all') {
       if (selectedType === 'all' || selectedType === 'expense') {
         filtered = filtered.filter(t => {
            if (t.type === 'expense') {
              return t.expenseSubtype === selectedExpenseSubtype;
            }
            return selectedType === 'all' ? true : false; 
         })
       }
    }
    
    setDisplayedTransactions(filtered);
     if (filtered.length === 0 && allTransactions.length > 0) {
        toast({
            title: "Nenhum resultado",
            description: "Nenhuma transação encontrada para os filtros aplicados.",
            variant: "default"
        });
    }
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedCategory(undefined);
    setSelectedSource(undefined);
    setSelectedType('all');
    setSelectedExpenseSubtype('all');
    setDisplayedTransactions(allTransactions); 
  };

  const handleExportToExcel = () => {
    if (!displayedTransactions.length) {
      toast({
        title: 'Nenhuma transação',
        description: 'Não há transações locais para exportar com os filtros atuais.',
        variant: 'default'
      });
      return;
    }

    const dataToExport = displayedTransactions.map(transaction => ({
      'Data': format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR }),
      'Descrição': transaction.description,
      'Tipo': transaction.type === 'income' ? 'Receita' : 'Despesa',
      'Tipo de Despesa': transaction.type === 'expense' ? (transaction.expenseSubtype === 'fixed' ? 'Fixa' : 'Variável') : '',
      'Categoria/Fonte': transaction.type === 'expense'
        ? (expenseCategories.find(cat => cat.value === transaction.category)?.label || transaction.category || '-')
        : (transaction.source || '-'),
      'Valor': transaction.amount
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 40 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 15 }
    ];
    dataToExport.forEach((_, index) => {
      const cellRef = XLSX.utils.encode_cell({c: 5, r: index + 1});
      if(worksheet[cellRef]) {
         worksheet[cellRef].z = `"${CURRENCY_SYMBOL}" #,##0.00;[Red]-"${CURRENCY_SYMBOL}" #,##0.00`;
         worksheet[cellRef].t = 'n';
      }
    });
    XLSX.utils.sheet_add_aoa(worksheet, [['Data', 'Descrição', 'Tipo', 'Tipo de Despesa', 'Categoria/Fonte', `Valor (${CURRENCY_SYMBOL})`]], { origin: 'A1' });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');
    XLSX.writeFile(workbook, 'transacoes_fluxo_financeiro.xlsx');
    toast({
      title: 'Exportação Concluída',
      description: 'O arquivo transacoes_fluxo_financeiro.xlsx foi baixado.',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando Relatórios...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Relatórios Financeiros</h1>
        <p className="text-muted-foreground">Visualize seus dados financeiros salvos localmente no dispositivo.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita (Filtrado)</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{CURRENCY_SYMBOL}{summary.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas (Filtrado)</CardTitle>
            <TrendingDown className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{CURRENCY_SYMBOL}{summary.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo (Filtrado)</CardTitle>
            <Activity className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
             <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
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
                    <label htmlFor="typeFilter" className="text-sm font-medium">Tipo de Transação</label>
                    <Select
                        value={selectedType}
                        onValueChange={(value) => setSelectedType(value as TransactionType | 'all' | undefined)}
                    >
                        <SelectTrigger id="typeFilter" className="w-full">
                        <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                        {typeFilterOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                            {option.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2 w-full">
                    <label htmlFor="expenseSubtypeFilter" className="text-sm font-medium">Tipo de Despesa</label>
                    <Select
                        value={selectedExpenseSubtype}
                        onValueChange={(value) => setSelectedExpenseSubtype(value as ExpenseSubtype | 'all' | undefined)}
                        disabled={selectedType === 'income'}
                    >
                        <SelectTrigger id="expenseSubtypeFilter" className="w-full">
                        <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                        {expenseSubtypeFilterOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                            {option.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
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
                            disabled={selectedType === 'income'}
                        >
                            {selectedCategory
                            ? expenseCategories.find(cat => cat.value === selectedCategory)?.label
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
                                {expenseCategories.map((category) => {
                                  const Icon = getIcon(category.icon);
                                  return (
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
                                      <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                      {category.label}
                                    </CommandItem>
                                  );
                                })}
                            </CommandGroup>
                            </CommandList>
                        </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="grid gap-2 w-full">
                    <label htmlFor="sourceFilter" className="text-sm font-medium">Fonte da Receita</label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="sourceFilter"
                            variant="outline"
                            role="combobox"
                            className={cn(
                            "w-full justify-between",
                            !selectedSource && "text-muted-foreground"
                            )}
                            disabled={selectedType === 'expense'}
                        >
                            {selectedSource
                            ? incomeSources.find(src => src.value === selectedSource)?.label
                            : "Todas as fontes"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                        <Command>
                            <CommandInput placeholder="Buscar fonte..." />
                            <CommandList>
                            <CommandEmpty>Nenhuma fonte encontrada.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                key="all-sources"
                                value="all-sources"
                                onSelect={() => {
                                    const combobox = document.activeElement;
                                    if (combobox) (combobox as HTMLElement).blur();
                                    setSelectedSource(undefined);
                                }}
                                >
                                <Check
                                    className={cn(
                                    "mr-2 h-4 w-4",
                                    !selectedSource ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                Todas as fontes
                                </CommandItem>
                                {incomeSources.map((source) => (
                                    <CommandItem
                                      value={source.label}
                                      key={source.value}
                                      onSelect={() => {
                                        setSelectedSource(source.value);
                                        const combobox = document.activeElement;
                                        if (combobox) (combobox as HTMLElement).blur();
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            source.value === selectedSource ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {source.label}
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
        <ExpenseBreakdownChart expenses={displayedTransactions.filter(t => t.type === 'expense')} categories={expenseCategories} />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-headline text-xl">Transações</CardTitle>
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
                    <TableHead className="font-bold">Data</TableHead>
                    <TableHead className="font-bold">Descrição</TableHead>
                    <TableHead className="font-bold">Tipo</TableHead>
                    <TableHead className="font-bold">Tipo Despesa</TableHead>
                    <TableHead className="font-bold">Categoria/Fonte</TableHead>
                    <TableHead className="text-right font-bold">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedTransactions.map((transaction) => {
                    const category = expenseCategories.find(cat => cat.value === transaction.category);
                    const source = incomeSources.find(src => src.value === transaction.source);
                    const Icon = getIcon(category?.icon);
                    return (
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
                        <TableCell>
                          {transaction.type === 'expense' && transaction.expenseSubtype && (
                            <Badge variant={transaction.expenseSubtype === 'fixed' ? 'secondary' : 'outline'}>
                              {transaction.expenseSubtype === 'fixed' ? 'Fixa' : 'Variável'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="flex items-center">
                          {transaction.type === 'expense' && <Icon className="h-4 w-4 mr-1 inline-block text-muted-foreground" />}
                          {transaction.type === 'expense'
                            ? (category?.label || transaction.category || '-')
                            : (source?.label || transaction.source || '-')}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${transaction.type === 'income' ? 'text-primary' : 'text-destructive'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{CURRENCY_SYMBOL}{Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
             <div className="text-center py-10">
               <Image src="https://placehold.co/300x200.png" alt="Nenhuma transação encontrada" width={300} height={200} className="mx-auto mb-4 rounded-md" data-ai-hint="documento pesquisa vazia"/>
              <p className="text-muted-foreground">{transactionListDescription}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

