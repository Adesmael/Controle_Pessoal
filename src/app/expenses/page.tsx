
'use client';

import { useState, useEffect } from 'react';
import ExpenseForm from '@/components/forms/ExpenseForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Transaction, TransactionType } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EXPENSE_CATEGORIES, CURRENCY_SYMBOL } from '@/lib/constants';
import Image from 'next/image';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
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
// import { supabase } from '@/lib/supabaseClient'; // Supabase removido

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Transaction[]>([]); // Manter para estrutura, mas será local ou vazia
  const [loading, setLoading] = useState(false); // Não há mais carregamento do Supabase
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const { toast } = useToast();

  // useEffect(() => {
  //   fetchExpenses(); // Removido - não há Supabase para buscar
  // }, []);
  
  // async function fetchExpenses() {
  //   // Lógica de busca do Supabase removida
  //   setLoading(false);
  // }
  
  const handleExpenseAdded = (newExpenseData: Omit<Transaction, 'id' | 'type' | 'created_at'>) => {
    // Lógica de inserção do Supabase removida
    // Poderia adicionar a uma lista local 'expenses' aqui se desejado para a sessão atual
    const newExpense: Transaction = {
        ...newExpenseData,
        id: crypto.randomUUID(),
        type: 'expense',
        created_at: new Date().toISOString(),
    };
    setExpenses((prevExpenses) => [newExpense, ...prevExpenses].sort((a,b) => b.date.getTime() - a.date.getTime()));
    toast({
      title: "Despesa Adicionada (Localmente)!",
      description: `A despesa "${newExpenseData.description}" foi adicionada à lista local. Os dados não serão salvos permanentemente.`,
    });
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleDeleteConfirm = async () => {
    // Lógica de exclusão do Supabase removida
    if (!transactionToDelete) return;
    setExpenses((prevExpenses) => prevExpenses.filter(exp => exp.id !== transactionToDelete.id));
    toast({
      title: "Despesa Excluída (Localmente)!",
      description: `A despesa "${transactionToDelete.description}" foi excluída da lista local.`,
    });
    setTransactionToDelete(null);
  };

  if (loading) { // Este loading não deve mais ser ativado sem Supabase
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
        <p className="text-muted-foreground">Acompanhe para onde seu dinheiro está indo. Os dados serão mantidos localmente nesta sessão.</p>
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
          <CardTitle className="font-headline text-xl">Despesas Recentes (Local)</CardTitle>
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
                      <TableCell>{format(expense.date, 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
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
            <AlertDialogTitle>Confirmar Exclusão (Local)</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a despesa "{transactionToDelete?.description}" no valor de {CURRENCY_SYMBOL}{Number(transactionToDelete?.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} da lista local?
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
