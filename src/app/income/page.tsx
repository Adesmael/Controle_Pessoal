
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
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedIncomes = localStorage.getItem('financialFlowIncomes');
    if (storedIncomes) {
      setIncomes(JSON.parse(storedIncomes).map((t: Transaction) => ({...t, date: new Date(t.date)})));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('financialFlowIncomes', JSON.stringify(incomes));
    }
  }, [incomes, hydrated]);

  const handleIncomeAdded = (newIncome: Transaction) => {
    setIncomes((prevIncomes) => [newIncome, ...prevIncomes]);
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleDeleteConfirm = () => {
    if (transactionToDelete) {
      setIncomes((prevIncomes) => prevIncomes.filter(inc => inc.id !== transactionToDelete.id));
      toast({
        title: "Receita Excluída!",
        description: `A receita "${transactionToDelete.description}" foi excluída com sucesso.`,
      });
      setTransactionToDelete(null); 
    }
  };
  
  if (!hydrated) {
     return <div className="flex justify-center items-center h-screen"><p>Carregando Página de Receitas...</p></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Registrar Receita</h1>
        <p className="text-muted-foreground">Registre todas as suas fontes de receita aqui.</p>
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
          <CardDescription>Exibindo suas últimas receitas registradas.</CardDescription>
        </CardHeader>
        <CardContent>
          {incomes.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomes.slice(0, 10).map((income) => ( 
                    <TableRow key={income.id}>
                      <TableCell className="font-medium">{income.description}</TableCell>
                      <TableCell className="text-green-600">
                        {CURRENCY_SYMBOL}{income.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{format(new Date(income.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>{income.source || '-'}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(income)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
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
              Tem certeza que deseja excluir a receita "{transactionToDelete?.description}" no valor de {CURRENCY_SYMBOL}{transactionToDelete?.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}? Esta ação não pode ser desfeita.
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
