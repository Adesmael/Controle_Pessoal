
'use client';

import { useState, useEffect } from 'react';
import ExpenseForm from '@/components/forms/ExpenseForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Transaction } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EXPENSE_CATEGORIES, CURRENCY_SYMBOL } from '@/lib/constants';
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
import { getStoredTransactions, addStoredTransaction, deleteStoredTransaction } from '@/lib/transactionStorage';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadExpenses = () => {
      const allTransactions = getStoredTransactions();
      setExpenses(allTransactions.filter(tx => tx.type === 'expense').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    };
    loadExpenses();
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

  const openDeleteDialog = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;
    const success = deleteStoredTransaction(transactionToDelete.id);
    if (success) {
      setExpenses((prevExpenses) => prevExpenses.filter(exp => exp.id !== transactionToDelete.id));
      toast({
        title: "Despesa Excluída!",
        description: `A despesa "${transactionToDelete.description}" foi excluída do armazenamento local.`,
      });
    } else {
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir a despesa do armazenamento local.",
        variant: "destructive",
      });
    }
    setTransactionToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando Despesas...</p>
      </div>
    );
  }

  const getCategoryIcon = (categoryValue?: string) => {
    const category = EXPENSE_CATEGORIES.find(cat => cat.value === categoryValue);
    return category ? <category.icon className="h-5 w-5 mr-2 inline-block text-muted-foreground" /> : null;
  };


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
          {expenses.length > 0 ? (
             <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => ( 
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell className="flex items-center">
                        {getCategoryIcon(expense.category)}
                        {EXPENSE_CATEGORIES.find(cat => cat.value === expense.category)?.label || expense.category || '-'}
                      </TableCell>
                      <TableCell className="text-destructive"> 
                        {CURRENCY_SYMBOL}{Number(expense.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{format(new Date(expense.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(expense)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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

      <AlertDialog open={!!transactionToDelete} onOpenChange={(isOpen) => { if(!isOpen) setTransactionToDelete(null)}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a despesa "{transactionToDelete?.description}" no valor de {CURRENCY_SYMBOL}{Number(transactionToDelete?.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} do armazenamento local?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
