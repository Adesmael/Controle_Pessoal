
'use client';

import { useState, useEffect, useMemo } from 'react';
import ExpenseForm from '@/components/forms/ExpenseForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Transaction, ExpenseCategory } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import Image from 'next/image';
import { Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getStoredTransactions, addStoredTransaction, deleteStoredTransaction, deleteStoredTransactions } from '@/lib/transactionStorage';
import { getStoredExpenseCategories } from '@/lib/categoryStorage';
import { getIcon } from '@/lib/iconMap';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const { toast } = useToast();

  const isAllSelected = useMemo(() => expenses.length > 0 && selectedIds.size === expenses.length, [expenses, selectedIds]);

  useEffect(() => {
    const loadData = () => {
      const allTransactions = getStoredTransactions();
      setExpenses(allTransactions.filter(tx => tx.type === 'expense').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setExpenseCategories(getStoredExpenseCategories());
      setLoading(false);
    };
    loadData();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'financialApp_transactions' || event.key === 'financialApp_expense_categories') {
        loadData();
        setSelectedIds(new Set()); // Reset selection on external data change
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const handleExpenseAdded = (newExpenseData: Omit<Transaction, 'id' | 'type' | 'created_at'>) => {
    const newExpense = addStoredTransaction(newExpenseData, 'expense');
    if (newExpense) {
      setExpenses((prevExpenses) => [newExpense, ...prevExpenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({
        title: "Despesa Adicionada!",
        description: `A despesa "${newExpense.description}" foi salva localmente.`,
      });
    } else {
       toast({
        title: "Erro ao Adicionar Despesa",
        description: "Não foi possível salvar a despesa localmente.",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const allIds = new Set(expenses.map(e => e.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleDeleteConfirm = () => {
    if (selectedIds.size === 0) return;
    const idsToDelete = Array.from(selectedIds);
    const success = deleteStoredTransactions(idsToDelete);
    if (success) {
      setExpenses(prevExpenses => prevExpenses.filter(exp => !idsToDelete.includes(exp.id)));
      toast({
        title: `${idsToDelete.length} Despesa(s) Excluída(s)!`,
        description: 'As despesas selecionadas foram removidas do armazenamento local.',
      });
      setSelectedIds(new Set());
    } else {
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir as despesas selecionadas.",
        variant: "destructive",
      });
    }
    setIsDeleteAlertOpen(false);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando Despesas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Registrar Despesas</h1>
        <p className="text-muted-foreground">Acompanhe para onde seu dinheiro está indo. Os dados serão salvos localmente no seu dispositivo.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Novo Registro de Despesa</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm onExpenseAdded={handleExpenseAdded} />
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Despesas Recentes</CardTitle>
          <CardDescription>Exibindo suas últimas despesas registradas localmente.</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedIds.size > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-md flex justify-between items-center">
                <span className="text-sm font-medium">{selectedIds.size} item(s) selecionado(s)</span>
                <Button variant="destructive" size="sm" onClick={() => setIsDeleteAlertOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Selecionados
                </Button>
            </div>
          )}
          {expenses.length > 0 ? (
             <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                        <Checkbox 
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Selecionar todas as despesas"
                        />
                    </TableHead>
                    <TableHead className="font-bold">Descrição</TableHead>
                    <TableHead className="font-bold">Categoria</TableHead>
                    <TableHead className="font-bold">Tipo</TableHead>
                    <TableHead className="font-bold">Valor</TableHead>
                    <TableHead className="text-right font-bold">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => {
                    const category = expenseCategories.find(cat => cat.value === expense.category);
                    const Icon = getIcon(category?.icon);
                    return (
                      <TableRow key={expense.id} data-state={selectedIds.has(expense.id) ? 'selected' : undefined}>
                        <TableCell>
                            <Checkbox 
                              checked={selectedIds.has(expense.id)}
                              onCheckedChange={(checked) => handleSelectOne(expense.id, !!checked)}
                              aria-label={`Selecionar despesa ${expense.description}`}
                            />
                        </TableCell>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell className="flex items-center">
                          <Icon className="h-5 w-5 mr-2 inline-block text-muted-foreground" />
                          {category?.label || expense.category || '-'}
                        </TableCell>
                         <TableCell>
                          {expense.expenseSubtype && (
                            <Badge variant={expense.expenseSubtype === 'fixed' ? 'secondary' : 'outline'}>
                              {expense.expenseSubtype === 'fixed' ? 'Fixa' : 'Variável'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-destructive"> 
                          {CURRENCY_SYMBOL}{Number(expense.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">{format(new Date(expense.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <Image src="https://placehold.co/300x200.png" alt="Nenhum registro de despesa" width={300} height={200} className="mx-auto mb-4 rounded-md" data-ai-hint="carteira vazia" />
              <p className="text-muted-foreground">Nenhuma despesa registrada ainda. Adicione sua primeira despesa usando o formulário acima.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir as {selectedIds.size} despesas selecionadas do armazenamento local? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
