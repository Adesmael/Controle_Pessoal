
'use client';

import { useState, useEffect } from 'react';
import IncomeForm from '@/components/forms/IncomeForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Transaction } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
import { getStoredTransactions, addStoredTransaction, deleteStoredTransaction } from '@/lib/transactionStorage';

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadIncomes = () => {
      const allTransactions = getStoredTransactions();
      setIncomes(allTransactions.filter(tx => tx.type === 'income').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    };
    loadIncomes();
  }, []);

  const handleIncomeAdded = (newIncomeData: Omit<Transaction, 'id' | 'type' | 'created_at'>) => {
    const newIncome = addStoredTransaction(newIncomeData, 'income');
    if (newIncome) {
      setIncomes((prevIncomes) => [newIncome, ...prevIncomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({
        title: "Receita Adicionada!",
        description: `A receita "${newIncome.description}" foi salva localmente.`,
      });
    } else {
      toast({
        title: "Erro ao Adicionar Receita",
        description: "Não foi possível salvar a receita localmente.",
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
      setIncomes((prevIncomes) => prevIncomes.filter(inc => inc.id !== transactionToDelete.id));
      toast({
        title: "Receita Excluída!",
        description: `A receita "${transactionToDelete.description}" foi removida do armazenamento local.`,
      });
    } else {
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir a receita do armazenamento local.",
        variant: "destructive",
      });
    }
    setTransactionToDelete(null);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando Receitas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Registrar Receita</h1>
        <p className="text-muted-foreground">Registre todas as suas fontes de receita aqui. Os dados serão salvos localmente no seu dispositivo.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Novo Registro de Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeForm onIncomeAdded={handleIncomeAdded} />
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Receitas Recentes</CardTitle>
          <CardDescription>Exibindo suas últimas receitas registradas localmente.</CardDescription>
        </CardHeader>
        <CardContent>
          {incomes.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Descrição</TableHead>
                    <TableHead className="font-bold">Valor</TableHead>
                    <TableHead className="font-bold">Data</TableHead>
                    <TableHead className="font-bold">Fonte</TableHead>
                    <TableHead className="text-right font-bold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomes.map((income) => ( 
                    <TableRow key={income.id}>
                      <TableCell className="font-medium">{income.description}</TableCell>
                      <TableCell className="text-primary"> 
                        {CURRENCY_SYMBOL}{Number(income.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{format(new Date(income.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>{income.source || '-'}</TableCell>
                      <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(income)}>
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
              <Image src="https://placehold.co/300x200.png" alt="Nenhum registro de receita" width={300} height={200} className="mx-auto mb-4 rounded-md" data-ai-hint="dinheiro" />
              <p className="text-muted-foreground">Nenhuma receita registrada ainda. Adicione sua primeira receita usando o formulário acima.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!transactionToDelete} onOpenChange={(isOpen) => { if(!isOpen) setTransactionToDelete(null)}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a receita "{transactionToDelete?.description}" no valor de {CURRENCY_SYMBOL}{Number(transactionToDelete?.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} do armazenamento local?
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
